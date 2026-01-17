import MarkerClusterGroup from "react-leaflet-cluster";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { MapPin, Repeat } from "lucide-react";
import type { Property } from "@/types/database.types";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

interface ClusterLayerProps {
  properties: Property[];
}

// Design system colours
const TEAL = "#0f5d5e";
const CORAL = "#d16b55";
const TEAL_SOFT = "#d9eceb";
const CORAL_SOFT = "#f7e5df";

// Create a custom divIcon for property markers
function createPropertyIcon(property: Property): L.DivIcon {
  const isMultiVisit = property.visit_count > 1;
  const color = isMultiVisit ? CORAL : TEAL;
  const size = Math.min(12 + Math.log2(property.visit_count) * 4, 24);

  return L.divIcon({
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
}

// Custom cluster icon function
function createClusterCustomIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount();
  let size = 40;
  let bgColor = "#2f7ab8"; // Small cluster - blue

  if (count >= 100) {
    size = 50;
    bgColor = "rgba(209, 107, 85, 0.92)"; // Large cluster - coral
  } else if (count >= 10) {
    size = 45;
    bgColor = "rgba(15, 93, 94, 0.9)"; // Medium cluster - teal
  }

  return L.divIcon({
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
}

export default function ClusterLayer({ properties }: ClusterLayerProps) {
  return (
    <MarkerClusterGroup
      chunkedLoading
      iconCreateFunction={createClusterCustomIcon}
      maxClusterRadius={80}
      spiderfyOnMaxZoom
      showCoverageOnHover={false}
      zoomToBoundsOnClick
    >
      {properties.map((property) => {
        const isMultiVisit = property.visit_count > 1;
        const color = isMultiVisit ? CORAL : TEAL;

        return (
          <Marker
            key={property.id}
            position={[property.lat, property.lon]}
            icon={createPropertyIcon(property)}
          >
            <Popup className="property-popup">
              <div
                className={`icon-popup ${isMultiVisit ? "multiple" : "single"}`}
              >
                {/* Banner Header */}
                <div
                  className="popup-banner"
                  style={{ backgroundColor: color }}
                >
                  <span className="banner-title">
                    {isMultiVisit ? "Recurring Issue" : "Single Visit"}
                  </span>
                  <div className="badge-header">
                    <span
                      className="dot"
                      style={{ backgroundColor: "#fff" }}
                    ></span>
                    {isMultiVisit ? "Multi-Visit" : "Single Visit"}
                  </div>
                </div>

                {/* Popup Body */}
                <div className="popup-body">
                  {/* Address Section */}
                  <div className="info-section">
                    <div
                      className="info-icon location"
                      style={{
                        backgroundColor: isMultiVisit ? CORAL_SOFT : TEAL_SOFT,
                      }}
                    >
                      <MapPin
                        size={16}
                        strokeWidth={2}
                        style={{ stroke: color }}
                      />
                    </div>
                    <div className="info-content">
                      <div className="info-label">Address</div>
                      <div className="info-value">{property.address}</div>
                    </div>
                  </div>

                  {/* Visit Count Section */}
                  <div className="info-section">
                    <div
                      className="info-icon visits"
                      style={{
                        backgroundColor: isMultiVisit ? CORAL_SOFT : TEAL_SOFT,
                      }}
                    >
                      <Repeat
                        size={16}
                        strokeWidth={2}
                        style={{ stroke: color }}
                      />
                    </div>
                    <div className="info-content">
                      <div className="info-label">Total Visits</div>
                      <div className="info-value highlight" style={{ color }}>
                        {property.visit_count}
                      </div>
                    </div>
                  </div>

                  {/* Status Footer */}
                  <div className="status-footer">
                    <div
                      className={`badge ${isMultiVisit ? "multiple" : "single"}`}
                    >
                      <span
                        className="dot"
                        style={{ backgroundColor: color }}
                      ></span>
                      {isMultiVisit
                        ? `${property.visit_count} recorded visits`
                        : "Single recorded visit"}
                    </div>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MarkerClusterGroup>
  );
}
