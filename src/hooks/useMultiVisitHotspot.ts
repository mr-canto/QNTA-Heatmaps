import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface MultiVisitHotspot {
  outcode: string;
  areaName: string;
  multiVisitPercentage: number;
  multiVisitCount: number;
  propertyCount: number;
}

async function fetchMultiVisitHotspot(): Promise<MultiVisitHotspot | null> {
  // First, get the current import
  const { data: currentImport, error: importError } = await supabase
    .from("imports")
    .select("id")
    .eq("is_current", true)
    .single();

  if (importError || !currentImport) {
    return null;
  }

  // Fetch all outcode stats for the current import
  const { data: stats, error: statsError } = await supabase
    .from("outcode_stats")
    .select("outcode, area_name, property_count, multi_visit_count")
    .eq("import_id", currentImport.id);

  if (statsError) {
    throw new Error(`Failed to fetch outcode stats: ${statsError.message}`);
  }

  if (!stats || stats.length === 0) {
    return null;
  }

  // Find the outcode with the highest percentage of multi-visit properties
  let hotspot: MultiVisitHotspot | null = null;
  let highestPercentage = -1;

  for (const stat of stats) {
    if (stat.property_count > 0) {
      const percentage = (stat.multi_visit_count / stat.property_count) * 100;
      if (percentage > highestPercentage) {
        highestPercentage = percentage;
        hotspot = {
          outcode: stat.outcode,
          areaName: stat.area_name,
          multiVisitPercentage: percentage,
          multiVisitCount: stat.multi_visit_count,
          propertyCount: stat.property_count,
        };
      }
    }
  }

  return hotspot;
}

export function useMultiVisitHotspot() {
  return useQuery({
    queryKey: ["multiVisitHotspot"],
    queryFn: fetchMultiVisitHotspot,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
