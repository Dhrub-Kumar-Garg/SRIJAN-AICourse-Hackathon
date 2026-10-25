// Curated source snapshot, not a runtime dependency on scraping or geocoding.
// Run deliberately, review the diff, and confirm operator policies before release.
import { writeFile } from "node:fs/promises";

const checkedAt = new Date().toISOString().slice(0, 10);
const userAgent =
  "Srijan-directory/1.0 (+https://github.com/Dhrub-Kumar-Garg/SRIJAN-AICourse-Hackathon)";
const bbmpSource =
  "https://apps.bbmpgov.in/SWM/Home/Forms/Publicwastestream.aspx?Page=dry";
const programSource = "https://www.croma.com/lp-sustainable-living";
const stores = [
  ["indiranagar", "indiranagar", "263536"],
  ["nagarbhavi", "nagarabhavi", "263570"],
  ["jayanagar", "jayanagar", "263735"],
  ["carmelaram", "doddakanahalli", "316932"],
];
async function read(url, json = false) {
  const response = await fetch(url, {
    headers: { "User-Agent": userAgent },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  return json ? response.json() : response.text();
}
function clock(value) {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(value);
  if (!match || +match[1] < 1 || +match[1] > 12 || +match[2] > 59)
    throw new Error(`Unrecognised hours: ${value}`);
  return (
    (+match[1] % 12) +
    (match[3].toUpperCase() === "PM" ? 12 : 0) +
    +match[2] / 60
  );
}
function decode(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&#039;", "'")
    .replaceAll("&quot;", '"');
}
const records = [];
for (const [slug, locality, id] of stores) {
  const url = `https://store.croma.com/croma-${slug}-electronics-retail-and-repair-shop-${locality}-bengaluru-${id}/Home`;
  const html = await read(url);
  const entries = [
    ...html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ].flatMap((match) => JSON.parse(match[1]));
  const place = entries.find(
    (entry) => entry.geo && entry.openingHoursSpecification?.length === 7,
  );
  const named = entries.find(
    (entry) => entry.geo && entry.name?.startsWith("Croma -"),
  );
  if (!place || !named) throw new Error(`Missing store metadata: ${url}`);
  const address = Array.isArray(place.address)
    ? place.address[0]
    : place.address;
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const schedule = place.openingHoursSpecification.map((row) => {
    const day = days.indexOf(row.dayOfWeek);
    if (day < 0) throw new Error(`Unknown weekday: ${row.dayOfWeek}`);
    return { day, start: clock(row.opens), end: clock(row.closes) };
  });
  if (new Set(schedule.map((row) => row.day)).size !== 7)
    throw new Error("Incomplete schedule");
  const first = place.openingHoursSpecification[0];
  const uniform = schedule.every(
    (row) => row.start === schedule[0].start && row.end === schedule[0].end,
  );
  records.push({
    center: {
      id: `croma-${id}`,
      name: named.name,
      lat: +place.geo.latitude,
      lng: +place.geo.longitude,
      address: decode(
        `${address.streetAddress}, ${address.addressLocality}, Bengaluru ${address.postalCode}`,
      ),
      hours: uniform
        ? `Daily, ${first.opens} – ${first.closes} (store hours)`
        : "Hours vary by weekday; see source",
      openHours: { start: schedule[0].start, end: schedule[0].end },
      type: "ewaste",
      accepts: ["ewaste"],
    },
    details: {
      sourceLabel: "Croma official store",
      sourceUrl: url,
      materialsSourceUrl: programSource,
      materialsSourceLabel: "E-waste programme",
      checkedAt,
      schedule,
      phone: address.telephone[0],
      evidence: "Operator listing",
      note: "Croma advertises in-store e-waste collection. Call to confirm your device and intake availability; store hours do not guarantee collection service. Do not leave items outside.",
      coordinateNote: "Coordinates published by the operator.",
      mapUpdatedAt: null,
    },
  });
}
for (const [id, area] of [
  [1119896626, "Austin Town"],
  [530598182, "Hennur"],
]) {
  const url = `https://api.openstreetmap.org/api/0.6/way/${id}/full.json`;
  const data = await read(url, true);
  const way = data.elements.find((row) => row.type === "way" && row.id === id);
  if (
    way?.tags?.amenity !== "recycling" ||
    !way.tags.name?.includes("Dry Waste")
  )
    throw new Error(`OSM facility changed: ${id}`);
  const points = data.elements.filter(
    (row) => row.type === "node" && way.nodes.includes(row.id),
  );
  if (!points.length || points.length !== new Set(way.nodes).size)
    throw new Error("Incomplete geometry");
  records.push({
    center: {
      id: `osm-way-${id}`,
      name: `${way.tags.name} · ${area}`,
      lat: +(points.reduce((n, p) => n + p.lat, 0) / points.length).toFixed(7),
      lng: +(points.reduce((n, p) => n + p.lon, 0) / points.length).toFixed(7),
      address: `${area}, Bengaluru · mapped site; street address not listed`,
      hours: "Hours not published",
      openHours: { start: 0, end: 0 },
      type: "recycling",
      accepts: ["plastic", "paper", "glass", "metal"],
    },
    details: {
      sourceLabel: "OpenStreetMap record",
      sourceUrl: `https://www.openstreetmap.org/way/${id}`,
      materialsSourceUrl: bbmpSource,
      materialsSourceLabel: "BBMP dry-waste guidance",
      checkedAt,
      schedule: [],
      phone: null,
      evidence: "Community mapped",
      note: "Materials shown are the general BBMP dry-waste stream, not verified acceptance at this site. Confirm ward access, exact items and hours with the local operator before visiting. No e-waste or hazardous-waste acceptance is assumed.",
      coordinateNote:
        "Pin is the centre of the mapped building, not a verified entrance.",
      mapUpdatedAt: way.timestamp.slice(0, 10),
    },
  });
}
if (new Set(records.map((r) => r.center.id)).size !== records.length)
  throw new Error("Duplicate facility");
for (const { center } of records) {
  if (!(
    center.lat > 12.8 &&
    center.lat < 13.2 &&
    center.lng > 77.4 &&
    center.lng < 77.85
  ))
    throw new Error(`Invalid Bengaluru coordinates: ${center.id}`);
}
const snapshot = {
  checkedAt,
  city: "Bengaluru",
  coverage:
    "Curated directory; not a complete city inventory or a live availability feed.",
  osmAttribution: "© OpenStreetMap contributors",
  osmLicense: "https://opendatacommons.org/licenses/odbl/1-0/",
  records,
};
// Only replace the snapshot after every source and record passes validation.
await writeFile(
  new URL("../src/data/centerDirectory.json", import.meta.url),
  `${JSON.stringify(snapshot, null, 2)}\n`,
);
console.log(
  `Refreshed ${records.length} sourced Bengaluru facilities (${checkedAt}). Review changes before committing.`,
);
