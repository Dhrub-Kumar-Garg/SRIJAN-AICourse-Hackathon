import { catalog } from "../data/catalog";
import { centers } from "../data/centers";
import type { Activity, Listing } from "../data/types";
import {
  co2eSavedKg,
  diversionRate,
  itemsRerouted,
  landfillAvoidedKg,
} from "../store/selectors";

export const demoPhone = catalog.find((item) => item.name === "Old phone")!;
export const demoCenter = centers.find(
  (center) => center.type === "ewaste" && center.accepts.includes("ewaste"),
)!;
export const demoLamp = "working study lamp";
export const phoneSteps = [
  "Classify an item",
  "Read the Route Card",
  "Find an e-waste center",
  "Log the drop-off",
  "See your impact",
];
export const reuseSteps = [
  "List the study lamp",
  "Request the lamp",
  "Confirm the handover",
];
export const impactSnapshot = (activities: Activity[]) => ({
  diversion: diversionRate(activities) * 100,
  landfill: landfillAvoidedKg(activities),
  co2e: co2eSavedKg(activities),
  items: itemsRerouted(activities),
});
export type DemoSession = {
  phase: "phone" | "reuse" | "complete";
  step: number;
  startedAt: number;
  baseline: ReturnType<typeof impactSnapshot>;
  activityId?: string;
  listingId?: string;
};

export function parseDemoSession(raw: string | null): DemoSession | null {
  try {
    const s = JSON.parse(raw ?? "null");
    if (
      !s ||
      !["phone", "reuse", "complete"].includes(s.phase) ||
      !Number.isInteger(s.step) ||
      s.step < 0 ||
      s.step >= (s.phase === "phone" ? 5 : s.phase === "reuse" ? 3 : 1) ||
      !Number.isFinite(s.startedAt) ||
      !s.baseline ||
      !["diversion", "landfill", "co2e", "items"].every(
        (key) =>
          typeof s.baseline[key] === "number" &&
          Number.isFinite(s.baseline[key]),
      ) ||
      (s.activityId !== undefined && typeof s.activityId !== "string") ||
      (s.listingId !== undefined && typeof s.listingId !== "string")
    )
      return null;
    return s;
  } catch {
    return null;
  }
}

export function demoRecords(
  session: DemoSession | null,
  activities: Activity[],
  listings: Listing[],
) {
  const dropoff = session
    ? activities.find((a) =>
        session.activityId
          ? a.id === session.activityId
          : new Date(a.date).getTime() >= session.startedAt &&
            a.itemName.toLowerCase() === demoPhone.name.toLowerCase() &&
            a.category === "ewaste" &&
            a.route === "special" &&
            a.status !== "pending" &&
            centers.some(
              (c) => c.id === a.centerId && c.accepts.includes("ewaste"),
            ),
      )
    : undefined;
  const listing = session
    ? listings.find((l) =>
        session.listingId
          ? l.id === session.listingId
          : new Date(l.createdAt).getTime() >= session.startedAt &&
            l.title.toLowerCase() === demoLamp &&
            l.category === "ewaste",
      )
    : undefined;
  return { dropoff, listing };
}

export function demoReady(
  session: DemoSession,
  records: ReturnType<typeof demoRecords>,
) {
  if (session.phase === "phone") return session.step !== 3 || !!records.dropoff;
  if (session.phase === "complete") return true;
  return (
    !!records.listing &&
    (session.step === 0 ||
      (session.step === 1
        ? records.listing.status !== "available"
        : records.listing.status === "handed_over"))
  );
}

export function demoDestination(session: DemoSession) {
  if (session.phase === "complete") return "/dashboard?demo=complete";
  if (session.phase === "reuse") {
    const params = new URLSearchParams({ demo: `reuse-${session.step + 1}` });
    if (session.listingId) params.set("focus", session.listingId);
    else {
      params.set("new", "1");
      params.set("title", demoLamp);
      params.set("category", "ewaste");
    }
    return `/exchange?${params}`;
  }
  if (session.step === 4) return "/dashboard?demo=impact";
  if (session.step < 2) {
    const params = new URLSearchParams({
      q: "old phone",
      demo: session.step === 0 ? "classify" : "route",
    });
    if (session.step === 1) params.set("item", demoPhone.id);
    return `/classify?${params}`;
  }
  const params = new URLSearchParams({
    category: "ewaste",
    itemId: demoPhone.id,
    weightKg: String(demoPhone.avgWeightKg),
    centerId: demoCenter.id,
    demo: session.step === 2 ? "center" : "dropoff",
  });
  if (session.step === 3 && !session.activityId) params.set("dropoff", "1");
  return `/centers?${params}`;
}
