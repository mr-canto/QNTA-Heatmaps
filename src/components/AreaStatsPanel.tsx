import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OutcodeStats } from "@/hooks/useOutcodeStats";

interface AreaStatsPanelProps {
  areas: OutcodeStats[];
  selectedArea: string | null;
  onAreaClick: (outcode: string | null) => void;
  isLoading?: boolean;
}

export default function AreaStatsPanel({
  areas,
  selectedArea,
  onAreaClick,
  isLoading,
}: AreaStatsPanelProps) {
  // Calculate max visits for relative bar sizing
  const maxVisits = Math.max(...areas.map((a) => a.totalVisits), 1);

  return (
    <Card className="absolute top-14 right-4 z-[1000] w-[280px] max-h-[calc(100vh-200px)] overflow-hidden shadow-[0_6px_16px_rgba(15,23,42,0.08)]">
      <CardHeader className="py-3 px-4 border-b border-[#dce3e7]">
        <CardTitle className="text-xs font-bold uppercase tracking-[0.1em] text-[#627083]">
          Areas by Visit Count
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-y-auto max-h-[400px]">
        {isLoading ? (
          <div className="p-4 text-sm text-[#627083]">Loading areas...</div>
        ) : areas.length === 0 ? (
          <div className="p-4 text-sm text-[#627083]">No areas found</div>
        ) : (
          <ul className="divide-y divide-[#eef2f1]">
            {areas.map((area) => {
              const barWidth = (area.totalVisits / maxVisits) * 100;
              const isSelected = selectedArea === area.outcode;

              return (
                <li
                  key={area.outcode}
                  onClick={() =>
                    onAreaClick(isSelected ? null : area.outcode)
                  }
                  className={`px-4 py-3 cursor-pointer transition-colors hover:bg-[#f7f9fb] ${
                    isSelected ? "bg-[#d9eceb]" : ""
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-[#1f2a37]">
                      {area.areaName}
                    </span>
                    <span className="text-sm font-semibold text-[#0f5d5e] tabular-nums">
                      {area.totalVisits.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#8996a5] w-10">
                      {area.outcode}
                    </span>
                    <div className="flex-1 h-1.5 bg-[#eef2f1] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0f5d5e] rounded-full transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
