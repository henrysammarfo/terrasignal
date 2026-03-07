import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Copy, Check, Key, Globe, Code, Terminal, User, Mail, Save } from "lucide-react";
import Logo from "@/components/Logo";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AvatarUpload from "@/components/AvatarUpload";
import ThemeToggle from "@/components/ThemeToggle";

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
    <pre className="font-mono text-[11px] sm:text-[12px] text-foreground whitespace-pre-wrap leading-relaxed pr-16">
      {children}
    </pre>
  </div>
);

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "api">("profile");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      });
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } else {
      toast({ title: "Profile updated", description: "Your display name has been saved." });
    }
  };

  const pythonSnippet = `import requests

url = "${WEBHOOK_URL}"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "YOUR_WEBHOOK_API_KEY"
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
  -H "x-api-key: YOUR_WEBHOOK_API_KEY" \\
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
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Logo />
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 rounded-full border border-border px-3 sm:px-4 py-2 text-[13px] font-medium font-['Geist'] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Back to Dashboard</span>
          <span className="sm:hidden">Back</span>
        </button>
      </div>

      <div className="mx-auto max-w-[720px] px-4 sm:px-6 pt-20 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-['Geist'] font-medium text-[22px] sm:text-[28px] tracking-[-0.03em] text-foreground mb-1">
            Settings
          </h1>
          <p className="font-['Geist'] text-[13px] sm:text-[14px] text-muted-foreground mb-6">
            Manage your profile and API integrations.
          </p>

          {/* Tab switcher */}
          <div className="flex gap-1 mb-8 p-1 rounded-lg bg-muted w-fit">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-medium font-['Geist'] transition-all ${
                activeTab === "profile" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab("api")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-medium font-['Geist'] transition-all ${
                activeTab === "api" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              API
            </button>
          </div>

          {activeTab === "profile" && (
            <div className="space-y-4">
              {/* Avatar */}
              {user && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <AvatarUpload
                    userId={user.id}
                    currentUrl={avatarUrl}
                    onUploaded={(url) => setAvatarUrl(url)}
                  />
                </div>
              )}

              {/* Display Name */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-4 h-4 text-primary" />
                  <h2 className="font-['Geist'] font-medium text-[15px] text-foreground">Display Name</h2>
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={100}
                  placeholder="Enter your name"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-[14px] font-['Geist'] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
                />
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="mt-3 flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-[13px] font-medium font-['Geist'] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>

              {/* Email (read-only) */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-4 h-4 text-primary" />
                  <h2 className="font-['Geist'] font-medium text-[15px] text-foreground">Email</h2>
                </div>
                <code className="block rounded-md bg-muted px-3 py-2 font-mono text-[13px] text-foreground truncate">
                  {user?.email || "—"}
                </code>
                <p className="font-['Geist'] text-[12px] text-muted-foreground mt-2">
                  Your email address cannot be changed here.
                </p>
              </div>

              {/* User ID */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Key className="w-4 h-4 text-primary" />
                  <h2 className="font-['Geist'] font-medium text-[15px] text-foreground">User ID</h2>
                </div>
                <div className="flex items-center gap-3">
                  <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-[12px] sm:text-[13px] text-foreground truncate">
                    {user?.id || "—"}
                  </code>
                  {user?.id && <CopyButton text={user.id} />}
                </div>
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <>
              {/* Credentials */}
              <div className="space-y-4 mb-10">
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Key className="w-4 h-4 text-primary" />
                    <h2 className="font-['Geist'] font-medium text-[15px] text-foreground">Your User ID</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-[12px] sm:text-[13px] text-foreground truncate">
                      {user?.id || "—"}
                    </code>
                    {user?.id && <CopyButton text={user.id} />}
                  </div>
                  <p className="font-['Geist'] text-[12px] text-muted-foreground mt-2">
                    Include this as <code className="bg-muted px-1 rounded text-[11px]">user_id</code> in every webhook payload.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-primary" />
                    <h2 className="font-['Geist'] font-medium text-[15px] text-foreground">Webhook Endpoint</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-[11px] sm:text-[12px] text-foreground truncate">
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
                <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-3">
                  {[
                    { field: "user_id", type: "string (UUID)", required: "recommended", desc: "Your auth user ID" },
                    { field: "signal", type: "object", required: "required", desc: "event_title, region_name, severity, crop_type, bbox, event_source, published_at" },
                    { field: "satellite", type: "object", required: "optional", desc: "ndvi_mean, ndvi_delta, ndwi_mean, msi_mean, anomaly_score, cloud_cover_pct, acquisition_date" },
                    { field: "weather", type: "object", required: "optional", desc: "precip_anomaly_mm, temp_anomaly_c, drought_index, soil_moisture_percentile" },
                    { field: "report", type: "object", required: "required", desc: "headline, summary, confidence, market_implication" },
                  ].map((row) => (
                    <div key={row.field} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                      <code className="font-mono text-[13px] text-foreground font-medium sm:min-w-[90px]">{row.field}</code>
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
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
