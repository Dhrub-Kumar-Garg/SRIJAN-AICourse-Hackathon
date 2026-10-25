import type { Category } from "../data/types";
import metadata from "../data/wasteModelMetadata.json";
import type { Prediction } from "./predictionPolicy";

export const WASTE_CATEGORIES = metadata.categories as Category[];
export const MATERIAL_THRESHOLD = metadata.policy.confidenceThreshold;
export const MATERIAL_MARGIN = metadata.policy.marginThreshold;

export function assessWastePredictions(predictions: Prediction[]): {
  category: Category | null;
  reason: string;
} {
  const [first, second] = predictions;
  if (
    !first ||
    !WASTE_CATEGORIES.includes(first.className as Category) ||
    !Number.isFinite(first.probability) ||
    first.probability < 0 ||
    first.probability > 1
  )
    return {
      category: null,
      reason:
        "No usable material prediction. Please choose the category yourself.",
    };
  if (first.probability < MATERIAL_THRESHOLD)
    return {
      category: null,
      reason: "Low material-model score; choose a category manually.",
    };
  if (
    second &&
    (!Number.isFinite(second.probability) ||
      second.probability < 0 ||
      second.probability > first.probability ||
      first.probability - second.probability < MATERIAL_MARGIN)
  )
    return {
      category: null,
      reason: "Leading material scores are too close; choose manually.",
    };
  return {
    category: first.className as Category,
    reason:
      "Suggested material. Check composition, contamination and condition before confirming.",
  };
}
