import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";

/**
 * Flat, shadow-free toggle to replace the native <Switch>, whose baked-in
 * knob/track shadow reads as a heavy grey drop shadow. Same footprint as an
 * iOS switch, animated, but completely flat.
 */
export default function Toggle({
  value,
  onValueChange,
  accessibilityLabel,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  accessibilityLabel?: string;
}) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 180,
      // Color + layout interpolation can't use the native driver.
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const backgroundColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#E9E9EA", colors.primary],
  });
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
    >
      <Animated.View style={[styles.track, { backgroundColor }]}>
        <Animated.View style={[styles.knob, { transform: [{ translateX }] }]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
  },
  knob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
  },
});
