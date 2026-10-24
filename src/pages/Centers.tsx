import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { MapPin, Navigation, Clock, LocateFixed } from "lucide-react";
import { centers } from "../data/centers";
import { CATEGORY_META, CITY_CENTER } from "../data/constants";
import {
  PageHeader,
  Highlight,
  Card,
  Badge,
  Button,
  EmptyState,
} from "../components/ui";
import type { Category } from "../data/types";
function distance(a: [number, number], b: [number, number]) {
  const rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad,
    dLng = (b[1] - a[1]) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
export default function Centers() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") as Category | null;
  const [origin, setOrigin] = useState<[number, number]>(CITY_CENTER);
  const [locationMessage, setLocationMessage] = useState("");
  const filtered = centers
    .filter((c) => !category || c.accepts.includes(category))
    .map((c) => ({ ...c, distance: distance(origin, [c.lat, c.lng]) }))
    .sort((a, b) => a.distance - b.distance);
  return (
    <>
      <PageHeader
        eyebrow="A GOOD NEXT STEP, CLOSE BY"
        title={
          <>
            Find a <Highlight>better destination.</Highlight>
          </>
        }
        description="Places to recycle, repair, compost, and pass things on."
        action={
          <Button
            variant="secondary"
            onClick={() => {
              if (!navigator.geolocation) {
                setLocationMessage(
                  "Location is unavailable. Showing distances from the city center.",
                );
                return;
              }
              navigator.geolocation.getCurrentPosition(
                (p) => {
                  setOrigin([p.coords.latitude, p.coords.longitude]);
                  setLocationMessage("Distances now use your location.");
                },
                () =>
                  setLocationMessage(
                    "Location could not be accessed. Showing distances from the city center.",
                  ),
              );
            }}
          >
            <LocateFixed size={17} />
            Use my location
          </Button>
        }
      />
      <div className="notice">
        Demo locations only: all 14 centers and addresses are fictional, around
        Bengaluru. Verify real local facilities before travelling.
      </div>
      {locationMessage && (
        <p role="status" className="muted">
          {locationMessage}
        </p>
      )}
      <div className="filter-row">
        <label>
          Accepts{" "}
          <select
            value={category || ""}
            onChange={(e) =>
              setParams(e.target.value ? { category: e.target.value } : {})
            }
          >
            <option value="">All materials</option>
            {Object.entries(CATEGORY_META).map(([k, m]) => (
              <option value={k} key={k}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <span className="muted">
          {filtered.length} demo destinations · sorted by distance
        </span>
      </div>
      <div className="centers-layout">
        <div className="center-list">
          {filtered.map((c) => (
            <Card key={c.id} className="center-card">
              <div className="row between">
                <Badge>{c.type.replace("-", " ")}</Badge>
                <small>{c.distance.toFixed(1)} km</small>
              </div>
              <h3>{c.name}</h3>
              <p className="row">
                <MapPin size={15} />
                {c.address}
              </p>
              <p className="row">
                <Clock size={15} />
                {c.hours} (IST)
              </p>
              <div className="center-tags">
                {c.accepts.map((k) => (
                  <span key={k}>{CATEGORY_META[k].label}</span>
                ))}
              </div>
              <a
                className="text-link"
                href={`https://www.openstreetmap.org/?mlat=${c.lat}&mlon=${c.lng}#map=16/${c.lat}/${c.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                View demo map location <Navigation size={14} />
              </a>
            </Card>
          ))}
          {!filtered.length && (
            <EmptyState
              title="No matching demo centers"
              description="Choose a different material to explore more destinations."
            />
          )}
        </div>
        <div className="map-wrap">
          <MapContainer
            center={CITY_CENTER}
            zoom={12}
            scrollWheelZoom={false}
            style={{ height: "100%", minHeight: 520, width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filtered.map((c) => (
              <CircleMarker
                key={c.id}
                center={[c.lat, c.lng]}
                radius={10}
                pathOptions={{
                  color: "#12372A",
                  fillColor: "#C5F467",
                  fillOpacity: 1,
                  weight: 3,
                }}
              >
                <Popup>
                  <strong>{c.name}</strong>
                  <p>Fictional demo center</p>
                  {c.hours}
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>
    </>
  );
}
