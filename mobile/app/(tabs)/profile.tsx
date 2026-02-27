import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Button, Snackbar, TextInput as PaperTextInput } from "react-native-paper";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import styles from "../styles/home.style"; // Reuse or adjust
import Colors from "../constant/color"; // Reuse your color constants
const API_BASE = "http://localhost:5000"; // ← CHANGE TO YOUR REAL IP

export default function Profile() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editImage, setEditImage] = useState(null); // new image if changed
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    setErrorMessage("");
    setItems([]);

    try {
      const token = await SecureStore.getItemAsync("authToken");
      const storedUser = await SecureStore.getItemAsync("user");

      if (!token || !storedUser) {
        setIsLoggedIn(false);
        return;
      }

      setIsLoggedIn(true);
      setUser(JSON.parse(storedUser));

      const response = await fetch(`${API_BASE}/api/items/my-items`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to load your items");
      }

      const data = await response.json();
      console.log("My items loaded:", data);
      setItems(data || []);
    } catch (error) {
      console.error("Profile load error:", error);
      setErrorMessage(error.message || "Could not load your items");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProfile();
  }, []);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("authToken");
    await SecureStore.deleteItemAsync("user");
    setSuccessMessage("Logged out successfully");
    setTimeout(() => router.replace("/login"), 1500);
  };

  const handleDeleteItem = (itemId) => {
    Alert.alert(
      "Delete Item",
      "Are you sure? This deletes the item and its image permanently.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync("authToken");
              const response = await fetch(`${API_BASE}/api/items/${itemId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });

              if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || "Delete failed");
              }

              setSuccessMessage("Item deleted");
              loadProfile();
            } catch (error) {
              setErrorMessage(error.message || "Could not delete");
            }
          },
        },
      ]
    );
  };

  // Open edit modal with pre-filled data
  const handleEditItem = (item) => {
    setEditingItem(item);
    setEditDescription(item.description || "");
    setEditCategory(item.category || "");
    setEditLocation(item.location || "");
    setEditImage(null); // reset new image
    setEditModalVisible(true);
  };

  // Pick new image for edit
  const pickEditImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setErrorMessage("Gallery permission required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setEditImage(result.assets[0].uri);
    }
  };

  // Submit edit
  const handleSubmitEdit = async () => {
    if (!editDescription.trim() || !editCategory.trim() || !editLocation.trim()) {
      setErrorMessage("All fields are required");
      return;
    }

    setEditLoading(true);

    try {
      const token = await SecureStore.getItemAsync("authToken");
      const formData = new FormData();
      formData.append("description", editDescription);
      formData.append("category", editCategory);
      formData.append("location", editLocation);

      if (editImage) {
        const filename = editImage.split("/").pop() || `edit-${Date.now()}.jpg`;
        const fileType = filename.split(".").pop() || "jpg";

        formData.append("image", {
          uri: editImage,
          name: filename,
          type: `image/${fileType}`,
        } as any);
      }

      const response = await fetch(`${API_BASE}/api/items/${editingItem._id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Edit failed");
      }

      setSuccessMessage("Item updated successfully");
      setEditModalVisible(false);
      loadProfile(); // Refresh list
    } catch (error) {
      setErrorMessage(error.message || "Could not update item");
    } finally {
      setEditLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl.startsWith("http") ? item.imageUrl : `${API_BASE}${item.imageUrl}` }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.cardImage, { backgroundColor: "#eee", justifyContent: "center", alignItems: "center" }]}>
          <Text style={{ color: "#999" }}>No image</Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <Text style={styles.itemTitle}>
          {item.type?.toUpperCase() || "ITEM"} - {item.category || "Unknown"}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description || "No description"}
        </Text>
        <Text style={styles.location}>
          Location: {item.location || "Not specified"}
        </Text>
        <Text style={styles.date}>
          {item.date ? new Date(item.date).toLocaleDateString() : "No date"}
        </Text>

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
          <Button
            mode="outlined"
            icon="pencil"
            onPress={() => handleEditItem(item)}
            textColor={Colors.primary}
            style={{ flex: 1, marginRight: 8, borderColor: Colors.primary }}
          >
            Edit
          </Button>

          <Button
            mode="outlined"
            icon="delete"
            onPress={() => handleDeleteItem(item._id)}
            textColor="#d32f2f"
            style={{ flex: 1, borderColor: "#d32f2f" }}
          >
            Delete
          </Button>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#16bd93" style={{ marginTop: 100 }} />
        ) : !isLoggedIn ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
            <Text style={{ fontSize: 18, color: "#666", marginBottom: 24, textAlign: "center" }}>
              Please sign in to view your profile and posted items
            </Text>
            <Button
              mode="contained"
              onPress={() => router.push("/login")}
              buttonColor="#16bd93"
              textColor="white"
              style={{ borderRadius: 12 }}
            >
              Sign In
            </Button>
          </View>
        ) : (
          <>
            {/* User Info */}
            <View style={{ padding: 20, backgroundColor: "white", marginBottom: 16 }}>
              <Text style={{ fontSize: 22, fontWeight: "bold", color: "#333", marginBottom: 12 }}>
                Hello, {user?.name || "User"}
              </Text>
              <Text style={{ fontSize: 16, color: "#555" }}>Email: {user?.email || "—"}</Text>
              <Text style={{ fontSize: 16, color: "#555", marginTop: 4 }}>
                Role: {user?.role || "Student"}
              </Text>

              <Button
                mode="outlined"
                icon="logout"
                onPress={handleLogout}
                textColor="#d32f2f"
                style={{ marginTop: 24, borderColor: "#d32f2f" }}
              >
                Logout
              </Button>
            </View>

            {/* My Items */}
            <FlatList
              data={items}
              keyExtractor={(item) => item._id}
              renderItem={renderItem}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#16bd93"]}
                  tintColor="#16bd93"
                />
              }
              ListEmptyComponent={
                <Text style={{ textAlign: "center", marginTop: 60, color: "#666", fontSize: 16 }}>
                  You haven't posted any items yet.
                </Text>
              }
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
            />
          </>
        )}

        {/* Edit Modal */}
        <Modal
          visible={editModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <SafeAreaProvider>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ flex: 1 }}
            >
              <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center" }}>
                <View style={{ backgroundColor: "white", margin: 20, borderRadius: 16, padding: 24, maxHeight: "90%" }}>
                  <Text style={{ fontSize: 22, fontWeight: "bold", color: "#333", marginBottom: 20 }}>
                    Edit Item
                  </Text>

                  <ScrollView>
                    {/* Category */}
                    <Text style={{ fontSize: 16, color: "#555", marginBottom: 8 }}>Category</Text>
                    <PaperTextInput
                      value={editCategory}
                      onChangeText={setEditCategory}
                      mode="outlined"
                      outlineStyle={{ borderRadius: 12 }}
                      style={{ marginBottom: 16 }}
                    />

                    {/* Location */}
                    <Text style={{ fontSize: 16, color: "#555", marginBottom: 8 }}>Location</Text>
                    <PaperTextInput
                      value={editLocation}
                      onChangeText={setEditLocation}
                      mode="outlined"
                      outlineStyle={{ borderRadius: 12 }}
                      style={{ marginBottom: 16 }}
                    />

                    {/* Description */}
                    <Text style={{ fontSize: 16, color: "#555", marginBottom: 8 }}>Description</Text>
                    <PaperTextInput
                      value={editDescription}
                      onChangeText={setEditDescription}
                      mode="outlined"
                      multiline
                      numberOfLines={5}
                      outlineStyle={{ borderRadius: 12 }}
                      style={{ marginBottom: 24, textAlignVertical: "top" }}
                    />

                    {/* Image */}
                    <Text style={{ fontSize: 16, color: "#555", marginBottom: 8 }}>Image</Text>
                    <TouchableOpacity
                      onPress={pickEditImage}
                      style={{
                        borderWidth: 2,
                        borderColor: "#16bd93",
                        borderStyle: "dashed",
                        borderRadius: 12,
                        padding: 16,
                        alignItems: "center",
                        marginBottom: 24,
                      }}
                    >
                      {editImage || editingItem?.imageUrl ? (
                        <Image
                          source={{ uri: editImage || editingItem.imageUrl }}
                          style={{ width: "100%", height: 180, borderRadius: 8 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <>
                          <Ionicons name="image-outline" size={48} color="#16bd93" />
                          <Text style={{ color: "#16bd93", marginTop: 8 }}>Tap to change image</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </ScrollView>

                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16 }}>
                    <Button
                      mode="outlined"
                      onPress={() => setEditModalVisible(false)}
                      textColor="#757575"
                      style={{ flex: 1, marginRight: 8 }}
                    >
                      Cancel
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleSubmitEdit}
                      loading={editLoading}
                      disabled={editLoading}
                      buttonColor="#16bd93"
                      style={{ flex: 1 }}
                    >
                      {editLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaProvider>
        </Modal>

        {/* Snackbars */}
        <Snackbar
          visible={!!errorMessage}
          onDismiss={() => setErrorMessage("")}
          duration={4000}
          action={{ label: "OK", onPress: () => setErrorMessage("") }}
          style={{ backgroundColor: "#d32f2f" }}
        >
          {errorMessage}
        </Snackbar>

        <Snackbar
          visible={!!successMessage}
          onDismiss={() => setSuccessMessage("")}
          duration={2500}
          style={{ backgroundColor: "#16bd93" }}
        >
          {successMessage}
        </Snackbar>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}