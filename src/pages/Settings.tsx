import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Copy, Check, Key, Globe, Code, Terminal } from "lucide-react";
import Logo from "@/components/Logo";
import { useState } from "react";

const WEBHOOK_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/webhook-receiver`;

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium font-['Geist'] border border-border bg-muted text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
};

const CodeBlock = ({ children }: { children: string }) => (
  <div className="relative rounded-lg border border-border bg-muted/50 p-4 overflow-x-auto">
    <div className="absolute top-2 right-2">
      <CopyButton text={children} />
    </div>
    <pre className="font-mono text-[12px] text-foreground whitespace-pre-wrap leading-relaxed pr-16">
      {children}
    </pre>
  </div>
);

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const pythonSnippet = `import requests

url = "${WEBHOOK_URL}"
headers = {
    "Content-Type": "application/json",
    # "x-api-key": "YOUR_WEBHOOK_API_KEY"  # optional
}

payload = {
    "user_id": "${user?.id || "YOUR_USER_ID"}",
    "signal": {
        "event_title": "Drought hits Mato Grosso soy belt",
        "region_name": "Mato Grosso, Brazil",
        "crop_type": "Soy",
        "severity": "high",
        "bbox": [-56.0, -13.0, -54.0, -12.0],
        "event_source": "USDA",
        "published_at": "2026-03-02T12:00:00Z"
    },
    "satellite": {
        "ndvi_mean": 0.42,
        "ndvi_delta": -0.15,
        "ndwi_mean": 0.18,
        "anomaly_score": -2.1,
        "cloud_cover_pct": 12.5,
        "acquisition_date": "2026-03-01"
    },
    "weather": {
        "precip_anomaly_mm": -45.0,
        "temp_anomaly_c": 2.8,
        "drought_index": "D3",
        "soil_moisture_percentile": 8.0
    },
    "report": {
        "headline": "Brazil Soy Output at Risk",
        "summary": "Severe drought in Mato Grosso...",
        "confidence": 0.87,
        "market_implication": "CBOT soybean futures likely to rally 5-8%"
    }
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;

  const curlSnippet = `curl -X POST "${WEBHOOK_URL}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "user_id": "${user?.id || "YOUR_USER_ID"}",
    "signal": {
      "event_title": "Test signal",
      "region_name": "Iowa, United States",
      "severity": "medium"
    },
    "report": {
      "headline": "Test Report",
      "summary": "Testing webhook integration"
    }
  }'`;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 bg-background/80 backdrop-blur-md border-b border-border">
        <Logo />
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-[13px] font-medium font-['Geist'] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </button>
      </div>

      <div className="mx-auto max-w-[720px] px-4 sm:px-6 pt-20 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-['Geist'] font-medium text-[22px] sm:text-[28px] tracking-[-0.03em] text-foreground mb-1">
            Settings & API
          </h1>
          <p className="font-['Geist'] text-[14px] text-muted-foreground mb-8">
            Connect your Python agent to start sending live signals to your dashboard.
          </p>

          {/* Credentials */}
          <div className="space-y-4 mb-10">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Key className="w-4 h-4 text-primary" />
                <h2 className="font-['Geist'] font-medium text-[15px] text-foreground">Your User ID</h2>
              </div>
              <div className="flex items-center gap-3">
                <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-[13px] text-foreground truncate">
                  {user?.id || "—"}
                </code>
                {user?.id && <CopyButton text={user.id} />}
              </div>
              <p className="font-['Geist'] text-[12px] text-muted-foreground mt-2">
                Include this as <code className="bg-muted px-1 rounded text-[11px]">user_id</code> in every webhook payload so signals appear in your dashboard.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-primary" />
                <h2 className="font-['Geist'] font-medium text-[15px] text-foreground">Webhook Endpoint</h2>
              </div>
              <div className="flex items-center gap-3">
                <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-[12px] text-foreground truncate">
                  {WEBHOOK_URL}
                </code>
                <CopyButton text={WEBHOOK_URL} />
              </div>
              <p className="font-['Geist'] text-[12px] text-muted-foreground mt-2">
                Send <code className="bg-muted px-1 rounded text-[11px]">POST</code> requests with JSON body containing <code className="bg-muted px-1 rounded text-[11px]">signal</code> and <code className="bg-muted px-1 rounded text-[11px]">report</code>.
              </p>
            </div>
          </div>

          {/* Payload Schema */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Code className="w-4 h-4 text-primary" />
              <h2 className="font-['Geist'] font-medium text-[17px] text-foreground">Payload Schema</h2>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              {[
                { field: "user_id", type: "string (UUID)", required: "recommended", desc: "Your auth user ID" },
                { field: "signal", type: "object", required: "required", desc: "event_title, region_name, severity, crop_type, bbox, event_source, published_at" },
                { field: "satellite", type: "object", required: "optional", desc: "ndvi_mean, ndvi_delta, ndwi_mean, msi_mean, anomaly_score, cloud_cover_pct, acquisition_date" },
                { field: "weather", type: "object", required: "optional", desc: "precip_anomaly_mm, temp_anomaly_c, drought_index, soil_moisture_percentile" },
                { field: "report", type: "object", required: "required", desc: "headline, summary, confidence, market_implication" },
              ].map((row) => (
                <div key={row.field} className="flex items-start gap-3">
                  <code className="font-mono text-[13px] text-foreground font-medium min-w-[90px]">{row.field}</code>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-['Geist'] text-[12px] text-muted-foreground">{row.type}</span>
                      <span className={`text-[10px] font-['Geist'] font-medium px-1.5 py-0.5 rounded-full border ${
                        row.required === "required"
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : row.required === "recommended"
                          ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-600"
                          : "border-border bg-muted text-muted-foreground"
                      }`}>
                        {row.required}
                      </span>
                    </div>
                    <p className="font-['Geist'] text-[12px] text-muted-foreground">{row.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Start */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="w-4 h-4 text-primary" />
                <h2 className="font-['Geist'] font-medium text-[17px] text-foreground">Quick Start — cURL</h2>
              </div>
              <CodeBlock>{curlSnippet}</CodeBlock>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Code className="w-4 h-4 text-primary" />
                <h2 className="font-['Geist'] font-medium text-[17px] text-foreground">Python Example</h2>
              </div>
              <CodeBlock>{pythonSnippet}</CodeBlock>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
