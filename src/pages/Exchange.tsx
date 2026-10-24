import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, MapPin, ArrowUpRight, X, Package } from "lucide-react";
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
export default function Exchange() {
  const [params, setParams] = useSearchParams();
  const [show, setShow] = useState(params.get("new") === "1");
  const [filter, setFilter] = useState("all");
  const [title, setTitle] = useState(params.get("title") || "");
  const initialCategory = params.get("category");
  const [category, setCategory] = useState<Category>(
    initialCategory && initialCategory in CATEGORY_META
      ? (initialCategory as Category)
      : "textile",
  );
  const [condition, setCondition] = useState<Listing["condition"]>("good");
  const [qty, setQty] = useState(1);
  const [area, setArea] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestName, setRequestName] = useState("");
  const { listings, addListing, requestListing, markHandedOver } = useStore();
  const toast = useToast();
  useModal(show, () => {
    setShow(false);
    setParams({});
  });
  useModal(Boolean(requestId), () => setRequestId(null));
  const visible = listings.filter(
    (l) => filter === "all" || l.status === filter,
  );
  return (
    <>
      <PageHeader
        eyebrow="GOOD THINGS DESERVE ANOTHER GO"
        title={
          <>
            Less waste. <Highlight>More possibility.</Highlight>
          </>
        }
        description="Give something useful a new home, or find your next favourite."
        action={
          <Button onClick={() => setShow(true)}>
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
          Share honestly, arrange collection thoughtfully, and mark the handover
          when it’s done.
        </p>
        <Badge>Demo community</Badge>
      </div>
      <div className="filter-row">
        <h2>The Reuse Exchange</h2>
        <select
          aria-label="Filter listings by status"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All listings</option>
          <option value="available">Available</option>
          <option value="requested">Requested</option>
          <option value="handed_over">Handed over</option>
        </select>
      </div>
      <div className="listing-grid">
        {visible.map((l, i) => {
          const Icon = CATEGORY_META[l.category].icon;
          return (
            <Card className="listing-card" key={l.id}>
              <div className={`listing-art listing-art-${i % 4}`}>
                <Icon size={76} strokeWidth={1} />
                <span className="listing-condition">
                  {l.condition.replace("-", " ")}
                </span>
                <span className="listing-qty">×{l.qty}</span>
              </div>
              <div className="listing-content">
                <div className="row between">
                  <small className="eyebrow">
                    {CATEGORY_META[l.category].label}
                  </small>
                  <StatusPill status={l.status} />
                </div>
                <h3>{l.title}</h3>
                <p className="row">
                  <MapPin size={14} />
                  {l.area}
                </p>
                <p className="listing-note">{l.note}</p>
                <small className="muted">
                  Shared by {l.postedBy} ·{" "}
                  {new Date(l.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </small>
                {l.status === "available" ? (
                  <Button
                    variant="secondary"
                    onClick={() => setRequestId(l.id)}
                  >
                    Give it a new home <ArrowUpRight size={15} />
                  </Button>
                ) : l.status === "requested" ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      markHandedOver(l.id);
                      toast(
                        "Handover complete! A reuse action has been added to your activity.",
                      );
                    }}
                  >
                    Mark handed over <ArrowUpRight size={15} />
                  </Button>
                ) : (
                  <span className="handed-note">A happy new chapter.</span>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      {!visible.length && (
        <EmptyState
          title="Room for something good"
          description="No listings match this filter. Share an item to start a new chapter."
        />
      )}
      {show && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="listing-title"
          >
            <div className="row between">
              <h2 id="listing-title">Give it a second route.</h2>
              <button
                aria-label="Close listing form"
                onClick={() => {
                  setShow(false);
                  setParams({});
                }}
              >
                <X />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addListing({
                  title: title.trim(),
                  category,
                  condition,
                  qty,
                  area: area.trim(),
                  postedBy: name.trim(),
                  note: note.trim(),
                });
                setShow(false);
                setParams({});
                toast(
                  "Your item is on the exchange. Here’s to its next chapter.",
                );
                setTitle("");
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
                    {Object.entries(CATEGORY_META).map(([k, m]) => (
                      <option value={k} key={k}>
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
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="needs-repair">Needs repair</option>
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
                    required
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
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
                Display name
                <input
                  required
                  value={name}
                  maxLength={50}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="A nickname is fine"
                />
              </label>
              <label>
                A little about it
                <textarea
                  value={note}
                  maxLength={400}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Condition, collection details, and anything helpful…"
                />
              </label>
              <p className="footnote">
                Saved locally in this demo browser. Avoid sharing contact
                details.
              </p>
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
          >
            <div className="row between">
              <h2 id="request-title">A new home starts here.</h2>
              <button
                aria-label="Close request"
                onClick={() => setRequestId(null)}
              >
                <X />
              </button>
            </div>
            <p>
              Enter a display name to request this item in the demo exchange.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                requestListing(requestId, requestName.trim());
                setRequestId(null);
                setRequestName("");
                toast(
                  "Request saved. Arrange a handover, then mark it complete.",
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
