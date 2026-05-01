export type ImageRole = "front" | "closeup" | "side";

export type PhotoSlot = {
  role: ImageRole;
  title: string;
  guidance: string;
  file: File | null;
  previewUrl: string | null;
  messages: string[];
};

export type Prediction = {
  key: string;
  label: string;
  probability: number;
  threshold: number;
  prediction: "yes" | "no";
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  retailer: string;
  priceTier: string;
  price: string;
  currency: string;
  rating: string;
  reviewCount: string;
  match: string;
  score: number;
  timing: string;
  frequency: string;
  ingredients: string;
  why: string;
  imageUrl: string;
  url: string;
};

export type ConditionStatus = "detected" | "possible" | "not_detected";

export type AggregatedCondition = {
  key: string;
  label: string;
  status: ConditionStatus;
  detections: number;
  total: number;
  averageProbability: number;
};

export type SkinProfile = {
  main_concerns: string[];
  secondary_concerns: string[];
  recommendation_focus: string[];
};

export type ImageValidation = {
  role: ImageRole;
  ok: boolean;
  messages: string[];
  metrics: Record<string, number>;
};

export type AnalyzeSessionResponse = {
  imageValidations: ImageValidation[];
  perImagePredictions: Record<ImageRole, Prediction[]>;
  result: {
    detected: string[];
    possible: string[];
    not_detected: string[];
    conditions: AggregatedCondition[];
    skin_profile: SkinProfile;
  };
  routine: {
    morning: Product[];
    evening: Product[];
    products: Product[];
  };
  disclaimer: string;
};
