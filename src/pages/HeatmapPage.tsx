import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import { useProperties, type PropertyFilters } from "@/hooks/useProperties";
import { useOutcodeStats } from "@/hooks/useOutcodeStats";
import { useImports } from "@/hooks/useImports";
import { useQueryErrorHandler } from "@/hooks/useQueryErrorHandler";
import HeatmapLayer from "@/components/HeatmapLayer";
import MarkerLayer from "@/components/MarkerLayer";
import ClusterLayer from "@/components/ClusterLayer";
import MapController from "@/components/MapController";
import AreaStatsPanel from "@/components/AreaStatsPanel";
import HeatmapStatsHeader from "@/components/HeatmapStatsHeader";
import { useHeaderExtras } from "@/context/HeaderExtrasContext";
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
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Search, X, Download, History, SlidersHorizontal, BarChart3 } from "lucide-react";
import type { Property } from "@/types/database.types";

// Southwark centre coordinates
const SOUTHWARK_CENTER: [number, number] = [51.47, -0.065];
const DEFAULT_ZOOM = 13;
const EMPTY_PROPERTIES: Property[] = [];

type ViewMode = "heatmap" | "markers" | "clusters";
type VisitType = "all" | "single" | "multi";

export default function HeatmapPage() {
  const { setExtras } = useHeaderExtras();

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

  // Mobile panel state
  const [controlsPanelOpen, setControlsPanelOpen] = useState(false);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const areaStatsRef = useRef<HTMLDivElement | null>(null);
  const areaScrollLipRef = useRef<HTMLDivElement | null>(null);
  const legendRef = useRef<HTMLDivElement | null>(null);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close panels when clicking outside on mobile
  const handleOverlayClick = useCallback(() => {
    setControlsPanelOpen(false);
    setInfoPanelOpen(false);
  }, []);

  // Sync layout metrics with CSS variables for panel sizing
  useEffect(() => {
    const setLayoutMetrics = () => {
      const header = document.querySelector("header");
      const legend = legendRef.current;
      const headerHeight = header ? header.getBoundingClientRect().height : 72;
      const legendHeight = legend ? legend.getBoundingClientRect().height : 0;

      document.documentElement.style.setProperty(
        "--header-height",
        `${headerHeight}px`
      );
      document.documentElement.style.setProperty(
        "--legend-height",
        `${legendHeight}px`
      );
    };

    setLayoutMetrics();
    window.addEventListener("resize", setLayoutMetrics);
    const raf = requestAnimationFrame(setLayoutMetrics);

    return () => {
      window.removeEventListener("resize", setLayoutMetrics);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Fetch all imports for the snapshot selector
  const importsQuery = useImports();
  const imports = importsQuery.data ?? [];

  // Fetch outcode stats for the dropdown
  const statsQuery = useOutcodeStats();
  const outcodeStats = statsQuery.data ?? [];
  const isStatsLoading = statsQuery.isLoading;

  // Update scroll indicator for area stats
  useEffect(() => {
    const areaStats = areaStatsRef.current;
    const scrollLip = areaScrollLipRef.current;
    if (!areaStats || !scrollLip) return;

    const updateScrollIndicator = () => {
      const canScroll = areaStats.scrollHeight > areaStats.clientHeight + 2;
      const atBottom =
        areaStats.scrollTop + areaStats.clientHeight >=
        areaStats.scrollHeight - 2;
      scrollLip.classList.toggle("visible", canScroll && !atBottom);
    };

    updateScrollIndicator();
    areaStats.addEventListener("scroll", updateScrollIndicator);
    window.addEventListener("resize", updateScrollIndicator);

    return () => {
      areaStats.removeEventListener("scroll", updateScrollIndicator);
      window.removeEventListener("resize", updateScrollIndicator);
    };
  }, [outcodeStats, isStatsLoading]);

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
  const propertiesQuery = useProperties(filters);
  const properties = propertiesQuery.data ?? EMPTY_PROPERTIES;
  const isLoading = propertiesQuery.isLoading;

  // Error handlers with retry functionality
  useQueryErrorHandler({
    error: propertiesQuery.error,
    isError: propertiesQuery.isError,
    refetch: propertiesQuery.refetch,
    context: "property data",
  });
  useQueryErrorHandler({
    error: statsQuery.error,
    isError: statsQuery.isError,
    refetch: statsQuery.refetch,
    context: "area statistics",
  });
  useQueryErrorHandler({
    error: importsQuery.error,
    isError: importsQuery.isError,
    refetch: importsQuery.refetch,
    context: "import snapshots",
  });

  const statsHeader = useMemo(
    () => <HeatmapStatsHeader properties={properties} isLoading={isLoading} />,
    [properties, isLoading]
  );

  useEffect(() => {
    setExtras(statsHeader);
    return () => {
      setExtras(null);
    };
  }, [setExtras, statsHeader]);

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

  const infoPanelHeight =
    "calc(100vh - (var(--header-height) + 18px + var(--legend-height) + 24px + 16px))";
  const infoPanelStyle = isMobile
    ? undefined
    : { height: infoPanelHeight, maxHeight: infoPanelHeight };

  return (
    <div
      className="w-full relative"
      style={{ height: "calc(100vh - var(--header-height, 72px))" }}
    >
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

      {/* Mobile Toggle Buttons - only visible on mobile (<768px) */}
      <button
        onClick={() => {
          setControlsPanelOpen(!controlsPanelOpen);
          setInfoPanelOpen(false);
        }}
        className={`fixed z-[1001] w-11 h-11 rounded-lg border border-[#dce3e7] shadow-[0_12px_26px_rgba(15,23,42,0.12)] items-center justify-center transition-all duration-200 active:scale-95 top-[calc(72px+12px)] left-3 hidden max-md:flex ${
          controlsPanelOpen
            ? "bg-[#0f5d5e] border-white/35"
            : "bg-white"
        }`}
      >
        <SlidersHorizontal
          className={`w-5 h-5 ${controlsPanelOpen ? "stroke-white" : "stroke-[#0f5d5e]"}`}
        />
      </button>
      <button
        onClick={() => {
          setInfoPanelOpen(!infoPanelOpen);
          setControlsPanelOpen(false);
        }}
        className={`fixed z-[1001] w-11 h-11 rounded-lg border border-[#dce3e7] shadow-[0_12px_26px_rgba(15,23,42,0.12)] items-center justify-center transition-all duration-200 active:scale-95 top-[calc(72px+12px)] right-3 hidden max-md:flex ${
          infoPanelOpen
            ? "bg-[#0f5d5e] border-white/35"
            : "bg-white"
        }`}
      >
        <BarChart3
          className={`w-5 h-5 ${infoPanelOpen ? "stroke-white" : "stroke-[#0f5d5e]"}`}
        />
      </button>

      {/* Mobile Overlay - only visible when a panel is open on mobile */}
      {isMobile && (controlsPanelOpen || infoPanelOpen) && (
        <div
          onClick={handleOverlayClick}
          className="fixed inset-0 bg-[rgba(15,23,42,0.38)] z-[999] transition-opacity duration-300 max-sm:block sm:hidden"
        />
      )}

      {/* Controls Panel - Left Side */}
      <div
        className={`controls fixed z-[1002] bg-white border border-[#dce3e7] shadow-[0_20px_45px_rgba(15,23,42,0.16)] backdrop-blur-[6px] transition-transform duration-300 ease-out
          md:top-[calc(72px+18px)] md:left-6 md:w-[280px] md:rounded-[14px] md:p-4 md:translate-x-0
          max-lg:w-[240px] max-lg:left-4 max-lg:p-3.5
          max-md:top-0 max-md:left-0 max-md:w-[280px] max-md:max-w-[85vw] max-md:h-screen max-md:max-h-screen max-md:overflow-y-auto max-md:rounded-none max-md:pt-[72px] max-md:px-4 max-md:pb-5
          max-sm:w-full max-sm:max-w-full
          ${isMobile ? (controlsPanelOpen ? "translate-x-0" : "-translate-x-full") : ""}`}
      >
        {/* Mobile Close Button */}
        <button
          onClick={() => setControlsPanelOpen(false)}
          className="absolute top-2.5 right-2.5 w-8 h-8 border border-[#dce3e7] bg-[#f4f7f6] rounded-md items-center justify-center hidden max-md:flex hover:bg-[#eef2f1]"
        >
          <X className="w-4 h-4 stroke-[#627083]" />
        </button>

        <div className="text-[11px] font-bold text-[#627083] uppercase tracking-[0.14em] mb-0">
          Control Panel
        </div>

        <div className="border-t border-[#dce3e7] mt-2.5 mb-3.5" />

        {/* Snapshot Selector */}
        <div className="mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#627083] uppercase tracking-[0.14em]">
              Snapshot
            </span>
            <Select
              value={selectedImportId ?? "current"}
              onValueChange={(value) =>
                setSelectedImportId(value === "current" ? null : value)
              }
            >
              <SelectTrigger className="ml-auto w-[140px] text-[12px] border-[#dce3e7] bg-[#eef2f1] rounded-[10px] max-md:py-3 max-md:text-[13px]">
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

        <div className="border-t border-[#dce3e7] mt-2 mb-[18px]" />

        {/* View Mode Toggle */}
        <div className="mb-[18px]">
          <div className="text-[11px] font-bold text-[#627083] uppercase tracking-[0.14em] mb-2.5">
            View Mode
          </div>
          <div className="toggle-group">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("heatmap")}
              className={`toggle-btn ${viewMode === "heatmap" ? "active" : ""}`}
            >
              Heatmap
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("markers")}
              className={`toggle-btn ${viewMode === "markers" ? "active" : ""}`}
            >
              Markers
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("clusters")}
              className={`toggle-btn ${viewMode === "clusters" ? "active" : ""}`}
            >
              Clusters
            </Button>
          </div>
        </div>

        {/* Visit Type Filter */}
        <div className="mb-[18px]">
          <div className="text-[11px] font-bold text-[#627083] uppercase tracking-[0.14em] mb-2.5">
            Filter by Visits
          </div>
          <div className="toggle-group">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVisitType("all")}
              className={`toggle-btn ${visitType === "all" ? "active" : ""}`}
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVisitType("single")}
              className={`toggle-btn ${visitType === "single" ? "active" : ""}`}
            >
              Single
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVisitType("multi")}
              className={`toggle-btn ${visitType === "multi" ? "active" : ""}`}
            >
              Multiple
            </Button>
          </div>
        </div>

        {/* Minimum Visits Slider */}
        <div className="mb-0">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-bold text-[#627083] uppercase tracking-[0.14em]">
              Number of Visits
            </span>
            <span className="bg-[#d9eceb] text-[#0b4d4f] px-2.5 py-1 rounded-full text-xs font-semibold tabular-nums">
              {minVisits === 10 ? "10+" : minVisits}
            </span>
          </div>
          <Slider
            value={[minVisits]}
            onValueChange={(value) => setMinVisits(value[0])}
            min={1}
            max={10}
            step={1}
            className="[&_[data-slot=slider-track]]:bg-[#eef2f1] [&_[data-slot=slider-range]]:bg-[#eef2f1] [&_[data-slot=slider-thumb]]:bg-[#0f5d5e] [&_[data-slot=slider-thumb]]:border-white [&_[data-slot=slider-thumb]]:w-[18px] [&_[data-slot=slider-thumb]]:h-[18px] max-md:[&_[data-slot=slider-thumb]]:w-6 max-md:[&_[data-slot=slider-thumb]]:h-6 max-md:[&_[data-slot=slider-track]]:h-2"
          />
          <div className="flex justify-between text-[10px] text-[#8996a5] mt-1.5">
            <span>1</span>
            <span>5</span>
            <span>10+</span>
          </div>
        </div>

        <div className="border-t border-[#dce3e7] my-[18px]" />

        {/* Area Filter */}
        <div className="mb-[18px]">
          <div className="text-[11px] font-bold text-[#627083] uppercase tracking-[0.14em] mb-2.5">
            Filter by Area
          </div>
          <Select
            value={selectedArea ?? "all"}
            onValueChange={(value) =>
              setSelectedArea(value === "all" ? null : value)
            }
          >
            <SelectTrigger className="w-full text-[12px] border-[#dce3e7] bg-[#eef2f1] rounded-[10px] max-md:py-3 max-md:text-[13px]">
              <SelectValue placeholder="All Areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {outcodeStats.map((area) => (
                <SelectItem key={area.outcode} value={area.outcode}>
                  {area.areaName}, {area.outcode} ({area.totalVisits.toLocaleString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Input */}
        <div className="mb-[18px]">
          <div className="flex items-center gap-2 mb-2.5">
            <Search className="w-3.5 h-3.5 text-[#627083]" />
            <span className="text-[11px] font-bold text-[#627083] uppercase tracking-[0.14em]">
              Search
            </span>
          </div>
          <div className="relative">
            <Input
              type="text"
              placeholder="Address or postcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-8 text-[12px] h-9 border-[#dce3e7] bg-[#eef2f1] rounded-[10px] max-md:h-10 max-md:text-[13px]"
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

        <div className="border-t border-[#dce3e7] my-[18px]" />

        {/* Export Button */}
        <Button
          onClick={exportToCSV}
          disabled={properties.length === 0}
          className="w-full h-auto rounded-[10px] bg-[#0f5d5e] hover:bg-[#0b4d4f] text-white text-[12px] font-semibold py-2.5 shadow-[0_6px_16px_rgba(15,23,42,0.08)]"
        >
          <Download className="w-4 h-4" />
          Export CSV ({properties.length.toLocaleString()})
        </Button>
      </div>

      {/* Info Panel - Right Side (Area Statistics) */}
      <div
        style={infoPanelStyle}
        className={`info-panel fixed z-[1002] bg-white border border-[#dce3e7] shadow-[0_20px_45px_rgba(15,23,42,0.16)] backdrop-blur-md transition-transform duration-300 ease-out overflow-hidden flex flex-col
          md:top-[calc(72px+18px)] md:right-6 md:w-[280px] md:rounded-[14px] md:p-4 md:translate-x-0
          max-lg:right-4 max-lg:p-3.5
          max-md:top-0 max-md:right-0 max-md:w-[280px] max-md:max-w-[85vw] max-md:h-screen max-md:max-h-screen max-md:rounded-none max-md:pt-[72px] max-md:px-4 max-md:pb-5
          max-sm:w-full max-sm:max-w-full
          ${isMobile ? (infoPanelOpen ? "translate-x-0" : "translate-x-full") : ""}`}
      >
        {/* Mobile Close Button */}
        <button
          onClick={() => setInfoPanelOpen(false)}
          className="absolute top-2.5 right-2.5 w-8 h-8 border border-[#dce3e7] bg-[#f4f7f6] rounded-md items-center justify-center hidden max-md:flex hover:bg-[#eef2f1]"
        >
          <X className="w-4 h-4 stroke-[#627083]" />
        </button>

        <h3 className="text-[11px] text-[#627083] mb-3.5 pb-2.5 tracking-[0.14em] uppercase border-b border-[#dce3e7] font-bold">
          Visits by Area
        </h3>

        <div
          id="area-stats"
          ref={areaStatsRef}
          className="flex-1 overflow-y-auto min-h-0 pr-1 pb-1.5"
        >
          <AreaStatsPanel
            areas={outcodeStats}
            selectedArea={selectedArea}
            onAreaClick={(outcode) => {
              setSelectedArea(outcode);
              if (isMobile) setInfoPanelOpen(false);
            }}
            isLoading={isStatsLoading}
            embedded
          />
        </div>
        <div
          className="scroll-lip"
          id="area-scroll-lip"
          ref={areaScrollLipRef}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24">
            <path
              d="M6 9l6 6 6-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Scroll for more</span>
        </div>
      </div>

      {/* Heatmap Legend - Bottom Right (Desktop/Tablet) / Bottom Center (Mobile) */}
      <div
        ref={legendRef}
        className="fixed z-[1000] bg-white rounded-[14px] border border-[#dce3e7] shadow-[0_20px_45px_rgba(15,23,42,0.16)] p-3.5 md:bottom-6 md:right-6 md:w-[280px] max-lg:w-[240px] max-lg:right-4 max-md:bottom-2.5 max-md:left-2.5 max-md:right-2.5 max-md:w-auto max-md:p-3 max-md:rounded-[14px] max-sm:bottom-2 max-sm:left-2 max-sm:right-2 max-sm:p-2.5"
      >
        <h4 className="text-[11px] mb-2.5 text-[#627083] tracking-[0.14em] uppercase font-bold max-md:text-[10px] max-md:mb-1.5">
          Visit Intensity
        </h4>
        <div
          className="w-full h-4 rounded-full mb-1.5 border border-[rgba(15,23,42,0.08)] max-md:h-3.5"
          style={{
            background:
              "linear-gradient(to right, #2f7ab8 0%, #3aa6b9 25%, #f1d77a 50%, #f2a65a 75%, #d45a4b 100%)",
          }}
        />
        <div className="flex justify-between text-[11px] text-[#627083] font-medium max-md:text-[10px]">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
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
          attribution='&copy; OpenStreetMap, &copy; CartoDB'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
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
