import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { LogOut, Activity, Map, BarChart3, Settings, Satellite, Menu, X, User } from "lucide-react";
import Logo from "@/components/Logo";
import IntelFeed from "@/components/dashboard/IntelFeed";
import SignalMap from "@/components/dashboard/SignalMap";
import SignalCharts from "@/components/dashboard/SignalCharts";
import NotificationCenter from "@/components/dashboard/NotificationCenter";
import CommodityTicker from "@/components/dashboard/CommodityTicker";
import MarketChat from "@/components/dashboard/MarketChat";
import ThemeToggle from "@/components/ThemeToggle";

type Tab = "feed" | "map" | "charts";

const getGoogleAvatar = (user: any): string | null => {
  return user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
};

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("feed");
  const [mobileMenu, setMobileMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const googleAvatar = getGoogleAvatar(user);
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email;

  const tabs: { id: Tab; label: string; shortLabel: string; icon: any }[] = [
    { id: "feed", label: "Intel Feed", shortLabel: "Feed", icon: Activity },
    { id: "map", label: "Signal Map", shortLabel: "Map", icon: Map },
    { id: "charts", label: "Charts", shortLabel: "Charts", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 bg-background/80 backdrop-blur-md border-b border-border">
        <Logo />
        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-3">
          <ThemeToggle />
          <NotificationCenter />
          <button
            onClick={() => navigate("/settings")}
            className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-[13px] font-medium font-['Geist'] text-muted-foreground hover:text-foreground transition-colors"
          >
            {googleAvatar ? (
              <img src={googleAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <User className="w-3.5 h-3.5" />
            )}
            Profile
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-[13px] font-medium font-['Geist'] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            API
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-[13px] font-medium font-['Geist'] text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
        {/* Mobile actions */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />
          <NotificationCenter />
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            {mobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenu && (
        <div className="fixed top-[57px] left-0 right-0 z-40 bg-background border-b border-border shadow-lg sm:hidden">
          <div className="flex flex-col p-3 gap-1">
            {googleAvatar && (
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 mb-1">
                <img src={googleAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                <div className="min-w-0">
                  <p className="font-['Geist'] text-[14px] font-medium text-foreground truncate">{displayName}</p>
                  <p className="font-['Geist'] text-[12px] text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
            )}
            <button
              onClick={() => { navigate("/settings"); setMobileMenu(false); }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] font-['Geist'] text-foreground hover:bg-muted transition-colors"
            >
              <User className="w-4 h-4 text-muted-foreground" />
              Profile
            </button>
            <button
              onClick={() => { navigate("/settings"); setMobileMenu(false); }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] font-['Geist'] text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
              API & Settings
            </button>
            <button
              onClick={() => { handleSignOut(); setMobileMenu(false); }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] font-['Geist'] text-destructive hover:bg-destructive/5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mx-auto max-w-[1000px] px-4 sm:px-6 pt-20 pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-end justify-between mb-4">
            <div className="flex items-center gap-3">
              {googleAvatar && (
                <img src={googleAvatar} alt="" className="w-10 h-10 rounded-full object-cover border border-border hidden sm:block" />
              )}
              <div>
                <h1 className="font-['Geist'] font-medium text-[22px] sm:text-[28px] tracking-[-0.03em] text-foreground">Dashboard</h1>
                <p className="font-['Geist'] text-[13px] sm:text-[14px] text-muted-foreground mt-0.5 truncate max-w-[260px] sm:max-w-none">
                  Welcome, {displayName}
                </p>
              </div>
            </div>
          </div>

          {/* Commodity Prices Ticker */}
          <div className="mb-6">
            <p className="font-['Geist'] text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Markets</p>
            <CommodityTicker />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 rounded-lg bg-muted w-fit">
            {tabs.map(({ id, label, shortLabel, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md text-[13px] font-medium font-['Geist'] transition-all ${
                  tab === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{shortLabel}</span>
              </button>
            ))}
          </div>

          {tab === "feed" && (
            <>
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                <Satellite className="h-5 w-5 text-primary shrink-0" />
                <p className="font-['Geist'] text-[12px] sm:text-[13px] text-muted-foreground">
                  Live intel is updated automatically by the TerraSignal agent. New reports trigger real-time notifications.
                </p>
              </div>
              <IntelFeed />
            </>
          )}
          {tab === "map" && <SignalMap />}
          {tab === "charts" && <SignalCharts />}
        </motion.div>
      </div>

      {/* AI Chat */}
      <MarketChat />
    </div>
  );
};

export default Dashboard;
