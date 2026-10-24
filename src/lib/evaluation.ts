import { CATEGORY_META } from "../data/constants";
import type { EvaluationResult } from "../data/evalResults";
import type { Category } from "../data/types";
import type { ClassificationRun } from "./classificationLog";

export const LOW_CONFIDENCE_THRESHOLD = 0.45;
export function evaluationSummary(rows: EvaluationResult[]) {
  const correct = rows.filter(
    (r) => r.expectedCategory === r.predictedCategory,
  ).length;
  const lowConfidence = rows.filter(
    (r) => r.confidence < LOW_CONFIDENCE_THRESHOLD,
  ).length;
  return {
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
