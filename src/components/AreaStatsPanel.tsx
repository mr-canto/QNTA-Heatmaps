import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { OutcodeStats } from "@/hooks/useOutcodeStats";

interface AreaStatsPanelProps {
  areas: OutcodeStats[];
  selectedArea: string | null;
  onAreaClick: (outcode: string | null) => void;
  isLoading?: boolean;
  embedded?: boolean;
}

export default function AreaStatsPanel({
  areas,
  selectedArea,
  onAreaClick,
  isLoading,
  embedded = false,
}: AreaStatsPanelProps) {
  // Calculate max visits for relative bar sizing
  const maxVisits = Math.max(...areas.map((a) => a.totalVisits), 1);

  // Embedded mode: render just the list content without Card wrapper
  if (embedded) {
    return (
      <>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-3 rounded-[10px] border border-[#dce3e7] bg-white">
                <div className="flex justify-between items-center mb-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-2 flex-1 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : areas.length === 0 ? (
          <div className="p-4 text-sm text-[#627083]">No areas found</div>
        ) : (
          <div className="space-y-2">
            {areas.map((area) => {
              const barWidth = (area.totalVisits / maxVisits) * 100;
              const isSelected = selectedArea === area.outcode;

              return (
                <div
                  key={area.outcode}
                  onClick={() => onAreaClick(isSelected ? null : area.outcode)}
                  className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-3 rounded-[10px] border border-[#dce3e7] bg-white cursor-pointer transition-all hover:-translate-y-px hover:shadow-[0_6px_16px_rgba(15,23,42,0.08)] hover:border-[rgba(15,23,42,0.12)] max-sm:grid-cols-1 max-sm:gap-2 ${
                    isSelected ? "bg-[#d9eceb] border-[#0f5d5e]/20" : ""
                  }`}
                >
                  <div className="flex items-baseline gap-0 flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                    <span className="text-[13px] font-semibold text-[#1f2a37] max-lg:text-[12px]">
                      {area.areaName}
                    </span>
                    <span className="font-semibold text-[11px] text-[#627083] ml-0.5">
                      {area.outcode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 min-w-[118px] justify-end max-sm:w-full max-sm:min-w-0 max-sm:grid max-sm:grid-cols-[1fr_auto] max-sm:gap-2 max-sm:justify-start">
                    <div className="shrink-0 w-16 h-2 bg-[#eef2f1] rounded-full overflow-hidden max-sm:w-full">
                      <div
                        className="h-full bg-[#0f5d5e] rounded-full transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="text-[12px] text-[#1f2a37] min-w-[40px] text-right tabular-nums font-semibold max-lg:text-[11px]">
                      {area.totalVisits.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  }

  // Standalone mode: render with Card wrapper (hidden on mobile since we use embedded mode in info panel)
  return (
    <Card className="absolute top-14 right-4 z-[1000] w-[280px] max-h-[calc(100vh-200px)] overflow-hidden shadow-[0_6px_16px_rgba(15,23,42,0.08)] hidden md:block max-lg:w-[240px] max-lg:right-4">
      <CardHeader className="py-3 px-4 border-b border-[#dce3e7]">
        <CardTitle className="text-xs font-bold uppercase tracking-[0.1em] text-[#627083]">
          Areas by Visit Count
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-y-auto max-h-[400px]">
        {isLoading ? (
          <ul className="divide-y divide-[#eef2f1]">
            {[...Array(6)].map((_, i) => (
              <li key={i} className="px-4 py-3">
                <div className="flex justify-between items-center mb-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-1.5 flex-1 rounded-full" />
                </div>
              </li>
            ))}
          </ul>
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
                    <span className="text-sm font-medium text-[#1f2a37] max-lg:text-[12px]">
                      {area.areaName}
                    </span>
                    <span className="text-sm font-semibold text-[#0f5d5e] tabular-nums max-lg:text-[11px]">
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
