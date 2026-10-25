import { useId, useState, type FormEvent } from "react";
import { X, Check, MapPin } from "lucide-react";
import type { Category, Route, Center, CatalogItem } from "../data/types";
import { CATEGORY_META, ROUTE_META } from "../data/constants";
import { centers } from "../data/centers";
import { catalog } from "../data/catalog";
import { CENTER_TYPE_META } from "../lib/centers";
import { useModal } from "../lib/useModal";
import { useStore } from "../store/useStore";
import { Button, useToast } from "./ui";

type Props = {
  onClose: () => void;
  center?: Center;
  initialCategory?: Category;
  initialItem?: CatalogItem;
  initialWeight?: number;
};
export default function ActivityModal({
  onClose,
  center,
  initialCategory,
  initialItem,
  initialWeight,
}: Props) {
  const id = useId();
  const toast = useToast();
  const add = useStore((s) => s.addActivity);
  const allowed = Object.keys(CATEGORY_META).filter(
    (c) => !center || center.accepts.includes(c as Category),
  ) as Category[];
  const itemAllowed =
    initialItem && allowed.includes(initialItem.category)
      ? initialItem
      : undefined;
  const [itemName, setItemName] = useState(itemAllowed?.name ?? "");
  const [category, setCategory] = useState<Category>(
    itemAllowed?.category ??
      (initialCategory && allowed.includes(initialCategory)
        ? initialCategory
        : allowed[0]),
  );
  const [route, setRoute] = useState<Route>(
    itemAllowed?.route ??
      (center ? CENTER_TYPE_META[center.type].route : "recycle"),
  );
  const [weight, setWeight] = useState(
    String(itemAllowed ? (initialWeight ?? itemAllowed.avgWeightKg) : ""),
  );
  const [centerId, setCenterId] = useState(center?.id ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  useModal(true, onClose);
  function selectCatalogItem(value: string) {
    setItemName(value);
    const match = catalog.find(
      (c) =>
        c.name.toLowerCase() === value.trim().toLowerCase() &&
        allowed.includes(c.category),
    );
    if (match) {
      setCategory(match.category);
      setRoute(match.route);
      if (!weight) setWeight(String(match.avgWeightKg));
      if (!center) setCenterId("");
    }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (saved) return;
    if (!itemName.trim()) return setError("Enter an item name.");
    if (!Number.isFinite(Number(weight)) || Number(weight) <= 0)
      return setError("Enter a weight greater than zero.");
    const destination = centers.find((c) => c.id === centerId);
    if (centerId && (!destination || !destination.accepts.includes(category)))
      return setError("Choose a center that accepts this category.");
    add({
      itemName: itemName.trim(),
      category,
      route,
      weightKg: Number(weight),
      status: center ? "collected" : "pending",
      ...(centerId ? { centerId } : {}),
    });
    setSaved(true);
    toast(
      center
        ? "Drop-off logged as collected. Find it in My Activity."
        : "Activity logged. Your next small step is saved.",
    );
    onClose();
  }
  return (
    <div className="modal-backdrop">
      <section
        className="modal activity-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-heading`}
        aria-describedby={`${id}-description`}
      >
        <div className="row between">
          <h2 id={`${id}-heading`}>
            {center ? "Log a drop-off" : "Log activity"}
          </h2>
          <button
            type="button"
            aria-label="Close activity form"
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </div>
        <p id={`${id}-description`} className="modal-description">
          {center ? (
            <>
              <MapPin size={15} />
              {center.name} · saved as collected
            </>
          ) : (
            "Record an everyday item and the route you chose. New entries start as pending."
          )}
        </p>
        <form noValidate onSubmit={submit}>
          <label htmlFor={`${id}-item`}>
            Item name
            <input
              id={`${id}-item`}
              list={`${id}-catalog`}
              required
              maxLength={100}
              value={itemName}
              onChange={(e) => selectCatalogItem(e.target.value)}
              placeholder="e.g. PET bottle"
              autoComplete="off"
            />
          </label>
          <datalist id={`${id}-catalog`}>
            {catalog
              .filter((c) => allowed.includes(c.category))
              .map((c) => (
                <option value={c.name} key={c.id} />
              ))}
          </datalist>
          <div className="form-two">
            <label htmlFor={`${id}-category`}>
              Category
              <select
                id={`${id}-category`}
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as Category);
                  if (!center) setCenterId("");
                }}
              >
                {allowed.map((c) => (
                  <option value={c} key={c}>
                    {CATEGORY_META[c].label}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor={`${id}-route`}>
              Route
              <select
                id={`${id}-route`}
                value={route}
                onChange={(e) => setRoute(e.target.value as Route)}
              >
                {Object.entries(ROUTE_META).map(([r, m]) => (
                  <option value={r} key={r}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label htmlFor={`${id}-weight`}>
            Weight (kg)
            <input
              id={`${id}-weight`}
              type="number"
              min="0.001"
              step="any"
              required
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0.250"
              inputMode="decimal"
            />
          </label>
          {!center && (
            <label htmlFor={`${id}-center`}>
              Center <span className="muted">(optional)</span>
              <select
                id={`${id}-center`}
                value={centerId}
                onChange={(e) => setCenterId(e.target.value)}
              >
                <option value="">No center selected</option>
                {centers
                  .filter((c) => c.accepts.includes(category))
                  .map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <p className="footnote">
            {center
              ? "Log only a drop-off you have completed (or an illustrative guided-demo entry). Use the measured weight when known. This saves a local record; it does not book or verify a collection."
              : "Use an estimate if you do not know the exact weight."}
          </p>
          <Button type="submit" disabled={saved}>
            <Check size={16} />
            {center ? "Save drop-off" : "Save activity"}
          </Button>
        </form>
      </section>
    </div>
  );
}
