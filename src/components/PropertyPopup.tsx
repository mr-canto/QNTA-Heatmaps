import type { Property } from "@/types/database.types";

interface PropertyPopupProps {
  property: Property;
  onClose: () => void;
}

/**
 * Shared popup component for displaying property details on the map.
 * Used by both MarkerLayer and ClusterLayer components to maintain
 * consistent popup appearance and behavior.
 */
export default function PropertyPopup({ property, onClose }: PropertyPopupProps) {
  const isMultiVisit = property.visit_count > 1;

  return (
    <div className={`icon-popup ${isMultiVisit ? "multiple" : "single"}`}>
      {/* Banner Header */}
      <div className={`popup-banner ${isMultiVisit ? "multiple" : "single"}`}>
        <span className="banner-title">Property Details</span>
        <span className={`badge-header ${isMultiVisit ? "multiple" : "single"}`}>
          <span className="dot"></span>
          {isMultiVisit ? "Multiple Visits" : "Single Visit"}
        </span>
        <button
          type="button"
          className="popup-close"
          onClick={onClose}
          aria-label="Close popup"
        >
          &times;
        </button>
      </div>

      {/* Popup Body */}
      <div className="popup-body">
        {/* Address Section */}
        <div className="info-section">
          <div className="info-icon location">
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
          <div className="info-icon visits">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 20V10" />
              <path d="M12 20V4" />
              <path d="M6 20v-6" />
            </svg>
          </div>
          <div className="info-content">
            <div className="info-label">Total Visits</div>
            <div className="info-value highlight">{property.visit_count}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
