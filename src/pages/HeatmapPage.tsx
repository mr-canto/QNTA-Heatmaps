import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useProperties, type PropertyFilters } from "@/hooks/useProperties";
import HeatmapLayer from "@/components/HeatmapLayer";
import { useState } from "react";

// Southwark centre coordinates
const SOUTHWARK_CENTER: [number, number] = [51.47, -0.065];
const DEFAULT_ZOOM = 13;

export default function HeatmapPage() {
  // State for filters (will be expanded in future stories)
  const [filters] = useState<PropertyFilters>({});

  // Fetch properties based on filters
  const { data: properties = [], isLoading } = useProperties(filters);

  return (
    <div className="h-[calc(100vh-72px)] w-full relative">
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
        {properties.length > 0 && <HeatmapLayer properties={properties} />}
      </MapContainer>
    </div>
  );
}
