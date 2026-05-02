import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapPoint {
  id: number;
  name: string;
  city?: string;
  category?: string;
  latitude: string | null;
  longitude: string | null;
  href?: string;
  image?: string | null;
  averageRating?: number;
  reviewCount?: number;
}

const wineIcon = L.divIcon({
  className: "marker-wine",
  html: `<svg viewBox="0 0 32 40" width="32" height="40" xmlns="http://www.w3.org/2000/svg"><path d="M16 0C7.2 0 0 7.2 0 16c0 11 16 24 16 24s16-13 16-24C32 7.2 24.8 0 16 0z" fill="#68191e"/><circle cx="16" cy="15" r="6" fill="#fff4e4"/><circle cx="16" cy="15" r="3" fill="#c9a96e"/></svg>`,
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -36],
});

function FitBounds({ points }: { points: Array<[number, number]> }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) {
      // Default view: Belgium
      map.setView([50.5, 4.7], 8);
      return;
    }
    if (points.length === 1) {
      map.setView(points[0], 11);
      return;
    }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
  }, [map, points]);
  return null;
}

export default function MarketplaceMap({ points, height = 560 }: { points: MapPoint[]; height?: number }) {
  const valid = points
    .map((p) => {
      const lat = p.latitude ? Number(p.latitude) : NaN;
      const lng = p.longitude ? Number(p.longitude) : NaN;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { ...p, lat, lng };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return (
    <div className="border border-wine-deep/10 bg-cream relative" style={{ height }}>
      <MapContainer
        center={[50.5, 4.7]}
        zoom={8}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <FitBounds points={valid.map((p) => [p.lat, p.lng] as [number, number])} />
        {valid.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={wineIcon}>
            <Popup>
              <div style={{ minWidth: 200, fontFamily: "system-ui" }}>
                {p.image && (
                  <img src={p.image} alt={p.name} style={{ width: "100%", height: 90, objectFit: "cover", marginBottom: 8 }} />
                )}
                <div style={{ fontWeight: 700, fontSize: 14, color: "#68191e", marginBottom: 2 }}>{p.name}</div>
                {p.category && (
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "#c9a96e", marginBottom: 4 }}>
                    {p.category}
                  </div>
                )}
                {p.city && <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>{p.city}</div>}
                {typeof p.averageRating === "number" && p.averageRating > 0 && (
                  <div style={{ fontSize: 12, color: "#c9a96e", marginBottom: 4 }}>
                    ★ {p.averageRating.toFixed(1)} ({p.reviewCount ?? 0} avis)
                  </div>
                )}
                {p.href && (
                  <a href={p.href} style={{ display: "inline-block", marginTop: 4, padding: "6px 12px", background: "#68191e", color: "#fff4e4", textDecoration: "none", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em" }}>
                    Voir la fiche
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {valid.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-cream/95 px-6 py-4 border border-wine-deep/20 text-center max-w-sm">
            <p className="text-sm text-wine-deep/70">Aucun prestataire géolocalisé pour ces filtres. Essayez de réinitialiser ou d'élargir votre recherche.</p>
          </div>
        </div>
      )}
    </div>
  );
}
