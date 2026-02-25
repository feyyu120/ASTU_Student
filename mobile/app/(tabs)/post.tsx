import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput as NativeTextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Snackbar } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import styles from "../styles/home.style"; // your existing styles
import Colors from "../constant/color"; // your colors file

const API_URL = "http://localhost:5000"; 

export default function Post() {
  const [type, setType] = useState<"lost" | "found">("lost");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Request gallery permission
  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setErrorMessage("Permission to access gallery is required.");
      return false;
    }
    return true;
  };

  // Pick image from gallery
  const pickImage = async () => {
    if (!(await requestPermission())) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Submit to backend
  const handleSubmit = async () => {
    if (!description.trim() || !category.trim() || !location.trim()) {
      setErrorMessage("All fields are required");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const formData = new FormData();
      formData.append("type", type);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("location", location);

      if (image) {
        const filename = image.split("/").pop() || `item-${Date.now()}.jpg`;
        const fileType = filename.split(".").pop() || "jpg";

        formData.append("image", {
          uri: image,
          name: filename,
          type: `image/${fileType}`,
        } as any);
      }

      const response = await fetch(`${API_URL}/api/items/report`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          
        },
        body: formData,
      });

      const contentType = response.headers.get("content-type");

      if (!response.ok) {
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          throw new Error(data.message || "Failed to post item");
        } else {
          const text = await response.text();
          console.log("Non-JSON error:", text);
          throw new Error("Server error - invalid response");
        }
      }

      const data = await response.json();

      setSuccessMessage("Item posted successfully!");
      setTimeout(() => router.back(), 1800);

   
      setDescription("");
      setCategory("");
      setLocation("");
      setImage(null);
    } catch (error: any) {
      console.error("Upload error:", error);
      setErrorMessage(error.message || "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardDismissMode="on-drag">
         
          <Text
            style={{
              fontSize: 26,
              fontWeight: "bold",
              color: Colors.textSecondary,
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            Report {type === "lost" ? "Lost" : "Found"} Item
          </Text>

         
          <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 32 }}>
            <TouchableOpacity
              onPress={() => setType("lost")}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 12,
                backgroundColor: type === "lost" ? Colors.secondary : "transparent",
                borderWidth: 0.1,
                borderColor: Colors.border,
                marginRight: 16,
              }}
            >
              <Text
                style={{
                  color: type === "lost" ? "white" : Colors.textSecondary,
                  fontWeight: "bold",
                  fontSize: 16,
                }}
              >
                Lost
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setType("found")}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 12,
                backgroundColor: type === "found" ? Colors.secondary : "transparent",
                borderWidth: 0.5,
                borderColor: Colors.border,
              }}
            >
              <Text
                style={{
                  color: type === "found" ? "white" : Colors.textSecondary,
                  fontWeight: "bold",
                  fontSize: 16,
                }}
              >
                Found
              </Text>
            </TouchableOpacity>
          </View>

         
          <Text style={{ fontSize: 16, color: Colors.textPrimary, marginBottom: 6, fontWeight: "600" }}>
            Category 
          </Text>
          <NativeTextInput
            value={category}
            onChangeText={setCategory}
            placeholder="ID,charger...."
            placeholderTextColor={Colors.textTertiary}
            style={{
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: 12,
              padding: 14,
              fontSize: 16,
              backgroundColor: "white",
              marginBottom: 20,
            }}
          />

        
          <Text style={{ fontSize: 16, color: Colors.textPrimary, marginBottom: 6, fontWeight: "600" }}>
            Location 
          </Text>
          <NativeTextInput
            value={location}
            onChangeText={setLocation}
            placeholder="centeral library..."
            placeholderTextColor={Colors.textTertiary}
            style={{
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: 12,
              padding: 14,
              fontSize: 16,
              backgroundColor: "white",
              marginBottom: 20,
            }}
          />

        
         
        
          <TouchableOpacity
            onPress={pickImage}
            style={{
              borderWidth: 2,
              borderColor: Colors.border,
              borderStyle: "dashed",
              borderRadius: 12,
              padding: 20,
              alignItems: "center",
              marginBottom: 24,
              backgroundColor: Colors.surface,
            }}
          >
            {image ? (
              <Image
                source={{ uri: image }}
                style={{ width: "100%", height: 220, borderRadius: 8 }}
                resizeMode="cover"
              />
            ) : (
              <>
                <Ionicons name="image-outline" size={60} color={Colors.textTertiary} />
                <Text style={{ color: Colors.textTertiary, marginTop: 12, fontSize: 16, fontWeight: "500" }}>
                  Tap to upload image
                </Text>
              </>
            )}
          </TouchableOpacity>

        <Text style={{ fontSize: 16, color: Colors.textPrimary, marginBottom: 6, fontWeight: "600" }}>
            Description
          </Text>
          <NativeTextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the item in detail..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={3}
            style={{
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: 12,
              padding: 14,
              fontSize: 16,
              backgroundColor: "white",
              textAlignVertical: "top",
              minHeight: 120,
              marginBottom: 24,
            }}
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            buttonColor={Colors.secondary}
            textColor="white"
            style={{  marginBottom: 16 }}
            contentStyle={{ paddingVertical: 5}}
          >
            {isLoading ? "Posting..." : "Submit Report"}
          </Button>

          <Button
            mode="text"
            onPress={() => {
              setCategory("");
              setLocation("");
              setDescription("");
              setImage(null);
            }}
            textColor={Colors.textSecondary}
            style={{ alignSelf: "center" }}
          >
            Cancel
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

    
      <Snackbar
        visible={!!successMessage}
        onDismiss={() => setSuccessMessage("")}
        duration={2500}
        style={{ backgroundColor: Colors.success }}
      >
        {successMessage}
      </Snackbar>

     
      <Snackbar
        visible={!!errorMessage}
        onDismiss={() => setErrorMessage("")}
        duration={4000}
        action={{ label: "OK", onPress: () => setErrorMessage("") }}
        style={{ backgroundColor: Colors.error }}
      >
        {errorMessage}
      </Snackbar>
    </SafeAreaView>
  );
}