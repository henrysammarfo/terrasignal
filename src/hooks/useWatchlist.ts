import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface WatchlistItem {
  id: string;
  user_id: string;
  commodity: string;
  region: string | null;
  alert_enabled: boolean;
  created_at: string;
}

export const useWatchlist = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["watchlist", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("watchlists")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as WatchlistItem[];
    },
    enabled: !!user,
  });

  const add = useMutation({
    mutationFn: async ({ commodity, region }: { commodity: string; region?: string }) => {
      const { error } = await supabase
        .from("watchlists")
        .insert({ user_id: user!.id, commodity, region: region || null });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["watchlist"] });
      toast.success("Added to watchlist");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("watchlists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["watchlist"] });
      toast.success("Removed from watchlist");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleAlert = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("watchlists")
        .update({ alert_enabled: enabled })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlist"] }),
  });

  return { ...query, add, remove, toggleAlert };
};
