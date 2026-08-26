import "react-native-get-random-values";
import {
  CognitoIdentityClient,
  GetCredentialsForIdentityCommand,
  GetIdCommand,
} from "@aws-sdk/client-cognito-identity";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import {
  DietaryPreferences,
  RecipeResponse,
  ScanMode,
} from "@/types/recipe";

/**
 * Backend connection, read from Expo public env vars (see `.env`).
 * `EXPO_PUBLIC_*` values are inlined into the client bundle at build time.
 * None of these are secrets: the Identity Pool id is designed to be public.
 */
export const AWS_REGION = process.env.EXPO_PUBLIC_AWS_REGION ?? "us-east-1";
export const AGENT_RUNTIME_ARN = process.env.EXPO_PUBLIC_AGENT_RUNTIME_ARN ?? "";
const IDENTITY_POOL_ID = process.env.EXPO_PUBLIC_IDENTITY_POOL_ID ?? "";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__ ? "http://localhost:8080/invocations" : "");

/**
 * Auth: Cognito Identity Pool guest credentials + SigV4.
 *
 * The API route uses AWS_IAM auth. The app holds NO long-lived secret — it
 * fetches short-lived AWS credentials for an anonymous ("guest") identity from
 * the public Identity Pool id, then SigV4-signs each request. Creds are cached
 * until ~2 min before expiry.
 */
type GuestCreds = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
};

let cachedCreds: { value: GuestCreds; expiresAt: number } | null = null;
let cachedIdentityId: string | null = null;

async function getGuestCredentials(): Promise<GuestCreds | null> {
  if (!IDENTITY_POOL_ID) return null; // e.g. local `agentcore dev`, no signing
  const now = Date.now();
  if (cachedCreds && cachedCreds.expiresAt > now) return cachedCreds.value;

  const cog = new CognitoIdentityClient({ region: AWS_REGION });
  if (!cachedIdentityId) {
    const { IdentityId } = await cog.send(
      new GetIdCommand({ IdentityPoolId: IDENTITY_POOL_ID })
    );
    cachedIdentityId = IdentityId ?? null;
  }
  if (!cachedIdentityId) {
    throw new Error("Couldn't reach the kitchen service. Please try again.");
  }

  const { Credentials } = await cog.send(
    new GetCredentialsForIdentityCommand({ IdentityId: cachedIdentityId })
  );
  if (
    !Credentials?.AccessKeyId ||
    !Credentials.SecretKey ||
    !Credentials.SessionToken
  ) {
    throw new Error("Couldn't authenticate with the kitchen service. Please try again.");
  }

  const value: GuestCreds = {
    accessKeyId: Credentials.AccessKeyId,
    secretAccessKey: Credentials.SecretKey,
    sessionToken: Credentials.SessionToken,
  };
  const expMs = Credentials.Expiration
    ? Credentials.Expiration.getTime()
    : now + 3_000_000;
  cachedCreds = { value, expiresAt: expMs - 120_000 };
  return value;
}

// Parse host/path without relying on RN's partial URL implementation.
function splitUrl(u: string): { hostname: string; path: string } {
  const m = u.match(/^https?:\/\/([^/]+)(\/.*)?$/);
  return { hostname: m?.[1] ?? "", path: m?.[2] ?? "/" };
}

/**
 * SigV4-sign a JSON POST to the API. Returns the headers to fetch with. The
 * `body` must be the exact string sent (the signature covers its hash). When
 * no Identity Pool is configured, returns plain headers (local dev).
 */
async function signedHeaders(body: string): Promise<Record<string, string>> {
  const creds = await getGuestCredentials();
  if (!creds) {
    return { "content-type": "application/json", accept: "application/json" };
  }
  const { hostname, path } = splitUrl(API_URL);
  const signer = new SignatureV4({
    service: "execute-api",
    region: AWS_REGION,
    credentials: creds,
    sha256: Sha256,
  });
  const request = new HttpRequest({
    method: "POST",
    protocol: "https:",
    hostname,
    path,
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      host: hostname,
    },
    body,
  });
  const { headers } = await signer.sign(request);
  return headers as Record<string, string>;
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
    const headers = await signedHeaders(body);

    const response = await fetch(API_URL, {
      method: "POST",
      headers,
      body,
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
