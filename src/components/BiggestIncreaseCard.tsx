import { Card, CardContent } from "@/components/ui/card";
import { type BiggestIncrease } from "@/hooks/useBiggestIncrease";
import { TrendingUp } from "lucide-react";

interface BiggestIncreaseCardProps {
  increase: BiggestIncrease | null;
  isLoading: boolean;
}

export default function BiggestIncreaseCard({
  increase,
  isLoading,
}: BiggestIncreaseCardProps) {
  if (isLoading) {
    return (
      <Card className="h-full border-[#0f5d5e]/30 bg-gradient-to-br from-[#0f5d5e]/5 to-transparent">
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

  // No previous import exists
  if (!increase) {
    return (
      <Card className="h-full border-[#dce3e7] bg-[#f4f7f6]">
        <CardContent className="p-4 h-full flex flex-col justify-center items-center">
          <TrendingUp className="h-5 w-5 text-[#8996a5] mb-2" />
          <p className="text-[#8996a5] text-xs text-center">
            No previous data available
          </p>
        </CardContent>
      </Card>
    );
  }

  // Format the percentage change with + prefix for positive values
  const formattedChange = increase.percentageChange >= 0
    ? `+${increase.percentageChange.toFixed(0)}%`
    : `${increase.percentageChange.toFixed(0)}%`;

  return (
    <Card className="h-full border-[#0f5d5e]/30 bg-gradient-to-br from-[#0f5d5e]/5 to-transparent">
      <CardContent className="p-4 h-full flex flex-col justify-center">
        <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#0f5d5e] mb-1">
          Biggest Increase
        </p>
        <p className="text-sm font-semibold text-[#1f2a37] leading-tight">
          {increase.areaName}
        </p>
        <p className="text-xs text-[#627083] mb-2">{increase.outcode}</p>
        <p className="text-lg font-bold text-[#0f5d5e]">{formattedChange}</p>
        <p className="text-[10px] text-[#8996a5]">since last import</p>
      </CardContent>
    </Card>
  );
}
