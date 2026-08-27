import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { colors } from "@/constants/theme";

/** Routes that an unauthenticated user is allowed to see. */
const AUTH_ROUTES = ["login", "signup", "confirm", "forgot-password"];

function RootNavigator() {
  const { session, initializing } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;
    const onAuthRoute = AUTH_ROUTES.includes(segments[0] ?? "");
    if (!session && !onAuthRoute) {
      // Not signed in and trying to use the app → go sign in.
      router.replace("/login");
    } else if (session && onAuthRoute) {
      // Signed in but sitting on an auth screen → go home.
      router.replace("/");
    }
  }, [session, initializing, segments, router]);

  // Hold the splash-ish loading state until we know the auth status, to avoid
  // a flash of the wrong screen.
  if (initializing) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
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
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="confirm" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
