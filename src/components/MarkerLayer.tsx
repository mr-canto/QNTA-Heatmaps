import { CircleMarker, Popup, useMap } from "react-leaflet";
import type { Property } from "@/types/database.types";

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
              <div
                className={`icon-popup ${isMultiVisit ? "multiple" : "single"}`}
              >
                {/* Banner Header */}
                <div
                  className={`popup-banner ${isMultiVisit ? "multiple" : "single"}`}
                >
                  <span className="banner-title">Property Details</span>
                  <span className={`badge-header ${isMultiVisit ? "multiple" : "single"}`}>
                    <span className="dot"></span>
                    {isMultiVisit ? "Multiple Visits" : "Single Visit"}
                  </span>
                  <button
                    type="button"
                    className="popup-close"
                    onClick={() => map.closePopup()}
                    aria-label="Close popup"
                  >
                    &times;
                  </button>
                </div>

                {/* Popup Body */}
                <div className="popup-body">
                  {/* Address Section */}
                  <div className="info-section">
                    <div
                      className="info-icon location"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
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
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M18 20V10" />
                        <path d="M12 20V4" />
                        <path d="M6 20v-6" />
                      </svg>
                    </div>
                    <div className="info-content">
                      <div className="info-label">Total Visits</div>
                      <div className="info-value highlight">
                        {property.visit_count}
                      </div>
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
