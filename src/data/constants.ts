import {
  Milk as Bottle,
  Newspaper,
  GlassWater,
  Package,
  Leaf,
  Smartphone,
  Shirt,
  TriangleAlert,
  Trash2,
} from "lucide-react";
import type { Category, Route } from "./types";
export const CATEGORY_META = {
  plastic: { label: "Plastic", color: "#3B82F6", icon: Bottle },
  paper: { label: "Paper", color: "#B48A56", icon: Newspaper },
  glass: { label: "Glass", color: "#14B8A6", icon: GlassWater },
  metal: { label: "Metal", color: "#64748B", icon: Package },
  organic: { label: "Organic", color: "#65A30D", icon: Leaf },
  ewaste: { label: "E-waste", color: "#8B5CF6", icon: Smartphone },
  textile: { label: "Textile", color: "#EC4899", icon: Shirt },
  hazardous: { label: "Hazardous", color: "#DC2626", icon: TriangleAlert },
  residual: { label: "Residual", color: "#6B7280", icon: Trash2 },
} satisfies Record<
  Category,
  { label: string; color: string; icon: typeof Leaf }
>;
export const ROUTE_META: Record<
  Route,
  { label: string; color: string; meaning: string }
> = {
  recycle: {
    label: "Recycle",
    color: "#16A34A",
    meaning: "Recover materials for a fresh start.",
  },
  reuse: {
    label: "Reuse",
    color: "#0D9488",
    meaning: "Pass something useful to someone new.",
  },
  repair: {
    label: "Repair",
    color: "#6366F1",
    meaning: "A little care can extend its life.",
  },
  compost: {
    label: "Compost",
    color: "#84A336",
    meaning: "Return organic goodness to the earth.",
  },
  special: {
    label: "Special care",
    color: "#D97706",
    meaning: "Use a specialist collection facility.",
  },
  dispose: {
    label: "Dispose",
    color: "#6B7280",
    meaning: "Safely handle what cannot be recovered.",
  },
};
// Indicative approximations, not verified lifecycle measurements; vary by processing and region.
export const CO2E_PER_KG: Record<Category, number> = {
  plastic: 1.5,
  paper: 0.9,
  glass: 0.3,
  metal: 4,
  organic: 0.5,
  ewaste: 2.5,
  textile: 3.6,
  hazardous: 0,
  residual: 0,
};
// Default directory area: Bengaluru. Facilities have dated provenance in centerDirectory.json.
export const CITY_CENTER: [number, number] = [12.9716, 77.5946];
