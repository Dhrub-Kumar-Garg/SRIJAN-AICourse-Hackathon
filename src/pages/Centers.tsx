import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  MapPin,
  Navigation,
  Clock,
  LocateFixed,
  Plus,
  Map as MapIcon,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  ArrowUpRight,
} from "lucide-react";
import { centers } from "../data/centers";
import { catalog } from "../data/catalog";
import { CATEGORY_META, CITY_CENTER } from "../data/constants";
import {
  CENTER_TYPE_META,
  haversineDistance,
  isOpenAt,
  centerLocalHour,
  directionsUrl,
} from "../lib/centers";
import {
  PageHeader,
  Highlight,
  Card,
  Button,
  EmptyState,
} from "../components/ui";
import ActivityModal from "../components/ActivityModal";
import CenterMap from "../components/CenterMap";
import type { Category, Center } from "../data/types";

export default function Centers() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const rawCategory = params.get("category");
  const category =
    rawCategory && Object.hasOwn(CATEGORY_META, rawCategory)
      ? (rawCategory as Category)
      : null;
  const [type, setType] = useState("all");
  const [openOnly, setOpenOnly] = useState(false);
  const [now, setNow] = useState(new Date());
  const [origin, setOrigin] = useState<[number, number]>(CITY_CENTER);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState(
    "Distances from the Bengaluru city center.",
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectionVersion, setSelectionVersion] = useState(0);
  const [mapVisible, setMapVisible] = useState(true);
  const [dropOff, setDropOff] = useState<Center | null>(null);
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const navigationState = location.state as {
    itemId?: string;
    weightKg?: number;
  } | null;
  const initialItem = catalog.find((i) => i.id === navigationState?.itemId);
  const initialWeight =
    typeof navigationState?.weightKg === "number" &&
    Number.isFinite(navigationState.weightKg) &&
    navigationState.weightKg > 0
      ? navigationState.weightKg
      : undefined;
  const hour = centerLocalHour(now);
  const filtered = centers
    .filter(
      (c) =>
        (!category || c.accepts.includes(category)) &&
        (type === "all" || c.type === type) &&
        (!openOnly || isOpenAt(c.openHours, hour)),
    )
    .map((c) => ({ ...c, distance: haversineDistance(origin, [c.lat, c.lng]) }))
    .sort((a, b) => a.distance - b.distance);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    setSelectedId(null);
  }, [category, type, openOnly]);
  const visibleSelected = filtered.some((c) => c.id === selectedId)
    ? selectedId
    : null;
  function selectCenter(id: string, fromMarker = false) {
    setSelectedId(id);
    setSelectionVersion((v) => v + 1);
    if (fromMarker)
      cardRefs.current.get(id)?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "nearest",
      });
  }
  function locate() {
    setSelectedId(null);
    setLocating(true);
    setLocationMessage("Finding your location…");
    const fallback = () => {
      setOrigin([...CITY_CENTER]);
      setLocating(false);
      setLocationMessage(
        "Location could not be accessed. Using the Bengaluru city center.",
      );
    };
    if (!navigator.geolocation) {
      fallback();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setOrigin([p.coords.latitude, p.coords.longitude]);
        setLocating(false);
        setLocationMessage("Distances now use your location.");
      },
      fallback,
      { timeout: 10000, maximumAge: 60000 },
    );
  }
  return (
    <>
      <PageHeader
        eyebrow="A GOOD NEXT STEP, CLOSE BY"
        title={
          <>
            Find a <Highlight>better destination.</Highlight>
          </>
        }
        description="The right place for your item’s next chapter. Find it, drop it off, keep the good going."
        action={
          <Button variant="secondary" disabled={locating} onClick={locate}>
            {locating ? (
              <LoaderCircle size={17} className="spin" />
            ) : (
              <LocateFixed size={17} />
            )}
            {locating ? "Finding you…" : "Use my location"}
          </Button>
        }
      />
      <div className="notice">
        Demo locations only: all 14 centers and addresses are fictional, around
        Bengaluru. Verify real local facilities before travelling.
      </div>
      {category && (
        <div className="category-banner">
          <MapPin size={18} />
          <span>
            Showing centers that accept{" "}
            <strong>{CATEGORY_META[category].label}</strong>
          </span>
        </div>
      )}
      <section className="center-filters" aria-label="Filter centers">
        <div className="filter-chips" aria-label="Accepted categories">
          <button
            className={`filter-chip ${!category ? "active" : ""}`}
            aria-pressed={!category}
            onClick={() => {
              const next = new URLSearchParams(params);
              next.delete("category");
              setParams(next);
            }}
          >
            All materials
          </button>
          {Object.entries(CATEGORY_META).map(([key, m]) => (
            <button
              key={key}
              className={`filter-chip ${category === key ? "active" : ""}`}
              aria-pressed={category === key}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set("category", key);
                setParams(next);
              }}
            >
              <m.icon size={15} />
              {m.label}
            </button>
          ))}
        </div>
        <div className="center-filter-bottom">
          <label>
            Center type
            <select
              aria-label="Center type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="all">All types</option>
              {Object.entries(CENTER_TYPE_META).map(([key, m]) => (
                <option value={key} key={key}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="open-toggle">
            <input
              type="checkbox"
              checked={openOnly}
              onChange={(e) => {
                setNow(new Date());
                setOpenOnly(e.target.checked);
              }}
            />
            <span />
            Open now <small>(IST)</small>
          </label>
          <span className="center-result-count">
            {filtered.length} {filtered.length === 1 ? "center" : "centers"} ·
            nearest first
          </span>
        </div>
      </section>
      <div className="center-location-row">
        <p role="status">{locationMessage}</p>
        <Button
          variant="secondary"
          className="mobile-map-toggle"
          aria-expanded={mapVisible}
          aria-controls="center-map"
          onClick={() => setMapVisible((v) => !v)}
        >
          <MapIcon size={15} />
          {mapVisible ? "Hide map" : "Show map"}
          {mapVisible ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </Button>
      </div>
      <div className="centers-layout centers-workspace">
        <div className="center-list" aria-label="Matching centers">
          {filtered.map((c) => {
            const meta = CENTER_TYPE_META[c.type];
            const open = isOpenAt(c.openHours, hour);
            return (
              <article
                key={c.id}
                ref={(node) => {
                  if (node) cardRefs.current.set(c.id, node);
                  else cardRefs.current.delete(c.id);
                }}
                className={`center-entry ${visibleSelected === c.id ? "is-selected" : ""}`}
                onClick={() => selectCenter(c.id)}
                aria-label={c.name}
              >
                <Card className="center-card">
                  <div className="row between">
                    <span
                      className="center-type-badge"
                      style={{
                        color: meta.color,
                        background: `${meta.color}12`,
                      }}
                    >
                      <meta.icon size={13} />
                      {meta.label}
                    </span>
                    <span className="distance-pill">
                      {c.distance.toFixed(1)} km
                    </span>
                  </div>
                  <button
                    className="center-select"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectCenter(c.id);
                    }}
                    aria-pressed={visibleSelected === c.id}
                    aria-label={`Show ${c.name} on map`}
                  >
                    <h3>{c.name}</h3>
                    <ArrowUpRight size={17} />
                  </button>
                  <p className="row">
                    <MapPin size={14} />
                    {c.address}
                  </p>
                  <p className="row">
                    <Clock size={14} />
                    {c.hours} (IST){" "}
                    <span className={`center-open ${open ? "is-open" : ""}`}>
                      {open ? "Open" : "Closed"}
                    </span>
                  </p>
                  <div className="center-tags" aria-label="Accepted materials">
                    {c.accepts.map((k) => {
                      const Icon = CATEGORY_META[k].icon;
                      return (
                        <span key={k}>
                          <Icon size={13} />
                          {CATEGORY_META[k].label}
                        </span>
                      );
                    })}
                  </div>
                  <div className="center-card-actions">
                    <a
                      href={directionsUrl(c)}
                      className="button button-secondary"
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Directions to ${c.name}`}
                    >
                      <Navigation size={14} />
                      Directions
                    </a>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        selectCenter(c.id);
                        setDropOff(c);
                      }}
                    >
                      <Plus size={14} />
                      Log a drop-off
                    </Button>
                  </div>
                </Card>
              </article>
            );
          })}
          {!filtered.length && (
            <div className="center-empty">
              <EmptyState
                title="Nothing nearby accepts this - try the Reuse Exchange"
                description="Try another category, center type, or opening-hours filter."
              />
              <Link className="button button-secondary" to="/exchange">
                Explore Reuse Exchange <ArrowUpRight size={15} />
              </Link>
            </div>
          )}
        </div>
        <div
          id="center-map"
          className={`map-wrap ${mapVisible ? "" : "mobile-map-hidden"}`}
          role="region"
          aria-label="Center locations map"
        >
          <CenterMap
            centers={filtered}
            selectedId={visibleSelected}
            selectionVersion={selectionVersion}
            onSelect={(id) => selectCenter(id, true)}
            origin={origin}
            visible={mapVisible}
          />
          <div className="map-caption">
            Select a marker to find its center{" "}
            <span>Fictional demo locations</span>
          </div>
        </div>
      </div>
      {dropOff && (
        <ActivityModal
          center={dropOff}
          initialCategory={category ?? undefined}
          initialItem={initialItem}
          initialWeight={initialWeight}
          onClose={() => setDropOff(null)}
        />
      )}
    </>
  );
}
