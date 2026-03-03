import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface WebhookPayload {
  type: "INSERT";
  table: string;
  record: Record<string, unknown>;
  old_record: null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openclawUrl = Deno.env.get("OPENCLAW_GATEWAY_URL");
    if (!openclawUrl) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "OPENCLAW_GATEWAY_URL not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();

    // Can be called directly with report data or via DB webhook
    const reportId = body.report_id || body.record?.id;
    if (!reportId) {
      return new Response(
        JSON.stringify({ error: "Missing report_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch report with signal data
    const { data: report, error: reportErr } = await supabase
      .from("intel_reports")
      .select(`
        *,
        crop_signals (
          event_title, region_name, crop_type, severity
        )
      `)
      .eq("id", reportId)
      .single();

    if (reportErr || !report) {
      return new Response(
        JSON.stringify({ error: "Report not found", detail: reportErr?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const signal = report.crop_signals;
    const severity = signal?.severity || "low";

    // Only forward high / critical severity
    if (severity !== "high" && severity !== "critical") {
      return new Response(
        JSON.stringify({ skipped: true, reason: `Severity "${severity}" below threshold` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build message for OpenClaw
    const severityEmoji = severity === "critical" ? "🔴" : "🟠";
    const confidencePct = report.confidence ? `${Math.round(report.confidence * 100)}%` : "N/A";

    const message = [
      `${severityEmoji} **TerraSignal Alert — ${severity.toUpperCase()}**`,
      "",
      `**${report.headline}**`,
      "",
      `📍 ${signal?.region_name || "Unknown Region"}${signal?.crop_type ? ` · ${signal.crop_type}` : ""}`,
      `📊 Confidence: ${confidencePct}`,
      "",
      report.market_implication ? `💰 ${report.market_implication}` : "",
      report.summary ? `\n${report.summary}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    // Send to OpenClaw gateway
    const openclawResponse = await fetch(openclawUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        // OpenClaw standard fields
        channel: Deno.env.get("OPENCLAW_CHANNEL") || "default",
        metadata: {
          source: "terrasignal",
          report_id: reportId,
          severity,
          region: signal?.region_name,
        },
      }),
    });

    const result = await openclawResponse.text();

    return new Response(
      JSON.stringify({
        success: true,
        severity,
        headline: report.headline,
        openclaw_status: openclawResponse.status,
        openclaw_response: result,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("OpenClaw alert error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
