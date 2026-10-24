import {
  Recycle,
  Smartphone,
  Leaf,
  Shirt,
  TriangleAlert,
  ArrowLeftRight,
} from "lucide-react";
import type { Center, Route } from "../data/types";

export const CENTER_TYPE_META = {
  recycling: {
    label: "Recycling",
    color: "#16A34A",
    icon: Recycle,
    route: "recycle",
  },
  ewaste: {
    label: "E-waste",
    color: "#8B5CF6",
    icon: Smartphone,
    route: "special",
  },
  compost: { label: "Compost", color: "#84A336", icon: Leaf, route: "compost" },
  textile: { label: "Textile", color: "#DB2777", icon: Shirt, route: "reuse" },
  hazardous: {
    label: "Hazardous",
    color: "#DC2626",
    icon: TriangleAlert,
    route: "special",
  },
  "reuse-hub": {
    label: "Reuse hub",
    color: "#0D9488",
    icon: ArrowLeftRight,
    route: "reuse",
  },
} satisfies Record<
  Center["type"],
  { label: string; color: string; icon: typeof Leaf; route: Route }
>;

export function haversineDistance(a: [number, number], b: [number, number]) {
  const rad = Math.PI / 180;
  const h =
    Math.sin(((b[0] - a[0]) * rad) / 2) ** 2 +
    Math.cos(a[0] * rad) *
      Math.cos(b[0] * rad) *
      Math.sin(((b[1] - a[1]) * rad) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}

export function isOpenAt(openHours: Center["openHours"], hour: number) {
  const { start, end } = openHours;
  if (start === end) return true;
  return start < end
    ? hour >= start && hour < end
    : hour >= start || hour < end;
}

/** Fictional centers are in Bengaluru; opening hours follow Asia/Kolkata. */
export function centerLocalHour(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return (
    Number(parts.find((p) => p.type === "hour")?.value) +
    Number(parts.find((p) => p.type === "minute")?.value) / 60
  );
}
export function directionsUrl(center: Pick<Center, "lat" | "lng">) {
  return `https://www.google.com/maps/dir/?api=1&destination=${center.lat},${center.lng}`;
}
