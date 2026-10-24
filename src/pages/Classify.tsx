import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Camera,
  Search,
  Upload,
  ArrowRight,
  Check,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";
import type { Category, CatalogItem } from "../data/types";
import { CATEGORY_META } from "../data/constants";
import { catalog } from "../data/catalog";
import {
  Button,
  Card,
  Highlight,
  PageHeader,
  EmptyState,
  useToast,
} from "../components/ui";
import RouteCard from "../components/RouteCard";
import { mapImageNetLabel } from "../lib/imagenetMap";
import { logClassification } from "../lib/classificationLog";
import { LOW_CONFIDENCE_THRESHOLD } from "../lib/evaluation";
let classifier:
  | ReturnType<(typeof import("@tensorflow-models/mobilenet"))["load"]>
  | undefined;
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Classifier request timed out")),
          ms,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
type Prediction = { className: string; probability: number };
function fuzzy(text: string, query: string) {
  const source = text.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((word) => {
      if (source.includes(word)) return true;
      if (word.length < 3) return false;
      return source.split(/[^a-z0-9]+/).some((candidate) => {
        if (candidate.length - word.length > 2) return false;
        let i = 0;
        for (const c of candidate) if (c === word[i]) i++;
        return i === word.length;
      });
    });
}
export default function Classify() {
  const toast = useToast();
  const [params] = useSearchParams();
  const [tab, setTab] = useState<"snap" | "pick">("snap");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [preview, setPreview] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const runId = useRef(0);
  const selectMethod = (method: "snap" | "pick") => {
    setTab(method);
    setSelected(null);
    setCategory(null);
    setQuery("");
  };
  useEffect(() => {
    const search = params.get("q");
    const item = catalog.find((i) => i.id === params.get("item"));
    if (search !== null || item) {
      setTab("pick");
      setQuery(search ?? "");
      setCategory(null);
      setSelected(item ?? null);
    }
  }, [params]);
  useEffect(() => {
    if (selected && params.get("demo") === "route")
      document
        .getElementById("route-card")
        ?.scrollIntoView({ block: "center" });
  }, [selected, params]);
  useEffect(
    () => () => {
      runId.current++;
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  const predicted = predictions[0]
    ? mapImageNetLabel(predictions[0].className)
    : null;
  const uncertain =
    !predicted || (predictions[0]?.probability ?? 0) < LOW_CONFIDENCE_THRESHOLD;
  async function classify() {
    const id = ++runId.current;
    setBusy(true);
    setConfirmed(false);
    setSelected(null);
    setPredictions([]);
    setError("");
    try {
      const tf = await import("@tensorflow/tfjs");
      await tf.ready();
      const mobilenet = await import("@tensorflow-models/mobilenet");
      classifier ??= withTimeout(
        mobilenet.load({ version: 2, alpha: 1 }),
        45000,
      ).catch((err) => {
        classifier = undefined;
        throw err;
      });
      const model = await classifier;
      if (!img.current || id !== runId.current) return;
      const p = await model.classify(img.current, 3);
      if (id !== runId.current) return;
      setPredictions(p);
      setCategory(p[0] ? mapImageNetLabel(p[0].className) : null);
    } catch {
      if (id === runId.current)
        setError(
          "The photo model could not load. Check your connection, retry, or pick an item below.",
        );
    } finally {
      if (id === runId.current) setBusy(false);
    }
  }
  function upload(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    runId.current++;
    setPreview(URL.createObjectURL(file));
    setPredictions([]);
    setSelected(null);
    setCategory(null);
    setConfirmed(false);
    setError("");
  }
  const items = catalog.filter(
    (i) =>
      (!category || i.category === category) &&
      fuzzy(i.name + " " + i.keywords.join(" "), query),
  );
  return (
    <>
      <PageHeader
        eyebrow="A LITTLE CLARITY GOES A LONG WAY"
        title={
          <>
            Find its <Highlight>second route.</Highlight>
          </>
        }
        description="Start with a photo or an everyday item. We’ll help with what comes next."
      />
      <div className="classify-layout">
        <div>
          <div
            className="tabs"
            role="tablist"
            aria-label="Classification method"
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              )
                return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? "snap"
                  : event.key === "End"
                    ? "pick"
                    : tab === "snap"
                      ? "pick"
                      : "snap";
              selectMethod(next);
              event.currentTarget
                .querySelector<HTMLButtonElement>(
                  `#${next === "snap" ? "photo" : "catalog"}-tab`,
                )
                ?.focus();
            }}
          >
            <button
              role="tab"
              id="photo-tab"
              aria-controls="classification-panel"
              tabIndex={tab === "snap" ? 0 : -1}
              aria-selected={tab === "snap"}
              className={tab === "snap" ? "active" : ""}
              onClick={() => selectMethod("snap")}
            >
              <Camera size={17} />
              Snap a photo
            </button>
            <button
              role="tab"
              id="catalog-tab"
              aria-controls="classification-panel"
              tabIndex={tab === "pick" ? 0 : -1}
              aria-selected={tab === "pick"}
              className={tab === "pick" ? "active" : ""}
              onClick={() => selectMethod("pick")}
            >
              <Search size={17} />
              Pick an item
            </button>
          </div>
          <div
            role="tabpanel"
            id="classification-panel"
            aria-labelledby={tab === "snap" ? "photo-tab" : "catalog-tab"}
          >
            {tab === "snap" && (
              <>
                <div
                  className={`upload-zone ${preview ? "has-photo" : ""}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    upload(e.dataTransfer.files[0]);
                  }}
                >
                  {preview ? (
                    <img
                      ref={img}
                      src={preview}
                      alt="Your uploaded item for classification"
                      onLoad={classify}
                      onError={() =>
                        setError(
                          "This image format could not be read. Please choose a JPEG, PNG, or WebP photo.",
                        )
                      }
                    />
                  ) : (
                    <>
                      <span className="upload-icon">
                        <Camera size={32} />
                      </span>
                      <h3>A fresh perspective starts here.</h3>
                      <p>Drop a photo here, or choose one from your device.</p>
                    </>
                  )}
                  <input
                    ref={input}
                    type="file"
                    accept="image/*"
                    aria-label="Upload a photo of your item"
                    onChange={(e) => upload(e.target.files?.[0])}
                    hidden
                  />
                  <div className="row wrap center">
                    <Button
                      variant="secondary"
                      onClick={() => input.current?.click()}
                    >
                      <Upload size={16} />
                      {preview ? "Choose another photo" : "Choose a photo"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => camera.current?.click()}
                    >
                      <Camera size={16} />
                      Use camera
                    </Button>
                    <input
                      ref={camera}
                      aria-label="Take a photo of your item"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      hidden
                      onChange={(e) => upload(e.target.files?.[0])}
                    />
                  </div>
                  <small>
                    Photos stay in your browser. Nothing is uploaded.
                  </small>
                </div>
                {busy && (
                  <div className="model-loading" role="status">
                    <LoaderCircle className="spin" size={21} />
                    <div>
                      Warming up the classifier…
                      <div className="skeleton" />
                      <small>
                        First use downloads the model. This may take a moment.
                      </small>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="notice" role="alert">
                    {error}
                    <div className="row">
                      <Button
                        variant="secondary"
                        onClick={classify}
                        disabled={busy || !preview}
                      >
                        Retry
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setTab("pick")}
                      >
                        Pick an item
                      </Button>
                    </div>
                  </div>
                )}
                {predictions.length > 0 && (
                  <Card className="predictions">
                    <span className="eyebrow">WHAT THE MODEL SEES</span>
                    {predictions.map((p) => (
                      <div key={p.className} className="prediction">
                        <div className="row between">
                          <span>{p.className}</span>
                          <strong>{Math.round(p.probability * 100)}%</strong>
                        </div>
                        <div className="confidence-bar">
                          <i style={{ width: `${p.probability * 100}%` }} />
                        </div>
                      </div>
                    ))}
                    {uncertain && (
                      <p className="notice">
                        <TriangleAlert size={17} />
                        Not confident - please confirm the category
                      </p>
                    )}
                    <p className="muted text-sm">
                      You know your item best. Always check the category.
                    </p>
                  </Card>
                )}
              </>
            )}
            {(tab === "pick" || predictions.length > 0 || error) && (
              <>
                <div className="row between subsection">
                  <h3>
                    {tab === "pick"
                      ? "What are you giving a second route?"
                      : "Confirm the category"}
                  </h3>
                  {category && (
                    <button
                      className="text-link"
                      onClick={() => {
                        setCategory(null);
                        setConfirmed(false);
                      }}
                    >
                      Show all
                    </button>
                  )}
                </div>
                {tab === "pick" && (
                  <label className="search-field">
                    <Search size={19} />
                    <input
                      placeholder="Try “bottle”, “old phone”, or “pizza box”…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      aria-label="Search catalog items"
                    />
                  </label>
                )}
                <div className="category-grid">
                  {Object.entries(CATEGORY_META).map(([key, m]) => (
                    <button
                      key={key}
                      className={`category-tile ${category === key ? "selected" : ""}`}
                      onClick={() => {
                        setCategory(key as Category);
                        setConfirmed(false);
                        setSelected(null);
                      }}
                    >
                      <m.icon size={23} style={{ color: m.color }} />
                      <span>{m.label}</span>
                      {category === key && <Check size={13} />}
                    </button>
                  ))}
                </div>
                {tab === "snap" && (
                  <Button
                    disabled={!category || confirmed}
                    onClick={() => {
                      if (!category) return;
                      if (
                        predictions.length &&
                        !logClassification({
                          predictedCategory: predicted,
                          confirmedCategory: category,
                          confidence: predictions[0]?.probability ?? 0,
                          timestamp: new Date().toISOString(),
                        })
                      )
                        toast(
                          "Category confirmed. Browser storage is unavailable, so this photo run could not be saved.",
                        );
                      setConfirmed(true);
                    }}
                  >
                    {confirmed ? "Category confirmed" : "Confirm category"}
                    <Check size={16} />
                  </Button>
                )}
                {(tab === "pick" || confirmed) && (
                  <div className="item-results">
                    <div className="row between">
                      <h3>Pick the exact item</h3>
                      <small className="muted">{items.length} items</small>
                    </div>
                    {items.length ? (
                      items.map((item) => (
                        <button
                          className={`item-result ${selected?.id === item.id ? "selected" : ""}`}
                          onClick={() => setSelected(item)}
                          key={item.id}
                        >
                          <span>
                            {item.name}
                            <small>{CATEGORY_META[item.category].label}</small>
                          </span>
                          <ArrowRight size={17} />
                        </button>
                      ))
                    ) : (
                      <EmptyState
                        title="No matching items"
                        description="Try a shorter search or choose another category."
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <aside id="route-card">
          {selected ? (
            <RouteCard key={selected.id} item={selected} />
          ) : (
            <Card className="route-placeholder">
              <span className="step-icon">
                <LeafIcon />
              </span>
              <h2>
                A new chapter
                <br />
                starts with one item.
              </h2>
              <p>
                Choose your item to reveal its route, practical tips, and the
                next step.
              </p>
              <div className="mini-route">
                <span>YOUR ITEM</span>
                <ArrowRight size={17} />
                <span>NEW POSSIBILITY</span>
              </div>
            </Card>
          )}
          <div className="privacy-note">
            <Check size={15} />
            <p>
              AI suggests. You decide.
              <br />
              <span>Every route stays in your hands.</span>
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
function LeafIcon() {
  return <Camera size={27} />;
}
