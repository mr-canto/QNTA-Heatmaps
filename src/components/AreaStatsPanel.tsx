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
  const getAreaNameParts = (areaName: string, outcode: string) => {
    const trailingOutcode = new RegExp(`\\s*,?\\s*${outcode}$`, "i");
    const strippedName = areaName.replace(trailingOutcode, "").trim();
    return {
      name: strippedName,
      hasName: strippedName.length > 0,
    };
  };

  // Calculate max visits for relative bar sizing (log scale as per HTML)
  const maxVisits = Math.max(...areas.map((a) => a.totalVisits), 1);

  // Embedded mode: render just the list content without Card wrapper
  if (embedded) {
    return (
      <>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="p-3 rounded-[10px] border border-[#dce3e7] bg-white"
              >
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
              const isSelected = selectedArea === area.outcode;
              const { name, hasName } = getAreaNameParts(
                area.areaName,
                area.outcode
              );
              const barWidth =
                (Math.log(area.totalVisits + 1) / Math.log(maxVisits + 1)) * 100;

              return (
                <div
                  key={area.outcode}
                  onClick={() => onAreaClick(isSelected ? null : area.outcode)}
                  className="area-stat"
                >
                  <span className="area-name">
                    {hasName && (
                      <span className="area-name-text">{name},</span>
                    )}
                    <span className="area-outcode">{area.outcode}</span>
                  </span>
                  <div className="area-count">
                    <div className="area-bar">
                      <div
                        className="area-bar-fill"
                        style={{ width: `${barWidth.toFixed(0)}%` }}
                      />
                    </div>
                    <span className="area-value">
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
          Visits by Area
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
              const barWidth =
                (Math.log(area.totalVisits + 1) / Math.log(maxVisits + 1)) * 100;
              const isSelected = selectedArea === area.outcode;
              const { name, hasName } = getAreaNameParts(
                area.areaName,
                area.outcode
              );

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
                      {hasName ? name : area.outcode}
                    </span>
                    <span className="text-sm font-semibold text-[#0f5d5e] tabular-nums max-lg:text-[11px]">
                      {area.totalVisits.toLocaleString()}
                    </span>
                  </div>
                  <div className={`flex items-center ${hasName ? "gap-2" : ""}`}>
                    {hasName && (
                      <span className="text-[10px] text-[#8996a5] w-10">
                        {area.outcode}
                      </span>
                    )}
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
