import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface BiggestIncrease {
  outcode: string;
  areaName: string;
  percentageChange: number;
  currentTotalVisits: number;
  previousTotalVisits: number;
}

async function fetchBiggestIncrease(): Promise<BiggestIncrease | null> {
  // Get the two most recent imports (current and previous)
  const { data: imports, error: importsError } = await supabase
    .from("imports")
    .select("id, uploaded_at")
    .order("uploaded_at", { ascending: false })
    .limit(2);

  if (importsError) {
    throw new Error(`Failed to fetch imports: ${importsError.message}`);
  }

  // If there's no previous import, return null
  if (!imports || imports.length < 2) {
    return null;
  }

  const [currentImport, previousImport] = imports;

  // Fetch outcode stats for both imports
  const [currentStatsResult, previousStatsResult] = await Promise.all([
    supabase
      .from("outcode_stats")
      .select("outcode, area_name, total_visits")
      .eq("import_id", currentImport.id),
    supabase
      .from("outcode_stats")
      .select("outcode, total_visits")
      .eq("import_id", previousImport.id),
  ]);

  if (currentStatsResult.error) {
    throw new Error(`Failed to fetch current stats: ${currentStatsResult.error.message}`);
  }

  if (previousStatsResult.error) {
    throw new Error(`Failed to fetch previous stats: ${previousStatsResult.error.message}`);
  }

  const currentStats = currentStatsResult.data || [];
  const previousStats = previousStatsResult.data || [];

  if (currentStats.length === 0 || previousStats.length === 0) {
    return null;
  }

  // Create a map of previous stats by outcode for quick lookup
  const previousStatsMap = new Map<string, number>();
  for (const stat of previousStats) {
    previousStatsMap.set(stat.outcode, stat.total_visits);
  }

  // Find the outcode with the biggest percentage increase
  let biggestIncrease: BiggestIncrease | null = null;
  let highestPercentageChange = -Infinity;

  for (const current of currentStats) {
    const previousVisits = previousStatsMap.get(current.outcode);

    // Skip if this outcode didn't exist in the previous import
    if (previousVisits === undefined) {
      continue;
    }

    // Calculate percentage change
    // Handle case where previous was 0 (would be infinite increase)
    let percentageChange: number;
    if (previousVisits === 0) {
      if (current.total_visits > 0) {
        percentageChange = 100; // Treat as 100% increase from 0
      } else {
        percentageChange = 0; // No change (0 -> 0)
      }
    } else {
      percentageChange = ((current.total_visits - previousVisits) / previousVisits) * 100;
    }

    if (percentageChange > highestPercentageChange) {
      highestPercentageChange = percentageChange;
      biggestIncrease = {
        outcode: current.outcode,
        areaName: current.area_name,
        percentageChange,
        currentTotalVisits: current.total_visits,
        previousTotalVisits: previousVisits,
      };
    }
  }

  return biggestIncrease;
}

export function useBiggestIncrease() {
  return useQuery({
    queryKey: ["biggestIncrease"],
    queryFn: fetchBiggestIncrease,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
