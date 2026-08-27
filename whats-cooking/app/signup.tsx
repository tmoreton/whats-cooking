import React, { useState } from "react";
import { router } from "expo-router";
import {
  AuthButton,
  AuthError,
  AuthField,
  AuthLink,
  AuthScreen,
} from "@/components/AuthUI";
import { signUp } from "@/services/auth";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !password) {
      setError("Enter your email and a password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signUp(trimmed, password);
      router.push({ pathname: "/confirm", params: { email: trimmed } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      title="Create account"
      subtitle="Sign up to save your scans and recipes."
    >
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
        placeholder="At least 8 characters"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="password-new"
        textContentType="newPassword"
      />
      <AuthField
        label="Confirm password"
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Re-enter your password"
        secureTextEntry
        autoCapitalize="none"
        onSubmitEditing={onSubmit}
        returnKeyType="go"
      />
      <AuthButton label="Create account" onPress={onSubmit} loading={loading} />
      <AuthLink
        prefix="Already have an account?"
        label="Sign in"
        onPress={() => router.replace("/login")}
      />
    </AuthScreen>
  );
}
