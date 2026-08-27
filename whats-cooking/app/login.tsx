import React, { useState } from "react";
import { router } from "expo-router";
import {
  AuthButton,
  AuthError,
  AuthField,
  AuthLink,
  AuthScreen,
} from "@/components/AuthUI";
import { AuthError as AuthErr, signIn } from "@/services/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !password) {
      setError("Enter your email and password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(trimmed, password);
      // The auth gate in _layout redirects to the app once signed in.
    } catch (err) {
      if (err instanceof AuthErr && err.code === "UserNotConfirmedException") {
        router.push({ pathname: "/confirm", params: { email: trimmed } });
        return;
      }
      setError(err instanceof Error ? err.message : "Couldn't sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen title="Welcome back" subtitle="Sign in to start cooking.">
      <AuthError message={error} />
      <AuthField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        autoCorrect={false}
      />
      <AuthField
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="password"
        textContentType="password"
        onSubmitEditing={onSubmit}
        returnKeyType="go"
      />
      <AuthLink
        label="Forgot password?"
        onPress={() =>
          router.push({
            pathname: "/forgot-password",
            params: { email: email.trim().toLowerCase() },
          })
        }
      />
      <AuthButton label="Sign in" onPress={onSubmit} loading={loading} />
      <AuthLink
        prefix="New here?"
        label="Create an account"
        onPress={() => router.push("/signup")}
      />
    </AuthScreen>
  );
}
