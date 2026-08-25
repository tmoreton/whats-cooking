import { Platform, TextStyle, ViewStyle } from "react-native";
import { Confidence } from "@/types/recipe";

export const colors = {
  primary: "#FF6B35",
  primaryDark: "#E85425",
  primaryLight: "#FF8C61",
  available: "#4CAF50",
  availableLight: "#E8F5E9",
  missing: "#9E9E9E",
  background: "#FFFFFF",
  card: "#F7F7F8",
  cardBorder: "#ECECEE",
  text: "#1A1A1A",
  textSecondary: "#666666",
  textMuted: "#999999",
  white: "#FFFFFF",
  black: "#000000",
  overlay: "rgba(0,0,0,0.55)",
  // confidence colors
  confidenceHigh: "#4CAF50",
  confidenceMedium: "#FFA726",
  confidenceLow: "#EF5350",
  // difficulty colors
  difficultyEasy: "#4CAF50",
  difficultyMedium: "#FFA726",
  difficultyHard: "#EF5350",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const typography: Record<string, TextStyle> = {
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  subheading: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  body: {
    fontSize: 15,
    fontWeight: "400",
    color: colors.text,
  },
  caption: {
    fontSize: 13,
    fontWeight: "400",
    color: colors.textSecondary,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
};

export const shadow: ViewStyle = Platform.select<ViewStyle>({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  android: {
    elevation: 3,
  },
  default: {},
}) as ViewStyle;

export function confidenceColor(confidence: Confidence): string {
  switch (confidence) {
    case "high":
      return colors.confidenceHigh;
    case "medium":
      return colors.confidenceMedium;
    case "low":
      return colors.confidenceLow;
    default:
      return colors.missing;
  }
}

export function difficultyColor(difficulty: string): string {
  switch (difficulty) {
    case "easy":
      return colors.difficultyEasy;
    case "medium":
      return colors.difficultyMedium;
    case "hard":
      return colors.difficultyHard;
    default:
      return colors.missing;
  }
}
