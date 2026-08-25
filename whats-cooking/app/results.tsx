import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import IngredientChip from "@/components/IngredientChip";
import LoadingAnimation from "@/components/LoadingAnimation";
import RecipeCard from "@/components/RecipeCard";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";
import { analyzeImage } from "@/services/api";
import { consumePendingScan } from "@/services/pendingScan";
import {
  addRecentScan,
  getRecentScan,
  loadLastResult,
  loadMode,
  loadPreferences,
} from "@/services/storage";
import { RecipeResponse } from "@/types/recipe";

type Phase = "loading" | "success" | "error";

const FRIENDLY_VISION_ERROR =
  "I can't quite see what's in there — try getting a bit closer!";

export default function ResultsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ scanId?: string }>();
  const scanId = params.scanId;

  const [phase, setPhase] = useState<Phase>("loading");
  const [result, setResult] = useState<RecipeResponse | null>(null);
  const [errorText, setErrorText] = useState<string>(FRIENDLY_VISION_ERROR);
  const [usedCache, setUsedCache] = useState(false);

  const runAnalysis = useCallback(async () => {
    setPhase("loading");
    setUsedCache(false);

    // Re-opening a cached scan from history.
    if (scanId) {
      const cached = await getRecentScan(scanId);
      if (cached) {
        setResult(cached.response);
        setPhase("success");
        return;
      }
      // Fall through to a fresh analysis if the cache entry vanished.
    }

    const images = consumePendingScan();
    if (images.length === 0) {
      // No photos to analyze (e.g. deep-linked directly). Try last result.
      const last = await loadLastResult();
      if (last) {
        setResult(last);
        setUsedCache(true);
        setPhase("success");
      } else {
        setErrorText(
          "There's no photo to analyze — head back and snap your fridge!"
        );
        setPhase("error");
      }
      return;
    }

    try {
      const [prefs, mode] = await Promise.all([loadPreferences(), loadMode()]);
      const response = await analyzeImage(images, prefs, mode);
      setResult(response);
      setPhase("success");
      // Cache as a recent scan (also stores as last-result for offline use).
      void addRecentScan(response);
    } catch (err: unknown) {
      // On network/timeout failure, fall back to the last cached result.
      const last = await loadLastResult();
      if (last) {
        setResult(last);
        setUsedCache(true);
        setPhase("success");
        return;
      }
      setErrorText(err instanceof Error ? err.message : FRIENDLY_VISION_ERROR);
      setPhase("error");
    }
  }, [scanId]);

  useEffect(() => {
    void runAnalysis();
  }, [runAnalysis]);

  const scanAgain = () => {
    router.replace("/camera");
  };

  /* ------------------------------- Loading ------------------------------- */
  if (phase === "loading") {
    return (
      <View style={styles.centered}>
        <LoadingAnimation />
      </View>
    );
  }

  /* -------------------------------- Error -------------------------------- */
  if (phase === "error" || !result) {
    return (
      <View style={[styles.centered, { padding: spacing.xl }]}>
        <Text style={styles.errorEmoji}>🔍</Text>
        <Text style={styles.errorTitle}>{errorText}</Text>
        <Pressable
          onPress={runAnalysis}
          style={styles.primaryButton}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Try again</Text>
        </Pressable>
        <Pressable
          onPress={scanAgain}
          style={styles.secondaryButton}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>Scan again</Text>
        </Pressable>
      </View>
    );
  }

  /* ------------------------------- Success ------------------------------- */
  const hasFewIngredients = result.identified_ingredients.length < 2;
  const showMessage = Boolean(result.message) || hasFewIngredients;
  const messageText =
    result.message ??
    (hasFewIngredients
      ? "I only spotted a couple of things — try a clearer, closer photo for better ideas!"
      : null);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + spacing.xxl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {usedCache ? (
        <View style={styles.cacheBanner}>
          <Text style={styles.cacheBannerText}>
            📴 Offline — showing your last saved result.
          </Text>
        </View>
      ) : null}

      {showMessage && messageText ? (
        <View style={[styles.messageCard, shadow]}>
          <Text style={styles.messageText}>{messageText}</Text>
        </View>
      ) : null}

      {/* Identified ingredients */}
      {result.identified_ingredients.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I spotted…</Text>
          <View style={styles.chipWrap}>
            {result.identified_ingredients.map((ing, idx) => (
              <IngredientChip
                key={`${ing.name}-${idx}`}
                label={ing.name}
                confidence={ing.confidence}
              />
            ))}
          </View>
        </View>
      ) : null}

      {/* Fun fact */}
      {result.fun_fact ? (
        <View style={styles.funFact}>
          <Text style={styles.funFactLabel}>💡 Fun fact</Text>
          <Text style={styles.funFactText}>{result.fun_fact}</Text>
        </View>
      ) : null}

      {/* Recipes */}
      {result.recipes.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {result.recipes.length} recipe
            {result.recipes.length === 1 ? "" : "s"} you can make
          </Text>
          {result.recipes.map((recipe, idx) => (
            <RecipeCard key={`${recipe.title}-${idx}`} recipe={recipe} />
          ))}
        </View>
      ) : (
        <Text style={styles.emptyRecipes}>
          No recipes this time — try another photo!
        </Text>
      )}

      <Pressable
        onPress={scanAgain}
        style={styles.scanAgainButton}
        accessibilityRole="button"
      >
        <Text style={styles.scanAgainText}>📸 Scan Again</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.heading,
    marginBottom: spacing.md,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  funFact: {
    backgroundColor: colors.availableLight,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  funFactLabel: {
    ...typography.label,
    color: colors.available,
    marginBottom: spacing.xs,
  },
  funFactText: {
    ...typography.body,
    lineHeight: 21,
  },
  messageCard: {
    backgroundColor: "#FFF3E0",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  messageText: {
    ...typography.subheading,
    color: colors.primaryDark,
  },
  cacheBanner: {
    backgroundColor: colors.card,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  cacheBannerText: {
    ...typography.caption,
    textAlign: "center",
  },
  emptyRecipes: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginVertical: spacing.xl,
  },
  scanAgainButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  scanAgainText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "700",
  },
  errorEmoji: {
    fontSize: 52,
    marginBottom: spacing.md,
  },
  errorTitle: {
    ...typography.heading,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
});
