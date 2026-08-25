import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Confidence } from "@/types/recipe";
import { colors, confidenceColor, radii, spacing } from "@/constants/theme";

interface Props {
  label: string;
  /** For identified-ingredient chips at the top of results. */
  confidence?: Confidence;
  /** For recipe ingredient chips: whether the item is available. */
  available?: boolean;
}

/**
 * Rounded chip whose color reflects either detection confidence (when
 * `confidence` is provided) or availability (when `available` is provided).
 */
export default function IngredientChip({ label, confidence, available }: Props) {
  let accent: string = colors.missing;
  if (confidence) {
    accent = confidenceColor(confidence);
  } else if (available !== undefined) {
    accent = available ? colors.available : colors.missing;
  }

  return (
    <View
      style={[
        styles.chip,
        { borderColor: `${accent}44`, backgroundColor: `${accent}12` },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: accent }]} />
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 7,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    letterSpacing: -0.1,
  },
});
