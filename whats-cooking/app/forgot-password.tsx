import React, { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
  AuthButton,
  AuthError,
  AuthField,
  AuthLink,
  AuthScreen,
} from "@/components/AuthUI";
import { confirmForgotPassword, forgotPassword } from "@/services/auth";

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [stage, setStage] = useState<"request" | "reset">("request");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onRequest = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Enter your email.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(trimmed);
      setStage("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send a reset code.");
    } finally {
      setLoading(false);
    }
  };

  const onReset = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!code.trim() || !password) {
      setError("Enter the code and your new password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await confirmForgotPassword(trimmed, code.trim(), password);
      router.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reset your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      title="Reset password"
      subtitle={
        stage === "request"
          ? "We'll email you a code to reset your password."
          : "Enter the code we emailed and your new password."
      }
    >
      <AuthError message={error} />
      <AuthField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={stage === "request"}
      />
      {stage === "reset" ? (
        <>
          <AuthField
            label="Confirmation code"
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            keyboardType="number-pad"
            autoComplete="sms-otp"
            textContentType="oneTimeCode"
          />
          <AuthField
            label="New password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password-new"
            textContentType="newPassword"
            onSubmitEditing={onReset}
            returnKeyType="go"
          />
          <AuthButton label="Reset password" onPress={onReset} loading={loading} />
        </>
      ) : (
        <AuthButton label="Send code" onPress={onRequest} loading={loading} />
      )}
      <AuthLink
        prefix="Remembered it?"
        label="Back to sign in"
        onPress={() => router.replace("/login")}
      />
    </AuthScreen>
  );
}
