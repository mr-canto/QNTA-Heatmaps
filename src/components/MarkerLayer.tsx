import { CircleMarker, Popup } from "react-leaflet";
import { MapPin, Repeat } from "lucide-react";
import type { Property } from "@/types/database.types";

interface MarkerLayerProps {
  properties: Property[];
}

// Design system colours
const TEAL = "#0f5d5e";
const CORAL = "#d16b55";
const TEAL_SOFT = "#d9eceb";
const CORAL_SOFT = "#f7e5df";

// Calculate marker radius based on visit count
function getMarkerRadius(visitCount: number): number {
  // Base radius of 6, scales with visit count
  // Max of 16 for very high visit counts
  return Math.min(6 + Math.log2(visitCount) * 3, 16);
}

export default function MarkerLayer({ properties }: MarkerLayerProps) {
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
              fillOpacity: 0.8,
              color: "#fff",
              weight: 2,
            }}
          >
            <Popup className="property-popup">
              <div
                className={`icon-popup ${isMultiVisit ? "multiple" : "single"}`}
              >
                {/* Banner Header */}
                <div
                  className={`popup-banner ${isMultiVisit ? "multiple" : "single"}`}
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
          </CircleMarker>
        );
      })}
    </>
  );
}
