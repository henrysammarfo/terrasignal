import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { LogOut, LayoutDashboard, Map, Activity } from "lucide-react";
import { useState } from "react";
import IntelFeed from "@/components/dashboard/IntelFeed";
import SignalMap from "@/components/dashboard/SignalMap";
import NotificationCenter from "@/components/dashboard/NotificationCenter";

type Tab = "feed" | "map";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("feed");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "feed", label: "Intel Feed", icon: Activity },
    { id: "map", label: "Signal Map", icon: Map },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
            <span className="text-background text-xs font-bold font-['Geist']">T</span>
          </div>
          <span className="text-[17px] font-semibold font-['Geist'] tracking-[-0.02em] text-foreground">TerraSignal</span>
        </div>
        <div className="flex items-center gap-3">
          <NotificationCenter />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-[13px] font-medium font-['Geist'] text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[1000px] px-6 pt-20 pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h1 className="font-['Geist'] font-medium text-[28px] tracking-[-0.03em] text-foreground">Dashboard</h1>
              <p className="font-['Geist'] text-[14px] text-muted-foreground mt-0.5">Welcome, {user?.email}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 rounded-lg bg-muted w-fit">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-medium font-['Geist'] transition-all ${
                  tab === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {tab === "feed" && <IntelFeed />}
          {tab === "map" && <SignalMap />}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
