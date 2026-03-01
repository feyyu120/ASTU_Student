// reset-password.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { TextInput, Button, Snackbar } from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../constant/color";

const API_URL = "http://localhost:5000"; // ← change to real URL when deploying

export default function ResetPassword() {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleReset = async () => {
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!userId) {
      setError("Invalid reset session. Please try again.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Password reset failed");
      }

      // Save token & user → user is now logged in!
      await SecureStore.setItemAsync("authToken", data.token);
      await SecureStore.setItemAsync("user", JSON.stringify(data.user));

      setSuccess("Password reset successful! Logging you in...");

      // Redirect to home after short delay
      setTimeout(() => {
        router.replace("/(tabs)/home");
      }, 1800);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 28,
            paddingTop: 60,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flex: 1, justifyContent: "center" }}>
            {/* Header */}
            <Text
              style={{
                fontSize: 30,
                fontWeight: "700",
                color: "#1e293b",
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              Set New Password
            </Text>

            <Text
              style={{
                fontSize: 16,
                color: "#64748b",
                textAlign: "center",
                marginBottom: 40,
                lineHeight: 24,
              }}
            >
              Choose a strong password to protect your account
            </Text>

            {/* New Password */}
            <TextInput
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              mode="outlined"
              secureTextEntry={!showNewPassword}
              left={<TextInput.Icon icon="lock-outline" />}
              right={
                <TextInput.Icon
                  icon={showNewPassword ? "eye-off" : "eye"}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                />
              }
              outlineStyle={{ borderRadius: 16 }}
              style={{ marginBottom: 20 }}
              theme={{ colors: { primary: Colors.primary || "#3b82f6" } }}
            />

            {/* Confirm Password */}
            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry={!showConfirmPassword}
              left={<TextInput.Icon icon="lock-check-outline" />}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? "eye-off" : "eye"}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
              outlineStyle={{ borderRadius: 16 }}
              style={{ marginBottom: 32 }}
              theme={{ colors: { primary: Colors.primary || "#3b82f6" } }}
            />

            {/* Reset Button */}
            <Button
              mode="contained"
              onPress={handleReset}
              loading={loading}
              disabled={loading || !newPassword || !confirmPassword}
              buttonColor={Colors.secondary || "#1e40af"}
              style={{ borderRadius: 16, paddingVertical: 6 }}
              labelStyle={{ fontSize: 16, fontWeight: "600" }}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>

            {/* Back Link */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ alignSelf: "center", marginTop: 24 }}
            >
              <Text
                style={{
                  color: Colors.link || "#2563eb",
                  fontWeight: "600",
                  fontSize: 15,
                }}
              >
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Feedback */}
      <Snackbar
        visible={!!error}
        onDismiss={() => setError("")}
        duration={4500}
        action={{ label: "OK", onPress: () => setError("") }}
        style={{ backgroundColor: "#ef4444" }}
      >
        {error}
      </Snackbar>

      <Snackbar
        visible={!!success}
        onDismiss={() => setSuccess("")}
        duration={3000}
        style={{ backgroundColor: "#10b981" }}
      >
        {success}
      </Snackbar>
    </SafeAreaView>
  );
}