import React, { useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Recipe } from "@/types/recipe";
import {
  colors,
  difficultyColor,
  radii,
  shadow,
  spacing,
  typography,
} from "@/constants/theme";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  recipe: Recipe;
}

function buildShareText(recipe: Recipe): string {
  const ingredientLines = recipe.ingredients
    .map((i) => `${i.available ? "✓" : "🛒"} ${i.name}`)
    .join("\n");
  const stepLines = recipe.steps
    .map((s, idx) => `${idx + 1}. ${s}`)
    .join("\n");
  return (
    `🍳 ${recipe.title}\n` +
    `⏱ ${recipe.time_minutes} min · ${recipe.difficulty}\n\n` +
    `Ingredients:\n${ingredientLines}\n\n` +
    `Steps:\n${stepLines}\n\n` +
    `Shared from What's Cooking?`
  );
}

export default function RecipeCard({ recipe }: Props) {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    void Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  const onShare = async () => {
    try {
      await Share.share({ message: buildShareText(recipe) });
    } catch {
      // User cancelled or share failed — nothing to do.
    }
  };

  const diffColor = difficultyColor(recipe.difficulty);

  return (
    <View style={[styles.card, shadow]}>
      <Pressable onPress={toggle} accessibilityRole="button">
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={2}>
            {recipe.title}
          </Text>
        </View>

        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: colors.card }]}>
            <Text style={styles.badgeText}>⏱ {recipe.time_minutes} min</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: `${diffColor}22` }]}>
            <Text style={[styles.badgeText, { color: diffColor }]}>
              {recipe.difficulty}
            </Text>
          </View>
          {recipe.missing_count > 0 ? (
            <View style={[styles.badge, { backgroundColor: colors.card }]}>
              <Text style={styles.badgeText}>
                🛒 {recipe.missing_count} to buy
              </Text>
            </View>
          ) : (
            <View
              style={[styles.badge, { backgroundColor: colors.availableLight }]}
            >
              <Text style={[styles.badgeText, { color: colors.available }]}>
                ✓ You have it all
              </Text>
            </View>
          )}
        </View>
      </Pressable>

      <View style={styles.ingredients}>
        {recipe.ingredients.map((ing, idx) => (
          <View key={`${ing.name}-${idx}`} style={styles.ingredientRow}>
            <Text style={styles.ingredientIcon}>
              {ing.available ? "✓" : "🛒"}
            </Text>
            <Text
              style={[
                styles.ingredientText,
                !ing.available && styles.ingredientMissing,
              ]}
            >
              {ing.name}
            </Text>
          </View>
        ))}
      </View>

      {expanded ? (
        <View style={styles.steps}>
          <Text style={styles.stepsHeading}>Steps</Text>
          {recipe.steps.map((step, idx) => (
            <View key={idx} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{idx + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          onPress={toggle}
          style={styles.actionButton}
          accessibilityRole="button"
        >
          <Text style={styles.actionText}>
            {expanded ? "Hide steps" : "Show steps"}
          </Text>
        </Pressable>
        <Pressable
          onPress={onShare}
          style={[styles.actionButton, styles.shareButton]}
          accessibilityRole="button"
        >
          <Text style={[styles.actionText, styles.shareText]}>Share</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  headerRow: {
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.heading,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.xs,
  },
  badge: {
    borderRadius: radii.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  ingredients: {
    marginTop: spacing.xs,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  ingredientIcon: {
    width: 24,
    fontSize: 15,
  },
  ingredientText: {
    ...typography.body,
    flex: 1,
  },
  ingredientMissing: {
    color: colors.textMuted,
  },
  steps: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  stepsHeading: {
    ...typography.subheading,
    marginBottom: spacing.sm,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  stepNumberText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 13,
  },
  stepText: {
    ...typography.body,
    flex: 1,
    lineHeight: 21,
  },
  actions: {
    flexDirection: "row",
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: "center",
    backgroundColor: colors.card,
    marginRight: spacing.sm,
  },
  shareButton: {
    backgroundColor: colors.primary,
    marginRight: 0,
    marginLeft: spacing.sm,
  },
  actionText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  shareText: {
    color: colors.white,
  },
});
