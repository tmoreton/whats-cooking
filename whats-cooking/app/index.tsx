import React, { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  colors,
  radii,
  shadow,
  spacing,
  typography,
} from "@/constants/theme";
import {
  DEFAULT_PREFERENCES,
  loadMode,
  loadPreferences,
  loadRecentScans,
  RecentScan,
  saveMode,
  savePreferences,
} from "@/services/storage";
import { DietaryPreferences, ScanMode } from "@/types/recipe";

function formatWhen(ts: number): string {
  const diffMs = Date.now() - ts;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState<DietaryPreferences>(DEFAULT_PREFERENCES);
  const [mode, setMode] = useState<ScanMode>("normal");
  const [recent, setRecent] = useState<RecentScan[]>([]);

  // Reload persisted state each time the screen gains focus.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [loadedPrefs, loadedMode, loadedRecent] = await Promise.all([
          loadPreferences(),
          loadMode(),
          loadRecentScans(),
        ]);
        if (!active) return;
        setPrefs(loadedPrefs);
        setMode(loadedMode);
        setRecent(loadedRecent);
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  const updatePref = (key: keyof DietaryPreferences, value: boolean) => {
    const next: DietaryPreferences = { ...prefs, [key]: value };
    // Vegan implies vegetarian for a sensible UX.
    if (key === "vegan" && value) {
      next.vegetarian = true;
    }
    setPrefs(next);
    void savePreferences(next);
  };

  const updateMode = (surprise: boolean) => {
    const next: ScanMode = surprise ? "surprise" : "normal";
    setMode(next);
    void saveMode(next);
  };

  const openCamera = () => {
    router.push("/camera");
  };

  const openRecent = (scan: RecentScan) => {
    router.push({ pathname: "/results", params: { scanId: scan.id } });
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + spacing.xl }]}
        >
          <Text style={styles.headerEmoji}>🍳</Text>
          <Text style={styles.headerTitle}>What's Cooking?</Text>
          <Text style={styles.headerSubtitle}>
            Snap your fridge, get recipe ideas in seconds.
          </Text>
        </LinearGradient>

        <View style={styles.body}>
          <Pressable
            onPress={openCamera}
            style={({ pressed }) => [
              styles.openButton,
              shadow,
              pressed && styles.openButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Open fridge and take a photo"
          >
            <Text style={styles.openButtonEmoji}>🥶</Text>
            <Text style={styles.openButtonText}>Open Fridge</Text>
            <Text style={styles.openButtonHint}>Tap to snap a photo</Text>
          </Pressable>

          {/* Dietary preferences */}
          <View style={[styles.card, shadow]}>
            <Text style={styles.cardTitle}>Dietary preferences</Text>
            <PrefRow
              label="Vegetarian"
              emoji="🥗"
              value={prefs.vegetarian}
              onChange={(v) => updatePref("vegetarian", v)}
            />
            <PrefRow
              label="Vegan"
              emoji="🌱"
              value={prefs.vegan}
              onChange={(v) => updatePref("vegan", v)}
            />
            <PrefRow
              label="Gluten-free"
              emoji="🌾"
              value={prefs.glutenFree}
              onChange={(v) => updatePref("glutenFree", v)}
              last
            />
          </View>

          {/* Surprise me */}
          <View style={[styles.card, shadow]}>
            <PrefRow
              label="Surprise me"
              emoji="🎲"
              sublabel="Bolder, more creative suggestions"
              value={mode === "surprise"}
              onChange={updateMode}
              last
            />
          </View>

          {/* Recent scans */}
          {recent.length > 0 ? (
            <View style={styles.recentSection}>
              <Text style={styles.sectionTitle}>Recent scans</Text>
              {recent.map((scan) => (
                <Pressable
                  key={scan.id}
                  onPress={() => openRecent(scan)}
                  style={({ pressed }) => [
                    styles.recentRow,
                    shadow,
                    pressed && styles.recentRowPressed,
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={styles.recentEmoji}>🍽️</Text>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentTitle} numberOfLines={1}>
                      {scan.title}
                    </Text>
                    <Text style={styles.recentMeta}>
                      {scan.ingredientCount} ingredients ·{" "}
                      {formatWhen(scan.timestamp)}
                    </Text>
                  </View>
                  <Text style={styles.recentChevron}>›</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyRecent}>
              Your recent scans will show up here.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function PrefRow({
  label,
  emoji,
  sublabel,
  value,
  onChange,
  last,
}: {
  label: string;
  emoji: string;
  sublabel?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.prefRow, !last && styles.prefRowBorder]}>
      <Text style={styles.prefEmoji}>{emoji}</Text>
      <View style={styles.prefLabelWrap}>
        <Text style={styles.prefLabel}>{label}</Text>
        {sublabel ? <Text style={styles.prefSublabel}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#D9D9DE", true: colors.primary }}
        thumbColor={colors.white}
        ios_backgroundColor="#D9D9DE"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
  },
  headerEmoji: {
    fontSize: 44,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    marginTop: spacing.xs,
  },
  body: {
    padding: spacing.lg,
  },
  openButton: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: spacing.xxl,
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  openButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  openButtonEmoji: {
    fontSize: 56,
  },
  openButtonText: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
    marginTop: spacing.sm,
  },
  openButtonHint: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    ...typography.subheading,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  prefRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  prefEmoji: {
    fontSize: 22,
    marginRight: spacing.md,
  },
  prefLabelWrap: {
    flex: 1,
  },
  prefLabel: {
    ...typography.body,
    fontWeight: "600",
  },
  prefSublabel: {
    ...typography.caption,
    marginTop: 2,
  },
  recentSection: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.heading,
    marginBottom: spacing.md,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  recentRowPressed: {
    opacity: 0.85,
  },
  recentEmoji: {
    fontSize: 26,
    marginRight: spacing.md,
  },
  recentInfo: {
    flex: 1,
  },
  recentTitle: {
    ...typography.body,
    fontWeight: "600",
  },
  recentMeta: {
    ...typography.caption,
    marginTop: 2,
  },
  recentChevron: {
    fontSize: 28,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  emptyRecent: {
    ...typography.caption,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});
