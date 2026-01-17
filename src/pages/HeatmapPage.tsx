import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useProperties, type PropertyFilters } from "@/hooks/useProperties";
import { useOutcodeStats } from "@/hooks/useOutcodeStats";
import { useImports } from "@/hooks/useImports";
import HeatmapLayer from "@/components/HeatmapLayer";
import MarkerLayer from "@/components/MarkerLayer";
import ClusterLayer from "@/components/ClusterLayer";
import MapController from "@/components/MapController";
import AreaStatsPanel from "@/components/AreaStatsPanel";
import HeatmapStatsHeader from "@/components/HeatmapStatsHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo, useCallback } from "react";
import { Flame, MapPin, Grid3X3, Search, X, Download, History } from "lucide-react";
import type { Property } from "@/types/database.types";

// Southwark centre coordinates
const SOUTHWARK_CENTER: [number, number] = [51.47, -0.065];
const DEFAULT_ZOOM = 13;

type ViewMode = "heatmap" | "markers" | "clusters";
type VisitType = "all" | "single" | "multi";

export default function HeatmapPage() {
  // State for view mode
  const [viewMode, setViewMode] = useState<ViewMode>("heatmap");

  // State for area filter
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  // State for visit type filter
  const [visitType, setVisitType] = useState<VisitType>("all");

  // State for minimum visits filter
  const [minVisits, setMinVisits] = useState(1);

  // State for search
  const [searchTerm, setSearchTerm] = useState("");

  // State for selected import (null means current)
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null);

  // Fetch all imports for the snapshot selector
  const { data: imports = [] } = useImports();

  // Fetch outcode stats for the dropdown
  const { data: outcodeStats = [], isLoading: isStatsLoading } = useOutcodeStats();

  // Get the selected import details for banner
  const selectedImport = useMemo(() => {
    if (!selectedImportId) return null;
    return imports.find((i) => i.id === selectedImportId) ?? null;
  }, [selectedImportId, imports]);

  // Build filters based on selected area, visit type, min visits, search, and import
  const filters = useMemo<PropertyFilters>(
    () => ({
      importId: selectedImportId,
      outcode: selectedArea,
      visitType: visitType,
      minVisits: minVisits,
      searchTerm: searchTerm,
    }),
    [selectedImportId, selectedArea, visitType, minVisits, searchTerm]
  );

  // Fetch properties based on filters
  const { data: properties = [], isLoading } = useProperties(filters);

  // Get the coordinates for the selected area (for zooming)
  const selectedAreaCoords = useMemo(() => {
    if (!selectedArea) return null;
    const area = outcodeStats.find((a) => a.outcode === selectedArea);
    if (!area) return null;
    return [area.lat, area.lon] as [number, number];
  }, [selectedArea, outcodeStats]);

  // Export filtered data as CSV
  const exportToCSV = useCallback(() => {
    if (properties.length === 0) return;

    // CSV headers
    const headers = ["address", "postcode", "outcode", "visit_count"];

    // Convert properties to CSV rows
    const rows = properties.map((p: Property) => [
      `"${(p.address || "").replace(/"/g, '""')}"`,
      p.postcode || "",
      p.outcode || "",
      p.visit_count.toString(),
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Create filename with date
    const date = new Date().toISOString().split("T")[0];
    const filename = `heatmap-export-${date}.csv`;

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [properties]);

  return (
    <div className="h-[calc(100vh-72px)] w-full relative">
      {/* Historical Data Banner */}
      {selectedImport && (
        <div className="absolute top-0 left-0 right-0 z-[1001] bg-amber-500 text-white py-2 px-4 text-center text-sm font-medium">
          <History className="inline-block w-4 h-4 mr-2 -mt-0.5" />
          Viewing data from{" "}
          {new Date(selectedImport.uploaded_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      )}

      {/* Statistics Header */}
      <HeatmapStatsHeader properties={properties} isLoading={isLoading} />

      {/* Snapshot Selector */}
      <div className="absolute top-14 right-4 z-[1000] flex flex-col gap-2">
        <div className="bg-white rounded-[10px] border border-[#dce3e7] shadow-[0_6px_16px_rgba(15,23,42,0.08)] p-3">
          <div className="flex items-center gap-2 mb-2">
            <History className="w-3.5 h-3.5 text-[#0f5d5e]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#627083]">
              Snapshot
            </span>
          </div>
          <Select
            value={selectedImportId ?? "current"}
            onValueChange={(value) =>
              setSelectedImportId(value === "current" ? null : value)
            }
          >
            <SelectTrigger className="w-[200px] text-sm border-[#dce3e7]">
              <SelectValue placeholder="Select snapshot" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current</SelectItem>
              {imports
                .filter((i) => !i.is_current)
                .map((imp) => (
                  <SelectItem key={imp.id} value={imp.id}>
                    {new Date(imp.uploaded_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="absolute top-14 left-4 z-[1000] bg-white rounded-[10px] border border-[#dce3e7] shadow-[0_6px_16px_rgba(15,23,42,0.08)] p-1">
        <div className="flex gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("heatmap")}
            className={`px-3 py-2 text-xs font-semibold transition-all rounded-lg ${
              viewMode === "heatmap"
                ? "bg-white text-[#1f2a37] shadow-[0_6px_16px_rgba(15,23,42,0.08)] border border-[rgba(15,23,42,0.08)]"
                : "text-[#627083] hover:text-[#1f2a37]"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Heatmap
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("markers")}
            className={`px-3 py-2 text-xs font-semibold transition-all rounded-lg ${
              viewMode === "markers"
                ? "bg-white text-[#1f2a37] shadow-[0_6px_16px_rgba(15,23,42,0.08)] border border-[rgba(15,23,42,0.08)]"
                : "text-[#627083] hover:text-[#1f2a37]"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Markers
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("clusters")}
            className={`px-3 py-2 text-xs font-semibold transition-all rounded-lg ${
              viewMode === "clusters"
                ? "bg-white text-[#1f2a37] shadow-[0_6px_16px_rgba(15,23,42,0.08)] border border-[rgba(15,23,42,0.08)]"
                : "text-[#627083] hover:text-[#1f2a37]"
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            Clusters
          </Button>
        </div>
      </div>

      {/* Visit Type Filter */}
      <div className="absolute top-[6.5rem] left-4 z-[1000] bg-white rounded-[10px] border border-[#dce3e7] shadow-[0_6px_16px_rgba(15,23,42,0.08)] p-1">
        <div className="flex gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVisitType("all")}
            className={`px-3 py-2 text-xs font-semibold transition-all rounded-lg ${
              visitType === "all"
                ? "bg-white text-[#1f2a37] shadow-[0_6px_16px_rgba(15,23,42,0.08)] border border-[rgba(15,23,42,0.08)]"
                : "text-[#627083] hover:text-[#1f2a37]"
            }`}
          >
            All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVisitType("single")}
            className={`px-3 py-2 text-xs font-semibold transition-all rounded-lg ${
              visitType === "single"
                ? "bg-white text-[#0f5d5e] shadow-[0_6px_16px_rgba(15,23,42,0.08)] border border-[#0f5d5e]/30"
                : "text-[#627083] hover:text-[#1f2a37]"
            }`}
          >
            Single Visit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVisitType("multi")}
            className={`px-3 py-2 text-xs font-semibold transition-all rounded-lg ${
              visitType === "multi"
                ? "bg-white text-[#d16b55] shadow-[0_6px_16px_rgba(15,23,42,0.08)] border border-[#d16b55]/30"
                : "text-[#627083] hover:text-[#1f2a37]"
            }`}
          >
            Multi Visit
          </Button>
        </div>
      </div>

      {/* Minimum Visits Slider */}
      <div className="absolute top-[9.5rem] left-4 z-[1000] bg-white rounded-[10px] border border-[#dce3e7] shadow-[0_6px_16px_rgba(15,23,42,0.08)] p-3 w-[200px]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#627083]">
            Min Visits
          </span>
          <span className="bg-[#d9eceb] text-[#0b4d4f] px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums">
            {minVisits === 10 ? "10+" : minVisits}
          </span>
        </div>
        <Slider
          value={[minVisits]}
          onValueChange={(value) => setMinVisits(value[0])}
          min={1}
          max={10}
          step={1}
          className="[&_[data-slot=slider-track]]:bg-[#eef2f1] [&_[data-slot=slider-range]]:bg-[#0f5d5e] [&_[data-slot=slider-thumb]]:border-[#0f5d5e] [&_[data-slot=slider-thumb]]:w-[18px] [&_[data-slot=slider-thumb]]:h-[18px]"
        />
        <div className="flex justify-between text-[10px] text-[#8996a5] mt-1">
          <span>1</span>
          <span>10+</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="absolute top-[13rem] left-4 z-[1000] bg-white rounded-[10px] border border-[#dce3e7] shadow-[0_6px_16px_rgba(15,23,42,0.08)] p-3 w-[200px]">
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-3.5 h-3.5 text-[#0f5d5e]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#627083]">
            Search
          </span>
        </div>
        <div className="relative">
          <Input
            type="text"
            placeholder="Address or postcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-8 text-sm h-8 border-[#dce3e7]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8996a5] hover:text-[#627083]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Export Button */}
      <div className="absolute top-[17.5rem] left-4 z-[1000]">
        <Button
          onClick={exportToCSV}
          disabled={properties.length === 0}
          className="bg-[#0f5d5e] hover:bg-[#0b4d4f] text-white shadow-[0_6px_16px_rgba(15,23,42,0.08)] w-[200px]"
        >
          <Download className="w-4 h-4" />
          Export CSV ({properties.length.toLocaleString()})
        </Button>
      </div>

      {/* Area Statistics Panel */}
      <AreaStatsPanel
        areas={outcodeStats}
        selectedArea={selectedArea}
        onAreaClick={setSelectedArea}
        isLoading={isStatsLoading}
      />

      {isLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 px-4 py-2 rounded-lg shadow-md text-sm text-[#627083]">
          Loading properties...
        </div>
      )}
      <MapContainer
        center={SOUTHWARK_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="topleft" />
        <MapController center={selectedAreaCoords} />
        {properties.length > 0 && viewMode === "heatmap" && (
          <HeatmapLayer properties={properties} />
        )}
        {properties.length > 0 && viewMode === "markers" && (
          <MarkerLayer properties={properties} />
        )}
        {properties.length > 0 && viewMode === "clusters" && (
          <ClusterLayer properties={properties} />
        )}
      </MapContainer>
    </div>
  );
}
