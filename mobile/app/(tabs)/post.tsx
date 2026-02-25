import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, TextInput, Snackbar } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import styles from "../styles/home.style"; 
import Colors from "../constant/color"

const API_URL = "http://localhost:5000"; // Change to real URL later

export default function Post() {
  const [type, setType] = useState<"lost" | "found">("lost");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Request permission for image picker (only once)
  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setErrorMessage("Permission to access gallery is required.");
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    if (!(await requestPermission())) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

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

      // Add text fields
      formData.append("type", type);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("location", location);

      
      if (image) {
        const filename = image.split("/").pop();
        const fileType = filename?.split(".").pop();

        formData.append("image", {
          uri: image,
          name: filename || `item.${fileType}`,
          type: `image/${fileType}` || "image/jpeg",
        } as any);
      }

      const response = await fetch(`${API_URL}/api/items/report`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Do NOT set Content-Type manually — let fetch handle multipart
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to post item");
        
      }

      setSuccessMessage("Item posted successfully!");
      setTimeout(() => {
        router.back(); 
      }, 1800);

   
      setDescription("");
      setCategory("");
      setLocation("");
      setImage(null);

    } catch (error: any) {
      setErrorMessage(error.message || "Something went wrong. Try again.");
        setDescription("");
      setCategory("");
      setLocation("");
      setImage(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 10 }}>
          <Text
            style={{
              fontSize: 26,
              fontWeight: "bold",
              color: "#296d5c",
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            Report {type === "lost" ? "Lost" : "Found"} Item
          </Text>

         
          <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 24 }}>
            <Button
              mode={type === "lost" ? "contained" : "outlined"}
              onPress={() => setType("lost")}
              buttonColor={type === "lost" ? Colors.secondary : undefined}
              textColor={type === "lost" ? "white" : Colors.textSecondary}
              style={{ borderRadius: 12, marginRight: 12 }}
            >
              Lost
            </Button>
            <Button
              mode={type === "found" ? "contained" : "outlined"}
              onPress={() => setType("found")}
              buttonColor={type === "found" ? Colors.secondary : undefined}
              textColor={type === "found" ? "white" : Colors.textSecondary}
              style={{ borderRadius: 12 }}
            >
              Found
            </Button>
          </View>

         
          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={4}
            outlineStyle={{ borderRadius: 12 }}
            style={{ backgroundColor: "white", marginBottom: 16 }}
          />

          <TextInput
            label="Category Ex. ID"
            value={category}
            onChangeText={setCategory}
            mode="outlined"
            outlineStyle={{ borderRadius: 12 }}
            style={{ backgroundColor: "white", marginBottom: 16 }}
          />

          <TextInput
            label="Location Ex. Library"
            value={location}
            onChangeText={setLocation}
            mode="outlined"
            outlineStyle={{ borderRadius: 12 }}
            style={{ backgroundColor: "white", marginBottom: 24 }}
          />

      
          <TouchableOpacity
            onPress={pickImage}
            style={{
              borderWidth: 2,
              borderColor: Colors.secondary,
              borderStyle: "dashed",
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            {image ? (
              <Image
                source={{ uri: image }}
                style={{ width: "100%", height: 200, borderRadius: 8 }}
                resizeMode="cover"
              />
            ) : (
              <>
                <Ionicons name="image-outline" size={48} color={Colors.secondary} />
                <Text style={{ color: Colors.secondary, marginTop: 8 }}>
                  Tap to upload image
                </Text>
              </>
            )}
          </TouchableOpacity>

        
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            buttonColor={Colors.secondary}
            textColor="white"
            style={{  paddingVertical: 4 }}
          >
            {isLoading ? "Posting..." : "Submit Report"}
          </Button>

          <Button
            mode="text"
            onPress={() => router.back()}
            textColor={Colors.textSecondary}
            style={{ marginTop: 16 }}
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
        action={{
          label: "OK",
          onPress: () => setErrorMessage(""),
        }}
        style={{ backgroundColor: Colors.error }}
      >
        {errorMessage}
      </Snackbar>
    </SafeAreaView>
  );
}