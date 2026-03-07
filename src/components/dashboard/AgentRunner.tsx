import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bot, Satellite, Zap, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type AgentPhase = "idle" | "scanning" | "analyzing" | "ingesting" | "done" | "error";

const phases: { id: AgentPhase; label: string; icon: any }[] = [
  { id: "scanning", label: "Detecting events across 6 global regions…", icon: Satellite },
  { id: "analyzing", label: "Analyzing Sentinel-2 imagery & weather data…", icon: Bot },
  { id: "ingesting", label: "Generating intel reports & alerts…", icon: Zap },
  { id: "done", label: "Agent scan complete", icon: CheckCircle2 },
];

const AgentRunner = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [phase, setPhase] = useState<AgentPhase>("idle");
  const [resultCount, setResultCount] = useState(0);

  const runAgent = async () => {
    if (phase !== "idle" && phase !== "done" && phase !== "error") return;

    setPhase("scanning");
    setResultCount(0);

    // Simulate progressive phases while the edge function runs
    const phaseTimer1 = setTimeout(() => setPhase("analyzing"), 3000);
    const phaseTimer2 = setTimeout(() => setPhase("ingesting"), 7000);

    try {
      const { data, error } = await supabase.functions.invoke("agent-scan");

      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResultCount(data.events_detected || 0);
      setPhase("done");

      // Refresh the feed
      queryClient.invalidateQueries({ queryKey: ["intel-reports"] });

      toast({
        title: "🛰️ Agent Scan Complete",
        description: `Detected ${data.events_detected} events across global regions.`,
      });

      // Reset to idle after a delay
      setTimeout(() => setPhase("idle"), 8000);
    } catch (err: any) {
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      console.error("Agent error:", err);
      setPhase("error");
      toast({
        title: "Agent Error",
        description: err.message || "Failed to run agent scan.",
        variant: "destructive",
      });
      setTimeout(() => setPhase("idle"), 5000);
    }
  };

  const isRunning = phase === "scanning" || phase === "analyzing" || phase === "ingesting";
  const currentPhaseInfo = phases.find((p) => p.id === phase);

  return (
    <div className="mb-6">
      <motion.div
        layout
        className={`relative overflow-hidden rounded-2xl border transition-all duration-500 ${
          isRunning
            ? "border-primary/30 bg-primary/5"
            : phase === "done"
            ? "border-green-500/30 bg-green-500/5"
            : phase === "error"
            ? "border-destructive/30 bg-destructive/5"
            : "border-border bg-card hover:border-primary/20"
        }`}
      >
        {/* Animated scan line when running */}
        {isRunning && (
          <motion.div
            className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
            animate={{ y: [0, 100, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        )}

        <div className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isRunning
                  ? "bg-primary/10"
                  : phase === "done"
                  ? "bg-green-500/10"
                  : "bg-muted"
              }`}
            >
              {isRunning ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : phase === "done" ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : phase === "error" ? (
                <AlertCircle className="w-5 h-5 text-destructive" />
              ) : (
                <Bot className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-['Geist'] font-medium text-[14px] text-foreground">
                TerraSignal AI Agent
              </h3>
              <AnimatePresence mode="wait">
                <motion.p
                  key={phase}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="font-['Geist'] text-[12px] text-muted-foreground mt-0.5"
                >
                  {phase === "idle"
                    ? "Scan global regions for crop events, satellite anomalies & market signals"
                    : phase === "done"
                    ? `${resultCount} new intelligence reports generated`
                    : phase === "error"
                    ? "Scan failed — try again"
                    : currentPhaseInfo?.label}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          <button
            onClick={runAgent}
            disabled={isRunning}
            className={`shrink-0 px-5 py-2.5 rounded-xl text-[13px] font-medium font-['Geist'] transition-all ${
              isRunning
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
            }`}
          >
            {isRunning ? "Running…" : phase === "done" ? "Run Again" : "Run Agent"}
          </button>
        </div>

        {/* Progress phases */}
        {(isRunning || phase === "done") && (
          <div className="px-5 pb-4 flex gap-6">
            {phases.slice(0, -1).map((p, i) => {
              const phaseOrder = ["scanning", "analyzing", "ingesting"];
              const currentIdx = phaseOrder.indexOf(phase);
              const thisIdx = phaseOrder.indexOf(p.id);
              const isComplete = phase === "done" || thisIdx < currentIdx;
              const isActive = thisIdx === currentIdx;

              return (
                <div key={p.id} className="flex items-center gap-1.5">
                  <div
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      isComplete
                        ? "bg-green-500"
                        : isActive
                        ? "bg-primary animate-pulse"
                        : "bg-border"
                    }`}
                  />
                  <span
                    className={`text-[11px] font-['Geist'] transition-colors ${
                      isComplete
                        ? "text-green-600"
                        : isActive
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {["Detect", "Analyze", "Report"][i]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AgentRunner;
