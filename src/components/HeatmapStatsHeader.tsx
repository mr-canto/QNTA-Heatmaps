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
    <div className="text-white">
      <div className="flex items-center justify-center gap-2.5 flex-nowrap">
        <div className="text-center px-2.5 py-1 rounded-[10px] border border-white/15 bg-white/10 min-w-[80px]">
          <div className="text-base font-semibold tabular-nums tracking-tight max-lg:text-[15px] max-md:text-[13px]">
            {isLoading ? "..." : stats.total.toLocaleString()}
          </div>
          <div className="text-[9px] tracking-[0.14em] uppercase text-white/70 mt-0.5 max-lg:text-[8px] max-md:text-[7px]">
            Properties
          </div>
        </div>
        <div className="text-center px-2.5 py-1 rounded-[10px] border border-white/15 bg-white/10 min-w-[80px]">
          <div className="text-base font-semibold tabular-nums tracking-tight max-lg:text-[15px] max-md:text-[13px]">
            {isLoading ? "..." : stats.singleVisit.toLocaleString()}
          </div>
          <div className="text-[9px] tracking-[0.14em] uppercase text-white/70 mt-0.5 max-lg:text-[8px] max-md:text-[7px]">
            Single Visit
          </div>
        </div>
        <div className="text-center px-2.5 py-1 rounded-[10px] border border-white/15 bg-white/10 min-w-[80px]">
          <div className="text-base font-semibold tabular-nums tracking-tight max-lg:text-[15px] max-md:text-[13px]">
            {isLoading ? "..." : stats.multiVisit.toLocaleString()}
          </div>
          <div className="text-[9px] tracking-[0.14em] uppercase text-white/70 mt-0.5 max-lg:text-[8px] max-md:text-[7px]">
            Multi Visit
          </div>
        </div>
      </div>
    </div>
  );
}
