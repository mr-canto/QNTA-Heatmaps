import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface MapControllerProps {
  center?: [number, number] | null;
  zoom?: number;
}

// Southwark centre coordinates
const SOUTHWARK_CENTER: [number, number] = [51.47, -0.065];
const DEFAULT_ZOOM = 13;
const AREA_ZOOM = 15;

export default function MapController({ center, zoom }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom ?? AREA_ZOOM, {
        duration: 0.8,
      });
    } else {
      // Reset to default view when no specific area is selected
      map.flyTo(SOUTHWARK_CENTER, DEFAULT_ZOOM, {
        duration: 0.8,
      });
    }
  }, [map, center, zoom]);

  return null;
}
