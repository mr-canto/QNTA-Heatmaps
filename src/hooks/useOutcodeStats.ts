import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface OutcodeStats {
  outcode: string;
  areaName: string;
  totalVisits: number;
  propertyCount: number;
  lat: number;
  lon: number;
}

async function fetchOutcodeStats(): Promise<OutcodeStats[]> {
  // First, get the current import
  const { data: currentImport, error: importError } = await supabase
    .from("imports")
    .select("id")
    .eq("is_current", true)
    .single();

  if (importError || !currentImport) {
    return [];
  }

  // Fetch all outcodes ordered by total visits
  const { data: stats, error: statsError } = await supabase
    .from("outcode_stats")
    .select("outcode, area_name, total_visits, property_count, lat, lon")
    .eq("import_id", currentImport.id)
    .order("total_visits", { ascending: false });

  if (statsError) {
    throw new Error(`Failed to fetch outcode stats: ${statsError.message}`);
  }

  return (stats || []).map((stat) => ({
    outcode: stat.outcode,
    areaName: stat.area_name,
    totalVisits: stat.total_visits,
    propertyCount: stat.property_count,
    lat: stat.lat,
    lon: stat.lon,
  }));
}

export function useOutcodeStats() {
  return useQuery({
    queryKey: ["outcodeStats"],
    queryFn: fetchOutcodeStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
