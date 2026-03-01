// forgot-password.tsx
import React, { useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { TextInput, Button, Snackbar } from "react-native-paper";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../constant/color";

const API_URL = "http://localhost:5000";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSendOTP = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");

      setMessage("6-digit code sent! Check your email.");
      setTimeout(() => {
        router.push({ pathname: "/verification", params: { email } });
      }, 1800);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: "center" }}>
          <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 12, textAlign: "center" }}>
            Reset Password
          </Text>
          <Text style={{ fontSize: 16, color: "#555", textAlign: "center", marginBottom: 32 }}>
            Enter your email and we'll send you a 6-digit code.
          </Text>

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ marginBottom: 24 }}
          />

          <Button
            mode="contained"
            onPress={handleSendOTP}
            loading={loading}
            disabled={loading}
            buttonColor={COLORS.secondary}
            style={{ paddingVertical: 4 }}
          >
            Send Code
          </Button>

          <Button mode="text" onPress={() => router.back()} style={{ marginTop: 16 }}>
            Back to Login
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar visible={!!error} onDismiss={() => setError("")} duration={4000} style={{ backgroundColor: "red" }}>
        {error}
      </Snackbar>
      <Snackbar visible={!!message} onDismiss={() => setMessage("")} duration={3000} style={{ backgroundColor: "green" }}>
        {message}
      </Snackbar>
    </SafeAreaView>
  );
}