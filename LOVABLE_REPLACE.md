# Replace these files in Lovable

In Lovable, open each file below and **replace its entire contents** with the code block under it. Then deploy the Edge Functions and set secrets (WEBHOOK_API_KEY, FLOCK_API_KEY).

---

## 1. `supabase/functions/webhook-receiver/index.ts`

```ts
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

    // Deduplication: skip if same event_url already exists for this user
    if (signal.event_url) {
      const { data: existing } = await supabase
        .from("crop_signals")
        .select("id")
        .eq("user_id", user_id)
        .eq("event_url", signal.event_url)
        .maybeSingle();
      if (existing) {
        return new Response(
          JSON.stringify({ success: true, deduplicated: true, existing_signal_id: existing.id }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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
        // Do NOT use `|| null` for numeric fields so that 0 is preserved.
        ndvi_mean: satellite.ndvi_mean,
        ndvi_delta: satellite.ndvi_delta,
        ndwi_mean: satellite.ndwi_mean,
        msi_mean: satellite.msi_mean,
        cloud_cover_pct: satellite.cloud_cover_pct,
        anomaly_score: satellite.anomaly_score,
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
        precip_anomaly_mm: weather.precip_anomaly_mm,
        temp_anomaly_c: weather.temp_anomaly_c,
        drought_index: weather.drought_index || null,
        soil_moisture_percentile: weather.soil_moisture_percentile,
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
            "x-internal-secret": Deno.env.get("OPENCLAW_INTERNAL_SECRET") || "",
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
```

---

## 2. `supabase/functions/market-chat/index.ts`

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FLOCK_URL = "https://api.flock.io/v1/chat/completions";
const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const FLOCK_API_KEY = Deno.env.get("FLOCK_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const FLOCK_MODEL = Deno.env.get("FLOCK_MODEL") || "qwen3-30b-a3b-instruct-2507";

    const useFlock = !!FLOCK_API_KEY;

    if (!useFlock && !LOVABLE_API_KEY) {
      throw new Error("Set FLOCK_API_KEY or LOVABLE_API_KEY in Edge Function secrets");
    }

    const systemPrompt = `You are TerraSignal AI — an expert analyst with deep knowledge of agricultural markets, satellite-based crop monitoring (Sentinel-2 NDVI/NDWI/MSI), weather patterns, disasters, and global supply chains.

Your capabilities:
- Analyze crop signals, satellite data (NDVI, NDWI, MSI, anomaly scores), and weather anomalies
- Provide market implications for corn, wheat, soybeans, sugar, coffee, cotton, and other agricultural commodities
- Explain how satellite-derived vegetation indices relate to crop health and yield forecasts
- Discuss global food security, trade flows, disasters, and supply/demand dynamics
- Generate trade ideas with directional bias (bullish/bearish) and confidence levels
- Interpret drought indices, precipitation anomalies, and soil moisture data

Personality:
- Concise and data-driven, like a Bloomberg terminal analyst
- Use bullet points for key takeaways
- Cite specific data points when possible
- End market analysis with a clear directional call (Bullish/Bearish/Neutral) and confidence %

Format responses in markdown. Keep answers focused and actionable.`;

    const body = {
      model: useFlock ? FLOCK_MODEL : "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
    };

    const response = useFlock
      ? await fetch(FLOCK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-litellm-api-key": FLOCK_API_KEY!,
          },
          body: JSON.stringify(body),
        })
      : await fetch(LOVABLE_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Use Flock by setting FLOCK_API_KEY in Edge Function secrets, or add Lovable credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

---

## 3. `supabase/functions/signal-scoring/index.ts`

```ts
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
```

---

## After replacing

1. **Deploy** the three Edge Functions in Lovable (deploy / publish so they run on Lovable’s Supabase).
2. **Set secrets** in Lovable for the Edge Functions:
   - **webhook-receiver:** `WEBHOOK_API_KEY` = `ts-webhook-2026-xK9mPqR7vL3nW8jF`
   - **market-chat** and **signal-scoring:** `FLOCK_API_KEY` = your Flock API key

Then run locally: `python scripts/test_edge_functions.py` to confirm market-chat and (with a report_id) signal-scoring work.

---

## Prompt to paste in Lovable (after you replaced the 3 files)

Copy the block below into **Lovable project chat** so Lovable deploys the updated functions and sets secrets. Use either version:

**Option A — you provide the Flock key in chat when asked:**  
(Use this if you prefer not to put your key in the prompt.)

```
I've just replaced the code in these three Edge Function files with the latest version from my repo:
- supabase/functions/webhook-receiver/index.ts
- supabase/functions/market-chat/index.ts
- supabase/functions/signal-scoring/index.ts

Please do the following in this Lovable project:

1) Deploy all three Edge Functions to our connected Supabase project (Lovable Cloud). Make sure the deployed versions use the code that is now in those files.

2) Set these secrets for the Edge Functions:
   - For webhook-receiver: set WEBHOOK_API_KEY to exactly: ts-webhook-2026-xK9mPqR7vL3nW8jF
   - For market-chat: set FLOCK_API_KEY — ask me for the value and I'll paste it in chat
   - For signal-scoring: set FLOCK_API_KEY to the same value you used for market-chat

3) Confirm that after deployment, market-chat and signal-scoring will use Flock when FLOCK_API_KEY is set (so we don't get "AI credits exhausted" from Lovable). The code in those files already checks for FLOCK_API_KEY first.

Reply with: "Done" and the live URLs for webhook-receiver, market-chat, and signal-scoring so I can update my local .env if needed.
```

**Option B — paste your Flock key in the prompt:**  
Replace `YOUR_FLOCK_API_KEY` below with your real key, then paste.

```
I've just replaced the code in these three Edge Function files with the latest version from my repo:
- supabase/functions/webhook-receiver/index.ts
- supabase/functions/market-chat/index.ts
- supabase/functions/signal-scoring/index.ts

Please do the following in this Lovable project:

1) Deploy all three Edge Functions to our connected Supabase project (Lovable Cloud). Make sure the deployed versions use the code that is now in those files.

2) Set these secrets for the Edge Functions:
   - For webhook-receiver: set WEBHOOK_API_KEY to exactly: ts-webhook-2026-xK9mPqR7vL3nW8jF
   - For market-chat: set FLOCK_API_KEY to: YOUR_FLOCK_API_KEY
   - For signal-scoring: set FLOCK_API_KEY to: YOUR_FLOCK_API_KEY

3) Confirm that after deployment, market-chat and signal-scoring will use Flock when FLOCK_API_KEY is set (so we don't get "AI credits exhausted" from Lovable). The code in those files already checks for FLOCK_API_KEY first.

Reply with: "Done" and the live URLs for webhook-receiver, market-chat, and signal-scoring so I can update my local .env if needed.
```
