import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ArrowUpRight } from "lucide-react";
import { useStore } from "../store/useStore";
import { CATEGORY_META, ROUTE_META } from "../data/constants";
import {
  PageHeader,
  Highlight,
  Card,
  EmptyState,
  StatusPill,
  StatNumber,
} from "../components/ui";
import {
  itemsRerouted,
  landfillAvoidedKg,
  handoverCount,
} from "../store/selectors";
export default function Activity() {
  const activities = useStore((s) => s.activities),
    update = useStore((s) => s.updateActivityStatus);
  const [status, setStatus] = useState("all");
  const rows = activities.filter(
    (a) => status === "all" || a.status === status,
  );
  return (
    <>
      <PageHeader
        eyebrow="THE LITTLE THINGS ADD UP"
        title={
          <>
            Your everyday <Highlight>good.</Highlight>
          </>
        }
        description="A record of items you’ve helped on their way."
        action={
          <Link className="button button-primary" to="/classify">
            <Plus size={17} />
            Log an item
          </Link>
        }
      />
      <div className="three-stats">
        <Card>
          <StatNumber
            value={itemsRerouted(activities)}
            label="items rerouted"
          />
        </Card>
        <Card>
          <StatNumber
            value={landfillAvoidedKg(activities).toFixed(1)}
            unit="kg"
            label="landfill avoided"
          />
        </Card>
        <Card>
          <StatNumber
            value={handoverCount(activities)}
            label="completed reuse actions"
          />
        </Card>
      </div>
      <div className="filter-row">
        <h2>Your activity</h2>
        <label>
          Status{" "}
          <select
            aria-label="Filter activity by status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {["all", "pending", "collected", "completed"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <Card className="table-card">
        {rows.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ITEM</th>
                  <th>ROUTE</th>
                  <th>WEIGHT</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                  <th>NEXT STEP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const Icon = CATEGORY_META[a.category].icon;
                  return (
                    <tr key={a.id}>
                      <td>
                        <span className="row">
                          <span className="table-icon">
                            <Icon size={19} />
                          </span>
                          <span>
                            <strong>{a.itemName}</strong>
                            <small>{CATEGORY_META[a.category].label}</small>
                          </span>
                        </span>
                      </td>
                      <td>
                        <span style={{ color: ROUTE_META[a.route].color }}>
                          {ROUTE_META[a.route].label}
                        </span>
                      </td>
                      <td>
                        {a.weightKg
                          .toFixed(3)
                          .replace(/0+$/, "")
                          .replace(/\.$/, "")}{" "}
                        kg
                      </td>
                      <td>
                        {new Date(a.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td>
                        <StatusPill status={a.status} />
                      </td>
                      <td>
                        {a.status !== "completed" ? (
                          <button
                            className="text-link"
                            onClick={() =>
                              update(
                                a.id,
                                a.status === "pending"
                                  ? "collected"
                                  : "completed",
                              )
                            }
                          >
                            Mark{" "}
                            {a.status === "pending" ? "collected" : "completed"}
                            <ArrowUpRight size={13} />
                          </button>
                        ) : (
                          <span className="muted">All done</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="A fresh page"
            description="Log your first item or choose another status to see activity."
          />
        )}
      </Card>
      <p className="footnote">
        Initial entries are synthetic demo activity. Your new actions are saved
        in this browser.
      </p>
    </>
  );
}
