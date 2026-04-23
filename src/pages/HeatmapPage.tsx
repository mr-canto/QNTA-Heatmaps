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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
} from "@/components/ui/select";
import { useState, useMemo, useCallback, useEffect, useRef, useDeferredValue } from "react";
import {
  Search,
  X,
  Download,
  History,
  SlidersHorizontal,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Property } from "@/types/database.types";

// Southwark centre coordinates
const SOUTHWARK_CENTER: [number, number] = [51.47, -0.065];
const DEFAULT_ZOOM = 13;
const EMPTY_PROPERTIES: Property[] = [];

type ViewMode = "heatmap" | "markers" | "clusters";
type VisitType = "all" | "single" | "multi";

export default function HeatmapPage() {
  const { setExtras } = useHeaderExtras();
  const previousViewportModeRef = useRef<"mobile" | "tablet" | "desktop">("desktop");

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
  const deferredSearchTerm = useDeferredValue(searchTerm);

  // State for selected import (null means current)
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null);

  // Mobile panel state
  const [controlsPanelOpen, setControlsPanelOpen] = useState(false);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [viewportMode, setViewportMode] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [statsPlacement, setStatsPlacement] = useState<"header" | "overlay">("header");
  const areaStatsRef = useRef<HTMLDivElement | null>(null);
  const areaScrollLipRef = useRef<HTMLDivElement | null>(null);
  const legendRef = useRef<HTMLDivElement | null>(null);
  const historicalBannerRef = useRef<HTMLDivElement | null>(null);
  const tabletStatsRef = useRef<HTMLDivElement | null>(null);
  const isMobile = viewportMode === "mobile";
  const isTablet = viewportMode === "tablet";
  const usesCompactPanels = isMobile || isTablet;
  const showHeaderStats =
    viewportMode === "desktop" ||
    (viewportMode === "tablet" && statsPlacement === "header");
  const showOverlayStats =
    viewportMode === "tablet" && statsPlacement === "overlay";

  // Check viewport mode
  useEffect(() => {
    const checkViewportMode = () => {
      let nextMode: "mobile" | "tablet" | "desktop" = "desktop";

      if (window.innerWidth < 768) {
        nextMode = "mobile";
      } else if (window.innerWidth < 1180) {
        nextMode = "tablet";
      }

      setViewportMode(nextMode);
      setStatsPlacement(
        nextMode === "tablet" && window.innerWidth < 880 ? "overlay" : "header"
      );

      if (previousViewportModeRef.current === nextMode) {
        return;
      }

      if (nextMode === "tablet") {
        setControlsPanelOpen(true);
        setInfoPanelOpen(false);
      } else {
        setControlsPanelOpen(false);
        setInfoPanelOpen(false);
      }

      previousViewportModeRef.current = nextMode;
    };

    checkViewportMode();
    window.addEventListener("resize", checkViewportMode);
    return () => window.removeEventListener("resize", checkViewportMode);
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
      const historicalBanner = historicalBannerRef.current;
      const tabletStats = tabletStatsRef.current;
      const headerHeight = header ? header.getBoundingClientRect().height : 72;
      const legendHeight = legend ? legend.getBoundingClientRect().height : 0;
      const historicalBannerHeight = historicalBanner
        ? historicalBanner.getBoundingClientRect().height
        : 0;
      const tabletStatsHeight =
        showOverlayStats && tabletStats ? tabletStats.getBoundingClientRect().height : 0;
      const topOverlayHeight =
        historicalBannerHeight + (showOverlayStats ? tabletStatsHeight + 12 : 0);
      const mapControlLeftOffset = isMobile
        ? 70
        : isTablet
          ? controlsPanelOpen
            ? 16 + 280 + 12
            : 16
          : 24 + 280 + 12;
      const mapControlTopOffset = (isMobile ? 12 : 18) + topOverlayHeight;

      document.documentElement.style.setProperty(
        "--header-height",
        `${headerHeight}px`
      );
      document.documentElement.style.setProperty(
        "--legend-height",
        `${legendHeight}px`
      );
      document.documentElement.style.setProperty(
        "--historical-banner-height",
        `${historicalBannerHeight}px`
      );
      document.documentElement.style.setProperty(
        "--tablet-stats-height",
        `${tabletStatsHeight}px`
      );
      document.documentElement.style.setProperty(
        "--map-top-overlay-height",
        `${topOverlayHeight}px`
      );
      document.documentElement.style.setProperty(
        "--map-control-left-offset",
        `${mapControlLeftOffset}px`
      );
      document.documentElement.style.setProperty(
        "--map-control-top-offset",
        `${mapControlTopOffset}px`
      );
    };

    setLayoutMetrics();
    window.addEventListener("resize", setLayoutMetrics);
    const raf = requestAnimationFrame(setLayoutMetrics);

    return () => {
      window.removeEventListener("resize", setLayoutMetrics);
      cancelAnimationFrame(raf);
    };
  }, [controlsPanelOpen, isMobile, isTablet, selectedImportId, showOverlayStats, viewportMode]);

  // Fetch all imports for the snapshot selector
  const importsQuery = useImports();
  const imports = useMemo(
    () => (importsQuery.data ?? []).filter((imp) => imp.status === "completed"),
    [importsQuery.data]
  );

  // Fetch outcode stats for the dropdown
  const statsQuery = useOutcodeStats(selectedImportId);
  const outcodeStats = useMemo(() => statsQuery.data ?? [], [statsQuery.data]);
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

  const currentImport = useMemo(
    () => imports.find((imp) => imp.is_current) ?? null,
    [imports]
  );

  const formatSnapshotDate = useCallback((uploadedAt: string) => {
    return new Date(uploadedAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, []);

  const snapshotTriggerLabel = selectedImport
    ? formatSnapshotDate(selectedImport.uploaded_at)
    : "Current";

  const historicalImportsByYear = useMemo(() => {
    const grouped = new Map<string, typeof imports>();

    for (const importRecord of imports.filter((imp) => !imp.is_current)) {
      const year = new Date(importRecord.uploaded_at).getFullYear().toString();
      const bucket = grouped.get(year) ?? [];
      bucket.push(importRecord);
      grouped.set(year, bucket);
    }

    return Array.from(grouped.entries()).sort((a, b) => Number(b[0]) - Number(a[0]));
  }, [imports]);

  const effectiveSelectedArea = useMemo(() => {
    if (!selectedArea) return null;
    return outcodeStats.some((area) => area.outcode === selectedArea) ? selectedArea : null;
  }, [selectedArea, outcodeStats]);

  // Build filters based on selected area, visit type, min visits, search, and import
  const filters = useMemo<PropertyFilters>(
    () => ({
      importId: selectedImportId,
      outcode: effectiveSelectedArea,
      visitType: visitType,
      minVisits: minVisits,
      searchTerm: deferredSearchTerm,
    }),
    [selectedImportId, effectiveSelectedArea, visitType, minVisits, deferredSearchTerm]
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

  const desktopStatsHeader = useMemo(
    () => <HeatmapStatsHeader properties={properties} isLoading={isLoading} />,
    [properties, isLoading]
  );
  const tabletStatsHeader = useMemo(
    () => (
      <HeatmapStatsHeader
        properties={properties}
        isLoading={isLoading}
        variant="tablet"
      />
    ),
    [properties, isLoading]
  );

  useEffect(() => {
    setExtras(showHeaderStats ? desktopStatsHeader : null);
    return () => {
      setExtras(null);
    };
  }, [desktopStatsHeader, setExtras, showHeaderStats]);

  // Get the coordinates for the selected area (for zooming)
  const selectedAreaCoords = useMemo(() => {
    if (!effectiveSelectedArea) return null;
    const area = outcodeStats.find((a) => a.outcode === effectiveSelectedArea);
    if (!area) return null;
    return [area.lat, area.lon] as [number, number];
  }, [effectiveSelectedArea, outcodeStats]);

  /**
   * Sanitize a value for CSV export to prevent formula injection attacks.
   * Prefixes values starting with formula characters (=, +, -, @, tab, carriage return)
   * with a single quote to prevent spreadsheet applications from interpreting them as formulas.
   */
  const sanitizeCsvValue = useCallback((value: string): string => {
    if (!value) return "";

    // Check if the value starts with a formula character
    const firstChar = value.charAt(0);
    const formulaChars = ["=", "+", "-", "@", "\t", "\r"];

    if (formulaChars.includes(firstChar)) {
      // Prefix with a single quote to prevent formula interpretation
      return `'${value}`;
    }

    return value;
  }, []);

  /**
   * Escape and sanitize a field for CSV format.
   * Handles quoting, escaping double quotes, and formula injection prevention.
   */
  const escapeCsvField = useCallback((value: string): string => {
    const sanitized = sanitizeCsvValue(value);
    // Escape double quotes and wrap in quotes
    return `"${sanitized.replace(/"/g, '""')}"`;
  }, [sanitizeCsvValue]);

  // Export filtered data as CSV
  const exportToCSV = useCallback(() => {
    if (properties.length === 0) return;

    // CSV headers
    const headers = ["address", "postcode", "outcode", "visit_count"];

    // Convert properties to CSV rows with formula injection prevention
    const rows = properties.map((p: Property) => [
      escapeCsvField(p.address || ""),
      escapeCsvField(p.postcode || ""),
      escapeCsvField(p.outcode || ""),
      p.visit_count.toString(), // Numbers are safe
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
  }, [properties, escapeCsvField]);

  const infoPanelHeight =
    "calc(100vh - (var(--header-height) + 18px + var(--legend-height) + 24px + 16px))";
  const infoPanelStyle = isMobile
    ? undefined
    : { height: infoPanelHeight, maxHeight: infoPanelHeight };
  const compactPanelTop = "calc(var(--header-height, 72px) + var(--map-top-overlay-height, 0px) + 12px)";
  const tabletPanelHeight =
    "calc(100vh - (var(--header-height, 72px) + var(--map-top-overlay-height, 0px) + var(--legend-height, 0px) + 28px))";
  const tabletPanelStyle = isTablet
    ? { top: compactPanelTop, height: tabletPanelHeight, maxHeight: tabletPanelHeight }
    : undefined;
  const floatingToggleStyle = usesCompactPanels ? { top: compactPanelTop } : undefined;
  const tabletStatsTop = selectedImport
    ? "calc(var(--historical-banner-height, 0px) + 12px)"
    : "12px";
  const hideButtonStyle = {
    clipPath:
      "polygon(12px 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0 50%)",
  } as const;
  const hideButtonClassName =
    "absolute top-2.5 h-8 px-3 inline-flex items-center gap-1.5 border border-[#dce3e7] bg-[#f4f7f6] text-[11px] font-bold uppercase tracking-[0.14em] text-[#0f5d5e] shadow-sm hover:bg-[#eef2f1]";

  return (
    <div
      className="w-full relative"
      style={{ height: "calc(100vh - var(--header-height, 72px))" }}
    >
      {/* Historical Data Banner */}
      {selectedImport && (
        <div
          ref={historicalBannerRef}
          className="absolute top-0 left-0 right-0 z-[1001] bg-amber-500 text-white py-2 px-4 text-center text-sm font-medium"
        >
          <History className="inline-block w-4 h-4 mr-2 -mt-0.5" />
          Viewing data from{" "}
          {new Date(selectedImport.uploaded_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      )}

      {showOverlayStats && (
        <div
          ref={tabletStatsRef}
          className="absolute left-1/2 z-[1001] w-[min(340px,calc(100vw-156px))] -translate-x-1/2 pointer-events-none"
          style={{ top: tabletStatsTop }}
        >
          {tabletStatsHeader}
        </div>
      )}

      {/* Compact-layout Toggle Buttons */}
      {usesCompactPanels && (
        <>
          {!controlsPanelOpen && (
            <button
              type="button"
              aria-label="Open control panel"
              onClick={() => {
                setControlsPanelOpen(true);
                setInfoPanelOpen(false);
              }}
              style={floatingToggleStyle}
              className="fixed z-[1001] w-11 h-11 rounded-lg border border-[#dce3e7] shadow-[0_12px_26px_rgba(15,23,42,0.12)] items-center justify-center transition-all duration-200 active:scale-95 left-3 flex bg-white"
            >
              <SlidersHorizontal className="w-5 h-5 stroke-[#0f5d5e]" />
            </button>
          )}
          {!infoPanelOpen && (
            <button
              type="button"
              aria-label="Open visits by area panel"
              onClick={() => {
                setInfoPanelOpen(true);
                setControlsPanelOpen(false);
              }}
              style={floatingToggleStyle}
              className="fixed z-[1001] w-11 h-11 rounded-lg border border-[#dce3e7] shadow-[0_12px_26px_rgba(15,23,42,0.12)] items-center justify-center transition-all duration-200 active:scale-95 right-3 flex bg-white"
            >
              <BarChart3 className="w-5 h-5 stroke-[#0f5d5e]" />
            </button>
          )}
        </>
      )}

      {/* Mobile Overlay - only visible when a panel is open on mobile */}
      {isMobile && (controlsPanelOpen || infoPanelOpen) && (
        <div
          onClick={handleOverlayClick}
          className="fixed inset-0 bg-[rgba(15,23,42,0.38)] z-[999] transition-opacity duration-300 max-sm:block sm:hidden"
        />
      )}

      {/* Controls Panel - Left Side */}
      <div
        style={tabletPanelStyle}
        className={`controls fixed z-[1002] bg-white border border-[#dce3e7] shadow-[0_20px_45px_rgba(15,23,42,0.16)] backdrop-blur-[6px] transition-transform duration-300 ease-out
          ${isTablet
            ? `${controlsPanelOpen ? "translate-x-0" : "-translate-x-[calc(100%+24px)]"} left-4 w-[280px] rounded-[14px] p-4 overflow-y-auto`
            : isMobile
              ? `${controlsPanelOpen ? "translate-x-0" : "-translate-x-full"} top-0 left-0 w-[280px] max-w-[85vw] h-screen max-h-screen overflow-y-auto rounded-none pt-[72px] px-4 pb-5 max-sm:w-full max-sm:max-w-full`
              : "top-[calc(72px+18px)] left-6 w-[280px] rounded-[14px] p-4 translate-x-0"}`}
      >
        {/* Mobile Close Button */}
        <button
          type="button"
          aria-label="Hide control panel"
          onClick={() => setControlsPanelOpen(false)}
          style={hideButtonStyle}
          className={`${hideButtonClassName} right-2.5 ${
            usesCompactPanels ? "flex" : "hidden"
          }`}
        >
          <ChevronLeft className="w-3.5 h-3.5 stroke-current" />
          <span>Hide</span>
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
                <span className="truncate">{snapshotTriggerLabel}</span>
              </SelectTrigger>
              <SelectContent
                position="popper"
                align="end"
                className="z-[1200] max-h-[320px] min-w-[280px]"
              >
                <SelectGroup>
                  <SelectLabel>Current Snapshot</SelectLabel>
                  <SelectItem value="current">
                    <div className="flex flex-col">
                      <span>Current · {currentImport ? formatSnapshotDate(currentImport.uploaded_at) : "Latest"}</span>
                      {currentImport && (
                        <span className="text-[11px] text-[#627083]">
                          {currentImport.filename} · {currentImport.record_count.toLocaleString()} properties
                        </span>
                      )}
                    </div>
                  </SelectItem>
                </SelectGroup>

                {historicalImportsByYear.length > 0 && <SelectSeparator />}

                {historicalImportsByYear.map(([year, yearImports]) => (
                  <SelectGroup key={year}>
                    <SelectLabel>{year}</SelectLabel>
                    {yearImports.map((imp) => (
                      <SelectItem key={imp.id} value={imp.id}>
                        <div className="flex flex-col">
                          <span>{formatSnapshotDate(imp.uploaded_at)}</span>
                          <span className="text-[11px] text-[#627083]">
                            {imp.filename} · {imp.record_count.toLocaleString()} properties
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
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
            value={effectiveSelectedArea ?? "all"}
            onValueChange={(value) =>
              setSelectedArea(value === "all" ? null : value)
            }
          >
            <SelectTrigger className="w-full text-[12px] border-[#dce3e7] bg-[#eef2f1] rounded-[10px] max-md:py-3 max-md:text-[13px]">
              <span className="truncate">
                {effectiveSelectedArea
                  ? outcodeStats.find((area) => area.outcode === effectiveSelectedArea)?.areaName ??
                    effectiveSelectedArea
                  : "All Areas"}
              </span>
            </SelectTrigger>
            <SelectContent
              position="popper"
              align="start"
              className="z-[1200] max-h-[320px] min-w-[280px]"
            >
              <SelectGroup>
                <SelectLabel>Areas</SelectLabel>
                <SelectItem value="all">All Areas</SelectItem>
                {outcodeStats.map((area) => (
                  <SelectItem key={area.outcode} value={area.outcode}>
                    <div className="flex flex-col">
                      <span>
                        {area.areaName}, {area.outcode}
                      </span>
                      <span className="text-[11px] text-[#627083]">
                        {area.totalVisits.toLocaleString()} visits
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
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
                type="button"
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
        style={isTablet ? tabletPanelStyle : infoPanelStyle}
        className={`info-panel fixed z-[1002] bg-white border border-[#dce3e7] shadow-[0_20px_45px_rgba(15,23,42,0.16)] backdrop-blur-md transition-transform duration-300 ease-out overflow-hidden flex flex-col
          ${isTablet
            ? `${infoPanelOpen ? "translate-x-0" : "translate-x-[calc(100%+24px)]"} right-4 w-[280px] rounded-[14px] p-4`
            : isMobile
              ? `${infoPanelOpen ? "translate-x-0" : "translate-x-full"} top-0 right-0 w-[280px] max-w-[85vw] h-screen max-h-screen rounded-none pt-[72px] px-4 pb-5 max-sm:w-full max-sm:max-w-full`
              : "top-[calc(72px+18px)] right-6 w-[280px] rounded-[14px] p-4 translate-x-0"}`}
      >
        {/* Mobile Close Button */}
        <button
          type="button"
          aria-label="Hide visits by area panel"
          onClick={() => setInfoPanelOpen(false)}
          style={hideButtonStyle}
          className={`${hideButtonClassName} right-2.5 ${
            usesCompactPanels ? "flex" : "hidden"
          }`}
        >
          <span>Hide</span>
          <ChevronRight className="w-3.5 h-3.5 stroke-current" />
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
