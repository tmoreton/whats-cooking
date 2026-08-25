import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii, spacing, typography } from "@/constants/theme";
import { setPendingScan } from "@/services/pendingScan";

const MAX_DIMENSION = 1024;
const MAX_PHOTOS = 6;

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturing, setCapturing] = useState(false);
  const [shots, setShots] = useState<string[]>([]);

  // Permissions still loading.
  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // Permission denied / not yet granted.
  if (!permission.granted) {
    return (
      <View style={[styles.centered, { padding: spacing.xl }]}>
        <Text style={styles.deniedEmoji}>📷</Text>
        <Text style={styles.deniedTitle}>Camera access needed</Text>
        <Text style={styles.deniedBody}>
          What's Cooking? needs your camera to snap a photo of your fridge.
          {permission.canAskAgain
            ? ""
            : " Please enable camera access in Settings."}
        </Text>
        {permission.canAskAgain ? (
          <Pressable
            onPress={requestPermission}
            style={styles.primaryButton}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Grant permission</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => router.back()}
          style={styles.secondaryButton}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const handleSnap = async () => {
    if (!cameraRef.current || capturing || shots.length >= MAX_PHOTOS) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      if (!photo) {
        throw new Error("No photo captured");
      }

      // Resize to a max dimension of 1024px and produce a base64 PNG.
      const manipulated = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: MAX_DIMENSION } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.PNG,
          base64: true,
        }
      );

      if (!manipulated.base64) {
        throw new Error("Failed to encode image");
      }

      // Add this shot to the collection; the user can keep snapping (fridge,
      // pantry, spice cabinet…) and tap Done when finished.
      setShots((prev) => [...prev, manipulated.base64 as string]);
    } catch {
      // Swallow the error; the shutter stays available to retry.
    } finally {
      setCapturing(false);
    }
  };

  const handleDone = () => {
    if (shots.length === 0) return;
    // Stash all captured photos in the in-memory singleton (router params
    // can't safely carry large base64 strings), then navigate to results.
    setPendingScan(shots);
    router.replace("/results");
  };

  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      {/* Top tip overlay */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.tipPill}>
          <Text style={styles.tipText}>
            {shots.length === 0
              ? "Snap your fridge — add your pantry or spice rack too!"
              : shots.length >= MAX_PHOTOS
              ? `Max ${MAX_PHOTOS} photos — tap Done`
              : `${shots.length} photo${shots.length > 1 ? "s" : ""} added — snap more or tap Done`}
          </Text>
        </View>
      </View>

      {/* Framing guide */}
      <View pointerEvents="none" style={styles.frameGuide} />

      {/* Bottom controls */}
      <View
        style={[styles.bottomOverlay, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.cancelButton}
          accessibilityRole="button"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>

        <Pressable
          onPress={handleSnap}
          disabled={capturing || shots.length >= MAX_PHOTOS}
          style={styles.shutterOuter}
          accessibilityRole="button"
          accessibilityLabel="Take photo"
        >
          <View style={styles.shutterInner}>
            {capturing ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.shutterEmoji}>📸</Text>
            )}
          </View>
        </Pressable>

        {shots.length > 0 ? (
          <Pressable
            onPress={handleDone}
            style={styles.doneButton}
            accessibilityRole="button"
            accessibilityLabel={`Done, ${shots.length} photos`}
          >
            <Text style={styles.doneText}>Done</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{shots.length}</Text>
            </View>
          </Pressable>
        ) : (
          // Spacer to balance the cancel button so the shutter stays centered.
          <View style={styles.cancelButton} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  tipPill: {
    backgroundColor: colors.overlay,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  tipText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  frameGuide: {
    position: "absolute",
    top: "22%",
    left: "8%",
    right: "8%",
    bottom: "28%",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
    borderRadius: radii.lg,
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  cancelButton: {
    width: 72,
    alignItems: "center",
  },
  cancelText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  doneButton: {
    width: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  doneText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  countBadge: {
    marginLeft: spacing.xs,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
  },
  shutterOuter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 5,
    borderColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterEmoji: {
    fontSize: 28,
  },
  deniedEmoji: {
    fontSize: 52,
    marginBottom: spacing.md,
  },
  deniedTitle: {
    ...typography.heading,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  deniedBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
});
