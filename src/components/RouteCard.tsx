import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CheckCircle2,
  Info,
  MapPin,
  Plus,
  Lightbulb,
} from "lucide-react";
import type { CatalogItem } from "../data/types";
import { CATEGORY_META, ROUTE_META } from "../data/constants";
import { useStore } from "../store/useStore";
import { Button, Badge, Highlight, useToast } from "./ui";
export default function RouteCard({ item }: { item: CatalogItem }) {
  const [weight, setWeight] = useState(String(item.avgWeightKg));
  const [logged, setLogged] = useState(false);
  const add = useStore((s) => s.addActivity);
  const toast = useToast();
  const route = ROUTE_META[item.route];
  return (
    <article className="route-ticket">
      <div className="ticket-top">
        <div className="row between">
          <span className="eyebrow">YOUR ITEM’S NEXT CHAPTER</span>
          <Badge>{CATEGORY_META[item.category].label}</Badge>
        </div>
        <h2>{item.name}</h2>
        <div className="route-word" style={{ color: route.color }}>
          <Highlight>{route.label.toUpperCase()}</Highlight>
          <ArrowUpRight size={32} />
        </div>
        <p>{route.meaning}</p>
      </div>
      <div className="ticket-body">
        <div className="route-detail">
          <Info size={19} />
          <div>
            <strong>Why this route</strong>
            <p>{item.why}</p>
          </div>
        </div>
        <div className="route-detail">
          <Lightbulb size={19} />
          <div>
            <strong>Do this</strong>
            <p>{item.tip}</p>
          </div>
        </div>
        {item.route === "dispose" && (
          <p className="notice">
            Last resort - check if any part can be separated first.
          </p>
        )}
      </div>
      <div className="ticket-bottom">
        <label>
          Estimated weight <span className="muted">(kg)</span>
          <input
            type="number"
            min="0.001"
            step="0.001"
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value);
              setLogged(false);
            }}
          />
        </label>
        <div className="ticket-actions">
          <Link
            className="button button-secondary"
            to={`/centers?category=${item.category}`}
          >
            <MapPin size={17} />
            Find nearest center
          </Link>
          <Button
            disabled={
              logged || !Number.isFinite(Number(weight)) || Number(weight) <= 0
            }
            onClick={() => {
              add({
                itemName: item.name,
                category: item.category,
                route: item.route,
                weightKg: Number(weight),
                status: "pending",
              });
              setLogged(true);
              toast("Item logged. A small action, a better route.");
            }}
          >
            {logged ? <CheckCircle2 size={17} /> : <Plus size={17} />}
            {logged ? "Logged" : "Log this"}
          </Button>
        </div>
        {["reuse", "repair"].includes(item.route) && (
          <Link
            className="text-link"
            to={`/exchange?new=1&title=${encodeURIComponent(item.name)}&category=${item.category}`}
          >
            List on Reuse Exchange <ArrowUpRight size={15} />
          </Link>
        )}
      </div>
    </article>
  );
}
