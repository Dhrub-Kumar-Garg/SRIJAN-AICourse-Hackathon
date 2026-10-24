import assert from "node:assert/strict";
import { catalog } from "../src/data/catalog";
import { centers } from "../src/data/centers";
import { seedActivities, seedListings } from "../src/data/seed";
import { mapImageNetLabel, IMAGENET_RULES } from "../src/lib/imagenetMap";
import * as selectors from "../src/store/selectors";
import type { Activity } from "../src/data/types";
const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => memory.set(k, v),
    removeItem: (k: string) => memory.delete(k),
  },
  configurable: true,
});
Object.defineProperty(globalThis, "window", {
  value: { localStorage: globalThis.localStorage },
  configurable: true,
});
const { useStore } = await import("../src/store/useStore");
const { logClassification, readClassificationLog } =
  await import("../src/lib/classificationLog");
assert.equal(catalog.length, 42);
assert.equal(centers.length, 14);
const seed = seedActivities();
assert.equal(seed.length, 35);
assert.equal(new Set(seed.map((a) => a.route)).size, 6);
assert.equal(new Set(seed.map((a) => a.status)).size, 3);
assert.equal(seedListings().length, 8);
for (const item of catalog) {
  assert.ok(item.why && item.tip && item.keywords.length);
  assert.ok(item.avgWeightKg > 0);
}
assert.ok(IMAGENET_RULES.length >= 40);
for (const [label, category] of [
  ["glass bottle", "glass"],
  ["water bottle", "plastic"],
  ["tin can", "metal"],
  ["envelope", "paper"],
  ["banana", "organic"],
  ["notebook computer", "ewaste"],
  ["jersey", "textile"],
  ["paint tin", "hazardous"],
  ["styrofoam", "residual"],
  ["pelican", null],
] as const)
  assert.equal(mapImageNetLabel(label), category, label);
const base = {
  category: "plastic",
  status: "completed",
  date: new Date().toISOString(),
} as const;
const sample: Activity[] = [
  { ...base, id: "a", itemName: "Bottle", route: "recycle", weightKg: 2 },
  { ...base, id: "b", itemName: "Residual", route: "dispose", weightKg: 3 },
];
assert.equal(selectors.totals(sample).weightKg, 5);
assert.equal(selectors.diversionRate(sample), 0.4);
assert.equal(selectors.landfillAvoidedKg(sample), 2);
assert.equal(selectors.co2eSavedKg(sample), 3);
assert.equal(selectors.itemsRerouted(sample), 1);
assert.equal(selectors.diversionRate([]), 0);
assert.equal(
  selectors.routeBreakdown(sample).reduce((n, r) => n + r.value, 0),
  5,
);
assert.equal(
  selectors.sankeyData(sample).links.reduce((n, r) => n + r.value, 0),
  5,
);
assert.equal(selectors.weeklySeries(sample).length, 8);
useStore.setState({ activities: [], listings: [] });
useStore.getState().addActivity({
  itemName: "Test jar",
  category: "glass",
  route: "reuse",
  weightKg: 0.3,
  status: "pending",
});
const added = useStore.getState().activities[0];
assert.ok(added.id && added.date);
useStore.getState().updateActivityStatus(added.id, "completed");
assert.equal(selectors.handoverCount(useStore.getState().activities), 1);
useStore.getState().addListing({
  title: "Test tote",
  category: "textile",
  condition: "good",
  qty: 2,
  area: "Demo area",
  postedBy: "Demo neighbour",
});
const id = useStore.getState().listings[0].id;
useStore.getState().markHandedOver(id);
assert.equal(
  useStore.getState().activities.length,
  1,
  "available listing cannot be handed over",
);
useStore.getState().requestListing(id, "Demo requester");
assert.equal(useStore.getState().listings[0].status, "requested");
useStore.getState().markHandedOver(id);
assert.equal(useStore.getState().listings[0].status, "handed_over");
assert.equal(useStore.getState().activities.length, 2);
assert.equal(useStore.getState().activities[0].route, "reuse");
useStore.getState().markHandedOver(id);
assert.equal(
  useStore.getState().activities.length,
  2,
  "handover is idempotent",
);
assert.ok(memory.has("srijan-store-v1"), "state persisted");
logClassification({
  predictedCategory: "plastic",
  confirmedCategory: "glass",
  confidence: 0.3,
  timestamp: new Date().toISOString(),
});
assert.equal(readClassificationLog()[0].confirmedCategory, "glass");
useStore.getState().resetDemo();
assert.equal(useStore.getState().activities.length, 35);
assert.equal(useStore.getState().listings.length, 8);
assert.equal(readClassificationLog().length, 1);
console.log(
  "Passed: seed diversity, 42 catalog items, label mapping, impact calculations, persistence, activity updates, exchange transitions, duplicate handover protection, classification logs, and demo reset.",
);
