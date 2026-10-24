import type { Category } from "../data/types";
const GROUPED_RULES: { keywords: string[]; category: Category }[] = [
  {
    keywords: [
      "glass bottle",
      "wine bottle",
      "beer bottle",
      "wine glass",
      "goblet",
      "glass jar",
    ],
    category: "glass",
  },
  {
    keywords: [
      "plastic bottle",
      "water bottle",
      "pop bottle",
      "soda bottle",
      "bottle",
      "plastic bag",
      "bucket",
      "shampoo",
      "detergent",
      "water jug",
      "rubber",
    ],
    category: "plastic",
  },
  {
    keywords: [
      "tin can",
      "beer can",
      "soda can",
      "can",
      "tin",
      "frying pan",
      "wok",
      "steel",
      "aluminium",
      "aluminum",
      "metal",
      "spoon",
      "fork",
    ],
    category: "metal",
  },
  {
    keywords: [
      "carton",
      "envelope",
      "paper",
      "newspaper",
      "cardboard",
      "book",
      "comic",
      "packet",
    ],
    category: "paper",
  },
  {
    keywords: [
      "banana",
      "orange",
      "apple",
      "broccoli",
      "lemon",
      "cucumber",
      "carrot",
      "cauliflower",
      "cabbage",
      "pineapple",
      "strawberry",
      "potato",
      "mushroom",
      "corn",
      "acorn",
      "leaf",
      "lettuce",
    ],
    category: "organic",
  },
  {
    keywords: [
      "laptop",
      "notebook computer",
      "cellular telephone",
      "cellphone",
      "mobile phone",
      "mouse",
      "remote",
      "keyboard",
      "monitor",
      "computer",
      "television",
      "printer",
      "modem",
      "ipod",
      "camera",
      "headphone",
      "radio",
    ],
    category: "ewaste",
  },
  {
    keywords: [
      "jersey",
      "sock",
      "shirt",
      "jean",
      "sweatshirt",
      "suit",
      "gown",
      "textile",
      "fabric",
      "backpack",
      "towel",
      "shoe",
      "sandal",
      "purse",
    ],
    category: "textile",
  },
  {
    keywords: ["battery", "paint", "fluorescent", "medicine", "syringe"],
    category: "hazardous",
  },
  {
    keywords: ["ceramic", "pottery", "diaper", "styrofoam"],
    category: "residual",
  },
];
// Specialist hazards must take precedence over broad material words such as "tin".
export const IMAGENET_RULES = [
  ...GROUPED_RULES.filter((r) => r.category === "hazardous"),
  ...GROUPED_RULES.filter((r) => r.category !== "hazardous"),
].flatMap((rule) =>
  rule.keywords.map((keyword) => ({
    keywords: [keyword],
    category: rule.category,
  })),
);
export function mapImageNetLabel(label: string): Category | null {
  const value = label.toLowerCase();
  for (const rule of IMAGENET_RULES)
    if (
      rule.keywords.some((k) =>
        new RegExp("(?:^|[^a-z])" + k + "(?:$|[^a-z])").test(value),
      )
    )
      return rule.category;
  return null;
}
