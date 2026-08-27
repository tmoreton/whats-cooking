import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii, spacing } from "@/constants/theme";

/** Shared screen shell for the auth flow: gradient header + card body. */
export function AuthScreen({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + spacing.xxl }]}
        >
          <Text style={styles.brand}>🍳 What's Cooking?</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </LinearGradient>
        <View style={styles.body}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function AuthField({
  label,
  errorText,
  ...props
}: TextInputProps & { label: string; errorText?: string }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, errorText ? styles.inputError : null]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
    </View>
  );
}

export function AuthButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        isDisabled && styles.buttonDisabled,
        pressed && !isDisabled && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={styles.buttonText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return <Text style={styles.errorBanner}>{message}</Text>;
}

export function AuthLink({
  prefix,
  label,
  onPress,
}: {
  prefix?: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.linkRow}>
      {prefix ? <Text style={styles.linkPrefix}>{prefix} </Text> : null}
      <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button">
        <Text style={styles.link}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
  },
  brand: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "rgba(255,255,255,0.85)",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    marginTop: spacing.sm,
    lineHeight: 21,
  },
  body: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  fieldWrap: { gap: spacing.xs },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  inputError: { borderColor: colors.confidenceLow },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.85 },
  errorBanner: {
    backgroundColor: "#FDECEA",
    color: "#B3261E",
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: 14,
    fontWeight: "500",
    overflow: "hidden",
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  linkPrefix: { color: colors.textSecondary, fontSize: 14 },
  link: { color: colors.primary, fontSize: 14, fontWeight: "700" },
});
