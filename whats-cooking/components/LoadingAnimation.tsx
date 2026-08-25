import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "@/constants/theme";

const MESSAGES = [
  "Peeking inside your fridge…",
  "Spotting your ingredients…",
  "Dreaming up recipes…",
  "Plating your options…",
];

// Vector-only cooking indicator — no emojis. A soft bowl with a rim rocks
// gently while three brand-colored dots bob above it. Everything is drawn
// with Views + Animated so the theme stays consistent with the icon system.
const DOT_COLORS = [colors.primary, colors.available, "#F5A623"];

export default function LoadingAnimation() {
  const rock = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setMsgIdx((i) => (i + 1) % MESSAGES.length),
      2200
    );
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const rockLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(rock, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rock, {
          toValue: -1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rock, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    rockLoop.start();
    bobLoop.start();
    return () => {
      rockLoop.stop();
      bobLoop.stop();
    };
  }, [rock, bob]);

  const rockRotate = rock.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-6deg", "6deg"],
  });

  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        {/* Floating "ingredients" — brand-colored dots */}
        <View style={styles.dotRow}>
          {DOT_COLORS.map((color, idx) => {
            const translateY = bob.interpolate({
              inputRange: [0, 1],
              outputRange: [0, idx % 2 === 0 ? -18 : -26],
            });
            return (
              <Animated.View
                key={color}
                style={[
                  styles.dot,
                  { backgroundColor: color, transform: [{ translateY }] },
                ]}
              />
            );
          })}
        </View>

        {/* Bowl — orange body with a dark rim, rocks gently */}
        <Animated.View
          style={[styles.bowl, { transform: [{ rotate: rockRotate }] }]}
        >
          <View style={styles.bowlRim} />
          <View style={styles.bowlBody} />
        </Animated.View>
      </View>

      <Text style={styles.message}>{MESSAGES[msgIdx]}</Text>
    </View>
  );
}

const BOWL_W = 132;
const BOWL_H = 80;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  stage: {
    height: 170,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  dotRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  bowl: {
    width: BOWL_W,
    height: BOWL_H + 12,
    alignItems: "center",
  },
  bowlRim: {
    width: BOWL_W,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.text,
  },
  bowlBody: {
    width: BOWL_W - 8,
    height: BOWL_H,
    marginTop: -2,
    borderBottomLeftRadius: radii.xl + 20,
    borderBottomRightRadius: radii.xl + 20,
    backgroundColor: colors.primary,
  },
  message: {
    ...typography.subheading,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
});
