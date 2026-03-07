import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const prevCountRef = useRef<number | null>(null);

  const query = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  // Realtime subscription — show toast on new notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        // Also refresh intel reports
        queryClient.invalidateQueries({ queryKey: ["intel-reports"] });

        const newNotif = payload.new as any;
        if (newNotif?.title) {
          toast({
            title: "🛰️ New Intelligence",
            description: newNotif.title.replace(/^🛰️\s*(Agent:\s*)?/, "").slice(0, 100),
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const unreadCount = query.data?.filter((n) => !n.read).length || 0;

  // Track unread count changes for badge animation
  useEffect(() => {
    if (prevCountRef.current !== null && unreadCount > prevCountRef.current) {
      // New unread notification arrived — could trigger sound here
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  return { ...query, unreadCount, markRead, markAllRead };
};
