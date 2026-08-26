import React, { useCallback, useState } from "react";
import {
  Modal,
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
import { colors, radii, spacing, typography } from "@/constants/theme";
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

const SWITCH_TRACK = { false: "#E9E9EA", true: colors.primary };

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState<DietaryPreferences>(DEFAULT_PREFERENCES);
  const [mode, setMode] = useState<ScanMode>("normal");
  const [recent, setRecent] = useState<RecentScan[]>([]);
  const [prefsOpen, setPrefsOpen] = useState(false);

  const anyPref = prefs.vegetarian || prefs.vegan || prefs.glutenFree;

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
          <Pressable
            onPress={() => setPrefsOpen(true)}
            style={[styles.prefsButton, { top: insets.top + spacing.sm }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Dietary preferences"
          >
            <Ionicons name="options-outline" size={20} color={colors.white} />
            {anyPref ? <View style={styles.prefsDot} /> : null}
          </Pressable>

          <Text style={styles.eyebrow}>Snap · Cook · Eat</Text>
          <Text style={styles.headerTitle}>
            What's cookin',{"\n"}good lookin'?
          </Text>
          <Text style={styles.headerSubtitle}>
            Snap your fridge, pantry &amp; spice rack — get real recipes in seconds.
          </Text>
        </LinearGradient>

        <View style={styles.body}>
          {/* Scan panel — prominent CTA with the Surprise-me toggle attached */}
          <View style={styles.scanPanel}>
            <Pressable
              onPress={openCamera}
              style={({ pressed }) => pressed && styles.pressed}
              accessibilityRole="button"
              accessibilityLabel="Start a new scan"
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.scanButton}
              >
                <View style={styles.scanIconWrap}>
                  <Ionicons name="camera" size={30} color={colors.white} />
                </View>
                <View style={styles.scanText}>
                  <Text style={styles.scanTitle}>Start a scan</Text>
                  <Text style={styles.scanSubtitle}>
                    Snap your fridge, pantry &amp; spices
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={24} color={colors.white} />
              </LinearGradient>
            </Pressable>

            <View style={styles.surpriseRow}>
              <View style={styles.surpriseIconWrap}>
                <Ionicons
                  name="sparkles"
                  size={17}
                  color={mode === "surprise" ? colors.primary : colors.textSecondary}
                />
              </View>
              <View style={styles.prefLabelWrap}>
                <Text style={styles.prefLabel}>Surprise me</Text>
                <Text style={styles.prefSublabel}>
                  Bolder, more creative suggestions
                </Text>
              </View>
              <Switch
                value={mode === "surprise"}
                onValueChange={updateMode}
                accessibilityLabel="Surprise me"
                trackColor={SWITCH_TRACK}
                thumbColor={colors.white}
                ios_backgroundColor={SWITCH_TRACK.false}
              />
            </View>
          </View>

          {/* Recent scans */}
          {recent.length > 0 ? (
            <View style={styles.recentSection}>
              <View style={styles.recentHeader}>
                <View style={styles.sectionLabel}>
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.sectionLabelText}>Recent scans</Text>
                </View>
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
                    pressed && styles.pressed,
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
              <View style={styles.sectionLabel}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.sectionLabelText}>Recent scans</Text>
              </View>
              <View style={styles.emptyRecent}>
                <Ionicons name="images-outline" size={26} color={colors.textMuted} />
                <Text style={styles.emptyRecentText}>
                  Your recent scans will show up here.
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Dietary preferences modal */}
      <Modal
        visible={prefsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPrefsOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setPrefsOpen(false)}
        >
          <Pressable
            style={[styles.modalSheet, { paddingBottom: insets.bottom + spacing.lg }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dietary preferences</Text>
              <Pressable
                onPress={() => setPrefsOpen(false)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>
              We'll only suggest recipes that fit these.
            </Text>
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
            <Pressable
              onPress={() => setPrefsOpen(false)}
              style={({ pressed }) => [styles.modalDone, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.modalDoneText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function PrefRow({
  label,
  icon,
  value,
  onChange,
  last,
}: {
  label: string;
  icon: IonName;
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
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={SWITCH_TRACK}
        thumbColor={colors.white}
        ios_backgroundColor={SWITCH_TRACK.false}
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
    paddingBottom: spacing.xxl,
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
  prefsButton: {
    position: "absolute",
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  prefsDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  body: {
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  pressed: { opacity: 0.94 },

  // Scan panel
  scanPanel: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    overflow: "hidden",
    marginBottom: spacing.xl,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  scanIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  scanText: { flex: 1 },
  scanTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: -0.4,
  },
  scanSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.92)",
    marginTop: 2,
  },
  surpriseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  surpriseIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  // Preferences modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  modalHandle: {
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.cardBorder,
    marginBottom: spacing.md,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    ...typography.heading,
  },
  modalSubtitle: {
    ...typography.caption,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  modalDone: {
    backgroundColor: colors.text,
    borderRadius: radii.md,
    paddingVertical: spacing.md + 2,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  modalDoneText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
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

  // Recent
  recentSection: { marginBottom: spacing.sm },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  sectionLabelText: {
    ...typography.label,
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
