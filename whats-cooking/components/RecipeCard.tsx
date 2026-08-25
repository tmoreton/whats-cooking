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
import { Ionicons } from "@expo/vector-icons";
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
    .map((i) => `${i.available ? "[x]" : "[ ]"} ${i.name}`)
    .join("\n");
  const stepLines = recipe.steps
    .map((s, idx) => `${idx + 1}. ${s}`)
    .join("\n");
  return (
    `${recipe.title}\n` +
    `${recipe.time_minutes} min · ${recipe.difficulty}\n\n` +
    `Ingredients\n${ingredientLines}\n\n` +
    `Steps\n${stepLines}\n\n` +
    `— Shared from What's Cooking?`
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
            <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.badgeText}>{recipe.time_minutes} min</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: `${diffColor}18` }]}>
            <View
              style={[styles.diffDot, { backgroundColor: diffColor }]}
            />
            <Text style={[styles.badgeText, { color: diffColor }]}>
              {recipe.difficulty}
            </Text>
          </View>
          {recipe.missing_count > 0 ? (
            <View style={[styles.badge, { backgroundColor: colors.card }]}>
              <Ionicons name="cart-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.badgeText}>
                {recipe.missing_count} to buy
              </Text>
            </View>
          ) : (
            <View
              style={[styles.badge, { backgroundColor: colors.availableLight }]}
            >
              <Ionicons name="checkmark-circle" size={13} color={colors.available} />
              <Text style={[styles.badgeText, { color: colors.available }]}>
                All in
              </Text>
            </View>
          )}
        </View>
      </Pressable>

      <View style={styles.ingredients}>
        {recipe.ingredients.map((ing, idx) => (
          <View key={`${ing.name}-${idx}`} style={styles.ingredientRow}>
            <View style={styles.ingredientIconWrap}>
              <Ionicons
                name={ing.available ? "checkmark" : "cart-outline"}
                size={14}
                color={ing.available ? colors.available : colors.textMuted}
              />
            </View>
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
          style={[styles.actionButton, styles.primaryAction]}
          accessibilityRole="button"
        >
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.white}
          />
          <Text style={[styles.actionText, styles.primaryActionText]}>
            {expanded ? "Hide steps" : "Show steps"}
          </Text>
        </Pressable>
        <Pressable
          onPress={onShare}
          style={styles.actionIconButton}
          accessibilityRole="button"
          accessibilityLabel="Share recipe"
          hitSlop={8}
        >
          <Ionicons
            name="share-outline"
            size={20}
            color={colors.textSecondary}
          />
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
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.pill,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    gap: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.1,
  },
  diffDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  ingredients: {
    marginTop: spacing.xs,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  ingredientIconWrap: {
    width: 26,
    alignItems: "center",
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
    alignItems: "center",
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    gap: 6,
  },
  primaryAction: {
    backgroundColor: colors.text,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: -0.1,
  },
  primaryActionText: {
    color: colors.white,
  },
  actionIconButton: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
});
