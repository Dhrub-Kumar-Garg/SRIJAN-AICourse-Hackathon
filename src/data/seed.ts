import type { Activity, Listing } from "./types";
import { catalog } from "./catalog";
export function seedActivities(): Activity[] {
  return Array.from({ length: 35 }, (_, i) => {
    const item = catalog[(i * 11 + 2) % catalog.length];
    return {
      id: `demo-${i}`,
      date: new Date(Date.now() - (i * 1.55 + 0.2) * 86400000).toISOString(),
      itemName: item.name,
      category: item.category,
      route: item.route,
      weightKg: Number((item.avgWeightKg * (1 + (i % 5))).toFixed(3)),
      status: (["completed", "completed", "collected", "pending"] as const)[
        i % 4
      ],
    };
  });
}
export function seedListings(): Listing[] {
  return [
    "Glass storage jars",
    "Moving boxes, set of 6",
    "Denim jacket",
    "Laptop with a loose hinge",
    "Cotton tote bags",
    "Reading lamp",
    "Plant pots",
    "Canvas backpack",
  ].map((title, i) => ({
    id: `listing-${i}`,
    title,
    category: (
      [
        "glass",
        "paper",
        "textile",
        "ewaste",
        "textile",
        "ewaste",
        "plastic",
        "textile",
      ] as const
    )[i],
    condition: i === 3 ? "needs-repair" : i % 2 ? "fair" : "good",
    qty: i === 0 ? 4 : i === 1 ? 6 : 1,
    area: ["Indiranagar", "Koramangala", "Jayanagar", "Whitefield"][i % 4],
    postedBy: `Demo neighbour ${i + 1}`,
    note: [
      "Clean and ready for a new home.",
      "A little less waste, a little more possibility.",
    ][i % 2],
    status: i < 5 ? "available" : i < 7 ? "requested" : "handed_over",
    requestedBy: i >= 5 ? "Demo neighbour" : undefined,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  }));
}
