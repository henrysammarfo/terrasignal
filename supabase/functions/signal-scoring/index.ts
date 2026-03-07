import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { report_id } = await req.json();
    if (!report_id) throw new Error("report_id required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if already scored
    const { data: existing } = await supabase
      .from("trade_signals")
      .select("id")
      .eq("report_id", report_id)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ success: true, message: "Already scored" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get report with signal data
    const { data: report, error: rErr } = await supabase
      .from("intel_reports")
      .select("*, crop_signals!inner(event_title, region_name, crop_type, severity)")
      .eq("id", report_id)
      .single();
    if (rErr || !report) throw new Error("Report not found");

    const signal = (report as any).crop_signals;

    const aiResponse = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a commodity trading analyst. Analyze intelligence reports and produce actionable trade signals.",
          },
          {
            role: "user",
            content: `Analyze this intel report and produce a trade signal:
Region: ${signal.region_name}
Crop: ${signal.crop_type}
Severity: ${signal.severity}
Headline: ${report.headline}
Summary: ${report.summary}
Market Implication: ${report.market_implication}
Confidence: ${report.confidence}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_trade_signal",
              description: "Submit a trade signal for the commodity",
              parameters: {
                type: "object",
                properties: {
                  signal: { type: "string", enum: ["buy", "sell", "hold"] },
                  confidence: { type: "number", description: "0.0 to 1.0" },
                  rationale: { type: "string", description: "2-3 sentence rationale" },
                  price_target: { type: "string", description: "Expected price direction and magnitude, e.g. '+5-10% over 2 weeks'" },
                  timeframe: { type: "string", description: "e.g. '1-2 weeks', '1 month'" },
                },
                required: ["signal", "confidence", "rationale", "price_target", "timeframe"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_trade_signal" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return trade signal");

    const ts = JSON.parse(toolCall.function.arguments);

    await supabase.from("trade_signals").insert({
      report_id,
      signal: ts.signal,
      confidence: ts.confidence,
      rationale: ts.rationale,
      price_target: ts.price_target,
      timeframe: ts.timeframe,
    });

    return new Response(JSON.stringify({ success: true, trade_signal: ts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Signal scoring error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
