import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import type { ActivitySample } from "./activity-types";

type Props = {
  samples: ActivitySample[];
  activeIndex: number | null;
};

export function ActivityMap({ samples, activeIndex }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.CircleMarker | null>(null);
  const gps = useMemo(
    () => samples.flatMap((sample, index) =>
      sample.latitudeDegrees === null || sample.longitudeDegrees === null
        ? []
        : [{ index, lat: sample.latitudeDegrees, lng: sample.longitudeDegrees }],
    ),
    [samples],
  );

  useEffect(() => {
    if (!container.current || map.current || gps.length < 2) return;
    const instance = L.map(container.current, { scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(instance);
    const coordinates = gps.map((point) => L.latLng(point.lat, point.lng));
    L.polyline(coordinates, { color: "#f05a36", weight: 4, opacity: 0.9 }).addTo(instance);
    L.circleMarker(coordinates[0]!, { radius: 6, color: "#111111", fillOpacity: 1 })
      .bindTooltip("Départ")
      .addTo(instance);
    L.circleMarker(coordinates.at(-1)!, { radius: 6, color: "#f05a36", fillOpacity: 1 })
      .bindTooltip("Arrivée")
      .addTo(instance);
    marker.current = L.circleMarker(coordinates[0]!, {
      radius: 7,
      color: "#ffffff",
      weight: 2,
      fillColor: "#111111",
      fillOpacity: 1,
    }).addTo(instance);
    instance.fitBounds(L.latLngBounds(coordinates), { padding: [24, 24] });
    map.current = instance;
    return () => {
      instance.remove();
      map.current = null;
      marker.current = null;
    };
  }, [gps]);

  useEffect(() => {
    if (activeIndex === null || !marker.current) return;
    const point = gps.reduce((closest, candidate) =>
      Math.abs(candidate.index - activeIndex) < Math.abs(closest.index - activeIndex)
        ? candidate
        : closest,
    gps[0]!);
    marker.current.setLatLng([point.lat, point.lng]);
  }, [activeIndex, gps]);

  if (gps.length < 2) {
    return <div className="map-empty">Aucune trace GPS disponible pour cette activité.</div>;
  }
  return <div ref={container} className="activity-map" aria-label="Carte interactive du parcours" />;
}
