export type Category =
  | "plastic"
  | "paper"
  | "glass"
  | "metal"
  | "organic"
  | "ewaste"
  | "textile"
  | "hazardous"
  | "residual";
export type Route =
  "recycle" | "reuse" | "repair" | "compost" | "special" | "dispose";
export type CatalogItem = {
  id: string;
  name: string;
  category: Category;
  route: Route;
  why: string;
  tip: string;
  avgWeightKg: number;
  keywords: string[];
};
export type Center = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  hours: string;
  openHours: { start: number; end: number };
  type:
    "recycling" | "ewaste" | "compost" | "textile" | "hazardous" | "reuse-hub";
  accepts: Category[];
};
export type Activity = {
  id: string;
  date: string;
  itemName: string;
  category: Category;
  route: Route;
  weightKg: number;
  status: "pending" | "collected" | "completed";
  centerId?: string;
};
export type Listing = {
  id: string;
  title: string;
  category: Category;
  condition: "good" | "fair" | "needs-repair";
  qty: number;
  area: string;
  postedBy: string;
  note?: string;
  status: "available" | "requested" | "handed_over";
  requestedBy?: string;
  createdAt: string;
};
