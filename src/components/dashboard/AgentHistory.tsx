import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "motion/react";
import { Clock, CheckCircle2, XCircle, Loader2, History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AgentScan {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  events_detected: number;
  regions_scanned: number;
  error_message: string | null;
}

const AgentHistory = () => {
  const { user } = useAuth();

  const { data: scans, isLoading } = useQuery({
    queryKey: ["agent-scans", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_scans")
        .select("*")
        .eq("user_id", user!.id)
        .order("started_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as AgentScan[];
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="mt-4 space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!scans?.length) {
    return (
      <div className="mt-4 rounded-xl border border-border bg-card p-8 text-center">
        <History className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
        <p className="font-['Geist'] text-[13px] text-muted-foreground">
          No agent scans yet. Click "Run Agent" to start your first scan.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="font-['Geist'] font-medium text-[13px] text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
        <History className="w-3.5 h-3.5" />
        Agent History
      </h3>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-2.5 text-[11px] font-medium font-['Geist'] text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-medium font-['Geist'] text-muted-foreground uppercase tracking-wider">Time</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-medium font-['Geist'] text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Duration</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-medium font-['Geist'] text-muted-foreground uppercase tracking-wider">Events</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-medium font-['Geist'] text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Regions</th>
            </tr>
          </thead>
          <tbody>
            {scans.map((scan, i) => {
              const duration =
                scan.completed_at && scan.started_at
                  ? Math.round(
                      (new Date(scan.completed_at).getTime() - new Date(scan.started_at).getTime()) / 1000
                    )
                  : null;

              return (
                <motion.tr
                  key={scan.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {scan.status === "completed" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      ) : scan.status === "failed" ? (
                        <XCircle className="w-3.5 h-3.5 text-destructive" />
                      ) : (
                        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                      )}
                      <span
                        className={`text-[12px] font-medium font-['Geist'] ${
                          scan.status === "completed"
                            ? "text-green-600"
                            : scan.status === "failed"
                            ? "text-destructive"
                            : "text-primary"
                        }`}
                      >
                        {scan.status === "completed"
                          ? "Complete"
                          : scan.status === "failed"
                          ? "Failed"
                          : "Running"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] font-['Geist'] text-muted-foreground">
                      {formatDistanceToNow(new Date(scan.started_at), { addSuffix: true })}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-[12px] font-['Geist'] text-muted-foreground">
                      {duration !== null ? `${duration}s` : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-[13px] font-semibold font-['Geist'] text-foreground">
                      {scan.events_detected}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <span className="text-[12px] font-['Geist'] text-muted-foreground">
                      {scan.regions_scanned}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AgentHistory;
