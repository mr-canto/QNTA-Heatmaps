import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useProperties, type PropertyFilters } from "@/hooks/useProperties";
import { useOutcodeStats } from "@/hooks/useOutcodeStats";
import HeatmapLayer from "@/components/HeatmapLayer";
import MarkerLayer from "@/components/MarkerLayer";
import ClusterLayer from "@/components/ClusterLayer";
import MapController from "@/components/MapController";
import AreaStatsPanel from "@/components/AreaStatsPanel";
import HeatmapStatsHeader from "@/components/HeatmapStatsHeader";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState, useMemo } from "react";
import { Flame, MapPin, Grid3X3 } from "lucide-react";

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

  // Fetch outcode stats for the dropdown
  const { data: outcodeStats = [], isLoading: isStatsLoading } = useOutcodeStats();

  // Build filters based on selected area, visit type, and min visits
  const filters = useMemo<PropertyFilters>(
    () => ({
      outcode: selectedArea,
      visitType: visitType,
      minVisits: minVisits,
    }),
    [selectedArea, visitType, minVisits]
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

  return (
    <div className="h-[calc(100vh-72px)] w-full relative">
      {/* Statistics Header */}
      <HeatmapStatsHeader properties={properties} isLoading={isLoading} />

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
