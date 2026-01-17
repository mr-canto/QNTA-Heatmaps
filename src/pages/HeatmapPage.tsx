import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useProperties, type PropertyFilters } from "@/hooks/useProperties";
import { useOutcodeStats } from "@/hooks/useOutcodeStats";
import HeatmapLayer from "@/components/HeatmapLayer";
import MarkerLayer from "@/components/MarkerLayer";
import ClusterLayer from "@/components/ClusterLayer";
import MapController from "@/components/MapController";
import AreaFilterDropdown from "@/components/AreaFilterDropdown";
import { Button } from "@/components/ui/button";
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

  // Fetch outcode stats for the dropdown
  const { data: outcodeStats = [], isLoading: isStatsLoading } = useOutcodeStats();

  // Build filters based on selected area and visit type
  const filters = useMemo<PropertyFilters>(
    () => ({
      outcode: selectedArea,
      visitType: visitType,
    }),
    [selectedArea, visitType]
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
      {/* View Mode Toggle */}
      <div className="absolute top-4 left-4 z-[1000] bg-white rounded-[10px] border border-[#dce3e7] shadow-[0_6px_16px_rgba(15,23,42,0.08)] p-1">
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
      <div className="absolute top-16 left-4 z-[1000] bg-white rounded-[10px] border border-[#dce3e7] shadow-[0_6px_16px_rgba(15,23,42,0.08)] p-1">
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

      {/* Area Filter */}
      <div className="absolute top-4 right-4 z-[1000]">
        <AreaFilterDropdown
          areas={outcodeStats}
          selectedArea={selectedArea}
          onAreaChange={setSelectedArea}
          isLoading={isStatsLoading}
        />
      </div>

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
