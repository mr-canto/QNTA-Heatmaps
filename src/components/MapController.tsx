import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

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

  useEffect(() => {
    const getPopupPadding = () => {
      const header = document.querySelector("header");
      const headerHeight = header ? header.getBoundingClientRect().height : 0;
      const basePadding = 20;

      if (window.innerWidth <= 767) {
        return {
          topLeft: L.point(basePadding, headerHeight + basePadding),
          bottomRight: L.point(basePadding, basePadding),
        };
      }

      const controlsPanel = document.querySelector(".controls");
      const infoPanel = document.querySelector(".info-panel");
      const controlsStyles = controlsPanel ? getComputedStyle(controlsPanel) : null;
      const infoStyles = infoPanel ? getComputedStyle(infoPanel) : null;
      const controlsLeft = controlsStyles ? parseInt(controlsStyles.left, 10) : 0;
      const infoRight = infoStyles ? parseInt(infoStyles.right, 10) : 0;
      const controlsWidth = controlsPanel ? controlsPanel.clientWidth : 0;
      const infoWidth = infoPanel ? infoPanel.clientWidth : 0;
      const safeControlsLeft = Number.isNaN(controlsLeft) ? 0 : controlsLeft;
      const safeInfoRight = Number.isNaN(infoRight) ? 0 : infoRight;
      const leftPadding = Math.max(basePadding, safeControlsLeft + controlsWidth + basePadding);
      const rightPadding = Math.max(basePadding, safeInfoRight + infoWidth + basePadding);

      return {
        topLeft: L.point(leftPadding, headerHeight + basePadding),
        bottomRight: L.point(rightPadding, basePadding),
      };
    };

    const handlePopupOpen = (e: L.PopupEvent) => {
      const padding = getPopupPadding();
      e.popup.options.autoPan = true;
      e.popup.options.keepInView = true;
      e.popup.options.autoPanPaddingTopLeft = padding.topLeft;
      e.popup.options.autoPanPaddingBottomRight = padding.bottomRight;
      if (typeof e.popup._adjustPan === "function") {
        e.popup._adjustPan();
      }
    };

    const handleResize = () => {
      const popup = (map as L.Map & { _popup?: L.Popup })._popup;
      if (!popup) return;
      const padding = getPopupPadding();
      popup.options.autoPanPaddingTopLeft = padding.topLeft;
      popup.options.autoPanPaddingBottomRight = padding.bottomRight;
      if (typeof popup._adjustPan === "function") {
        popup._adjustPan();
      }
    };

    map.on("popupopen", handlePopupOpen);
    window.addEventListener("resize", handleResize);

    return () => {
      map.off("popupopen", handlePopupOpen);
      window.removeEventListener("resize", handleResize);
    };
  }, [map]);

  return null;
}
