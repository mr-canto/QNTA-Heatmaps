import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface PropertiesDonutChartProps {
  singleVisitCount: number;
  multiVisitCount: number;
  isLoading?: boolean;
}

const COLORS = {
  singleVisit: "#0f5d5e", // teal
  multiVisit: "#d16b55", // coral
};

export default function PropertiesDonutChart({
  singleVisitCount,
  multiVisitCount,
  isLoading = false,
}: PropertiesDonutChartProps) {
  const totalProperties = singleVisitCount + multiVisitCount;

  const data = [
    { name: "Single Visit", value: singleVisitCount, color: COLORS.singleVisit },
    { name: "Multi Visit", value: multiVisitCount, color: COLORS.multiVisit },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
        <div className="w-32 h-32 rounded-full bg-[#f4f7f6] animate-pulse" />
        <div className="mt-4 space-y-2">
          <div className="h-4 w-24 bg-[#f4f7f6] rounded animate-pulse" />
          <div className="h-4 w-24 bg-[#f4f7f6] rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      {/* Donut Chart */}
      <div className="relative w-full h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-[#1f2a37]">
            {totalProperties.toLocaleString()}
          </span>
          <span className="text-xs text-[#627083]">Properties</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-col gap-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-[#1f2a37]">{entry.name}</span>
            <span className="text-sm font-medium text-[#627083] ml-1">
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
