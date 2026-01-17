import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Import {
  id: string;
  filename: string;
  record_count: number;
  is_current: boolean;
  uploaded_at: string;
}

async function fetchImports(): Promise<Import[]> {
  const { data, error } = await supabase
    .from("imports")
    .select("id, filename, record_count, is_current, uploaded_at")
    .order("uploaded_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch imports: ${error.message}`);
  }

  return data ?? [];
}

export function useImports() {
  return useQuery({
    queryKey: ["imports"],
    queryFn: fetchImports,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
