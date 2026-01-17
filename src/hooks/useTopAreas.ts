import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface TopArea {
  outcode: string;
  areaName: string;
  totalVisits: number;
}

async function fetchTopAreas(): Promise<TopArea[]> {
  // First, get the current import
  const { data: currentImport, error: importError } = await supabase
    .from("imports")
    .select("id")
    .eq("is_current", true)
    .single();

  if (importError || !currentImport) {
    return [];
  }

  // Fetch top 5 outcodes by total visits
  const { data: stats, error: statsError } = await supabase
    .from("outcode_stats")
    .select("outcode, area_name, total_visits")
    .eq("import_id", currentImport.id)
    .order("total_visits", { ascending: false })
    .limit(5);

  if (statsError) {
    throw new Error(`Failed to fetch top areas: ${statsError.message}`);
  }

  return (stats || []).map((stat) => ({
    outcode: stat.outcode,
    areaName: stat.area_name,
    totalVisits: stat.total_visits,
  }));
}

export function useTopAreas() {
  return useQuery({
    queryKey: ["topAreas"],
    queryFn: fetchTopAreas,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
