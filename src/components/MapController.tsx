import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// Extend Leaflet Popup type to include internal _adjustPan method
interface PopupWithAdjustPan extends L.Popup {
  _adjustPan?: () => void;
}

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
      const rootStyles = getComputedStyle(document.documentElement);
      const topOverlayHeight = parseInt(
        rootStyles.getPropertyValue("--map-top-overlay-height"),
        10
      ) || 0;
      const basePadding = 20;

      if (window.innerWidth <= 767) {
        return {
          topLeft: L.point(basePadding, headerHeight + topOverlayHeight + basePadding),
          bottomRight: L.point(basePadding, basePadding),
        };
      }

      const controlsPanel = document.querySelector(".controls");
      const infoPanel = document.querySelector(".info-panel");
      const controlsRect = controlsPanel?.getBoundingClientRect();
      const infoRect = infoPanel?.getBoundingClientRect();
      const controlsVisible =
        !!controlsRect && controlsRect.right > 0 && controlsRect.left < window.innerWidth;
      const infoVisible =
        !!infoRect && infoRect.left < window.innerWidth && infoRect.right > 0;
      const leftPadding = controlsVisible
        ? Math.max(basePadding, (controlsRect?.right ?? 0) + basePadding)
        : basePadding;
      const rightPadding = infoVisible
        ? Math.max(basePadding, window.innerWidth - (infoRect?.left ?? window.innerWidth) + basePadding)
        : basePadding;

      return {
        topLeft: L.point(leftPadding, headerHeight + topOverlayHeight + basePadding),
        bottomRight: L.point(rightPadding, basePadding),
      };
    };

    const handlePopupOpen = (e: L.PopupEvent) => {
      const padding = getPopupPadding();
      const popup = e.popup as PopupWithAdjustPan;
      popup.options.autoPan = true;
      popup.options.keepInView = true;
      popup.options.autoPanPaddingTopLeft = padding.topLeft;
      popup.options.autoPanPaddingBottomRight = padding.bottomRight;
      if (typeof popup._adjustPan === "function") {
        popup._adjustPan();
      }
    };

    const handleResize = () => {
      const popup = (map as L.Map & { _popup?: PopupWithAdjustPan })._popup;
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
