// Shared data contract. MUST match the backend exactly.

export type Confidence = "high" | "medium" | "low";
export type Difficulty = "easy" | "medium" | "hard";

export interface IdentifiedIngredient {
  name: string;
  confidence: Confidence;
}

export interface Ingredient {
  name: string;
  available: boolean;
}

export interface Recipe {
  title: string;
  time_minutes: number;
  difficulty: Difficulty;
  ingredients: Ingredient[];
  steps: string[];
  missing_count: number;
}

export interface RecipeResponse {
  identified_ingredients: IdentifiedIngredient[];
  recipes: Recipe[];
  fun_fact: string;
  message?: string | null;
}

export interface DietaryPreferences {
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
}

export type ScanMode = "normal" | "surprise";
