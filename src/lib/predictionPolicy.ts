import type { Category } from "../data/types";
import { mapImageNetLabel } from "./imagenetMap";

export type Prediction = { className: string; probability: number };
export const LOW_CONFIDENCE_THRESHOLD = 0.45;
export const CONFLICT_MARGIN = 0.15;
// Fixed heuristics, chosen before benchmark inference; not calibrated probabilities.
export function assessPredictions(predictions: Prediction[]): {
  category: Category | null;
  reason: string;
} {
  const top = predictions[0];
  if (
    !top ||
    !Number.isFinite(top.probability) ||
    top.probability < 0 ||
    top.probability > 1
  )
    return {
      category: null,
      reason: "No usable prediction. Please choose the category yourself.",
    };
  if (top.probability < LOW_CONFIDENCE_THRESHOLD)
    return {
      category: null,
      reason:
        "Low confidence. Please inspect the item and choose its category.",
    };
  const category = mapImageNetLabel(top.className);
  if (!category)
    return {
      category: null,
      reason:
        "This object label does not establish its material. Check what the item is made of and choose a category.",
    };
  const conflict = predictions.slice(1).some((p) => {
    const alternative = mapImageNetLabel(p.className);
    return (
      Number.isFinite(p.probability) &&
      p.probability >= 0 &&
      p.probability <= 1 &&
      alternative &&
      alternative !== category &&
      top.probability - p.probability < CONFLICT_MARGIN
    );
  });
  if (conflict)
    return {
      category: null,
      reason:
        "The leading labels suggest different categories. Please choose after inspecting the item.",
    };
  return {
    category,
    reason:
      "Suggested category. Check the material, condition and contamination before confirming.",
  };
}
