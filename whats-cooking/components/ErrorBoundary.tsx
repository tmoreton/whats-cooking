import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "@/constants/theme";

interface State {
  error: Error | null;
}

/**
 * Root-level error boundary. Catches render/lifecycle exceptions anywhere
 * in the app so a JS bug shows a friendly retry screen instead of a blank
 * white flash. Not for network/tool errors — those are handled per-screen.
 */
export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Surface to Metro/console; wire to Sentry/etc here in the future.
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.wrap}>
        <View style={styles.iconWrap}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.primary} />
        </View>
        <Text style={styles.title}>Something went sideways</Text>
        <Text style={styles.body}>
          The app hit an unexpected snag. Try again — if it keeps happening,
          restart the app.
        </Text>
        <Pressable
          onPress={this.reset}
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.heading,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
    maxWidth: 320,
  },
  button: {
    backgroundColor: colors.text,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl + spacing.sm,
    borderRadius: radii.md,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
