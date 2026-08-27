import { RecipeResponse, DietaryPreferences, ScanMode } from "@/types/recipe";
import { getIdToken } from "@/services/auth";

/**
 * Backend connection, read from Expo public env vars (see `.env`).
 * `EXPO_PUBLIC_*` values are inlined into the client bundle at build time.
 * None of these are secrets.
 */
export const AWS_REGION = process.env.EXPO_PUBLIC_AWS_REGION ?? "us-east-1";
export const AGENT_RUNTIME_ARN = process.env.EXPO_PUBLIC_AGENT_RUNTIME_ARN ?? "";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__ ? "http://localhost:8080/invocations" : "");

/**
 * Auth: Cognito User Pool JWT.
 *
 * The user signs in (see `services/auth.ts`) and we send their ID token as an
 * `Authorization: Bearer <token>` header. API Gateway's JWT authorizer
 * validates it before invoking the Lambda. Tokens are refreshed transparently
 * by `getIdToken()`.
 */
async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json",
  };
  const token = await getIdToken();
  if (token) headers.authorization = `Bearer ${token}`;
  return headers;
}

/** Thrown when the API rejects our token (expired/invalid session). */
export class UnauthorizedError extends Error {
  constructor() {
    super("Your session has expired. Please sign in again.");
    this.name = "UnauthorizedError";
  }
}


/**
 * Flip to `true` to demo the app with no backend running — analyzeImage will
 * return MOCK_RESPONSE after a short delay instead of hitting the network.
 */
export const USE_MOCK = false;

const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Realistic mock response for offline demos / development.
 */
export const MOCK_RESPONSE: RecipeResponse = {
  identified_ingredients: [
    { name: "Eggs", confidence: "high" },
    { name: "Cheddar cheese", confidence: "high" },
    { name: "Spinach", confidence: "medium" },
    { name: "Cherry tomatoes", confidence: "medium" },
    { name: "Butter", confidence: "high" },
    { name: "Milk", confidence: "high" },
    { name: "Red onion", confidence: "low" },
    { name: "Mushrooms", confidence: "medium" },
  ],
  recipes: [
    {
      title: "Cheesy Spinach Omelette",
      time_minutes: 15,
      difficulty: "easy",
      ingredients: [
        { name: "Eggs", available: true },
        { name: "Cheddar cheese", available: true },
        { name: "Spinach", available: true },
        { name: "Butter", available: true },
        { name: "Milk", available: true },
        { name: "Salt & pepper", available: false },
      ],
      steps: [
        "Whisk 3 eggs with a splash of milk, salt, and pepper.",
        "Melt butter in a non-stick pan over medium heat.",
        "Pour in the eggs and let them set for about 30 seconds.",
        "Scatter spinach and grated cheddar over one half.",
        "Fold the omelette over and cook until the cheese melts.",
        "Slide onto a plate and serve warm.",
      ],
      missing_count: 1,
    },
    {
      title: "Mushroom & Tomato Frittata",
      time_minutes: 30,
      difficulty: "medium",
      ingredients: [
        { name: "Eggs", available: true },
        { name: "Mushrooms", available: true },
        { name: "Cherry tomatoes", available: true },
        { name: "Red onion", available: true },
        { name: "Cheddar cheese", available: true },
        { name: "Olive oil", available: false },
        { name: "Fresh herbs", available: false },
      ],
      steps: [
        "Preheat the oven to 190°C (375°F).",
        "Sauté sliced mushrooms and red onion in an oven-safe skillet.",
        "Add halved cherry tomatoes and cook for 2 minutes.",
        "Beat 6 eggs and pour over the vegetables.",
        "Top with grated cheddar and fresh herbs.",
        "Transfer to the oven and bake for 15–18 minutes until set.",
        "Slice into wedges and serve.",
      ],
      missing_count: 2,
    },
    {
      title: "Creamy Spinach & Mushroom Pasta",
      time_minutes: 25,
      difficulty: "medium",
      ingredients: [
        { name: "Mushrooms", available: true },
        { name: "Spinach", available: true },
        { name: "Butter", available: true },
        { name: "Milk", available: true },
        { name: "Cheddar cheese", available: true },
        { name: "Pasta", available: false },
        { name: "Garlic", available: false },
      ],
      steps: [
        "Cook pasta in salted boiling water until al dente.",
        "Meanwhile, melt butter and sauté garlic and mushrooms.",
        "Add spinach and cook until wilted.",
        "Stir in milk and grated cheddar to form a creamy sauce.",
        "Drain the pasta and toss with the sauce.",
        "Season to taste and serve immediately.",
      ],
      missing_count: 2,
    },
  ],
  fun_fact:
    "Eggs are one of the few foods that naturally contain vitamin D — and a fresh egg will sink in water while an older one floats!",
  message: null,
};

/**
 * Analyze one or more fridge/pantry/spice-cabinet photos and return recipe
 * suggestions.
 *
 * @param base64Images Base64-encoded PNGs (no `data:` prefix), one per photo.
 * @param preferences Dietary preferences to honor.
 * @param mode "normal" or "surprise".
 */
export async function analyzeImage(
  base64Images: string[],
  preferences: DietaryPreferences,
  mode: ScanMode
): Promise<RecipeResponse> {
  if (USE_MOCK) {
    // Simulate a little latency so the loading animation is visible.
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return MOCK_RESPONSE;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const body = JSON.stringify({ images: base64Images, preferences, mode });
    const headers = await authHeaders();

    const response = await fetch(API_URL, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });

    if (response.status === 401 || response.status === 403) {
      throw new UnauthorizedError();
    }

    if (!response.ok) {
      throw new Error(
        `The kitchen server had a hiccup (status ${response.status}). Please try again.`
      );
    }

    const data = (await response.json()) as RecipeResponse;
    return data;
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) {
      throw err;
    }
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        "That took a little too long — check your connection and try again."
      );
    }
    if (err instanceof Error && err.message.startsWith("The kitchen server")) {
      throw err;
    }
    throw new Error(
      "I couldn't reach the kitchen right now. Please check your connection and try again."
    );
  } finally {
    clearTimeout(timeout);
  }
}
