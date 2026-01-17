import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Southwark centre coordinates
const SOUTHWARK_CENTER: [number, number] = [51.47, -0.065];
const DEFAULT_ZOOM = 13;

export default function HeatmapPage() {
  return (
    <div className="h-[calc(100vh-72px)] w-full relative">
      <MapContainer
        center={SOUTHWARK_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="topleft" />
      </MapContainer>
    </div>
  );
}
