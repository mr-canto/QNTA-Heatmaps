import { useMemo } from "react";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { Property } from "@/types/database.types";
import PropertyPopup from "./PropertyPopup";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

interface ClusterLayerProps {
  properties: Property[];
}

// Design system colours
const TEAL = "#0f5d5e";
const CORAL = "#d16b55";

/**
 * Icon cache to prevent creating new L.DivIcon instances on every render.
 * Keys are generated based on visit_count to ensure icons with the same
 * visual appearance are reused.
 */
const propertyIconCache = new Map<string, L.DivIcon>();

/**
 * Get or create a cached property marker icon.
 * Icons are cached by visit count since that determines the visual appearance.
 */
function getPropertyIcon(property: Property): L.DivIcon {
  const isMultiVisit = property.visit_count > 1;
  const color = isMultiVisit ? CORAL : TEAL;
  const size = Math.min(12 + Math.log2(property.visit_count) * 4, 24);

  // Create a cache key based on the visual properties
  const cacheKey = `${property.visit_count}`;

  // Return cached icon if available
  const cached = propertyIconCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Create new icon and cache it
  const icon = L.divIcon({
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    className: "property-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

  propertyIconCache.set(cacheKey, icon);
  return icon;
}

/**
 * Cache for cluster icons.
 * Keys are the cluster count since that determines the visual appearance.
 */
const clusterIconCache = new Map<number, L.DivIcon>();

/**
 * Get or create a cached cluster icon.
 * Icons are cached by count since that determines the visual appearance.
 */
function createClusterCustomIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount();

  // Return cached icon if available
  const cached = clusterIconCache.get(count);
  if (cached) {
    return cached;
  }

  let size = 40;
  let bgColor = "#2f7ab8"; // Small cluster - blue

  if (count >= 100) {
    size = 50;
    bgColor = "rgba(209, 107, 85, 0.92)"; // Large cluster - coral
  } else if (count >= 10) {
    size = 45;
    bgColor = "rgba(15, 93, 94, 0.9)"; // Medium cluster - teal
  }

  const icon = L.divIcon({
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${bgColor};
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.85);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: ${count >= 1000 ? "11px" : count >= 100 ? "12px" : "13px"};
      font-family: 'Manrope', sans-serif;
      box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
    ">${count}</div>`,
    className: "marker-cluster-custom",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

  clusterIconCache.set(count, icon);
  return icon;
}

export default function ClusterLayer({ properties }: ClusterLayerProps) {
  const map = useMap();

  // Memoize the markers to prevent unnecessary re-renders
  const markers = useMemo(() => {
    return properties.map((property) => (
      <Marker
        key={property.id}
        position={[property.lat, property.lon]}
        icon={getPropertyIcon(property)}
      >
        <Popup className="property-popup">
          <PropertyPopup property={property} onClose={() => map.closePopup()} />
        </Popup>
      </Marker>
    ));
  }, [properties, map]);

  return (
    <MarkerClusterGroup
      chunkedLoading
      iconCreateFunction={createClusterCustomIcon}
      maxClusterRadius={80}
      spiderfyOnMaxZoom
      showCoverageOnHover={false}
      zoomToBoundsOnClick
    >
      {markers}
    </MarkerClusterGroup>
  );
}
