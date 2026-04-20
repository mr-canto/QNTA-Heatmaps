import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database.types";

export type WorkOrder = Tables<"work_orders">;

async function fetchPropertyWorkOrders(propertyId: string): Promise<WorkOrder[]> {
  const { data, error } = await supabase
    .from("work_orders")
    .select("*")
    .eq("property_id", propertyId)
    .order("normalized_date", { ascending: false, nullsFirst: false })
    .order("import_row_order", { ascending: false })
    .order("work_order_ref", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to fetch property work orders: ${error.message}`);
  }

  return data ?? [];
}

export function usePropertyWorkOrders(propertyId: string) {
  return useQuery({
    queryKey: ["propertyWorkOrders", propertyId],
    queryFn: () => fetchPropertyWorkOrders(propertyId),
    enabled: Boolean(propertyId),
    staleTime: 1000 * 60 * 5,
  });
}
