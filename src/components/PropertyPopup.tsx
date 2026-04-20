import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import type { Property } from "@/types/database.types";
import { usePropertyWorkOrders } from "@/hooks/usePropertyWorkOrders";

interface PropertyPopupProps {
  property: Property;
  onClose: () => void;
}

const INITIAL_HISTORY_COUNT = 3;

interface PopupWithAdjustPan extends L.Popup {
  _adjustPan?: () => void;
}

function formatDisplayDate(value: string | null): string | null {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function PropertyPopup({ property, onClose }: PropertyPopupProps) {
  const isMultiVisit = property.visit_count > 1;
  const [expandedPropertyId, setExpandedPropertyId] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const map = useMap();
  const { data: workOrders = [], isLoading } = usePropertyWorkOrders(property.id);
  const showAllHistory = expandedPropertyId === property.id;

  const latestWorkOrderRef = useMemo(
    () => workOrders.find((workOrder) => workOrder.work_order_ref)?.work_order_ref ?? null,
    [workOrders]
  );

  const totalEstimatedCost = useMemo(() => {
    const total = workOrders.reduce((sum, workOrder) => sum + (workOrder.estimated_cost ?? 0), 0);
    return total > 0 ? total : null;
  }, [workOrders]);

  const historyItems = showAllHistory ? workOrders : workOrders.slice(0, INITIAL_HISTORY_COUNT);
  const hasMoreHistory = workOrders.length > INITIAL_HISTORY_COUNT;

  useEffect(() => {
    const popupElement = popupRef.current;
    if (!popupElement) return;

    const syncPopupPosition = () => {
      const popup = (map as L.Map & { _popup?: PopupWithAdjustPan })._popup;
      if (!popup) return;

      popup.update();
      if (typeof popup._adjustPan === "function") {
        popup._adjustPan();
      }
    };

    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(syncPopupPosition);
    });

    observer.observe(popupElement);
    syncPopupPosition();

    return () => observer.disconnect();
  }, [map, property.id]);

  return (
    <div ref={popupRef} className={`icon-popup ${isMultiVisit ? "multiple" : "single"}`}>
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

      <div className="popup-body popup-body-detailed">
        <section className="popup-address-block">
          <div className="info-label">Address</div>
          <div className="popup-address-value">{property.address}</div>
          <div className="popup-address-meta">
            {[property.outcode, property.postcode].filter(Boolean).join(" / ")}
          </div>
        </section>

        <section className="popup-summary-grid" aria-label="Property summary">
          <div className="popup-summary-card">
            <span className="info-label">Total visits</span>
            <span className="popup-summary-value highlight">{property.visit_count}</span>
          </div>

          {latestWorkOrderRef && (
            <div className="popup-summary-card">
              <span className="info-label">Latest work order</span>
              <span className="popup-summary-value">{latestWorkOrderRef}</span>
            </div>
          )}

          {totalEstimatedCost !== null && (
            <div className="popup-summary-card">
              <span className="info-label">Est. total cost</span>
              <span className="popup-summary-value">{formatCurrency(totalEstimatedCost)}</span>
            </div>
          )}
        </section>

        <section className="popup-history-section">
          <div className="popup-history-header">
            <div className="info-label">Work Order History</div>
          </div>

          {isLoading ? (
            <div className="popup-empty-state">Loading work order history...</div>
          ) : historyItems.length === 0 ? (
            <div className="popup-empty-state">No work order history available for this property yet.</div>
          ) : (
            <>
              <div className="popup-history-list">
                {historyItems.map((workOrder) => {
                  const displayDate = formatDisplayDate(workOrder.normalized_date);

                  return (
                    <article
                      key={workOrder.id}
                      className="popup-history-card"
                      aria-label="Work order history item"
                    >
                      <div className="popup-history-meta">
                        {displayDate ? (
                          <span className="popup-history-date">{displayDate}</span>
                        ) : (
                          <span className="popup-history-date muted">Date unavailable</span>
                        )}

                        <span className="popup-history-ref">
                          {workOrder.work_order_ref ?? "Reference unavailable"}
                        </span>
                      </div>

                      <p className="popup-history-description">
                        {workOrder.description ?? "No description recorded"}
                      </p>

                      {workOrder.estimated_cost !== null && (
                        <div className="popup-history-cost">
                          Est. cost {formatCurrency(workOrder.estimated_cost)}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>

              {hasMoreHistory && (
                <button
                  type="button"
                  className="popup-history-toggle"
                  onClick={() =>
                    setExpandedPropertyId((current) => (current === property.id ? null : property.id))
                  }
                >
                  {showAllHistory ? "Show fewer entries" : "Show older history"}
                </button>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
