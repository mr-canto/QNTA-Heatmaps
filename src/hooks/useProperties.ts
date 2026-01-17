import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Property } from "@/types/database.types";

export interface PropertyFilters {
  importId?: string | null;
  outcode?: string | null;
  visitType?: "all" | "single" | "multi";
  minVisits?: number;
  searchTerm?: string;
}

async function fetchProperties(filters: PropertyFilters): Promise<Property[]> {
  // Determine which import to use
  let importId = filters.importId;

  if (!importId) {
    // Get the current import
    const { data: currentImport, error: importError } = await supabase
      .from("imports")
      .select("id")
      .eq("is_current", true)
      .single();

    if (importError || !currentImport) {
      return [];
    }

    importId = currentImport.id;
  }

  // Build the query
  let query = supabase
    .from("properties")
    .select("*")
    .eq("import_id", importId);

  // Apply outcode filter
  if (filters.outcode) {
    query = query.eq("outcode", filters.outcode);
  }

  // Apply visit type filter
  if (filters.visitType === "single") {
    query = query.eq("visit_count", 1);
  } else if (filters.visitType === "multi") {
    query = query.gt("visit_count", 1);
  }

  // Apply minimum visits filter
  if (filters.minVisits && filters.minVisits > 1) {
    query = query.gte("visit_count", filters.minVisits);
  }

  // Apply search filter
  if (filters.searchTerm && filters.searchTerm.trim()) {
    const term = filters.searchTerm.trim();
    query = query.or(`address.ilike.%${term}%,postcode.ilike.%${term}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch properties: ${error.message}`);
  }

  return data ?? [];
}

export function useProperties(filters: PropertyFilters = {}) {
  return useQuery({
    queryKey: ["properties", filters],
    queryFn: () => fetchProperties(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
