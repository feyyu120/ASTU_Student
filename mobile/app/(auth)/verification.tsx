// verification.tsx
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { TextInput, Button, Snackbar } from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../constant/color";

const API_URL = "http://localhost:5000";

export default function Verification() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(60);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Enter 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid OTP");

      // Go to reset password page, pass userId or email
      router.push({ pathname: "/reset-password", params: { userId: data.userId, email } });
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    if (resendTimer > 0) return;
    // resend logic (same as forgot-password)
    setResendTimer(60);
    // call forgot-password endpoint again
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
          <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 8, textAlign: "center" }}>
            Verify Email
          </Text>
          <Text style={{ fontSize: 16, color: "#555", textAlign: "center", marginBottom: 32 }}>
            We sent a 6-digit code to{"\n"}
            <Text style={{ fontWeight: "600" }}>{email || "your email"}</Text>
          </Text>

          <TextInput
            label="Enter 6-digit code"
            value={otp}
            onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, "").slice(0, 6))}
            mode="outlined"
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
            style={{ fontSize: 24, letterSpacing: 12, textAlign: "center", marginBottom: 24 }}
          />

          <Button
            mode="contained"
            onPress={handleVerify}
            loading={loading}
            disabled={loading || otp.length !== 6}
            buttonColor={COLORS.secondary}
          >
            Verify & Continue
          </Button>

          <TouchableOpacity
            onPress={resendOTP}
            disabled={resendTimer > 0}
            style={{ marginTop: 24, alignItems: "center" }}
          >
            <Text style={{ color: resendTimer > 0 ? "#aaa" : COLORS.link, fontWeight: "500" }}>
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
            </Text>
          </TouchableOpacity>

          <Button mode="text" onPress={() => router.back()} style={{ marginTop: 16 }}>
            Back
          </Button>
        </View>
      </KeyboardAvoidingView>

      <Snackbar visible={!!error} onDismiss={() => setError("")} duration={4000} style={{ backgroundColor: "red" }}>
        {error}
      </Snackbar>
    </SafeAreaView>
  );
}