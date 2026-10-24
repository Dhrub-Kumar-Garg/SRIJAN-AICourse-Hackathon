import type { Center } from "./types";
import { CITY_CENTER } from "./constants";
const names = [
  "Green Loop Collective",
  "Second Life Station",
  "Circuit Care Hub",
  "Earthworks Compost",
  "Thread Again Studio",
  "SafeCycle Collection",
  "Neighbourhood Reuse Hub",
  "Paper Trail Recovery",
  "Renew Resource Center",
  "Leaf & Soil Collective",
  "Reboot Electronics",
  "Fabric Futures",
  "Careful Collection Point",
  "Circular Community Hub",
];
export const centers: Center[] = names.map((name, i) => {
  const type: Center["type"] = (
    [
      "recycling",
      "reuse-hub",
      "ewaste",
      "compost",
      "textile",
      "hazardous",
      "reuse-hub",
      "recycling",
      "recycling",
      "compost",
      "ewaste",
      "textile",
      "hazardous",
      "reuse-hub",
    ] as const
  )[i];
  const radius = 0.012 + (i % 5) * 0.009;
  return {
    id: `center-${i + 1}`,
    name,
    lat: CITY_CENTER[0] + Math.sin(i * 2.4) * radius,
    lng: CITY_CENTER[1] + Math.cos(i * 2.4) * radius,
    address: `${12 + i * 7}, Demo ${["Garden Road", "Lake Avenue", "Market Street"][i % 3]}, Bengaluru`,
    hours: i % 3 === 0 ? "Daily, 8 AM – 6 PM" : "Daily, 9 AM – 7 PM",
    openHours: { start: i % 3 === 0 ? 8 : 9, end: i % 3 === 0 ? 18 : 19 },
    type,
    accepts:
      type === "recycling"
        ? ["plastic", "paper", "glass", "metal"]
        : type === "reuse-hub"
          ? ["textile", "glass", "paper", "plastic"]
          : type === "ewaste"
            ? ["ewaste"]
            : type === "compost"
              ? ["organic"]
              : type === "textile"
                ? ["textile"]
                : ["hazardous", "plastic"],
  };
});
