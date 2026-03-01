import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { Button, TextInput, Snackbar } from "react-native-paper";
import * as SecureStore from "expo-secure-store";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { TypeAnimation } from "react-native-type-animation";
import Colors from "../constant/color"; 

const { height } = Dimensions.get("window");
const API_URL = "http://localhost:5000";

export default function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const insets = useSafeAreaInsets();

  const validateInputs = () => {
    if (!email.trim()) return setErrorMessage("Email is required"), false;
    if (!password.trim()) return setErrorMessage("Password is required"), false;
    if (password.length < 6) return setErrorMessage("Password must be at least 6 characters"), false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return setErrorMessage("Please enter a valid email"), false;

    return true;
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed. Check your credentials.");
      }

      await SecureStore.setItemAsync("authToken", data.token);
      await SecureStore.setItemAsync("user", JSON.stringify(data.user));

      setSuccessMessage("Welcome back!");
      setTimeout(() => router.replace("/(tabs)/home"), 200);

      setEmail("");
      setPassword("");
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={insets.top + 20}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 28,
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          <View
            style={{
              flex: 1,
              justifyContent: height > 800 ? "center" : "flex-start",
              paddingTop: height > 800 ? 0 : 60,
            }}
          >
         
           

            {/* Form Card */}
            <View
              style={{
                backgroundColor: "#FFF",
                borderRadius: 24,
                padding: 28,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.08,
                shadowRadius: 20,
                elevation: 8,
              }}
            >
               <TypeAnimation
              sequence={[{ text: "Welcome Back!", typeSpeed: 70 }]}
              cursor={false}
              style={{
                fontSize: 25,
                fontWeight: "700",
                color: Colors.secondary || "#1e40af",
                textAlign: "center",
                marginBottom: 20,
                letterSpacing: -0.5,
              }}
            />
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                left={<TextInput.Icon icon="email-outline" />}
                outlineStyle={{ borderRadius: 16 }}
                style={{ marginBottom: 20,backgroundColor:"transparent" }}
                theme={{ colors: { primary: Colors.secondary } }}
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry={!isPasswordVisible}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  />
                }
                outlineStyle={{ borderRadius: 16 }}
                style={{ marginBottom: 12 ,backgroundColor:"transparent"}}
                theme={{ colors: { primary: Colors.secondary } }}
              />

              {/* Forgot Password */}
              <TouchableOpacity
                onPress={() => router.push("/forgot-password")}
                style={{ alignSelf: "flex-end", marginBottom: 28 }}
              >
                <Text
                  style={{
                    color: Colors.link || "#2563eb",
                    fontWeight: "600",
                    fontSize: 15,
                  }}
                >
                  Forgot password?
                </Text>
              </TouchableOpacity>

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={isLoading}
                disabled={isLoading}
                buttonColor={Colors.secondary || "#1e40af"}
                style={{ borderRadius: 16, paddingVertical: 6 }}
                labelStyle={{ fontSize: 16, fontWeight: "600", letterSpacing: 0.5 }}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </View>

            {/* Sign Up Link */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginTop: 32,
              }}
            >
              <Text style={{ color: "#6b7280", fontSize: 15 }}>
                Don't have an account?{" "}
              </Text>
              <Link href="/register" asChild>
                <TouchableOpacity>
                  <Text
                    style={{
                      color: Colors.link || "#2563eb",
                      fontWeight: "700",
                      fontSize: 15,
                    }}
                  >
                    Sign up
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Snackbars */}
      <Snackbar
        visible={!!errorMessage}
        onDismiss={() => setErrorMessage("")}
        duration={4000}
        action={{ label: "OK", onPress: () => setErrorMessage("") }}
        style={{ backgroundColor: "#ef4444" }}
      >
        {errorMessage}
      </Snackbar>

      <Snackbar
        visible={!!successMessage}
        onDismiss={() => setSuccessMessage("")}
        duration={2200}
        style={{ backgroundColor: "#0e6749" }}
      >
        {successMessage}
      </Snackbar>
    </SafeAreaView>
  );
}