import { useMemo } from "react";
import { IntelReportRow } from "@/hooks/useIntelReports";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

export type SortField = "date" | "severity" | "confidence";
export type SortDir = "asc" | "desc";

interface Props {
  reports: IntelReportRow[];
  severity: string;
  cropType: string;
  region: string;
  sortField: SortField;
  sortDir: SortDir;
  onSeverity: (v: string) => void;
  onCropType: (v: string) => void;
  onRegion: (v: string) => void;
  onSortField: (v: SortField) => void;
  onSortDir: (v: SortDir) => void;
}

const IntelFeedFilters = ({
  reports,
  severity,
  cropType,
  region,
  sortField,
  sortDir,
  onSeverity,
  onCropType,
  onRegion,
  onSortField,
  onSortDir,
}: Props) => {
  const options = useMemo(() => {
    const severities = new Set<string>();
    const crops = new Set<string>();
    const regions = new Set<string>();
    reports.forEach((r) => {
      if (r.crop_signals?.severity) severities.add(r.crop_signals.severity);
      if (r.crop_signals?.crop_type) crops.add(r.crop_signals.crop_type);
      if (r.crop_signals?.region_name) regions.add(r.crop_signals.region_name);
    });
    return {
      severities: Array.from(severities).sort(),
      crops: Array.from(crops).sort(),
      regions: Array.from(regions).sort(),
    };
  }, [reports]);

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <Select value={severity} onValueChange={onSeverity}>
        <SelectTrigger className="w-[130px] h-8 text-[12px] font-['Geist']">
          <SelectValue placeholder="Severity" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Severity</SelectItem>
          {options.severities.map((s) => (
            <SelectItem key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={cropType} onValueChange={onCropType}>
        <SelectTrigger className="w-[130px] h-8 text-[12px] font-['Geist']">
          <SelectValue placeholder="Crop Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Crops</SelectItem>
          {options.crops.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={region} onValueChange={onRegion}>
        <SelectTrigger className="w-[150px] h-8 text-[12px] font-['Geist']">
          <SelectValue placeholder="Region" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Regions</SelectItem>
          {options.regions.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sortField} onValueChange={(v) => onSortField(v as SortField)}>
        <SelectTrigger className="w-[130px] h-8 text-[12px] font-['Geist']">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date">Date</SelectItem>
          <SelectItem value="severity">Severity</SelectItem>
          <SelectItem value="confidence">Confidence</SelectItem>
        </SelectContent>
      </Select>

      <button
        onClick={() => onSortDir(sortDir === "asc" ? "desc" : "asc")}
        className="flex items-center gap-1 h-8 px-2 rounded-md border border-input bg-background text-[12px] font-['Geist'] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowUpDown className="w-3 h-3" />
        {sortDir === "asc" ? "Asc" : "Desc"}
      </button>
    </div>
  );
};

export default IntelFeedFilters;
