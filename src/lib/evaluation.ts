import { CATEGORY_META } from "../data/constants";
import type { EvaluationResult } from "../data/evalResults";
import type { Category } from "../data/types";
import type { ClassificationRun } from "./classificationLog";

import { MATERIAL_THRESHOLD as LOW_CONFIDENCE_THRESHOLD } from "./wastePolicy";
export { MATERIAL_THRESHOLD as LOW_CONFIDENCE_THRESHOLD } from "./wastePolicy";
export function evaluationSummary(rows: EvaluationResult[]) {
  const correct = rows.filter(
    (r) => r.expectedCategory === r.predictedCategory,
  ).length;
  const lowConfidence = rows.filter(
    (r) => r.confidence < LOW_CONFIDENCE_THRESHOLD,
  ).length;
  return {
    suggested: rows.filter((r) => r.predictedCategory !== null).length,
    manualReview: rows.filter((r) => r.predictedCategory === null).length,
    suggestionAccuracy: rows.some((r) => r.predictedCategory !== null)
      ? correct / rows.filter((r) => r.predictedCategory !== null).length
      : null,
    total: rows.length,
    correct,
    accuracy: rows.length ? correct / rows.length : null,
    lowConfidence,
    lowConfidenceShare: rows.length ? lowConfidence / rows.length : null,
    failures: rows.filter((r) => r.expectedCategory !== r.predictedCategory),
    perCategory: Object.entries(CATEGORY_META).map(([key, meta]) => {
      const sample = rows.filter((r) => r.expectedCategory === key);
      const matches = sample.filter((r) => r.predictedCategory === key).length;
      return {
        category: key as Category,
        ...meta,
        total: sample.length,
        correct: matches,
        accuracy: sample.length ? matches / sample.length : null,
      };
    }),
  };
}
export function overrideSummary(log: ClassificationRun[]) {
  const overridden = log.filter(
    (r) => r.predictedCategory !== r.confirmedCategory,
  ).length;
  return {
    total: log.length,
    overridden,
    rate: log.length ? overridden / log.length : null,
  };
}
