import { Platform, TextStyle, ViewStyle } from "react-native";
import { Confidence } from "@/types/recipe";

export const colors = {
  primary: "#FF6B35",
  primaryDark: "#E85425",
  primaryLight: "#FF8C61",
  primarySoft: "#FFF3ED",
  available: "#2E8B57",
  availableLight: "#EAF5EE",
  missing: "#9AA0A6",
  background: "#FBFBFC",
  surface: "#FFFFFF",
  card: "#F7F7F8",
  cardBorder: "#EEECEA",
  divider: "#F0EEEC",
  text: "#141414",
  textSecondary: "#5A5A5F",
  textMuted: "#9A9A9F",
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

export const typography = {
  display: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.6,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.4,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.2,
  },
  subheading: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    letterSpacing: -0.1,
  },
  body: {
    fontSize: 15,
    fontWeight: "400",
    color: colors.text,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
} satisfies Record<string, TextStyle>;

export const shadow: ViewStyle = Platform.select<ViewStyle>({
  ios: {
    shadowColor: "#0F0E0C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  android: {
    elevation: 2,
  },
  default: {},
}) as ViewStyle;

export const shadowLg: ViewStyle = Platform.select<ViewStyle>({
  ios: {
    shadowColor: "#0F0E0C",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
  android: {
    elevation: 8,
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
