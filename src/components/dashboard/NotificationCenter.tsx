import { useNotifications } from "@/hooks/useNotifications";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

const NotificationCenter = () => {
  const { data: notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-9 h-9 rounded-full border border-border hover:bg-muted transition-colors"
      >
        <Bell className="w-4 h-4 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 z-50 w-[360px] max-h-[480px] overflow-auto rounded-xl border border-border bg-card shadow-lg"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-['Geist'] font-medium text-[14px] text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    className="text-[12px] font-['Geist'] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              {!notifications?.length ? (
                <div className="p-8 text-center">
                  <p className="font-['Geist'] text-[13px] text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                <div>
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        if (!n.read) markRead.mutate(n.id);
                      }}
                      className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors ${
                        !n.read ? "bg-accent/30" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!n.read ? "bg-primary" : "bg-transparent"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-['Geist'] text-[13px] font-medium text-foreground truncate">{n.title}</p>
                          {n.message && (
                            <p className="font-['Geist'] text-[12px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                          )}
                          <span className="font-['Geist'] text-[11px] text-muted-foreground mt-1 block">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
