import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { LogOut } from "lucide-react";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background px-6 pt-24">
      <div className="mx-auto max-w-[800px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-['Geist'] font-medium text-[28px] tracking-[-0.03em] text-foreground">
                Dashboard
              </h1>
              <p className="font-['Geist'] text-[15px] text-muted-foreground mt-1">
                Welcome, {user?.email}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-[13px] font-medium font-['Geist'] text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="font-['Geist'] text-[15px] text-muted-foreground">
              Your TerraSignal dashboard is ready. Start monitoring commodities.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
