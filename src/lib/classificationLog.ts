import type { Category } from "../data/types";
import { CATEGORY_META } from "../data/constants";
export const CLASSIFICATION_LOG_EVENT = "srijan-classification-change";
export type ClassificationRun = {
  predictedCategory: Category | null;
  confirmedCategory: Category;
  confidence: number;
  timestamp: string;
};
export function readClassificationLog(): ClassificationRun[] {
  try {
    const rows: unknown = JSON.parse(
      localStorage.getItem("srijan-classification-log") || "[]",
    );
    if (!Array.isArray(rows)) return [];
    return rows.filter(
      (r): r is ClassificationRun =>
        !!r &&
        typeof r === "object" &&
        (r.predictedCategory === null ||
          (typeof r.predictedCategory === "string" &&
            Object.hasOwn(CATEGORY_META, r.predictedCategory))) &&
        typeof r.confirmedCategory === "string" &&
        Object.hasOwn(CATEGORY_META, r.confirmedCategory) &&
        typeof r.confidence === "number" &&
        Number.isFinite(r.confidence) &&
        r.confidence >= 0 &&
        r.confidence <= 1 &&
        typeof r.timestamp === "string" &&
        Number.isFinite(Date.parse(r.timestamp)),
    );
  } catch {
    return [];
  }
}
export function logClassification(run: ClassificationRun) {
  try {
    localStorage.setItem(
      "srijan-classification-log",
      JSON.stringify([...readClassificationLog(), run]),
    );
    if (typeof window.dispatchEvent === "function")
      window.dispatchEvent(new Event(CLASSIFICATION_LOG_EVENT));
    return true;
  } catch {
    return false;
  }
}
