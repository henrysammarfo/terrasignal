import { useState } from "react";
import { Download, FileText, Table, Loader2 } from "lucide-react";
import { useIntelReports, IntelReportRow } from "@/hooks/useIntelReports";
import { useTradeSignals, TradeSignal } from "@/hooks/useTradeSignals";
import { toast } from "sonner";

function escapeCSV(val: string | number | null | undefined): string {
  if (val == null) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function reportsToCSV(reports: IntelReportRow[], tradeSignals: TradeSignal[]): string {
  const tsMap = new Map<string, TradeSignal>();
  tradeSignals.forEach(ts => tsMap.set(ts.report_id, ts));

  const headers = [
    "Date", "Headline", "Region", "Crop", "Severity", "Confidence",
    "Market Implication", "Trade Signal", "Signal Confidence", "Price Target",
    "Timeframe", "Rationale", "NDVI Mean", "NDVI Delta", "Anomaly Score",
    "Precip Anomaly (mm)", "Temp Anomaly (°C)", "Drought Index",
  ];

  const rows = reports.map(r => {
    const ts = tsMap.get(r.id);
    const sat = r.satellite_analyses?.[0];
    const wx = r.weather_contexts?.[0];
    return [
      r.generated_at, r.headline, r.crop_signals?.region_name, r.crop_signals?.crop_type,
      r.crop_signals?.severity, r.confidence != null ? Math.round(r.confidence * 100) + "%" : "",
      r.market_implication, ts?.signal?.toUpperCase() || "",
      ts?.confidence != null ? Math.round(ts.confidence * 100) + "%" : "",
      ts?.price_target || "", ts?.timeframe || "", ts?.rationale || "",
      sat?.ndvi_mean, sat?.ndvi_delta, sat?.anomaly_score,
      wx?.precip_anomaly_mm, wx?.temp_anomaly_c, wx?.drought_index,
    ].map(escapeCSV).join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

function reportsToPDFHTML(reports: IntelReportRow[], tradeSignals: TradeSignal[]): string {
  const tsMap = new Map<string, TradeSignal>();
  tradeSignals.forEach(ts => tsMap.set(ts.report_id, ts));

  const rows = reports.map(r => {
    const ts = tsMap.get(r.id);
    const sat = r.satellite_analyses?.[0];
    const sevColor = r.crop_signals?.severity === "critical" ? "#ef4444" :
      r.crop_signals?.severity === "high" ? "#f97316" :
      r.crop_signals?.severity === "medium" ? "#eab308" : "#22c55e";
    const tsColor = ts?.signal === "buy" ? "#22c55e" : ts?.signal === "sell" ? "#ef4444" : "#eab308";

    return `
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:12px;page-break-inside:avoid">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="background:${sevColor}20;color:${sevColor};padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600">${(r.crop_signals?.severity || "").toUpperCase()}</span>
          ${ts ? `<span style="background:${tsColor}20;color:${tsColor};padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600">${ts.signal.toUpperCase()} ${ts.confidence != null ? Math.round(ts.confidence * 100) + "%" : ""}</span>` : ""}
        </div>
        <h3 style="margin:0 0 4px 0;font-size:15px">${r.headline}</h3>
        <p style="color:#6b7280;font-size:12px;margin:0">${r.crop_signals?.region_name || ""} · ${r.crop_signals?.crop_type || ""} · ${new Date(r.generated_at).toLocaleDateString()}</p>
        ${r.summary ? `<p style="font-size:13px;margin:8px 0 0 0">${r.summary}</p>` : ""}
        ${r.market_implication ? `<p style="font-size:12px;color:#4b5563;margin:6px 0 0 0"><strong>Market:</strong> ${r.market_implication}</p>` : ""}
        ${ts?.rationale ? `<p style="font-size:12px;color:#4b5563;margin:4px 0 0 0"><strong>Trade Rationale:</strong> ${ts.rationale}</p>` : ""}
        ${sat ? `<p style="font-size:11px;color:#9ca3af;margin:6px 0 0 0">NDVI: ${sat.ndvi_mean?.toFixed(3) || "—"} | Δ: ${sat.ndvi_delta?.toFixed(3) || "—"} | Anomaly: ${sat.anomaly_score?.toFixed(1) || "—"}</p>` : ""}
      </div>`;
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>TerraSignal Intel Report</title>
    <style>body{font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:0 auto;padding:24px;color:#111}
    @media print{body{padding:12px}}</style></head><body>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;border-bottom:2px solid #111;padding-bottom:16px">
      <div><h1 style="margin:0;font-size:22px">TerraSignal Intelligence Report</h1>
      <p style="color:#6b7280;font-size:13px;margin:4px 0 0 0">${reports.length} signals · Generated ${new Date().toLocaleDateString()}</p></div>
    </div>${rows}</body></html>`;
}

const ExportButtons = () => {
  const { data: reports } = useIntelReports();
  const { data: tradeSignals } = useTradeSignals();
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  const handleCSV = () => {
    if (!reports?.length) { toast.error("No reports to export"); return; }
    setExporting("csv");
    try {
      const csv = reportsToCSV(reports, tradeSignals || []);
      downloadBlob(csv, `terrasignal-intel-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
      toast.success("CSV downloaded");
    } finally {
      setExporting(null);
    }
  };

  const handlePDF = () => {
    if (!reports?.length) { toast.error("No reports to export"); return; }
    setExporting("pdf");
    try {
      const html = reportsToPDFHTML(reports, tradeSignals || []);
      const printWin = window.open("", "_blank");
      if (printWin) {
        printWin.document.write(html);
        printWin.document.close();
        setTimeout(() => printWin.print(), 500);
      }
      toast.success("PDF ready — use Print dialog to save");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCSV}
        disabled={exporting !== null}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[12px] font-medium font-['Geist'] text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
      >
        {exporting === "csv" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Table className="w-3 h-3" />}
        CSV
      </button>
      <button
        onClick={handlePDF}
        disabled={exporting !== null}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[12px] font-medium font-['Geist'] text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
      >
        {exporting === "pdf" ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
        PDF
      </button>
    </div>
  );
};

export default ExportButtons;
