import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface DashboardStats {
  totalProperties: number;
  singleVisitCount: number;
  multiVisitCount: number;
  importId: string | null;
  importDate: string | null;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  // First, get the current import
  const { data: currentImport, error: importError } = await supabase
    .from("imports")
    .select("id, uploaded_at")
    .eq("is_current", true)
    .single();

  if (importError || !currentImport) {
    // No current import found - return empty stats
    return {
      totalProperties: 0,
      singleVisitCount: 0,
      multiVisitCount: 0,
      importId: null,
      importDate: null,
    };
  }

  // Aggregate stats from outcode_stats for the current import
  const { data: stats, error: statsError } = await supabase
    .from("outcode_stats")
    .select("property_count, multi_visit_count")
    .eq("import_id", currentImport.id);

  if (statsError) {
    throw new Error(`Failed to fetch statistics: ${statsError.message}`);
  }

  // Calculate totals
  const totals = (stats || []).reduce(
    (acc, stat) => {
      acc.totalProperties += stat.property_count;
      acc.multiVisitCount += stat.multi_visit_count;
      return acc;
    },
    { totalProperties: 0, multiVisitCount: 0 }
  );

  return {
    totalProperties: totals.totalProperties,
    singleVisitCount: totals.totalProperties - totals.multiVisitCount,
    multiVisitCount: totals.multiVisitCount,
    importId: currentImport.id,
    importDate: currentImport.uploaded_at,
  };
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: fetchDashboardStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
