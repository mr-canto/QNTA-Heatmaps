import { supabase } from "./supabase";
import { logger } from "./logger";
import type { GeocodedProperty, ImportableWorkOrder } from "./importProcessor";

/**
 * Import status values for tracking import lifecycle.
 */
export type ImportStatus = "pending" | "processing" | "completed" | "failed";

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
  workOrdersImported: number;
  error?: string;
}

interface InsertedPropertyRow {
  id: string;
  address: string;
}

function normalizeAddressKey(address: string): string {
  return address.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Update the status of an import record.
 * Used for tracking import lifecycle and enabling proper cleanup.
 */
async function updateImportStatus(
  importId: string,
  status: ImportStatus
): Promise<void> {
  const { error } = await supabase
    .from("imports")
    .update({ status })
    .eq("id", importId);

  if (error) {
    logger.error(`Failed to update import status to ${status}`, { importId, error: error.message });
  }
}

/**
 * Clean up a failed import by marking it as failed and ensuring is_current is false.
 * Does not delete the import record to preserve audit trail.
 */
async function cleanupFailedImport(
  importId: string,
  previousCurrentIds: string[]
): Promise<void> {
  // Mark the import as failed
  await updateImportStatus(importId, "failed");

  // Ensure is_current is false for the failed import
  await supabase
    .from("imports")
    .update({ is_current: false })
    .eq("id", importId);

  // Restore previous current import if needed
  if (previousCurrentIds.length > 0) {
    const { error: restoreError } = await supabase
      .from("imports")
      .update({ is_current: true })
      .in("id", previousCurrentIds);

    if (restoreError) {
      logger.error("Failed to restore previous current import", {
        previousIds: previousCurrentIds,
        error: restoreError.message,
      });
    }
  }
}

/**
 * Save geocoded properties to the database as a new import snapshot.
 *
 * This function:
 * 1. Creates a new import record with 'pending' status
 * 2. Updates status to 'processing' during data insertion
 * 3. Inserts all properties with the new import_id
 * 4. Calculates and stores outcode statistics
 * 5. Marks the previous current import as not current
 * 6. Sets the new import as current with 'completed' status
 *
 * On failure, the import is marked as 'failed' and previous state is restored.
 *
 * @param properties - Geocoded properties to import
 * @param filename - Original filename for the import record
 * @param userId - ID of the user performing the import
 * @returns Result object with success status and details
 */
export async function saveImportToDatabase(
  properties: GeocodedProperty[],
  workOrders: ImportableWorkOrder[],
  filename: string,
  userId: string
): Promise<ImportResult> {
  if (properties.length === 0) {
    return {
      success: false,
      propertiesImported: 0,
      workOrdersImported: 0,
      error: "No properties to import",
    };
  }

  let importId: string | null = null;
  let previousCurrentIds: string[] = [];

  try {
    // Step 1: Capture the current import(s) so we can restore on failure
    const { data: currentImports, error: currentError } = await supabase
      .from("imports")
      .select("id")
      .eq("is_current", true)
      .eq("status", "completed");

    if (currentError) {
      throw new Error(`Failed to read current import: ${currentError.message}`);
    }

    previousCurrentIds = (currentImports || []).map((row) => row.id);

    // Step 2: Create new import record with 'pending' status
    const { data: importData, error: insertError } = await supabase
      .from("imports")
      .insert({
        uploaded_by: userId,
        filename,
        record_count: properties.length,
        is_current: false,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !importData) {
      throw new Error(`Failed to create import record: ${insertError?.message}`);
    }

    importId = importData.id;
    // After this point, importId is guaranteed to be a non-null string
    const currentImportId = importId;
    logger.info("Created import record", { importId: currentImportId, filename, propertyCount: properties.length });

    // Step 3: Update status to 'processing'
    await updateImportStatus(currentImportId, "processing");

    // Step 4: Insert properties in batches and retain their IDs for work-order linking
    const BATCH_SIZE = 500;
    const insertedProperties: InsertedPropertyRow[] = [];
    for (let i = 0; i < properties.length; i += BATCH_SIZE) {
      const batch = properties.slice(i, i + BATCH_SIZE).map((prop) => ({
        import_id: currentImportId,
        address: prop.address,
        postcode: prop.postcode,
        outcode: prop.outcode.toUpperCase(),
        lat: prop.lat,
        lon: prop.lon,
        visit_count: prop.visitCount,
      }));

      const { data: batchData, error: batchError } = await supabase
        .from("properties")
        .insert(batch)
        .select("id, address");

      if (batchError) {
        logger.error("Failed to insert property batch", {
          importId: currentImportId,
          batchStart: i,
          batchSize: batch.length,
          error: batchError.message,
        });
        throw new Error(`Failed to insert properties: ${batchError.message}`);
      }

      insertedProperties.push(...(batchData ?? []));
    }

    // Step 5: Insert work orders linked to inserted properties
    const propertyIdByAddressKey = new Map(
      insertedProperties.map((property) => [normalizeAddressKey(property.address), property.id] as const)
    );

    for (let i = 0; i < workOrders.length; i += BATCH_SIZE) {
      const batch = workOrders.slice(i, i + BATCH_SIZE).map((workOrder) => {
        const propertyId = propertyIdByAddressKey.get(workOrder.addressKey);
        if (!propertyId) {
          throw new Error(`Failed to link work order to property: ${workOrder.address}`);
        }

        return {
          import_id: currentImportId,
          property_id: propertyId,
          address: workOrder.address,
          postcode: workOrder.postcode,
          outcode: workOrder.outcode.toUpperCase(),
          work_order_ref: workOrder.workOrderRef,
          description: workOrder.description,
          estimated_cost: workOrder.estimatedCost,
          raw_date_value: workOrder.rawDateValue,
          normalized_date: workOrder.normalizedDate,
          import_row_order: workOrder.importRowOrder,
        };
      });

      const { error: workOrderError } = await supabase.from("work_orders").insert(batch);

      if (workOrderError) {
        logger.error("Failed to insert work order batch", {
          importId: currentImportId,
          batchStart: i,
          batchSize: batch.length,
          error: workOrderError.message,
        });
        throw new Error(`Failed to insert work orders: ${workOrderError.message}`);
      }
    }

    // Step 6: Calculate and insert outcode statistics
    const outcodeStats = calculateOutcodeStats(properties);
    const statsInserts = outcodeStats.map((stat) => ({
      import_id: currentImportId,
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
      logger.error("Failed to insert outcode stats", { importId: currentImportId, error: statsError.message });
      throw new Error(`Failed to insert outcode stats: ${statsError.message}`);
    }

    // Step 7: Swap current import to the new snapshot
    if (previousCurrentIds.length > 0) {
      const { error: clearError } = await supabase
        .from("imports")
        .update({ is_current: false })
        .in("id", previousCurrentIds);

      if (clearError) {
        logger.error("Failed to clear previous current imports", {
          previousIds: previousCurrentIds,
          error: clearError.message,
        });
        throw new Error(`Failed to update previous import: ${clearError.message}`);
      }
    }

    // Step 8: Mark new import as current and completed
    const { error: finalizeError } = await supabase
      .from("imports")
      .update({ is_current: true, status: "completed" })
      .eq("id", currentImportId);

    if (finalizeError) {
      logger.error("Failed to finalize import", { importId: currentImportId, error: finalizeError.message });
      throw new Error(`Failed to mark import as current: ${finalizeError.message}`);
    }

    logger.info("Import completed successfully", { importId: currentImportId, propertiesImported: properties.length });

    return {
      success: true,
      importId: currentImportId,
      propertiesImported: properties.length,
      workOrdersImported: workOrders.length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    logger.error("Import failed", { importId, error: message });

    // Clean up the failed import if we created one
    if (importId) {
      await cleanupFailedImport(importId, previousCurrentIds);
    }

    return {
      success: false,
      propertiesImported: 0,
      workOrdersImported: 0,
      error: message,
    };
  }
}
