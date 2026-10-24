import type { Activity, Route } from "../data/types";
import { CO2E_PER_KG, CATEGORY_META, ROUTE_META } from "../data/constants";
const sum = (a: Activity[]) => a.reduce((n, x) => n + x.weightKg, 0);
export const totals = (a: Activity[]) => ({
  weightKg: sum(a),
  count: a.length,
});
export const landfillAvoidedKg = (a: Activity[]) =>
  sum(a.filter((x) => x.route !== "dispose"));
export const diversionRate = (a: Activity[]) =>
  sum(a) ? landfillAvoidedKg(a) / sum(a) : 0;
export const co2eSavedKg = (a: Activity[]) =>
  a
    .filter((x) => x.route !== "dispose")
    .reduce((n, x) => n + x.weightKg * CO2E_PER_KG[x.category], 0);
export const itemsRerouted = (a: Activity[]) =>
  a.filter((x) => x.route !== "dispose").length;
export const handoverCount = (a: Activity[]) =>
  a.filter((x) => x.route === "reuse" && x.status === "completed").length;
export const routeBreakdown = (a: Activity[]) =>
  Object.entries(ROUTE_META).map(([key, m]) => ({
    name: m.label,
    route: key,
    value: sum(a.filter((x) => x.route === key)),
    color: m.color,
  }));
export const categoryBreakdown = (a: Activity[]) =>
  Object.entries(CATEGORY_META).map(([key, m]) => ({
    name: m.label,
    value: sum(a.filter((x) => x.category === key)),
    color: m.color,
  }));
export const weeklySeries = (a: Activity[]) => {
  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Array.from({ length: 8 }, (_, i) => {
    const start = new Date(monday);
    start.setDate(start.getDate() - (7 - i) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const rows = a.filter(
      (x) => new Date(x.date) >= start && new Date(x.date) < end,
    );
    return {
      name: start.toLocaleDateString("en", { month: "short", day: "numeric" }),
      ...Object.fromEntries(
        Object.keys(ROUTE_META).map((r) => [
          r,
          sum(rows.filter((x) => x.route === (r as Route))),
        ]),
      ),
    };
  });
};
export const sankeyData = (a: Activity[]) => {
  const cats = Object.keys(CATEGORY_META),
    routes = Object.keys(ROUTE_META);
  return {
    nodes: [...Object.values(CATEGORY_META), ...Object.values(ROUTE_META)].map(
      (m) => ({ name: m.label }),
    ),
    links: cats
      .flatMap((c, source) =>
        routes.map((r, i) => ({
          source,
          target: cats.length + i,
          value: sum(a.filter((x) => x.category === c && x.route === r)),
        })),
      )
      .filter((l) => l.value > 0),
  };
};
