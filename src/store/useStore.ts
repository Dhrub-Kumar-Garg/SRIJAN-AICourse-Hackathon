import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Activity, Listing } from "../data/types";
import { seedActivities, seedListings } from "../data/seed";
import { catalog } from "../data/catalog";
type Store = {
  activities: Activity[];
  listings: Listing[];
  addActivity: (a: Omit<Activity, "id" | "date">) => void;
  updateActivityStatus: (id: string, status: Activity["status"]) => void;
  addListing: (l: Omit<Listing, "id" | "createdAt" | "status">) => void;
  requestListing: (id: string, name: string) => void;
  markHandedOver: (id: string) => void;
  resetDemo: () => void;
};
export const useStore = create<Store>()(
  persist(
    (set) => ({
      activities: seedActivities(),
      listings: seedListings(),
      addActivity: (a) =>
        set((s) => ({
          activities: [
            { ...a, id: crypto.randomUUID(), date: new Date().toISOString() },
            ...s.activities,
          ],
        })),
      updateActivityStatus: (id, status) =>
        set((s) => ({
          activities: s.activities.map((a) =>
            a.id === id ? { ...a, status } : a,
          ),
        })),
      addListing: (l) =>
        set((s) => ({
          listings: [
            {
              ...l,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              status: "available",
            },
            ...s.listings,
          ],
        })),
      requestListing: (id, name) =>
        set((s) => ({
          listings: s.listings.map((l) =>
            l.id === id && l.status === "available"
              ? { ...l, status: "requested", requestedBy: name }
              : l,
          ),
        })),
      markHandedOver: (id) =>
        set((s) => {
          const l = s.listings.find((l) => l.id === id);
          if (!l || l.status !== "requested") return s;
          const weight =
            catalog.find((c) => c.category === l.category)?.avgWeightKg ?? 0.2;
          return {
            listings: s.listings.map((x) =>
              x.id === id ? { ...x, status: "handed_over" } : x,
            ),
            activities: [
              {
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                itemName: l.title,
                category: l.category,
                route: "reuse",
                weightKg: weight * l.qty,
                status: "completed",
              },
              ...s.activities,
            ],
          };
        }),
      resetDemo: () =>
        set({ activities: seedActivities(), listings: seedListings() }),
    }),
    { name: "srijan-store-v1" },
  ),
);
