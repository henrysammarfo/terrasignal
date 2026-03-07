import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X, Bell, BellOff, Eye, Trash2 } from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";
import { Input } from "@/components/ui/input";

const COMMODITIES = ["Corn", "Wheat", "Soybeans", "Rice", "Sugar", "Coffee", "Cotton", "Cocoa", "Palm Oil", "Canola"];
const REGIONS = ["Punjab, India", "Midwest USA", "Ukraine Black Sea", "Mato Grosso, Brazil", "Queensland, Australia", "Nile Delta, Egypt", "Heilongjiang, China", "Buenos Aires, Argentina"];

const Watchlist = () => {
  const { data: items, isLoading, add, remove, toggleAlert } = useWatchlist();
  const [showAdd, setShowAdd] = useState(false);
  const [commodity, setCommodity] = useState("");
  const [region, setRegion] = useState("");
  const [customCommodity, setCustomCommodity] = useState("");

  const handleAdd = () => {
    const c = commodity === "__custom" ? customCommodity.trim() : commodity;
    if (!c) return;
    add.mutate({ commodity: c, region: region || undefined });
    setCommodity("");
    setRegion("");
    setCustomCommodity("");
    setShowAdd(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="font-['Geist'] font-medium text-[15px] text-foreground">Portfolio Watchlist</h3>
          <p className="font-['Geist'] text-[12px] text-muted-foreground mt-0.5">Track commodities & regions you care about</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium font-['Geist'] hover:opacity-90 transition-opacity"
        >
          {showAdd ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {showAdd ? "Cancel" : "Add"}
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-border bg-muted/30 space-y-3">
              <div>
                <label className="font-['Geist'] text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Commodity</label>
                <select
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] font-['Geist'] text-foreground"
                >
                  <option value="">Select commodity…</option>
                  {COMMODITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__custom">Custom…</option>
                </select>
                {commodity === "__custom" && (
                  <Input
                    placeholder="Enter commodity name"
                    value={customCommodity}
                    onChange={(e) => setCustomCommodity(e.target.value)}
                    className="mt-2 text-[13px]"
                  />
                )}
              </div>
              <div>
                <label className="font-['Geist'] text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Region (optional)</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] font-['Geist'] text-foreground"
                >
                  <option value="">All regions</option>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button
                onClick={handleAdd}
                disabled={!commodity || (commodity === "__custom" && !customCommodity.trim()) || add.isPending}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium font-['Geist'] hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {add.isPending ? "Adding…" : "Add to Watchlist"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}
          </div>
        ) : !items?.length ? (
          <div className="px-5 py-8 text-center">
            <Eye className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="font-['Geist'] text-[13px] text-muted-foreground">No items in your watchlist yet.</p>
            <p className="font-['Geist'] text-[12px] text-muted-foreground mt-1">Add commodities and regions to track.</p>
          </div>
        ) : (
          items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-['Geist'] text-[14px] font-medium text-foreground">{item.commodity}</p>
                {item.region && (
                  <p className="font-['Geist'] text-[12px] text-muted-foreground">{item.region}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleAlert.mutate({ id: item.id, enabled: !item.alert_enabled })}
                  className={`p-1.5 rounded-lg transition-colors ${item.alert_enabled ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}
                  title={item.alert_enabled ? "Alerts on" : "Alerts off"}
                >
                  {item.alert_enabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => remove.mutate(item.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Watchlist;
