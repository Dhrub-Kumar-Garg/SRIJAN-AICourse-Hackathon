import { useEffect, useRef, useMemo, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIconRetina from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { CITY_CENTER } from "../data/constants";
import { CENTER_TYPE_META, directionsUrl } from "../lib/centers";
import type { Center } from "../data/types";
import { centerDetails } from "../data/centers";

// Asset URLs are bundled by Vite, including when served from a hashed production build.
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
});
function MapFocus({
  selected,
  origin,
  visible,
  selectionVersion,
}: {
  selectionVersion: number;
  selected?: Center;
  origin: [number, number];
  visible: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (selected)
      map.flyTo([selected.lat, selected.lng], 14, { duration: 0.45 });
  }, [map, selected?.id, selectionVersion]);
  useEffect(() => {
    map.setView(origin, 11);
  }, [map, origin]);
  useEffect(() => {
    if (visible) requestAnimationFrame(() => map.invalidateSize());
  }, [map, visible]);
  return null;
}
function CenterMarker({
  center,
  selected,
  onSelect,
  selectionVersion,
}: {
  selectionVersion: number;
  center: Center;
  selected: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<L.Marker>(null);
  const meta = CENTER_TYPE_META[center.type];
  const icon = useMemo(
    () =>
      L.divIcon({
        className: `center-pin ${selected ? "center-pin-selected" : ""}`,
        html: renderToStaticMarkup(
          <span style={{ background: meta.color }}>
            <meta.icon size={19} strokeWidth={2} />
          </span>,
        ),
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -23],
      }),
    [meta, selected],
  );
  useEffect(() => {
    if (selected) ref.current?.openPopup();
    else ref.current?.closePopup();
  }, [selected, selectionVersion]);
  return (
    <Marker
      ref={ref}
      position={[center.lat, center.lng]}
      icon={icon}
      title={center.name}
      alt={`${meta.label} center: ${center.name}`}
      zIndexOffset={selected ? 1000 : 0}
      eventHandlers={{
        click: onSelect,
        // Leaflet opens a popup directly on Enter; it does not emit a click.
        popupopen: () => {
          if (!selected) onSelect();
        },
      }}
    >
      <Popup>
        <strong>{center.name}</strong>
        <p>
          {meta.label} · {center.hours}
        </p>
        <p>
          {centerDetails[center.id]?.evidence} · confirm acceptance before
          visiting.
        </p>
        <p>{centerDetails[center.id]?.coordinateNote}</p>
        <p>
          <a
            href={centerDetails[center.id]?.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            View location source
          </a>
        </p>
        <a href={directionsUrl(center)} target="_blank" rel="noreferrer">
          Directions on Google Maps
        </a>
      </Popup>
    </Marker>
  );
}
export default function CenterMap({
  centers,
  selectedId,
  onSelect,
  origin,
  visible,
  selectionVersion,
}: {
  selectionVersion: number;
  centers: Center[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  origin: [number, number];
  visible: boolean;
}) {
  const selected = centers.find((c) => c.id === selectedId);
  const [tileError, setTileError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  return (
    <>
      <MapContainer
        center={CITY_CENTER}
        zoom={11}
        scrollWheelZoom={false}
        className="center-leaflet-map"
      >
        <MapFocus
          selected={selected}
          origin={origin}
          visible={visible}
          selectionVersion={selectionVersion}
        />
        <TileLayer
          key={attempt}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            loading: () => setLoading(true),
            load: () => setLoading(false),
            tileerror: () => {
              setTileError(true);
              setLoading(false);
            },
          }}
        />
        {centers.map((c) => (
          <CenterMarker
            key={c.id}
            center={c}
            selected={selectedId === c.id}
            selectionVersion={selectionVersion}
            onSelect={() => onSelect(c.id)}
          />
        ))}
      </MapContainer>
      {(tileError || loading) && (
        <div className="map-network-status" role="status">
          {tileError ? (
            <>
              Map tiles could not load. The center list and directions still
              work.{" "}
              <button
                type="button"
                onClick={() => {
                  setTileError(false);
                  setLoading(true);
                  setAttempt((value) => value + 1);
                }}
              >
                Retry map
              </button>
            </>
          ) : (
            "Loading map…"
          )}
        </div>
      )}
    </>
  );
}
