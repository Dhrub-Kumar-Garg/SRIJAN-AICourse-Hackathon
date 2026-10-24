import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  MapPin,
  ArrowRight,
  ArrowUpRight,
  X,
  Package,
  Search,
  Check,
} from "lucide-react";
import { useModal } from "../lib/useModal";
import { useStore } from "../store/useStore";
import { CATEGORY_META } from "../data/constants";
import type { Category, Listing } from "../data/types";
import {
  PageHeader,
  Highlight,
  Button,
  Card,
  Badge,
  EmptyState,
  StatusPill,
  useToast,
} from "../components/ui";

const conditions = {
  good: "Good",
  fair: "Fair",
  "needs-repair": "Needs repair",
};
const privacyText =
  "Coordinate handover through the platform; never share personal contact details here.";
const isCategory = (value: string | null): value is Category =>
  !!value && Object.hasOwn(CATEGORY_META, value);
function timeAgo(date: string, now: number) {
  const minutes = Math.max(
    0,
    Math.floor((now - new Date(date).getTime()) / 60000),
  );
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

export default function Exchange() {
  const [params, setParams] = useSearchParams();
  const [show, setShow] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("textile");
  const [condition, setCondition] = useState<Listing["condition"]>("good");
  const [qty, setQty] = useState("1");
  const [area, setArea] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestName, setRequestName] = useState("");
  const [requestError, setRequestError] = useState("");
  const [now, setNow] = useState(Date.now());
  const { listings, addListing, requestListing, markHandedOver } = useStore();
  const toast = useToast();
  const resetForm = () => {
    setTitle("");
    setCategory("textile");
    setCondition("good");
    setQty("1");
    setArea("");
    setNote("");
    setError("");
  };
  const closeListing = () => {
    setShow(false);
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        ["new", "title", "category"].forEach((key) => next.delete(key));
        return next;
      },
      { replace: true },
    );
  };
  useEffect(() => {
    if (params.get("new") !== "1") return;
    setTitle((params.get("title") ?? "").slice(0, 100));
    const prefill = params.get("category");
    setCategory(isCategory(prefill) ? prefill : "textile");
    setError("");
    setShow(true);
  }, [params]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  useModal(show, closeListing);
  useModal(Boolean(requestId), () => setRequestId(null));
  const query = search.trim().toLowerCase();
  const visible = listings.filter(
    (l) =>
      (categoryFilter === "all" || l.category === categoryFilter) &&
      (conditionFilter === "all" || l.condition === conditionFilter) &&
      (!availableOnly || l.status === "available") &&
      `${l.title} ${l.area} ${l.note ?? ""} ${CATEGORY_META[l.category].label}`
        .toLowerCase()
        .includes(query),
  );
  const stages = [
    { status: "available", label: "Listed", detail: "ready for a new home" },
    { status: "requested", label: "Requested", detail: "awaiting handover" },
    {
      status: "handed_over",
      label: "Handed over",
      detail: "a second life begins",
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="REUSE EXCHANGE · GOOD THINGS DESERVE ANOTHER GO"
        title={
          <>
            Less waste. <Highlight>More possibility.</Highlight>
          </>
        }
        description="A neighbourhood board for passing usable items to new owners before they become waste."
        action={
          <Button
            onClick={() => {
              resetForm();
              setShow(true);
            }}
          >
            <Plus size={18} />
            List an item
          </Button>
        }
      />
      <div className="exchange-banner">
        <Package size={28} />
        <p>
          <strong>A neighbourhood of second chances.</strong>
          <br />
          All names and listings are synthetic. Requests and handovers stay in
          this browser.
        </p>
        <Badge>Demo community</Badge>
      </div>
      <section className="exchange-journey" aria-labelledby="journey-title">
        <h2 id="journey-title">
          Journey <small>Live counts at each stage</small>
        </h2>
        <ol>
          {stages.map((stage, i) => (
            <li key={stage.status}>
              <span className="journey-step">0{i + 1}</span>
              <div>
                <strong>
                  {listings.filter((l) => l.status === stage.status).length}
                </strong>
                <span>{stage.label}</span>
                <small>{stage.detail}</small>
              </div>
              {i < 2 && (
                <ArrowRight
                  size={20}
                  className="journey-arrow"
                  aria-hidden="true"
                />
              )}
            </li>
          ))}
        </ol>
      </section>
      <section
        className="exchange-filters"
        aria-label="Filter exchange listings"
      >
        <div className="filter-chips" aria-label="Filter by category">
          <button
            className={`filter-chip ${categoryFilter === "all" ? "active" : ""}`}
            aria-pressed={categoryFilter === "all"}
            onClick={() => setCategoryFilter("all")}
          >
            All materials
          </button>
          {Object.entries(CATEGORY_META).map(([key, meta]) => (
            <button
              key={key}
              className={`filter-chip ${categoryFilter === key ? "active" : ""}`}
              aria-pressed={categoryFilter === key}
              onClick={() => setCategoryFilter(key as Category)}
            >
              <meta.icon size={15} />
              {meta.label}
            </button>
          ))}
        </div>
        <div className="exchange-filter-controls">
          <label className="exchange-search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              aria-label="Search listings"
              placeholder="Search items or neighbourhoods"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="condition-filter">
            Condition
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
            >
              <option value="all">Any condition</option>
              {Object.entries(conditions).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="available-toggle">
            <input
              type="checkbox"
              role="switch"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
            />
            <span>Available only</span>
          </label>
        </div>
      </section>
      <div className="filter-row">
        <h2>Find a second beginning</h2>
        <span role="status">
          {visible.length} {visible.length === 1 ? "listing" : "listings"}
        </span>
      </div>
      <div className="listing-grid exchange-listings">
        {visible.map((l) => {
          const meta = CATEGORY_META[l.category];
          const Icon = meta.icon;
          const artIndex = Object.keys(CATEGORY_META).indexOf(l.category) % 4;
          return (
            <Card
              className={`listing-card ${l.status === "handed_over" ? "listing-complete" : ""}`}
              key={l.id}
            >
              <div className={`listing-art listing-art-${artIndex}`}>
                <Icon size={76} strokeWidth={1} aria-hidden="true" />
                <span className={`listing-condition condition-${l.condition}`}>
                  {conditions[l.condition]}
                </span>
                <span className="listing-qty" aria-label={`Quantity: ${l.qty}`}>
                  ×{l.qty}
                </span>
                {l.status === "handed_over" && (
                  <span className="second-life">
                    <Check size={13} />
                    Given a second life
                  </span>
                )}
              </div>
              <div className="listing-content">
                <div className="row between">
                  <Badge>{meta.label}</Badge>
                  <StatusPill status={l.status} />
                </div>
                <h3>{l.title}</h3>
                <p className="row">
                  <MapPin size={14} />
                  {l.area}
                </p>
                {l.note && <p className="listing-note">{l.note}</p>}
                <small className="muted">
                  Posted by {l.postedBy} ·{" "}
                  <time
                    dateTime={l.createdAt}
                    title={new Date(l.createdAt).toLocaleString("en-IN")}
                  >
                    {timeAgo(l.createdAt, now)}
                  </time>
                </small>
                {l.status === "available" ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setRequestName("");
                      setRequestError("");
                      setRequestId(l.id);
                    }}
                  >
                    Request this <ArrowUpRight size={15} />
                  </Button>
                ) : l.status === "requested" ? (
                  <div className="requested-action">
                    <p>
                      Requested by <strong>{l.requestedBy}</strong>
                    </p>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const before = useStore.getState().activities;
                        markHandedOver(l.id);
                        const after = useStore.getState().activities;
                        if (after !== before)
                          toast(
                            `${after[0].weightKg.toLocaleString("en-IN", { maximumFractionDigits: 3 })} kg kept out of landfill`,
                          );
                      }}
                    >
                      Confirm handover <Check size={15} />
                    </Button>
                  </div>
                ) : (
                  <span className="handed-note">
                    Thank you for keeping it in the loop.
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      {!visible.length && (
        <>
          <EmptyState
            title="Room for something good"
            description="No listings match these filters. Try another material, condition, or search."
          />
          <div className="row center">
            <Button
              variant="secondary"
              onClick={() => {
                setCategoryFilter("all");
                setConditionFilter("all");
                setAvailableOnly(false);
                setSearch("");
              }}
            >
              Clear filters
            </Button>
          </div>
        </>
      )}
      {show && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="listing-title"
            aria-describedby="listing-privacy"
          >
            <div className="row between">
              <h2 id="listing-title">List an item</h2>
              <button aria-label="Close listing form" onClick={closeListing}>
                <X />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!title.trim() || !area.trim()) {
                  setError(
                    "Enter an item title and neighbourhood; spaces alone won’t do.",
                  );
                  return;
                }
                const quantity = Number(qty);
                if (
                  !Number.isInteger(quantity) ||
                  quantity < 1 ||
                  quantity > 999
                ) {
                  setError("Quantity must be a whole number from 1 to 999.");
                  return;
                }
                addListing({
                  title: title.trim(),
                  category,
                  condition,
                  qty: quantity,
                  area: area.trim(),
                  postedBy: "Asha (demo)",
                  note: note.trim() || undefined,
                });
                closeListing();
                resetForm();
                setNow(Date.now());
                toast(
                  "Your item is on the exchange. Here’s to its next chapter.",
                );
              }}
            >
              <label>
                Item title
                <input
                  required
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <div className="form-two">
                <label>
                  Category
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                  >
                    {Object.entries(CATEGORY_META).map(([key, m]) => (
                      <option value={key} key={key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Condition
                  <select
                    value={condition}
                    onChange={(e) =>
                      setCondition(e.target.value as Listing["condition"])
                    }
                  >
                    {Object.entries(conditions).map(([key, label]) => (
                      <option value={key} key={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-two">
                <label>
                  Quantity
                  <input
                    type="number"
                    min="1"
                    max="999"
                    step="1"
                    required
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                  />
                </label>
                <label>
                  Area
                  <input
                    required
                    value={area}
                    maxLength={80}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Your neighbourhood"
                  />
                </label>
              </div>
              <label>
                Note (optional)
                <textarea
                  value={note}
                  maxLength={400}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Tell your neighbour about the item’s condition…"
                />
              </label>
              <p className="footnote" id="listing-privacy">
                {privacyText}
              </p>
              <p className="footnote">
                Posted locally as Asha (a synthetic demo name).
              </p>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit">
                Publish local listing <Plus size={16} />
              </Button>
            </form>
          </section>
        </div>
      )}
      {requestId && (
        <div className="modal-backdrop">
          <section
            className="modal small-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-title"
            aria-describedby="request-privacy"
          >
            <div className="row between">
              <h2 id="request-title">Request this item</h2>
              <button
                aria-label="Close request"
                onClick={() => setRequestId(null)}
              >
                <X />
              </button>
            </div>
            <p>
              {listings.find((l) => l.id === requestId)?.title} · Enter a
              display name. A nickname is fine.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!requestName.trim()) {
                  setRequestError(
                    "Enter a display name; spaces alone won’t do.",
                  );
                  return;
                }
                requestListing(requestId, requestName.trim());
                setRequestId(null);
                setRequestName("");
                toast(
                  "Request saved. Confirm the handover once the item reaches its new owner.",
                );
              }}
            >
              <label>
                Display name
                <input
                  required
                  maxLength={50}
                  value={requestName}
                  onChange={(e) => setRequestName(e.target.value)}
                />
              </label>
              <p className="footnote" id="request-privacy">
                {privacyText}
              </p>
              {requestError && (
                <p className="form-error" role="alert">
                  {requestError}
                </p>
              )}
              <Button type="submit">
                Request item <ArrowUpRight size={16} />
              </Button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
