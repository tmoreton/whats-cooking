import React, { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
  AuthButton,
  AuthError,
  AuthField,
  AuthLink,
  AuthScreen,
} from "@/components/AuthUI";
import { confirmSignUp, resendConfirmationCode } from "@/services/auth";

export default function ConfirmScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !code.trim()) {
      setError("Enter your email and the code we sent you.");
      return;
    }
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      await confirmSignUp(trimmed, code.trim());
      router.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't confirm account.");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Enter your email to resend the code.");
      return;
    }
    setError(null);
    try {
      await resendConfirmationCode(trimmed);
      setNotice("We sent a new code to your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't resend the code.");
    }
  };

  return (
    <AuthScreen
      title="Confirm your email"
      subtitle="Enter the 6-digit code we emailed you."
    >
      <AuthError message={error} />
      {notice ? <AuthLink label={notice} onPress={() => setNotice(null)} /> : null}
      <AuthField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <AuthField
        label="Confirmation code"
        value={code}
        onChangeText={setCode}
        placeholder="123456"
        keyboardType="number-pad"
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        onSubmitEditing={onSubmit}
        returnKeyType="go"
      />
      <AuthButton label="Confirm" onPress={onSubmit} loading={loading} />
      <AuthLink
        prefix="Didn't get it?"
        label="Resend code"
        onPress={onResend}
      />
    </AuthScreen>
  );
}
