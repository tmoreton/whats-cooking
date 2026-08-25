import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DietaryPreferences,
  RecipeResponse,
  ScanMode,
} from "@/types/recipe";

const PREFS_KEY = "@whatscooking/preferences";
const MODE_KEY = "@whatscooking/mode";
const RECENT_KEY = "@whatscooking/recentScans";
const LAST_RESULT_KEY = "@whatscooking/lastResult";

const MAX_RECENT = 8;

export const DEFAULT_PREFERENCES: DietaryPreferences = {
  vegetarian: false,
  vegan: false,
  glutenFree: false,
};

/** A stored scan the user can re-open from history. */
export interface RecentScan {
  id: string;
  timestamp: number;
  title: string; // headline (e.g. first recipe title) for the history row
  ingredientCount: number;
  response: RecipeResponse;
}

/* --------------------------- Dietary preferences --------------------------- */

export async function savePreferences(prefs: DietaryPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Non-fatal: preferences just won't persist this session.
  }
}

export async function loadPreferences(): Promise<DietaryPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as DietaryPreferences) };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

/* -------------------------------- Scan mode -------------------------------- */

export async function saveMode(mode: ScanMode): Promise<void> {
  try {
    await AsyncStorage.setItem(MODE_KEY, mode);
  } catch {
    // Non-fatal.
  }
}

export async function loadMode(): Promise<ScanMode> {
  try {
    const raw = await AsyncStorage.getItem(MODE_KEY);
    return raw === "surprise" ? "surprise" : "normal";
  } catch {
    return "normal";
  }
}

/* ------------------------------ Recent scans ------------------------------- */

export async function loadRecentScans(): Promise<RecentScan[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentScan[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addRecentScan(response: RecipeResponse): Promise<RecentScan> {
  const scan: RecentScan = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    title: response.recipes[0]?.title ?? "Fridge scan",
    ingredientCount: response.identified_ingredients.length,
    response,
  };

  try {
    const existing = await loadRecentScans();
    const next = [scan, ...existing].slice(0, MAX_RECENT);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
    // Also keep the single most recent result for offline fallback.
    await AsyncStorage.setItem(LAST_RESULT_KEY, JSON.stringify(response));
  } catch {
    // Non-fatal.
  }

  return scan;
}

export async function getRecentScan(id: string): Promise<RecentScan | null> {
  const scans = await loadRecentScans();
  return scans.find((s) => s.id === id) ?? null;
}

export async function clearRecentScans(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RECENT_KEY);
  } catch {
    // Non-fatal.
  }
}

/* --------------------------- Offline fallback ------------------------------ */

export async function loadLastResult(): Promise<RecipeResponse | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_RESULT_KEY);
    return raw ? (JSON.parse(raw) as RecipeResponse) : null;
  } catch {
    return null;
  }
}
