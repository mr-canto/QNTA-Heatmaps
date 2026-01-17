import { useAuth } from "@/hooks/useAuth";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import PropertiesDonutChart from "@/components/PropertiesDonutChart";
import VisitBreakdownPanel from "@/components/VisitBreakdownPanel";

function getFirstName(email: string | undefined, fullName?: string): string {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/);
    return parts[0];
  }
  if (email) {
    const localPart = email.split("@")[0];
    const name = localPart.replace(/[._-]/g, " ").split(" ")[0];
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }
  return "there";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading: isStatsLoading } = useDashboardStats();
  const firstName = getFirstName(
    user?.email,
    user?.user_metadata?.full_name || user?.user_metadata?.name
  );

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#eef1f3]">
      {/* Decorative gradient background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 10% 20%, rgba(15, 93, 94, 0.08), transparent 45%),
            radial-gradient(circle at 90% 0%, rgba(209, 107, 85, 0.08), transparent 40%)
          `,
        }}
      />

      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Welcome Message */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#1f2a37] mb-1">
            Welcome back, {firstName}
          </h1>
          <p className="text-[#627083] text-sm">
            Here is an overview of damp and mould property visits across
            Southwark.
          </p>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Snapshot Overview Section */}
          <Card className="lg:col-span-2 border-[#dce3e7] shadow-[0_6px_16px_rgba(15,23,42,0.08)]">
            <CardHeader className="border-b border-[#dce3e7] pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-[0.14em] text-[#627083]">
                Snapshot Overview
              </CardTitle>
              <CardDescription className="text-xs text-[#8996a5] mt-1">
                Current data summary from the latest import
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Charts and stats grid (US-007, US-008) */}
              <div className="grid md:grid-cols-2 gap-6 min-h-[200px]">
                {/* Properties Donut Chart (US-007) */}
                <div className="flex items-center justify-center rounded-lg bg-[#f4f7f6] border border-[#dce3e7] p-6">
                  <PropertiesDonutChart
                    singleVisitCount={stats?.singleVisitCount ?? 0}
                    multiVisitCount={stats?.multiVisitCount ?? 0}
                    isLoading={isStatsLoading}
                  />
                </div>
                {/* Visit Breakdown Panel (US-008) */}
                <div className="flex items-center justify-center rounded-lg bg-[#f4f7f6] border border-[#dce3e7] p-6">
                  <VisitBreakdownPanel
                    singleVisitCount={stats?.singleVisitCount ?? 0}
                    multiVisitCount={stats?.multiVisitCount ?? 0}
                    severeCount={stats?.severeCount ?? 0}
                    totalProperties={stats?.totalProperties ?? 0}
                    isLoading={isStatsLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Problem Areas Section */}
          <div className="space-y-6">
            <Card className="border-[#dce3e7] shadow-[0_6px_16px_rgba(15,23,42,0.08)]">
              <CardHeader className="border-b border-[#dce3e7] pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-[0.14em] text-[#627083]">
                  Problem Areas
                </CardTitle>
                <CardDescription className="text-xs text-[#8996a5] mt-1">
                  Areas requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Placeholder content for Top 5 Areas, Multi-Visit Hotspot, Biggest Increase (US-009, US-010, US-011) */}
                <div className="space-y-4 min-h-[280px]">
                  <div className="flex items-center justify-center rounded-lg bg-[#f4f7f6] border border-[#dce3e7] p-4 h-[120px]">
                    <p className="text-[#8996a5] text-sm text-center">
                      Top 5 areas chart will display here
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-center rounded-lg bg-[#f4f7f6] border border-[#dce3e7] p-4 h-[80px]">
                      <p className="text-[#8996a5] text-xs text-center">
                        Multi-visit hotspot
                      </p>
                    </div>
                    <div className="flex items-center justify-center rounded-lg bg-[#f4f7f6] border border-[#dce3e7] p-4 h-[80px]">
                      <p className="text-[#8996a5] text-xs text-center">
                        Biggest increase
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions Section */}
        <Card className="mt-6 border-[#dce3e7] shadow-[0_6px_16px_rgba(15,23,42,0.08)]">
          <CardHeader className="border-b border-[#dce3e7] pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-[0.14em] text-[#627083]">
              Quick Actions
            </CardTitle>
            <CardDescription className="text-xs text-[#8996a5] mt-1">
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Placeholder content for action buttons (US-012) */}
            <div className="flex flex-wrap gap-4 min-h-[60px]">
              <div className="flex items-center justify-center rounded-lg bg-[#f4f7f6] border border-[#dce3e7] px-6 py-3">
                <p className="text-[#8996a5] text-sm">View Heatmap</p>
              </div>
              <div className="flex items-center justify-center rounded-lg bg-[#f4f7f6] border border-[#dce3e7] px-6 py-3">
                <p className="text-[#8996a5] text-sm">Import Data</p>
              </div>
              <div className="flex items-center justify-center rounded-lg bg-[#f4f7f6] border border-[#dce3e7] px-6 py-3">
                <p className="text-[#8996a5] text-sm">Export Data</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
