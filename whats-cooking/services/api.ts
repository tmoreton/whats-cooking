import {
  DietaryPreferences,
  RecipeResponse,
  ScanMode,
} from "@/types/recipe";

/**
 * API endpoint.
 *
 * Read from Expo public env vars (see `.env` / `.env.example`), so the backend
 * connection details live in config rather than in source. `EXPO_PUBLIC_*`
 * variables are inlined into the client bundle at build time.
 *
 * NOTE: AgentCore runtimes are invoked via the SigV4 `InvokeAgentRuntime`
 * data-plane API — not a plain public URL. `EXPO_PUBLIC_API_URL` should point
 * at a thin proxy (e.g. API Gateway + Lambda) that SigV4-signs to the runtime
 * identified by `EXPO_PUBLIC_AGENT_RUNTIME_ARN`. In dev we fall back to a
 * locally-running `agentcore dev` server on :8080.
 */
export const AWS_REGION = process.env.EXPO_PUBLIC_AWS_REGION ?? "us-east-1";
export const AGENT_RUNTIME_ARN = process.env.EXPO_PUBLIC_AGENT_RUNTIME_ARN ?? "";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__ ? "http://localhost:8080/invocations" : "");

/**
 * Cognito machine-to-machine (client_credentials) auth. The proxy's API Gateway
 * route is protected by a Cognito JWT authorizer (per AWS/Isengard standards —
 * no unauthenticated public endpoints), so we fetch a short-lived access token
 * and send it as a Bearer token. No login screen: the app authenticates itself.
 */
const COGNITO_TOKEN_URL = process.env.EXPO_PUBLIC_COGNITO_TOKEN_URL ?? "";
const COGNITO_CLIENT_ID = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID ?? "";
const COGNITO_CLIENT_SECRET = process.env.EXPO_PUBLIC_COGNITO_CLIENT_SECRET ?? "";
const COGNITO_SCOPE = process.env.EXPO_PUBLIC_COGNITO_SCOPE ?? "whatscooking/invoke";

let cachedToken: { value: string; expiresAt: number } | null = null;

/**
 * Return a valid Cognito access token, fetching (and caching until ~1 min
 * before expiry) via the OAuth2 client_credentials grant. Returns null when
 * Cognito isn't configured (e.g. local `agentcore dev`), so callers can skip
 * the Authorization header.
 */
async function getAccessToken(): Promise<string | null> {
  if (!COGNITO_TOKEN_URL || !COGNITO_CLIENT_ID || !COGNITO_CLIENT_SECRET) {
    return null;
  }
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.value;
  }

  // btoa is available in React Native (Hermes) and Expo web.
  const basic = btoa(`${COGNITO_CLIENT_ID}:${COGNITO_CLIENT_SECRET}`);
  const body = `grant_type=client_credentials&scope=${encodeURIComponent(COGNITO_SCOPE)}`;
  const res = await fetch(COGNITO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body,
  });
  if (!res.ok) {
    throw new Error("Couldn't authenticate with the kitchen service. Please try again.");
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: json.access_token,
    expiresAt: now + (json.expires_in - 60) * 1000,
  };
  return cachedToken.value;
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
 * Analyze a fridge photo and return recipe suggestions.
 *
 * @param base64Image Base64-encoded PNG (no `data:` prefix).
 * @param preferences Dietary preferences to honor.
 * @param mode "normal" or "surprise".
 */
export async function analyzeImage(
  base64Image: string,
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
    const token = await getAccessToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        image: base64Image,
        preferences,
        mode,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `The kitchen server had a hiccup (status ${response.status}). Please try again.`
      );
    }

    const data = (await response.json()) as RecipeResponse;
    return data;
  } catch (err: unknown) {
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
