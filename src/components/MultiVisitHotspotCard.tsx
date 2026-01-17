import { Card, CardContent } from "@/components/ui/card";
import { type MultiVisitHotspot } from "@/hooks/useMultiVisitHotspot";

interface MultiVisitHotspotCardProps {
  hotspot: MultiVisitHotspot | null;
  isLoading: boolean;
}

export default function MultiVisitHotspotCard({
  hotspot,
  isLoading,
}: MultiVisitHotspotCardProps) {
  if (isLoading) {
    return (
      <Card className="h-full border-[#d16b55]/30 bg-gradient-to-br from-[#d16b55]/5 to-transparent">
        <CardContent className="p-4 h-full flex flex-col justify-center">
          <div className="space-y-2 animate-pulse">
            <div className="h-3 w-20 bg-[#dce3e7] rounded" />
            <div className="h-5 w-16 bg-[#dce3e7] rounded" />
            <div className="h-4 w-12 bg-[#dce3e7] rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hotspot) {
    return (
      <Card className="h-full border-[#dce3e7] bg-[#f4f7f6]">
        <CardContent className="p-4 h-full flex items-center justify-center">
          <p className="text-[#8996a5] text-xs text-center">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border-[#d16b55]/30 bg-gradient-to-br from-[#d16b55]/5 to-transparent">
      <CardContent className="p-4 h-full flex flex-col justify-center">
        <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#d16b55] mb-1">
          Multi-Visit Hotspot
        </p>
        <p className="text-sm font-semibold text-[#1f2a37] leading-tight">
          {hotspot.areaName}
        </p>
        <p className="text-xs text-[#627083] mb-2">{hotspot.outcode}</p>
        <p className="text-lg font-bold text-[#d16b55]">
          {hotspot.multiVisitPercentage.toFixed(1)}%
        </p>
        <p className="text-[10px] text-[#8996a5]">repeat visits</p>
      </CardContent>
    </Card>
  );
}
