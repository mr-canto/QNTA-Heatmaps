import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import type { Property } from "@/types/database.types";

interface HeatmapLayerProps {
  properties: Property[];
}

// Extend Leaflet with heat function
declare module "leaflet" {
  function heatLayer(
    latlngs: Array<[number, number, number]>,
    options?: {
      minOpacity?: number;
      maxZoom?: number;
      max?: number;
      radius?: number;
      blur?: number;
      gradient?: Record<number, string>;
    }
  ): L.Layer;
}

export default function HeatmapLayer({ properties }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!properties.length) return;

    // Convert properties to heatmap data points
    // Format: [lat, lng, intensity]
    const heatData: Array<[number, number, number]> = properties.map((p) => [
      p.lat,
      p.lon,
      p.visit_count,
    ]);

    // Custom gradient using the HTML heatmap scale
    const gradient: Record<number, string> = {
      0.2: "#2f7ab8",
      0.4: "#3aa6b9",
      0.6: "#f1d77a",
      0.8: "#f2a65a",
      1.0: "#d45a4b",
    };

    // Create the heat layer
    const heatLayer = L.heatLayer(heatData, {
      radius: 18,
      blur: 22,
      maxZoom: 16,
      gradient,
    });

    // Add to map
    heatLayer.addTo(map);

    // Cleanup on unmount or when properties change
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, properties]);

  return null;
}
