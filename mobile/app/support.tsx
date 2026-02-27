// support.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  TextInput,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Button, Snackbar } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "./constant/color"; // ← your color file

export default function Support() {
  const [message, setMessage] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Replace these with your REAL contact links
  const contacts = {
    telegram: "https://t.me/feyyu2", 
    whatsapp: "https://wa.me/+251950471868", 
    email: "mailto:feyselfeyyu@gmail.com",
  };

  const openLink = async (url: string, appName: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Cannot open", `Unable to open ${appName}. Please install the app or copy the link.`);
      }
    } catch (error) {
      Alert.alert("Error", `Failed to open ${appName}`);
    }
  };

  const handleSendMessage = () => {
    if (!message.trim()) {
      setSnackbarMessage("Please write a message first");
      setSnackbarVisible(true);
      return;
    }

    // For now — just show success (you can later send to backend or email)
    setSnackbarMessage("Thank you! Your message has been noted. We'll get back to you soon.");
    setSnackbarVisible(true);
    setMessage(""); // clear input
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 20,
              paddingBottom: 40,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header / Welcome */}
            <View style={{ alignItems: "center", marginBottom: 32 }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: Colors.primary + "22", // light version of primary
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Ionicons name="help-circle-outline" size={48} color={Colors.primary} />
              </View>

              <Text
                style={{
                  fontSize: 26,
                  fontWeight: "700",
                  color: "#333",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                We're here to help
              </Text>

              <Text
                style={{
                  fontSize: 16,
                  color: "#555",
                  textAlign: "center",
                  lineHeight: 24,
                  marginBottom: 24,
                }}
              >
                You can give any suggestion or{"\n"}need help? Feel free to ask anytime!
              </Text>
            </View>

            {/* Contact Options */}
            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontSize: 18, fontWeight: "600", color: "#333", marginBottom: 16 }}>
                Contact us directly
              </Text>

              <TouchableOpacity
                style={contactButtonStyle}
                onPress={() => openLink(contacts.telegram, "Telegram")}
              >
                <Ionicons name="logo-telegram" size={28} color="#0088cc" />
                <Text style={contactText}>Telegram Support</Text>
                <Ionicons name="open-outline" size={20} color="#888" />
              </TouchableOpacity>

              <TouchableOpacity
                style={contactButtonStyle}
                onPress={() => openLink(contacts.whatsapp, "WhatsApp")}
              >
                <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
                <Text style={contactText}>WhatsApp</Text>
                <Ionicons name="open-outline" size={20} color="#888" />
              </TouchableOpacity>

              <TouchableOpacity
                style={contactButtonStyle}
                onPress={() => openLink(contacts.email, "Email")}
              >
                <Ionicons name="mail-outline" size={28} color="#e74c3c" />
                <Text style={contactText}>Email Support</Text>
                <Ionicons name="open-outline" size={20} color="#888" />
              </TouchableOpacity>
            </View>

            {/* Message Form */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: "600", color: "#333", marginBottom: 12 }}>
                Or send us a message
              </Text>

              <TextInput
                style={{
                  backgroundColor: "white",
                  borderRadius: 12,
                  padding: 16,
                  minHeight: 120,
                  textAlignVertical: "top",
                  borderWidth: 1,
                  borderColor: "#ddd",
                  fontSize: 16,
                  marginBottom: 16,
                }}
                placeholder="Describe your issue or suggestion..."
                placeholderTextColor="#999"
                multiline
                value={message}
                onChangeText={setMessage}
              />

              <Button
                mode="contained"
                onPress={handleSendMessage}
                buttonColor={Colors.primary}
                style={{ borderRadius: 12, paddingVertical: 4 }}
                labelStyle={{ fontSize: 16 }}
              >
                Send Message
              </Button>
            </View>

            {/* Extra note */}
            <Text
              style={{
                fontSize: 14,
                color: "#777",
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              We usually reply within 24 hours during working days.{'\n'}
              Thank you for helping us improve!
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={4000}
          action={{
            label: "OK",
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {snackbarMessage}
        </Snackbar>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const contactButtonStyle = {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "white",
  padding: 16,
  borderRadius: 12,
  marginBottom: 12,
  elevation: 1,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
} as const;

const contactText = {
  flex: 1,
  fontSize: 16,
  color: "#222",
  marginLeft: 16,
  fontWeight: "500",
} as const;