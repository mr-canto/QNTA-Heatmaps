import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Property, Import } from "@/types/database.types";

interface ExportDataResult {
  properties: Property[];
  currentImport: Import | null;
}

async function fetchExportData(): Promise<ExportDataResult> {
  // Get the current import
  const { data: currentImport, error: importError } = await supabase
    .from("imports")
    .select("*")
    .eq("is_current", true)
    .single();

  if (importError || !currentImport) {
    return { properties: [], currentImport: null };
  }

  // Get all properties for the current import
  const { data: properties, error: propertiesError } = await supabase
    .from("properties")
    .select("*")
    .eq("import_id", currentImport.id)
    .order("outcode")
    .order("address");

  if (propertiesError) {
    throw propertiesError;
  }

  return {
    properties: properties ?? [],
    currentImport,
  };
}

function generateCSV(properties: Property[]): string {
  const headers = ["address", "postcode", "outcode", "visit_count"];
  const rows = properties.map((p) => [
    `"${p.address.replace(/"/g, '""')}"`,
    p.postcode,
    p.outcode,
    p.visit_count.toString(),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function useExportData() {
  const query = useQuery({
    queryKey: ["export-data"],
    queryFn: fetchExportData,
    enabled: false, // Only fetch when triggered
    staleTime: 0, // Always refetch to get latest data
  });

  const exportToCSV = async () => {
    const result = await query.refetch();

    if (!result.data) {
      return;
    }

    const { properties, currentImport } = result.data;

    if (properties.length === 0) {
      return;
    }

    const csv = generateCSV(properties);
    const date = new Date().toISOString().split("T")[0];
    const snapshotId = currentImport?.id.slice(0, 8) ?? "unknown";
    const filename = `qnta-heatmap-export-${date}-${snapshotId}.csv`;

    downloadCSV(csv, filename);
  };

  return {
    exportToCSV,
    isExporting: query.isFetching,
  };
}
