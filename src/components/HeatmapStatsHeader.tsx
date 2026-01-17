import type { Property } from "@/types/database.types";
import { useMemo } from "react";

interface HeatmapStatsHeaderProps {
  properties: Property[];
  isLoading?: boolean;
}

export default function HeatmapStatsHeader({
  properties,
  isLoading,
}: HeatmapStatsHeaderProps) {
  const stats = useMemo(() => {
    const total = properties.length;
    const singleVisit = properties.filter((p) => p.visit_count === 1).length;
    const multiVisit = properties.filter((p) => p.visit_count > 1).length;

    return { total, singleVisit, multiVisit };
  }, [properties]);

  return (
    <div className="absolute top-0 left-0 right-0 z-[999] bg-[#0f5d5e] text-white py-2 px-4">
      <div className="flex justify-center gap-3">
        <div className="text-center px-3 py-1 rounded-[10px] border border-white/15 bg-white/10 min-w-[88px]">
          <div className="text-lg font-semibold tabular-nums tracking-tight">
            {isLoading ? "..." : stats.total.toLocaleString()}
          </div>
          <div className="text-[9px] tracking-[0.14em] uppercase text-white/70 mt-0.5">
            Properties
          </div>
        </div>
        <div className="text-center px-3 py-1 rounded-[10px] border border-white/15 bg-white/10 min-w-[88px]">
          <div className="text-lg font-semibold tabular-nums tracking-tight">
            {isLoading ? "..." : stats.singleVisit.toLocaleString()}
          </div>
          <div className="text-[9px] tracking-[0.14em] uppercase text-white/70 mt-0.5">
            Single Visit
          </div>
        </div>
        <div className="text-center px-3 py-1 rounded-[10px] border border-white/15 bg-white/10 min-w-[88px]">
          <div className="text-lg font-semibold tabular-nums tracking-tight">
            {isLoading ? "..." : stats.multiVisit.toLocaleString()}
          </div>
          <div className="text-[9px] tracking-[0.14em] uppercase text-white/70 mt-0.5">
            Multi Visit
          </div>
        </div>
      </div>
    </div>
  );
}
