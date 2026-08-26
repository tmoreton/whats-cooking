import "react-native-get-random-values";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ErrorBoundary from "@/components/ErrorBoundary";
import { colors } from "@/constants/theme";

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="dark" />
          <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen
            name="camera"
            options={{ headerShown: false, presentation: "fullScreenModal" }}
          />
          <Stack.Screen
            name="results"
            options={{ title: "What's Cooking?", headerBackTitle: "Home" }}
          />
        </Stack>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
