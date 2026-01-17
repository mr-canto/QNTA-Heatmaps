/**
 * Database Types for Supabase
 *
 * This file contains TypeScript type definitions for the QNTA Heatmap database schema.
 * These types enable type-safe queries, autocompletion, and better developer experience.
 *
 * To regenerate from local database (requires Supabase to be running):
 *   npm run gen:types
 *
 * To regenerate from remote/production database:
 *   npm run gen:types:remote
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      imports: {
        Row: {
          id: string;
          uploaded_by: string;
          uploaded_at: string;
          filename: string;
          record_count: number;
          is_current: boolean;
        };
        Insert: {
          id?: string;
          uploaded_by: string;
          uploaded_at?: string;
          filename: string;
          record_count?: number;
          is_current?: boolean;
        };
        Update: {
          id?: string;
          uploaded_by?: string;
          uploaded_at?: string;
          filename?: string;
          record_count?: number;
          is_current?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "imports_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      properties: {
        Row: {
          id: string;
          import_id: string;
          address: string;
          postcode: string;
          outcode: string;
          lat: number;
          lon: number;
          visit_count: number;
        };
        Insert: {
          id?: string;
          import_id: string;
          address: string;
          postcode: string;
          outcode: string;
          lat: number;
          lon: number;
          visit_count?: number;
        };
        Update: {
          id?: string;
          import_id?: string;
          address?: string;
          postcode?: string;
          outcode?: string;
          lat?: number;
          lon?: number;
          visit_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "properties_import_id_fkey";
            columns: ["import_id"];
            isOneToOne: false;
            referencedRelation: "imports";
            referencedColumns: ["id"];
          }
        ];
      };
      outcode_stats: {
        Row: {
          id: string;
          import_id: string;
          outcode: string;
          area_name: string;
          total_visits: number;
          property_count: number;
          multi_visit_count: number;
          lat: number;
          lon: number;
        };
        Insert: {
          id?: string;
          import_id: string;
          outcode: string;
          area_name: string;
          total_visits?: number;
          property_count?: number;
          multi_visit_count?: number;
          lat: number;
          lon: number;
        };
        Update: {
          id?: string;
          import_id?: string;
          outcode?: string;
          area_name?: string;
          total_visits?: number;
          property_count?: number;
          multi_visit_count?: number;
          lat?: number;
          lon?: number;
        };
        Relationships: [
          {
            foreignKeyName: "outcode_stats_import_id_fkey";
            columns: ["import_id"];
            isOneToOne: false;
            referencedRelation: "imports";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

/**
 * Helper types for easier access to table row types.
 * Usage: Tables<'imports'> instead of Database['public']['Tables']['imports']['Row']
 */
export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never;

/**
 * Convenience type aliases for direct table access
 */
export type Import = Tables<"imports">;
export type ImportInsert = TablesInsert<"imports">;
export type ImportUpdate = TablesUpdate<"imports">;

export type Property = Tables<"properties">;
export type PropertyInsert = TablesInsert<"properties">;
export type PropertyUpdate = TablesUpdate<"properties">;

export type OutcodeStat = Tables<"outcode_stats">;
export type OutcodeStatInsert = TablesInsert<"outcode_stats">;
export type OutcodeStatUpdate = TablesUpdate<"outcode_stats">;
