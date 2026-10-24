import type { Category } from "./types";

export type EvaluationResult = {
  testImage: string;
  expectedCategory: Category;
  predictedCategory: Category | null;
  confidence: number;
  failureReason?: string;
};

// UI fixtures ONLY: these are invented examples, not outputs of model inference.
// Replace all 20 rows with independently labelled, real inference results before
// setting this flag to false. testImage is an identifier, never an uploaded photo.
export const EVALUATION_IS_PLACEHOLDER = true;
export const evalResults: EvaluationResult[] = [
  {
    testImage: "placeholder-01-pet-bottle",
    expectedCategory: "plastic",
    predictedCategory: "plastic",
    confidence: 0.91,
  },
  {
    testImage: "placeholder-02-clear-bottle",
    expectedCategory: "plastic",
    predictedCategory: "glass",
    confidence: 0.42,
    failureReason:
      "Transparent plastic confused with glass; appearance does not establish material.",
  },
  {
    testImage: "placeholder-03-detergent-bottle",
    expectedCategory: "plastic",
    predictedCategory: "plastic",
    confidence: 0.77,
  },
  {
    testImage: "placeholder-04-newspaper",
    expectedCategory: "paper",
    predictedCategory: "paper",
    confidence: 0.88,
  },
  {
    testImage: "placeholder-05-folded-carton",
    expectedCategory: "paper",
    predictedCategory: "paper",
    confidence: 0.33,
  },
  {
    testImage: "placeholder-06-glass-jar",
    expectedCategory: "glass",
    predictedCategory: "glass",
    confidence: 0.84,
  },
  {
    testImage: "placeholder-07-reflective-bottle",
    expectedCategory: "glass",
    predictedCategory: "plastic",
    confidence: 0.58,
    failureReason:
      "Reflections and packaging cues suggest plastic despite the glass material.",
  },
  {
    testImage: "placeholder-08-tin-can",
    expectedCategory: "metal",
    predictedCategory: "metal",
    confidence: 0.8,
  },
  {
    testImage: "placeholder-09-crushed-can",
    expectedCategory: "metal",
    predictedCategory: "metal",
    confidence: 0.41,
  },
  {
    testImage: "placeholder-10-banana-peel",
    expectedCategory: "organic",
    predictedCategory: "organic",
    confidence: 0.95,
  },
  {
    testImage: "placeholder-11-vegetable-scraps",
    expectedCategory: "organic",
    predictedCategory: "organic",
    confidence: 0.71,
  },
  {
    testImage: "placeholder-12-mixed-scraps",
    expectedCategory: "organic",
    predictedCategory: "residual",
    confidence: 0.29,
    failureReason:
      "Cluttered mixed-waste background obscures the organic item.",
  },
  {
    testImage: "placeholder-13-old-phone",
    expectedCategory: "ewaste",
    predictedCategory: "ewaste",
    confidence: 0.9,
  },
  {
    testImage: "placeholder-14-charger",
    expectedCategory: "ewaste",
    predictedCategory: "metal",
    confidence: 0.38,
    failureReason:
      "Visible metal connector dominates; electronic components need user confirmation.",
  },
  {
    testImage: "placeholder-15-shirt",
    expectedCategory: "textile",
    predictedCategory: "textile",
    confidence: 0.87,
  },
  {
    testImage: "placeholder-16-tote-bag",
    expectedCategory: "textile",
    predictedCategory: "textile",
    confidence: 0.65,
  },
  {
    testImage: "placeholder-17-battery",
    expectedCategory: "hazardous",
    predictedCategory: "hazardous",
    confidence: 0.62,
  },
  {
    testImage: "placeholder-18-paint-tin",
    expectedCategory: "hazardous",
    predictedCategory: "residual",
    confidence: 0.24,
    failureReason:
      "The container label is unreadable; hazardous contents cannot be inferred visually.",
  },
  {
    testImage: "placeholder-19-wrapper",
    expectedCategory: "residual",
    predictedCategory: "residual",
    confidence: 0.79,
  },
  {
    testImage: "placeholder-20-unfamiliar-foam",
    expectedCategory: "residual",
    predictedCategory: null,
    confidence: 0.18,
    failureReason: "Unmapped object label; require manual category selection.",
  },
];
