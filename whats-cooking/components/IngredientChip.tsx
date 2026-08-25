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
        { borderColor: accent, backgroundColor: `${accent}1A` },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: accent }]} />
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {confidence ? (
        <Text style={[styles.meta, { color: accent }]}>{confidence}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  meta: {
    fontSize: 11,
    fontWeight: "700",
    marginLeft: spacing.sm,
    textTransform: "uppercase",
  },
});
