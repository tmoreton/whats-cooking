import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/constants/theme";

/**
 * Pure React Native Animated cooking animation — no external Lottie asset
 * required. A pot rocks gently while three "ingredients" bob up and down above
 * it, and steam drifts upward. Everything is driven by looping Animated values.
 */
export default function LoadingAnimation({
  message = "Cooking up ideas…",
}: {
  message?: string;
}) {
  const rock = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const steam = useRef(new Animated.Value(0)).current;

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

    const steamLoop = Animated.loop(
      Animated.timing(steam, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );

    rockLoop.start();
    bobLoop.start();
    steamLoop.start();

    return () => {
      rockLoop.stop();
      bobLoop.stop();
      steamLoop.stop();
    };
  }, [rock, bob, steam]);

  const rockRotate = rock.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-8deg", "8deg"],
  });

  const steamTranslate = steam.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -28],
  });
  const steamOpacity = steam.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 0.7, 0.4, 0],
  });

  const ingredients = ["🍅", "🥕", "🧅"];

  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        {/* Floating ingredients */}
        <View style={styles.ingredientRow}>
          {ingredients.map((emoji, idx) => {
            const translateY = bob.interpolate({
              inputRange: [0, 1],
              outputRange: [0, idx % 2 === 0 ? -14 : -22],
            });
            return (
              <Animated.Text
                key={emoji}
                style={[
                  styles.ingredient,
                  { transform: [{ translateY }] },
                ]}
              >
                {emoji}
              </Animated.Text>
            );
          })}
        </View>

        {/* Steam */}
        <Animated.Text
          style={[
            styles.steam,
            {
              opacity: steamOpacity,
              transform: [{ translateY: steamTranslate }],
            },
          ]}
        >
          ~ ~ ~
        </Animated.Text>

        {/* Pot */}
        <Animated.Text
          style={[styles.pot, { transform: [{ rotate: rockRotate }] }]}
        >
          🍲
        </Animated.Text>
      </View>

      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  stage: {
    height: 180,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  ingredientRow: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  ingredient: {
    fontSize: 32,
    marginHorizontal: spacing.sm,
  },
  steam: {
    fontSize: 20,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  pot: {
    fontSize: 72,
  },
  message: {
    ...typography.subheading,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
});
