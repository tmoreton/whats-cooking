import React, { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  colors,
  radii,
  shadow,
  shadowLg,
  spacing,
  typography,
} from "@/constants/theme";
import {
  clearRecentScans,
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

type IonName = React.ComponentProps<typeof Ionicons>["name"];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState<DietaryPreferences>(DEFAULT_PREFERENCES);
  const [mode, setMode] = useState<ScanMode>("normal");
  const [recent, setRecent] = useState<RecentScan[]>([]);

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
    if (key === "vegan" && value) next.vegetarian = true;
    setPrefs(next);
    void savePreferences(next);
  };

  const updateMode = (surprise: boolean) => {
    const next: ScanMode = surprise ? "surprise" : "normal";
    setMode(next);
    void saveMode(next);
  };

  const openCamera = () => router.push("/camera");
  const openRecent = (scan: RecentScan) =>
    router.push({ pathname: "/results", params: { scanId: scan.id } });
  const clearRecent = () => {
    setRecent([]);
    void clearRecentScans();
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
          <Text style={styles.eyebrow}>What's Cooking?</Text>
          <Text style={styles.headerTitle}>
            Turn what you have{"\n"}into what you eat.
          </Text>
          <Text style={styles.headerSubtitle}>
            Snap your fridge, pantry &amp; spice rack — get real recipes in seconds.
          </Text>
        </LinearGradient>

        <View style={styles.body}>
          {/* Primary CTA */}
          <Pressable
            onPress={openCamera}
            style={({ pressed }) => [pressed && styles.ctaPressed]}
            accessibilityRole="button"
            accessibilityLabel="Start a new scan"
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.cta, shadowLg]}
            >
              <View style={styles.ctaIconWrap}>
                <Ionicons name="camera" size={26} color={colors.white} />
              </View>
              <View style={styles.ctaText}>
                <Text style={styles.ctaTitle}>Start a scan</Text>
                <Text style={styles.ctaSubtitle}>
                  Fridge, pantry &amp; spices — snap as many as you like
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={22} color={colors.white} />
            </LinearGradient>
          </Pressable>

          {/* Preferences */}
          <SectionLabel icon="options-outline" text="Preferences" />
          <View style={[styles.card, shadow]}>
            <PrefRow
              label="Vegetarian"
              icon="leaf-outline"
              value={prefs.vegetarian}
              onChange={(v) => updatePref("vegetarian", v)}
            />
            <PrefRow
              label="Vegan"
              icon="flower-outline"
              value={prefs.vegan}
              onChange={(v) => updatePref("vegan", v)}
            />
            <PrefRow
              label="Gluten-free"
              icon="nutrition-outline"
              value={prefs.glutenFree}
              onChange={(v) => updatePref("glutenFree", v)}
              last
            />
          </View>

          <View style={[styles.card, styles.cardSpaced, shadow]}>
            <PrefRow
              label="Surprise me"
              sublabel="Bolder, more creative suggestions"
              icon="sparkles-outline"
              value={mode === "surprise"}
              onChange={updateMode}
              last
            />
          </View>

          {/* Recent scans */}
          {recent.length > 0 ? (
            <View style={styles.recentSection}>
              <View style={styles.recentHeader}>
                <SectionLabel icon="time-outline" text="Recent scans" inline />
                <Pressable
                  onPress={clearRecent}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Clear recent scans"
                >
                  <Text style={styles.clearText}>Clear</Text>
                </Pressable>
              </View>
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
                  <View style={styles.recentIconWrap}>
                    <Ionicons
                      name="restaurant-outline"
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentTitle} numberOfLines={1}>
                      {scan.title}
                    </Text>
                    <Text style={styles.recentMeta}>
                      {scan.ingredientCount} ingredients · {formatWhen(scan.timestamp)}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textMuted}
                  />
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.recentSection}>
              <SectionLabel icon="time-outline" text="Recent scans" />
              <View style={[styles.emptyRecent, shadow]}>
                <Ionicons
                  name="images-outline"
                  size={26}
                  color={colors.textMuted}
                />
                <Text style={styles.emptyRecentText}>
                  Your recent scans will show up here.
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function SectionLabel({
  icon,
  text,
  inline = false,
}: {
  icon: IonName;
  text: string;
  inline?: boolean;
}) {
  return (
    <View style={[styles.sectionLabel, inline && { marginBottom: 0 }]}>
      <Ionicons name={icon} size={14} color={colors.textSecondary} />
      <Text style={styles.sectionLabelText}>{text}</Text>
    </View>
  );
}

function PrefRow({
  label,
  icon,
  sublabel,
  value,
  onChange,
  last,
}: {
  label: string;
  icon: IonName;
  sublabel?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.prefRow, !last && styles.prefRowBorder]}>
      <View style={styles.prefIconWrap}>
        <Ionicons
          name={icon}
          size={18}
          color={value ? colors.primary : colors.textSecondary}
        />
      </View>
      <View style={styles.prefLabelWrap}>
        <Text style={styles.prefLabel}>{label}</Text>
        {sublabel ? <Text style={styles.prefSublabel}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ false: "#D9D9DE", true: colors.primary }}
        thumbColor={colors.white}
        ios_backgroundColor="#D9D9DE"
      />
    </View>
  );
}

// Cast fights an @types/react-native strict-mode widening when a single
// StyleSheet.create call mixes many View-only and Text-only styles.
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl + spacing.md,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.75)",
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: -0.6,
    lineHeight: 36,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    marginTop: spacing.sm,
    lineHeight: 21,
  },
  body: {
    padding: spacing.lg,
    marginTop: -spacing.xl,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.xl,
  },
  ctaPressed: { transform: [{ scale: 0.99 }], opacity: 0.96 },
  ctaIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  ctaText: { flex: 1 },
  ctaTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: -0.2,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  sectionLabelText: {
    ...typography.label,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.lg,
  },
  cardSpaced: { marginTop: spacing.lg },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md + 2,
  },
  prefRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  prefIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  prefLabelWrap: { flex: 1 },
  prefLabel: {
    ...typography.body,
    fontWeight: "600",
  },
  prefSublabel: {
    ...typography.caption,
    marginTop: 2,
  },
  recentSection: { marginTop: spacing.xl },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  clearText: {
    ...typography.label,
    color: colors.primary,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  recentRowPressed: { opacity: 0.85 },
  recentIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  recentInfo: { flex: 1 },
  recentTitle: {
    ...typography.body,
    fontWeight: "600",
  },
  recentMeta: {
    ...typography.caption,
    marginTop: 2,
  },
  emptyRecent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  emptyRecentText: {
    ...typography.caption,
    textAlign: "center",
  },
}) as Record<string, ViewStyle & TextStyle>;
