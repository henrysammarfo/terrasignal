import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FLOCK_URL = "https://api.flock.io/v1/chat/completions";
const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

function parseTradeSignalFromContent(raw: string): { signal: string; confidence: number; rationale: string; price_target: string | null; timeframe: string | null } {
  let text = raw.trim();
  if (text.startsWith("```")) {
    const lines = text.split("\n");
    if (lines[0].startsWith("```")) lines.shift();
    if (lines.length && lines[lines.length - 1].trim() === "```") lines.pop();
    text = lines.join("\n");
  }
  const parsed = JSON.parse(text);
  const signal = ["buy", "sell", "hold"].includes(parsed.signal) ? parsed.signal : "hold";
  const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5));
  return {
    signal,
    confidence,
    rationale: String(parsed.rationale ?? ""),
    price_target: parsed.price_target != null ? String(parsed.price_target) : null,
    timeframe: parsed.timeframe != null ? String(parsed.timeframe) : null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const FLOCK_API_KEY = Deno.env.get("FLOCK_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const FLOCK_MODEL = Deno.env.get("FLOCK_MODEL") || "qwen3-30b-a3b-instruct-2507";

    const useFlock = !!FLOCK_API_KEY;
    if (!useFlock && !LOVABLE_API_KEY) throw new Error("Set FLOCK_API_KEY or LOVABLE_API_KEY in Edge Function secrets");

    const { report_id } = await req.json();
    if (!report_id) throw new Error("report_id required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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

    const { data: report, error: rErr } = await supabase
      .from("intel_reports")
      .select("*, crop_signals!inner(event_title, region_name, crop_type, severity)")
      .eq("id", report_id)
      .single();
    if (rErr || !report) throw new Error("Report not found");

    const signal = (report as any).crop_signals;
    const userContent = `Analyze this intel report and produce a trade signal.
Region: ${signal.region_name}
Crop: ${signal.crop_type}
Severity: ${signal.severity}
Headline: ${report.headline}
Summary: ${report.summary}
Market Implication: ${report.market_implication}
Confidence: ${report.confidence}`;

    let ts: { signal: string; confidence: number; rationale: string; price_target: string | null; timeframe: string | null };

    if (useFlock) {
      const systemPrompt = `You are a commodity trading analyst. Analyze intelligence reports and produce ONE actionable trade signal.
Return ONLY a single JSON object, no markdown or other text. Keys: "signal" (exactly one of: buy, sell, hold), "confidence" (number 0-1), "rationale" (2-3 sentences), "price_target" (e.g. "+5-10% over 2 weeks" or null), "timeframe" (e.g. "1-2 weeks" or null).`;

      const flockRes = await fetch(FLOCK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-litellm-api-key": FLOCK_API_KEY!,
        },
        body: JSON.stringify({
          model: FLOCK_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          max_tokens: 512,
          temperature: 0.2,
          stream: false,
        }),
      });

      if (!flockRes.ok) {
        if (flockRes.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited" }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (flockRes.status === 402) {
          return new Response(JSON.stringify({ error: "Flock API error or quota exceeded" }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`Flock API error: ${flockRes.status}`);
      }

      const flockData = await flockRes.json();
      const content = flockData.choices?.[0]?.message?.content;
      if (!content) throw new Error("Flock did not return trade signal content");
      ts = parseTradeSignalFromContent(content);
    } else {
      const aiResponse = await fetch(LOVABLE_URL, {
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
            { role: "user", content: userContent },
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
                    rationale: { type: "string" },
                    price_target: { type: "string" },
                    timeframe: { type: "string" },
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
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ error: "Credits exhausted. Set FLOCK_API_KEY to use Flock instead." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("AI did not return trade signal");
      const args = JSON.parse(toolCall.function.arguments);
      ts = {
        signal: ["buy", "sell", "hold"].includes(args.signal) ? args.signal : "hold",
        confidence: Math.max(0, Math.min(1, Number(args.confidence) || 0.5)),
        rationale: String(args.rationale ?? ""),
        price_target: args.price_target != null ? String(args.price_target) : null,
        timeframe: args.timeframe != null ? String(args.timeframe) : null,
      };
    }

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
