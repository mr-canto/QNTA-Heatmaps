import { useNavigate } from "react-router-dom";
import type { TopArea } from "@/hooks/useTopAreas";

interface TopAreasChartProps {
  areas: TopArea[];
  isLoading: boolean;
}

export default function TopAreasChart({
  areas,
  isLoading,
}: TopAreasChartProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="w-full space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-[#dce3e7] rounded w-1/3 mb-1" />
            <div className="h-6 bg-[#dce3e7] rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (areas.length === 0) {
    return (
      <div className="w-full flex items-center justify-center py-8">
        <p className="text-[#8996a5] text-sm">No area data available</p>
      </div>
    );
  }

  const maxVisits = Math.max(...areas.map((a) => a.totalVisits));

  const handleAreaClick = (outcode: string) => {
    navigate(`/heatmap?area=${outcode}`);
  };

  return (
    <div className="w-full space-y-3">
      {areas.map((area) => {
        const percentage = (area.totalVisits / maxVisits) * 100;

        return (
          <button
            key={area.outcode}
            onClick={() => handleAreaClick(area.outcode)}
            className="w-full text-left group cursor-pointer transition-colors hover:bg-[#f4f7f6] rounded-md p-1 -m-1"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#1f2a37] font-medium group-hover:text-[#0f5d5e]">
                {area.areaName}, {area.outcode}
              </span>
              <span className="text-xs font-semibold text-[#627083]">
                {area.totalVisits.toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-[#dce3e7] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0f5d5e] rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
