interface VisitBreakdownPanelProps {
  singleVisitCount: number;
  multiVisitCount: number;
  severeCount: number;
  totalProperties: number;
  isLoading?: boolean;
}

interface BreakdownBarProps {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

function BreakdownBar({ label, count, percentage, color }: BreakdownBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#1f2a37]">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#1f2a37]">
            {count.toLocaleString()}
          </span>
          <span className="text-xs text-[#627083]">
            ({percentage.toFixed(1)}%)
          </span>
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-[#dce3e7] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

export default function VisitBreakdownPanel({
  singleVisitCount,
  multiVisitCount,
  severeCount,
  totalProperties,
  isLoading = false,
}: VisitBreakdownPanelProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 w-full p-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-[#f4f7f6] rounded animate-pulse" />
              <div className="h-4 w-16 bg-[#f4f7f6] rounded animate-pulse" />
            </div>
            <div className="h-2 w-full bg-[#f4f7f6] rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const singlePercentage =
    totalProperties > 0 ? (singleVisitCount / totalProperties) * 100 : 0;
  const multiPercentage =
    totalProperties > 0 ? (multiVisitCount / totalProperties) * 100 : 0;
  const severePercentage =
    totalProperties > 0 ? (severeCount / totalProperties) * 100 : 0;

  const breakdownData = [
    {
      label: "Single Visit",
      count: singleVisitCount,
      percentage: singlePercentage,
      color: "#0f5d5e", // teal
    },
    {
      label: "Multi Visit",
      count: multiVisitCount,
      percentage: multiPercentage,
      color: "#d16b55", // coral
    },
    {
      label: "Severe (5+)",
      count: severeCount,
      percentage: severePercentage,
      color: "#d16b55", // coral
    },
  ];

  return (
    <div className="flex flex-col gap-5 w-full p-2">
      {breakdownData.map((item) => (
        <BreakdownBar
          key={item.label}
          label={item.label}
          count={item.count}
          percentage={item.percentage}
          color={item.color}
        />
      ))}
    </div>
  );
}
