import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "motion/react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      navigate("/dashboard");
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[400px]"
      >
        <h1 className="font-['Geist'] font-medium text-[28px] tracking-[-0.03em] text-foreground mb-2">
          Set new password
        </h1>
        <p className="font-['Geist'] text-[15px] text-muted-foreground mb-8">
          Enter your new password below.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={128}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-[14px] font-['Geist'] text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/30 transition-colors"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-foreground text-background py-3 text-[14px] font-medium font-['Geist'] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "..." : "Update Password"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
