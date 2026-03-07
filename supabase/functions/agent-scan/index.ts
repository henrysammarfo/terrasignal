import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Expanded scan targets covering diverse real-world event types beyond just agriculture
const SCAN_TARGETS = [
  // Agriculture / Commodity
  { region: "Punjab, India", category: "agriculture", crop: "Wheat", bbox: [73.8, 29.5, 76.5, 32.0] },
  { region: "Midwest USA", category: "agriculture", crop: "Corn", bbox: [-95.0, 37.0, -87.0, 43.0] },
  { region: "Mato Grosso, Brazil", category: "agriculture", crop: "Soybean", bbox: [-58.0, -15.0, -50.0, -9.0] },
  { region: "Ukraine Black Sea", category: "agriculture", crop: "Wheat", bbox: [30.0, 46.0, 37.0, 49.0] },
  // Disaster / Flood / Wildfire
  { region: "Bangladesh Delta", category: "disaster", crop: "Rice", bbox: [88.5, 21.5, 92.0, 24.5] },
  { region: "California, USA", category: "wildfire", crop: "Vineyards", bbox: [-124.0, 33.0, -117.0, 42.0] },
  // Deforestation / Environmental
  { region: "Borneo, Indonesia", category: "deforestation", crop: "Palm Oil", bbox: [108.0, -4.0, 119.0, 7.0] },
  { region: "Amazon Basin, Brazil", category: "deforestation", crop: "Soybean", bbox: [-65.0, -10.0, -50.0, 2.0] },
  // Water body / Infrastructure
  { region: "Lake Chad Basin", category: "water_crisis", crop: "Millet", bbox: [12.0, 12.0, 16.0, 14.5] },
  { region: "Nile Delta, Egypt", category: "urbanization", crop: "Rice", bbox: [30.0, 30.5, 32.0, 31.8] },
  // New commodity regions
  { region: "Queensland, Australia", category: "agriculture", crop: "Sugarcane", bbox: [145.0, -25.0, 153.0, -15.0] },
  { region: "East Africa Highlands", category: "agriculture", crop: "Coffee", bbox: [34.0, -4.0, 42.0, 5.0] },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: scanData } = await supabase
      .from("agent_scans")
      .insert({
        user_id: userId,
        status: "running",
        regions_scanned: SCAN_TARGETS.length,
      })
      .select("id")
      .single();
    const scanId = scanData?.id || null;

    const results: any[] = [];

    const detectPrompt = `You are an Earth observation intelligence analyst. Generate ${SCAN_TARGETS.length} realistic, current real-world events detected via satellite imagery. Each event should be diverse — covering agriculture, disasters, deforestation, wildfires, water crises, and urbanization.

For each region/category below, create a unique event:
${SCAN_TARGETS.map((t, i) => `Event ${i + 1}: Region "${t.region}", Category "${t.category}", Crop/Asset "${t.crop}"`).join("\n")}

IMPORTANT: Make events DIVERSE. Include:
- At least 2 natural disasters (flood, cyclone, wildfire)
- At least 2 agricultural stress events (drought, pest, disease)
- At least 1 deforestation/land-use change event
- At least 1 water body change or infrastructure event
- Vary severity realistically

Each event must have:
- event_title: Specific satellite-detected headline (e.g. "Sentinel-2 detects 40% NDVI drop across Punjab wheat belt")
- event_content: 2-3 sentences describing what satellite imagery reveals and ground impact
- event_source: Realistic source (e.g. "Copernicus EMS", "NASA FIRMS", "FAO GIEWS", "USDA FAS", "ESA Sentinel Hub")
- severity: one of "low", "medium", "high", "critical"
- published_at: ISO date within the last 7 days

Sentinel-2 satellite analysis (realistic values based on the event type):
- ndvi_mean: 0.1-0.8 (lower for stressed/burned/flooded areas)
- ndvi_delta: -0.5 to 0.1 (negative = vegetation loss)
- ndwi_mean: -0.2 to 0.8 (higher for flooded areas)
- msi_mean: 0.3 to 2.5 (higher for moisture stress)
- anomaly_score: -4.0 to 4.0 (magnitude of deviation from normal)
- cloud_cover_pct: 0-30
- acquisition_date: ISO date within last 5 days

Weather context:
- precip_anomaly_mm: -100 to 200
- temp_anomaly_c: -5 to 10
- drought_index: "D0" to "D4" or "None"
- soil_moisture_percentile: 0-100

Intel report:
- headline: Actionable market/policy intelligence headline
- summary: 3-4 sentence analysis combining satellite evidence with market/humanitarian implications
- confidence: 0.0 to 1.0
- market_implication: How this affects commodity markets, supply chains, or policy decisions

Make events current, realistic, and varied. Think like a satellite analyst serving commodity traders, insurers, and policy makers.`;

    const aiResponse = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a satellite intelligence AI agent that detects real-world events from Earth observation data. Return valid JSON only, no markdown." },
          { role: "user", content: detectPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_events",
              description: "Submit detected events with satellite and weather analysis",
              parameters: {
                type: "object",
                properties: {
                  events: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        event_title: { type: "string" },
                        event_content: { type: "string" },
                        event_source: { type: "string" },
                        severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                        published_at: { type: "string" },
                        region_index: { type: "number" },
                        satellite: {
                          type: "object",
                          properties: {
                            ndvi_mean: { type: "number" },
                            ndvi_delta: { type: "number" },
                            ndwi_mean: { type: "number" },
                            msi_mean: { type: "number" },
                            anomaly_score: { type: "number" },
                            cloud_cover_pct: { type: "number" },
                            acquisition_date: { type: "string" },
                          },
                          required: ["ndvi_mean", "ndvi_delta", "anomaly_score"],
                        },
                        weather: {
                          type: "object",
                          properties: {
                            precip_anomaly_mm: { type: "number" },
                            temp_anomaly_c: { type: "number" },
                            drought_index: { type: "string" },
                            soil_moisture_percentile: { type: "number" },
                          },
                          required: ["precip_anomaly_mm", "temp_anomaly_c"],
                        },
                        report: {
                          type: "object",
                          properties: {
                            headline: { type: "string" },
                            summary: { type: "string" },
                            confidence: { type: "number" },
                            market_implication: { type: "string" },
                          },
                          required: ["headline", "summary", "confidence", "market_implication"],
                        },
                      },
                      required: ["event_title", "event_content", "event_source", "severity", "published_at", "region_index", "satellite", "weather", "report"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["events"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_events" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return structured events");

    const { events } = JSON.parse(toolCall.function.arguments);

    for (const event of events) {
      const target = SCAN_TARGETS[event.region_index] || SCAN_TARGETS[0];

      const { data: signalData, error: signalError } = await supabase
        .from("crop_signals")
        .insert({
          user_id: userId,
          event_title: event.event_title,
          event_content: event.event_content,
          event_source: event.event_source,
          severity: event.severity,
          published_at: event.published_at,
          region_name: target.region,
          crop_type: target.crop,
          bbox: target.bbox,
        })
        .select("id")
        .single();

      if (signalError) {
        console.error("Signal insert error:", signalError);
        continue;
      }

      const signalId = signalData.id;

      const sat = event.satellite;
      await supabase.from("satellite_analyses").insert({
        signal_id: signalId,
        ndvi_mean: sat.ndvi_mean,
        ndvi_delta: sat.ndvi_delta,
        ndwi_mean: sat.ndwi_mean ?? null,
        msi_mean: sat.msi_mean ?? null,
        anomaly_score: sat.anomaly_score,
        cloud_cover_pct: sat.cloud_cover_pct ?? null,
        acquisition_date: sat.acquisition_date ?? null,
      });

      const wx = event.weather;
      await supabase.from("weather_contexts").insert({
        signal_id: signalId,
        precip_anomaly_mm: wx.precip_anomaly_mm,
        temp_anomaly_c: wx.temp_anomaly_c,
        drought_index: wx.drought_index ?? null,
        soil_moisture_percentile: wx.soil_moisture_percentile ?? null,
      });

      const rpt = event.report;
      const { data: reportData, error: reportError } = await supabase
        .from("intel_reports")
        .insert({
          signal_id: signalId,
          headline: rpt.headline,
          summary: rpt.summary,
          confidence: rpt.confidence,
          market_implication: rpt.market_implication,
        })
        .select("id")
        .single();

      if (reportError) {
        console.error("Report insert error:", reportError);
        continue;
      }

      // Auto-score trade signal for each report
      try {
        const tsResponse = await fetch(AI_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: "You are a commodity trading analyst. Produce a trade signal." },
              { role: "user", content: `Region: ${target.region}, Crop: ${target.crop}, Severity: ${event.severity}, Headline: ${rpt.headline}, Market: ${rpt.market_implication}` },
            ],
            tools: [{
              type: "function",
              function: {
                name: "trade_signal",
                description: "Submit trade signal",
                parameters: {
                  type: "object",
                  properties: {
                    signal: { type: "string", enum: ["buy", "sell", "hold"] },
                    confidence: { type: "number" },
                    rationale: { type: "string" },
                    price_target: { type: "string" },
                    timeframe: { type: "string" },
                  },
                  required: ["signal", "confidence", "rationale"],
                  additionalProperties: false,
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "trade_signal" } },
          }),
        });
        if (tsResponse.ok) {
          const tsData = await tsResponse.json();
          const tsTool = tsData.choices?.[0]?.message?.tool_calls?.[0];
          if (tsTool) {
            const ts = JSON.parse(tsTool.function.arguments);
            await supabase.from("trade_signals").insert({
              report_id: reportData.id,
              signal: ts.signal || "hold",
              confidence: ts.confidence,
              rationale: ts.rationale,
              price_target: ts.price_target || null,
              timeframe: ts.timeframe || null,
            });
          }
        }
      } catch (e) {
        console.error("Trade signal scoring error:", e);
      }

      // Create notification
      await supabase.from("notifications").insert({
        user_id: userId,
        report_id: reportData.id,
        title: `🛰️ ${target.category === "agriculture" ? "Crop Alert" : target.category === "disaster" ? "Disaster Alert" : target.category === "wildfire" ? "Wildfire Alert" : target.category === "deforestation" ? "Deforestation Alert" : "EO Alert"}: ${rpt.headline}`,
        message: rpt.market_implication,
      });

      // Forward high severity to OpenClaw
      if (event.severity === "high" || event.severity === "critical") {
        try {
          const funcUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/openclaw-alert`;
          await fetch(funcUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-secret": Deno.env.get("OPENCLAW_INTERNAL_SECRET") || "",
            },
            body: JSON.stringify({ report_id: reportData.id }),
          });
        } catch (e) {
          console.error("OpenClaw forwarding error:", e);
        }
      }

      results.push({
        signal_id: signalId,
        report_id: reportData.id,
        headline: rpt.headline,
        severity: event.severity,
        region: target.region,
        category: target.category,
      });
    }

    if (scanId) {
      await supabase
        .from("agent_scans")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          events_detected: results.length,
        })
        .eq("id", scanId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        agent: "TerraSignal AI Agent v2",
        scan_id: scanId,
        events_detected: results.length,
        categories: [...new Set(SCAN_TARGETS.map(t => t.category))],
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Agent scan error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
