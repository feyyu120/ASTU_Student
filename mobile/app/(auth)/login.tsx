import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, TextInput, Snackbar } from "react-native-paper";
import * as SecureStore from "expo-secure-store";
import styles from "../styles/login.style";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TypeAnimation } from "react-native-type-animation";
import COLORS from "../constant/color";
const API_URL = "http://localhost:5000"; // Change to your real backend URL later

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const validateInputs = () => {
    if (!email.trim()) {
      setErrorMessage("Email is required");
      return false;
    }
    if (!password.trim()) {
      setErrorMessage("Password is required");
      return false;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Please enter a valid email");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed. Please check your credentials.");
      }

      // Save JWT token & user securely
      await SecureStore.setItemAsync("authToken", data.token);
      await SecureStore.setItemAsync("user", JSON.stringify(data.user));

      // Clear fields
      setEmail("");
      setPassword("");

      // Success feedback via Snackbar
      setSuccessMessage("Login successful! Redirecting to home...");

      // Auto-redirect after short delay
      setTimeout(() => {
        router.replace("/(tabs)/home");
      }, 1800);

    } catch (error: any) {
      setErrorMessage(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, paddingBottom: insets.bottom }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 20,
          }}
          keyboardDismissMode="interactive"
        >
          <View style={styles.container}>
            <Image
              source={require("../../assets/images/delivery.png")}
              style={styles.image}
              resizeMode="contain"
            />

            <View style={styles.form}>
              <TypeAnimation
                sequence={[{ text: "Welcome Back!", typeSpeed: 80 }]}
                cursor={false}
                style={{
                  fontSize: 26,
                  color: COLORS.secondary,
                  fontWeight: "bold",
                  textAlign: "center",
                  marginBottom: 32,
                }}
              />

              <TextInput
                style={styles.input}
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                left={<TextInput.Icon icon="email" />}
                outlineStyle={{ borderRadius: 12 }}
              />

              <TextInput
                style={[styles.input, { marginTop: 16 }]}
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry={!isPasswordVisible}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={isPasswordVisible ? "eye-off" : "eye"}
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  />
                }
                outlineStyle={{ borderRadius: 12 }}
              />

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={isLoading}
                disabled={isLoading}
                buttonColor={COLORS.secondary}
                textColor="white"
                style={{ marginTop: 20 }}
                contentStyle={{ paddingVertical: 6 }}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>

              <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 10}}>
                <Text style={{ color: "#666", fontSize: 15 }}>
                  Don't have an account?{" "}
                </Text>
                <Link href="/register" asChild>
                  <TouchableOpacity>
                    <Text style={{ color: COLORS.link, fontWeight: "bold", fontSize: 15 }}>
                      Sign up
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Error Snackbar */}
      <Snackbar
        visible={!!errorMessage}
        onDismiss={() => setErrorMessage("")}
        duration={4000}
        action={{
          label: "OK",
          onPress: () => setErrorMessage(""),
        }}
        style={{ backgroundColor: COLORS.error }}
      >
        {errorMessage}
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        visible={!!successMessage}
        onDismiss={() => setSuccessMessage("")}
        duration={1800}
        style={{ backgroundColor: COLORS.success }}
      >
        {successMessage}
      </Snackbar>
    </>
  );
}