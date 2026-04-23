import type { Property } from "@/types/database.types";
import { useMemo } from "react";

interface HeatmapStatsHeaderProps {
  properties: Property[];
  isLoading?: boolean;
  variant?: "header" | "tablet";
}

export default function HeatmapStatsHeader({
  properties,
  isLoading,
  variant = "header",
}: HeatmapStatsHeaderProps) {
  const stats = useMemo(() => {
    let singleVisit = 0;
    let multiVisit = 0;

    for (const property of properties) {
      if (property.visit_count === 1) {
        singleVisit += 1;
      } else if (property.visit_count > 1) {
        multiVisit += 1;
      }
    }

    return {
      total: properties.length,
      singleVisit,
      multiVisit,
    };
  }, [properties]);

  const isTablet = variant === "tablet";
  const wrapperClassName = isTablet
    ? "rounded-[14px] border border-[#dce3e7] bg-white/95 px-2 py-1.5 shadow-[0_18px_38px_rgba(15,23,42,0.14)] backdrop-blur-[10px]"
    : "text-white";
  const rowClassName = isTablet
    ? "flex items-center justify-center gap-1.5 flex-nowrap"
    : "flex items-center justify-center gap-2.5 flex-nowrap";
  const cardClassName = isTablet
    ? "min-w-[92px] rounded-[10px] border border-[#dce3e7] bg-[#f4f7f6] px-2 py-1.5 text-center"
    : "min-w-[80px] rounded-[10px] border border-white/15 bg-white/10 px-2.5 py-1 text-center";
  const valueClassName = isTablet
    ? "text-[18px] font-semibold tabular-nums tracking-tight text-[#1f2d3d]"
    : "text-base font-semibold tabular-nums tracking-tight max-lg:text-[15px] max-md:text-[13px]";
  const labelClassName = isTablet
    ? "mt-0.5 text-[9px] uppercase tracking-[0.14em] text-[#627083]"
    : "mt-0.5 text-[9px] uppercase tracking-[0.14em] text-white/70 max-lg:text-[8px] max-md:text-[7px]";

  return (
    <div className={wrapperClassName}>
      <div className={rowClassName}>
        <div className={cardClassName}>
          <div className={valueClassName}>
            {isLoading ? "..." : stats.total.toLocaleString()}
          </div>
          <div className={labelClassName}>
            Properties
          </div>
        </div>
        <div className={cardClassName}>
          <div className={valueClassName}>
            {isLoading ? "..." : stats.singleVisit.toLocaleString()}
          </div>
          <div className={labelClassName}>
            Single Visit
          </div>
        </div>
        <div className={cardClassName}>
          <div className={valueClassName}>
            {isLoading ? "..." : stats.multiVisit.toLocaleString()}
          </div>
          <div className={labelClassName}>
            Multi Visit
          </div>
        </div>
      </div>
    </div>
  );
}
