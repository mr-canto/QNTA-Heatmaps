import { supabase } from "./supabase";
import type { GeocodedProperty } from "./importProcessor";

/**
 * Outcode to area name mapping for Southwark and surrounding areas.
 */
const OUTCODE_AREA_MAP: Record<string, string> = {
  SE15: "Peckham",
  SE1: "Borough",
  SE17: "Walworth",
  SE16: "Rotherhithe",
  SE5: "Camberwell",
  SE22: "East Dulwich",
  SE21: "Dulwich",
  SE24: "Herne Hill",
  SE11: "Kennington",
  SE23: "Forest Hill",
  SE14: "New Cross",
  SE8: "Deptford",
};

/**
 * Get area name from outcode, defaulting to outcode if not in mapping.
 */
function getAreaName(outcode: string): string {
  return OUTCODE_AREA_MAP[outcode.toUpperCase()] || outcode;
}

/**
 * Calculate outcode statistics from geocoded properties.
 */
interface OutcodeStats {
  outcode: string;
  areaName: string;
  totalVisits: number;
  propertyCount: number;
  multiVisitCount: number;
  lat: number;
  lon: number;
}

function calculateOutcodeStats(properties: GeocodedProperty[]): OutcodeStats[] {
  const statsMap = new Map<
    string,
    {
      totalVisits: number;
      propertyCount: number;
      multiVisitCount: number;
      latSum: number;
      lonSum: number;
    }
  >();

  for (const prop of properties) {
    const outcode = prop.outcode.toUpperCase();
    const existing = statsMap.get(outcode) || {
      totalVisits: 0,
      propertyCount: 0,
      multiVisitCount: 0,
      latSum: 0,
      lonSum: 0,
    };

    existing.totalVisits += prop.visitCount;
    existing.propertyCount += 1;
    if (prop.visitCount > 1) {
      existing.multiVisitCount += 1;
    }
    existing.latSum += prop.lat;
    existing.lonSum += prop.lon;

    statsMap.set(outcode, existing);
  }

  return Array.from(statsMap.entries()).map(([outcode, stats]) => ({
    outcode,
    areaName: getAreaName(outcode),
    totalVisits: stats.totalVisits,
    propertyCount: stats.propertyCount,
    multiVisitCount: stats.multiVisitCount,
    lat: stats.latSum / stats.propertyCount, // Average lat for centroid
    lon: stats.lonSum / stats.propertyCount, // Average lon for centroid
  }));
}

export interface ImportResult {
  success: boolean;
  importId?: string;
  propertiesImported: number;
  error?: string;
}

/**
 * Save geocoded properties to the database as a new import snapshot.
 *
 * This function:
 * 1. Marks the previous current import as not current
 * 2. Creates a new import record
 * 3. Inserts all properties with the new import_id
 * 4. Calculates and stores outcode statistics
 *
 * @param properties - Geocoded properties to import
 * @param filename - Original filename for the import record
 * @param userId - ID of the user performing the import
 * @returns Result object with success status and details
 */
export async function saveImportToDatabase(
  properties: GeocodedProperty[],
  filename: string,
  userId: string
): Promise<ImportResult> {
  if (properties.length === 0) {
    return {
      success: false,
      propertiesImported: 0,
      error: "No properties to import",
    };
  }

  try {
    // Step 1: Mark previous import as not current
    const { error: updateError } = await supabase
      .from("imports")
      .update({ is_current: false })
      .eq("is_current", true);

    if (updateError) {
      throw new Error(`Failed to update previous import: ${updateError.message}`);
    }

    // Step 2: Create new import record
    const { data: importData, error: insertError } = await supabase
      .from("imports")
      .insert({
        uploaded_by: userId,
        filename,
        record_count: properties.length,
        is_current: true,
      })
      .select("id")
      .single();

    if (insertError || !importData) {
      throw new Error(`Failed to create import record: ${insertError?.message}`);
    }

    const importId = importData.id;

    // Step 3: Insert properties in batches
    const BATCH_SIZE = 500;
    for (let i = 0; i < properties.length; i += BATCH_SIZE) {
      const batch = properties.slice(i, i + BATCH_SIZE).map((prop) => ({
        import_id: importId,
        address: prop.address,
        postcode: prop.postcode,
        outcode: prop.outcode.toUpperCase(),
        lat: prop.lat,
        lon: prop.lon,
        visit_count: prop.visitCount,
      }));

      const { error: batchError } = await supabase.from("properties").insert(batch);

      if (batchError) {
        // Attempt to rollback by deleting the import record
        await supabase.from("imports").delete().eq("id", importId);
        throw new Error(`Failed to insert properties: ${batchError.message}`);
      }
    }

    // Step 4: Calculate and insert outcode statistics
    const outcodeStats = calculateOutcodeStats(properties);
    const statsInserts = outcodeStats.map((stat) => ({
      import_id: importId,
      outcode: stat.outcode,
      area_name: stat.areaName,
      total_visits: stat.totalVisits,
      property_count: stat.propertyCount,
      multi_visit_count: stat.multiVisitCount,
      lat: stat.lat,
      lon: stat.lon,
    }));

    const { error: statsError } = await supabase
      .from("outcode_stats")
      .insert(statsInserts);

    if (statsError) {
      // Log but don't fail - stats can be recalculated
      console.error("Failed to insert outcode stats:", statsError.message);
    }

    return {
      success: true,
      importId,
      propertiesImported: properties.length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      propertiesImported: 0,
      error: message,
    };
  }
}
