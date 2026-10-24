import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  ArrowUpRight,
  Check,
  MapPin,
  Package,
  Leaf,
  Clock3,
} from "lucide-react";
import { useStore } from "../store/useStore";
import { CATEGORY_META, ROUTE_META } from "../data/constants";
import { centers } from "../data/centers";
import {
  PageHeader,
  Highlight,
  Card,
  Button,
  EmptyState,
  StatusPill,
  StatNumber,
  useToast,
} from "../components/ui";
import { totals, landfillAvoidedKg } from "../store/selectors";
import { groupActivitiesByWeek } from "../lib/activity";
import ActivityModal from "../components/ActivityModal";
import type { Activity as ActivityRecord } from "../data/types";

export default function Activity() {
  const activities = useStore((s) => s.activities);
  const update = useStore((s) => s.updateActivityStatus);
  const toast = useToast();
  const [status, setStatus] = useState("all");
  const [route, setRoute] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const rows = activities.filter(
    (a) =>
      (status === "all" || a.status === status) &&
      (route === "all" || a.route === route),
  );
  const groups = groupActivitiesByWeek(rows);
  function advance(a: ActivityRecord) {
    const next = a.status === "pending" ? "collected" : "completed";
    update(a.id, next);
    toast(`${a.itemName} marked ${next}.`);
  }
  return (
    <>
      <PageHeader
        eyebrow="THE LITTLE THINGS ADD UP"
        title={
          <>
            Your everyday <Highlight>good.</Highlight>
          </>
        }
        description="Every item has a story. Here’s how you’re helping yours move forward."
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus size={17} />
            Log activity
          </Button>
        }
      />
      <div className="three-stats activity-summary">
        <Card>
          <StatNumber
            value={totals(activities).count}
            label="items logged"
            icon={<Package size={19} />}
          />
        </Card>
        <Card>
          <StatNumber
            value={landfillAvoidedKg(activities).toFixed(1)}
            unit="kg"
            label="kg diverted"
            icon={<Leaf size={19} />}
          />
        </Card>
        <Card>
          <StatNumber
            value={activities.filter((a) => a.status === "pending").length}
            label="pending pickups"
            icon={<Clock3 size={19} />}
          />
        </Card>
      </div>
      <section className="activity-filters" aria-label="Filter activity">
        <div className="filter-chips">
          {["all", "pending", "collected", "completed"].map((s) => (
            <button
              key={s}
              className={`filter-chip ${status === s ? "active" : ""}`}
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <label>
          Route
          <select
            aria-label="Filter activity by route"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
          >
            <option value="all">All routes</option>
            {Object.entries(ROUTE_META).map(([r, m]) => (
              <option value={r} key={r}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </section>
      <div className="activity-timeline">
        {groups.map((group) => (
          <section
            className="activity-week"
            key={group.key}
            aria-label={group.label}
          >
            <header>
              <span className="week-dot" />
              <h2>{group.label}</h2>
              <span>
                {group.items.length}{" "}
                {group.items.length === 1 ? "item" : "items"}
              </span>
            </header>
            <Card className="timeline-card">
              {group.items.map((a) => {
                const category = CATEGORY_META[a.category];
                const routeMeta = ROUTE_META[a.route];
                const center = centers.find((c) => c.id === a.centerId);
                return (
                  <article
                    key={a.id}
                    className="activity-row"
                    aria-label={`${a.itemName}, ${a.status}`}
                  >
                    <span
                      className="activity-category-icon"
                      style={{
                        color: category.color,
                        background: `${category.color}12`,
                      }}
                    >
                      <category.icon size={21} />
                    </span>
                    <div className="activity-item">
                      <h3>{a.itemName}</h3>
                      <p>
                        {category.label}
                        <span>·</span>
                        <time dateTime={a.date}>
                          {new Date(a.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </time>
                      </p>
                      {center && (
                        <small>
                          <MapPin size={11} />
                          {center.name}
                        </small>
                      )}
                    </div>
                    <div className="activity-route-weight">
                      <span
                        className="route-badge"
                        style={{
                          color: routeMeta.color,
                          background: `${routeMeta.color}12`,
                        }}
                      >
                        {routeMeta.label}
                      </span>
                      <span>{Number(a.weightKg.toFixed(3))} kg</span>
                    </div>
                    <StatusPill status={a.status} />
                    <div className="activity-row-action">
                      {a.status === "completed" ? (
                        <span
                          className="completed-check"
                          aria-label="Completed"
                        >
                          <Check size={16} />
                        </span>
                      ) : (
                        <button
                          className="text-link"
                          onClick={() => advance(a)}
                          aria-label={`Mark ${a.itemName} ${a.status === "pending" ? "collected" : "completed"}`}
                        >
                          Mark{" "}
                          {a.status === "pending" ? "collected" : "completed"}
                          <ArrowUpRight size={14} />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </Card>
          </section>
        ))}
      </div>
      {!groups.length && (
        <Card className="activity-empty">
          <EmptyState
            title="A fresh chapter starts with one item."
            description="No activity matches these filters. Find an item’s next route or log an action to get started."
          />
          <div className="row center wrap">
            <Link className="button button-primary" to="/classify">
              Classify an item <ArrowUpRight size={16} />
            </Link>
            {(status !== "all" || route !== "all") && (
              <Button
                variant="secondary"
                onClick={() => {
                  setStatus("all");
                  setRoute("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </Card>
      )}
      <p className="footnote">
        Initial entries are synthetic demo activity. All logged statuses
        contribute to diverted-weight estimates. New actions are saved in this
        browser.
      </p>
      {showForm && <ActivityModal onClose={() => setShowForm(false)} />}
    </>
  );
}
