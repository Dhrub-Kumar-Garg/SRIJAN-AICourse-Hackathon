import type { Center } from "./types";
import directory from "./centerDirectory.json";

// Preserve the Center contract; provenance and weekday schedules live alongside it.
export const centers: Center[] = directory.records.map(
  (record) => record.center as Center,
);
export const centerDetails = Object.fromEntries(
  directory.records.map((record) => [record.center.id, record.details]),
);
export const directoryCheckedAt = directory.checkedAt;
export const directoryCoverage = directory.coverage;
