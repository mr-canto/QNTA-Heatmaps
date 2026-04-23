import { CircleMarker, Popup, useMap } from "react-leaflet";
import type { Property } from "@/types/database.types";
import PropertyPopup from "./PropertyPopup";

interface MarkerLayerProps {
  properties: Property[];
}

// Design system colours
const TEAL = "#0f5d5e";
const CORAL = "#d16b55";

// Calculate marker radius based on visit count (HTML)
function getMarkerRadius(visitCount: number): number {
  return Math.min(5 + visitCount * 2, 20);
}

export default function MarkerLayer({ properties }: MarkerLayerProps) {
  const map = useMap();

  return (
    <>
      {properties.map((property) => {
        const isMultiVisit = property.visit_count > 1;
        const color = isMultiVisit ? CORAL : TEAL;
        const radius = getMarkerRadius(property.visit_count);

        return (
          <CircleMarker
            key={property.id}
            center={[property.lat, property.lon]}
            radius={radius}
            pathOptions={{
              fillColor: color,
              fillOpacity: 0.82,
              color: "#f8fafb",
              weight: 1,
            }}
          >
            <Popup className="property-popup">
              <PropertyPopup property={property} onClose={() => map.closePopup()} />
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}
