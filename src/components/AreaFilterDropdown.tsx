import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin } from "lucide-react";
import type { OutcodeStats } from "@/hooks/useOutcodeStats";

interface AreaFilterDropdownProps {
  areas: OutcodeStats[];
  selectedArea: string | null;
  onAreaChange: (outcode: string | null) => void;
  isLoading?: boolean;
}

export default function AreaFilterDropdown({
  areas,
  selectedArea,
  onAreaChange,
  isLoading,
}: AreaFilterDropdownProps) {
  return (
    <div className="bg-white rounded-[10px] border border-[#dce3e7] shadow-[0_6px_16px_rgba(15,23,42,0.08)] p-2">
      <div className="flex items-center gap-2 mb-2 px-1">
        <MapPin className="w-3.5 h-3.5 text-[#0f5d5e]" />
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#627083]">
          Area
        </span>
      </div>
      <Select
        value={selectedArea ?? "all"}
        onValueChange={(value) => onAreaChange(value === "all" ? null : value)}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[200px] text-sm border-[#dce3e7]">
          <SelectValue placeholder="Select area" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex justify-between items-center w-full gap-4">
              <span>All Areas</span>
              <span className="text-[#8996a5] text-xs">
                {areas.reduce((sum, a) => sum + a.totalVisits, 0).toLocaleString()}
              </span>
            </div>
          </SelectItem>
          {areas.map((area) => (
            <SelectItem key={area.outcode} value={area.outcode}>
              <div className="flex justify-between items-center w-full gap-4">
                <span>
                  {area.areaName}, {area.outcode}
                </span>
                <span className="text-[#8996a5] text-xs">
                  {area.totalVisits.toLocaleString()}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
