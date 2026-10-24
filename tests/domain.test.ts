import assert from "node:assert/strict";
import { catalog } from "../src/data/catalog";
import { centers } from "../src/data/centers";
import { seedActivities, seedListings } from "../src/data/seed";
import { mapImageNetLabel, IMAGENET_RULES } from "../src/lib/imagenetMap";
import * as selectors from "../src/store/selectors";
import type { Activity } from "../src/data/types";
import {
  haversineDistance,
  isOpenAt,
  centerLocalHour,
  directionsUrl,
} from "../src/lib/centers";
import { groupActivitiesByWeek } from "../src/lib/activity";
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
// Center scheduling uses venue-local time and handles overnight intervals.
assert.equal(haversineDistance([12.9716, 77.5946], [12.9716, 77.5946]), 0);
assert.ok(Math.abs(haversineDistance([0, 0], [0, 1]) - 111.195) < 0.01);
assert.equal(isOpenAt({ start: 9, end: 19 }, 9), true);
assert.equal(isOpenAt({ start: 9, end: 19 }, 19), false);
assert.equal(isOpenAt({ start: 22, end: 6 }, 23), true);
assert.equal(isOpenAt({ start: 22, end: 6 }, 5.5), true);
assert.equal(isOpenAt({ start: 22, end: 6 }, 12), false);
assert.equal(isOpenAt({ start: 0, end: 0 }, 12), true);
assert.equal(centerLocalHour(new Date("2026-10-24T03:30:00Z")), 9);
assert.equal(
  directionsUrl({ lat: 12.5, lng: 77.5 }),
  "https://www.google.com/maps/dir/?api=1&destination=12.5,77.5",
);
// Monday boundaries and descending date order remain stable across calendar weeks.
const weekly = groupActivitiesByWeek(
  [
    {
      ...sample[0],
      id: "sun",
      date: new Date(2026, 9, 18, 23, 59).toISOString(),
    },
    {
      ...sample[0],
      id: "mon",
      date: new Date(2026, 9, 19, 0, 1).toISOString(),
    },
    { ...sample[0], id: "sat", date: new Date(2026, 9, 24, 8).toISOString() },
  ],
  new Date(2026, 9, 24, 12),
);
assert.equal(weekly.length, 2);
assert.equal(weekly[0].label, "This week");
assert.equal(weekly[1].label, "Last week");
assert.deepEqual(
  weekly[0].items.map((a) => a.id),
  ["sat", "mon"],
);
assert.deepEqual(groupActivitiesByWeek([]), []);
// The drop-off payload uses the unchanged contract and persists its center link.
const destination = centers.find((c) => c.accepts.includes("plastic"))!;
useStore
  .getState()
  .addActivity({
    itemName: "PET bottle drop-off",
    category: "plastic",
    route: "recycle",
    weightKg: 0.25,
    status: "collected",
    centerId: destination.id,
  });
const dropOff = useStore.getState().activities[0];
assert.equal(dropOff.centerId, destination.id);
assert.equal(dropOff.status, "collected");
assert.equal(
  JSON.parse(memory.get("srijan-store-v1")!).state.activities[0].centerId,
  destination.id,
);
useStore.getState().updateActivityStatus(dropOff.id, "completed");
assert.equal(useStore.getState().activities[0].status, "completed");
useStore.getState().resetDemo();
assert.equal(useStore.getState().activities.length, 35);
assert.equal(useStore.getState().listings.length, 8);
assert.equal(readClassificationLog().length, 1);
console.log(
  "Passed: seed diversity, 42 catalog items, label mapping, impact calculations, persistence, activity updates, exchange transitions, duplicate handover protection, classification logs, demo reset, center distances/opening times, weekly grouping, and persisted drop-offs.",
);
