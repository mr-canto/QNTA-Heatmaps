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

    // Custom gradient using the 5-colour scale from design specs
    // #2f7ab8 (blue), #3aa6b9 (teal), #f1d77a (yellow), #f2a65a (orange), #d45a4b (red)
    const gradient: Record<number, string> = {
      0.0: "#2f7ab8",
      0.25: "#3aa6b9",
      0.5: "#f1d77a",
      0.75: "#f2a65a",
      1.0: "#d45a4b",
    };

    // Create the heat layer
    const heatLayer = L.heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      max: 10, // Max intensity value
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
