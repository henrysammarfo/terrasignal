import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get("x-api-key");
    const expectedKey = Deno.env.get("WEBHOOK_API_KEY");

    if (!expectedKey || apiKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { user_id, signal, satellite, weather, report } = body;

    if (!signal || !report) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: signal, report" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert crop signal
    const { data: signalData, error: signalError } = await supabase
      .from("crop_signals")
      .insert({
        user_id,
        event_title: signal.event_title,
        event_content: signal.event_content || null,
        event_url: signal.event_url || null,
        event_source: signal.event_source || null,
        published_at: signal.published_at || null,
        region_name: signal.region_name,
        bbox: signal.bbox || null,
        crop_type: signal.crop_type || null,
        severity: signal.severity || "low",
      })
      .select("id")
      .single();

    if (signalError) throw signalError;
    const signalId = signalData.id;

    // Insert satellite analysis if provided
    if (satellite) {
      const { error } = await supabase.from("satellite_analyses").insert({
        signal_id: signalId,
        acquisition_date: satellite.acquisition_date || null,
        ndvi_mean: satellite.ndvi_mean || null,
        ndvi_delta: satellite.ndvi_delta || null,
        ndwi_mean: satellite.ndwi_mean || null,
        msi_mean: satellite.msi_mean || null,
        cloud_cover_pct: satellite.cloud_cover_pct || null,
        anomaly_score: satellite.anomaly_score || null,
        thumbnail_url: satellite.thumbnail_url || null,
      });
      if (error) console.error("Satellite insert error:", error);
    }

    // Insert weather context if provided
    if (weather) {
      const { error } = await supabase.from("weather_contexts").insert({
        signal_id: signalId,
        date_from: weather.date_from || null,
        date_to: weather.date_to || null,
        precip_anomaly_mm: weather.precip_anomaly_mm || null,
        temp_anomaly_c: weather.temp_anomaly_c || null,
        drought_index: weather.drought_index || null,
        soil_moisture_percentile: weather.soil_moisture_percentile || null,
      });
      if (error) console.error("Weather insert error:", error);
    }

    // Insert intel report
    const { data: reportData, error: reportError } = await supabase
      .from("intel_reports")
      .insert({
        signal_id: signalId,
        headline: report.headline,
        summary: report.summary || null,
        confidence: report.confidence || null,
        market_implication: report.market_implication || null,
      })
      .select("id")
      .single();

    if (reportError) throw reportError;

    // Create notification
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id,
      report_id: reportData.id,
      title: `New Signal: ${report.headline}`,
      message: report.market_implication || report.summary || "",
    });
    if (notifError) console.error("Notification insert error:", notifError);

    // Auto-forward high-severity alerts to OpenClaw
    const sev = signal.severity || "low";
    if (sev === "high" || sev === "critical") {
      try {
        const funcUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/openclaw-alert`;
        await fetch(funcUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ report_id: reportData.id }),
        });
      } catch (e) {
        console.error("OpenClaw forwarding error:", e);
      }
    }

    return new Response(
      JSON.stringify({ success: true, signal_id: signalId, report_id: reportData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
