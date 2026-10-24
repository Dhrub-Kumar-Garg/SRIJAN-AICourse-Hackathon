import type { Category } from "../data/types";
export type ClassificationRun = {
  predictedCategory: Category | null;
  confirmedCategory: Category;
  confidence: number;
  timestamp: string;
};
export function readClassificationLog(): ClassificationRun[] {
  try {
    return JSON.parse(
      localStorage.getItem("srijan-classification-log") || "[]",
    );
  } catch {
    return [];
  }
}
export function logClassification(run: ClassificationRun) {
  localStorage.setItem(
    "srijan-classification-log",
    JSON.stringify([...readClassificationLog(), run]),
  );
}
