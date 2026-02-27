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
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Button, Snackbar, TextInput as PaperTextInput } from "react-native-paper";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import styles from "../styles/home.style"; // adjust if needed
import Colors from "../constant/color";

const API_BASE = "http://localhost:5000"; // ← change to real backend URL

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Modal states
  const [postedHistoryVisible, setPostedHistoryVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editImage, setEditImage] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync("authToken");
      const storedUser = await SecureStore.getItemAsync("user");

      if (!token || !storedUser) {
        setIsLoggedIn(false);
        return;
      }

      setIsLoggedIn(true);
      const parsed = JSON.parse(storedUser);
      setUser(parsed);

      if (parsed?.profilePic) {
        setProfileImage(
          parsed.profilePic.startsWith("http")
            ? parsed.profilePic
            : `${API_BASE}${parsed.profilePic}`
        );
      }

      const res = await fetch(`${API_BASE}/api/items/my-items`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to load items");
      const data = await res.json();
      setItems(data || []);
    } catch (err) {
      console.error(err);
      setErrorMessage("Could not load profile");
    } finally {
      setIsLoading(false);
    }
  };

 const pickProfileImage = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    setErrorMessage("Gallery permission required");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (result.canceled) return;

  const uri = result.assets[0].uri;
  setProfileImage(uri); // optimistic UI update

  try {
    const token = await SecureStore.getItemAsync("authToken");
    if (!token) throw new Error("Not authenticated");

    const formData = new FormData();
    const filename = uri.split("/").pop() || `avatar-${Date.now()}.jpg`;

    formData.append("avatar", {
      uri,
      name: filename,
      type: "image/jpeg",
    });

    const response = await fetch(`${API_BASE}/api/users/profile-picture`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`Server error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    console.log("Profile updated:", data);

    // Update local user state + storage
    setUser(data.user);
    await SecureStore.setItemAsync("user", JSON.stringify(data.user));

    setSuccessMessage("Profile picture updated");
  } catch (err) {
    console.error("Profile pic upload failed:", err);
    setErrorMessage(err.message || "Could not update profile picture");
    // Optional: revert preview
    // setProfileImage(null);
  }
};

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("authToken");
    await SecureStore.deleteItemAsync("user");
    setSuccessMessage("Logged out");
    router.replace("/login");
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setEditDescription(item.description || "");
    setEditCategory(item.category || "");
    setEditLocation(item.location || "");
    setEditImage(null);
    setEditModalVisible(true);
  };

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
      quality: 0.5,
    });

    if (!result.canceled) {
      setEditImage(result.assets[0].uri);
    }
  };

  const handleSubmitEdit = async () => {
    if (!editDescription.trim() || !editCategory.trim() || !editLocation.trim()) {
      setErrorMessage("All fields required");
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
        const filename = editImage.split("/").pop() || `item-${Date.now()}.jpg`;
        formData.append("image", {
          uri: editImage,
          name: filename,
          type: "image/jpeg",
        });
      }

      const res = await fetch(`${API_BASE}/api/items/${editingItem._id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error();
      setSuccessMessage("Item updated");
      setEditModalVisible(false);
      loadProfile(); 
    } catch (err) {
      setErrorMessage("Update failed");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteItem = (itemId) => {
    Alert.alert("Delete Item", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await SecureStore.getItemAsync("authToken");
            const res = await fetch(`${API_BASE}/api/items/${itemId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            setSuccessMessage("Item deleted");
            loadProfile();
          } catch (err) {
            setErrorMessage("Delete failed");
          }
        },
      },
    ]);
  };

  const renderPostedItem = ({ item }) => (
    <View style={[styles.card, { marginBottom: 16 }]}>
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
          {item.type?.toUpperCase() || "ITEM"} • {item.category || "?"}
        </Text>
        <Text style={styles.description} numberOfLines={3}>
          {item.description || "No description"}
        </Text>
        <Text style={styles.location}>📍 {item.location || "—"}</Text>

        <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
          <Button
            mode="outlined"
            icon="pencil"
            onPress={() => handleEditItem(item)}
            textColor={Colors.primary}
            style={{ flex: 1 }}
          >
            Edit
          </Button>
          <Button
            mode="outlined"
            icon="delete"
            onPress={() => handleDeleteItem(item._id)}
            textColor="#d32f2f"
            style={{ flex: 1 }}
          >
            Delete
          </Button>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
        <Text style={{ fontSize: 18, textAlign: "center", marginBottom: 32, color: "#555" }}>
          Please sign in to view your profile
        </Text>
        <Button mode="contained" buttonColor={Colors.primary} onPress={() => router.push("/login")}>
          Sign In
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
        <View style={{ backgroundColor: "#0d47a1", paddingTop: 60, paddingBottom: 40, alignItems: "center" }}>
          <TouchableOpacity onPress={pickProfileImage}>
            <View style={{ position: "relative" }}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={{ width: 110, height: 110, borderRadius: 999, borderWidth: 4, borderColor: "white" }}
                />
              ) : (
                <View
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: 999,
                    backgroundColor: "#555",
                    borderWidth: 4,
                    borderColor: "white",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="person" size={64} color="white" />
                </View>
              )}

              <View
                style={{
                  position: "absolute",
                  bottom: 4,
                  right: 4,
                  backgroundColor: "white",
                  borderRadius: 20,
                  padding: 6,
                  borderWidth: 2,
                  borderColor: "#0d47a1",
                }}
              >
                <Ionicons name="camera" size={20} color="#0d47a1" />
              </View>
            </View>
          </TouchableOpacity>

          <Text style={{ color: "white", fontSize: 26, fontWeight: "700", marginTop: 16 }}>
            {user?.name || "User"}
          </Text>

          <Text style={{ color: "#d0d8ff", fontSize: 16, marginTop: 4 }}>
            {user?.username ? `@${user.username}` : `@${user?.name?.toLowerCase().replace(/\s/g, "") || "user"}`}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 12,
              backgroundColor: "rgba(255,255,255,0.22)",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 999,
            }}
          >
            <Ionicons name="mail-outline" size={18} color="white" style={{ marginRight: 8 }} />
            <Text style={{ color: "white", fontSize: 15 }}>{user?.email || "—"}</Text>
          </View>
        </View>

        {/* Menu - only 3 items */}
        <ScrollView style={{ flex: 1, backgroundColor: "white", marginTop: -24, borderTopLeftRadius: 32, borderTopRightRadius: 32 }}>
          <View style={{ paddingTop: 16 }}>
            <TouchableOpacity
              onPress={() => setPostedHistoryVisible(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 18,
                paddingHorizontal: 24,
                borderBottomWidth: 1,
                borderBottomColor: "#f0f0f0",
              }}
            >
              <Ionicons name="list-outline" size={26} color="#444" style={{ marginRight: 20 }} />
              <Text style={{ fontSize: 17, color: "#222", flex: 1 }}>Posted History</Text>
              <Ionicons name="chevron-forward" size={22} color="#aaa" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/support")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 18,
                paddingHorizontal: 24,
                borderBottomWidth: 1,
                borderBottomColor: "#f0f0f0",
              }}
            >
              <Ionicons name="help-circle-outline" size={26} color="#444" style={{ marginRight: 20 }} />
              <Text style={{ fontSize: 17, color: "#222", flex: 1 }}>Support</Text>
              <Ionicons name="chevron-forward" size={22} color="#aaa" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 18,
                paddingHorizontal: 24,
              }}
            >
              <Ionicons name="log-out-outline" size={26} color="#d32f2f" style={{ marginRight: 20 }} />
              <Text style={{ fontSize: 17, color: "#d32f2f", flex: 1 }}>Logout</Text>
              <Ionicons name="chevron-forward" size={22} color="#aaa" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ─── Posted History Modal ─── */}
        <Modal
          visible={postedHistoryVisible}
          animationType="slide"
          onRequestClose={() => setPostedHistoryVisible(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
            <View style={{ flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#eee" }}>
              <TouchableOpacity onPress={() => setPostedHistoryVisible(false)} style={{ paddingRight: 16 }}>
                <Ionicons name="arrow-back" size={28} color="#333" />
              </TouchableOpacity>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#333" }}>Posted History</Text>
            </View>

            <FlatList
              data={items}
              keyExtractor={(item) => item._id}
              renderItem={renderPostedItem}
              ListEmptyComponent={
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 50 }}>
                  <Text style={{ fontSize: 16, color: "#777", textAlign: "center" }}>
                    You haven't posted any items yet.
                  </Text>
                </View>
              }
              contentContainerStyle={{ padding: 16 }}
            />
          </SafeAreaView>
        </Modal>

      
        <Modal visible={editModalVisible} animationType="slide" transparent>
          <SafeAreaProvider>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
              <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center" }}>
                <View style={{ backgroundColor: "white", margin: 20, borderRadius: 16, padding: 34, maxHeight: "88%" }}>
                  <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 20 }}>Edit Item</Text>

                  <ScrollView>
                    <Text style={{ fontSize: 16, color: "#555", marginBottom: 6 }}>Category</Text>
                    <PaperTextInput
                      value={editCategory}
                      onChangeText={setEditCategory}
                      mode="outlined"
                      style={{ marginBottom: 16 }}
                    />

                    <Text style={{ fontSize: 16, color: "#555", marginBottom: 6 }}>Location</Text>
                    <PaperTextInput
                      value={editLocation}
                      onChangeText={setEditLocation}
                      mode="outlined"
                      style={{ marginBottom: 16 }}
                    />

                    <Text style={{ fontSize: 16, color: "#555", marginBottom: 6 }}>Description</Text>
                    <PaperTextInput
                      value={editDescription}
                      onChangeText={setEditDescription}
                      mode="outlined"
                      multiline
                      numberOfLines={5}
                      style={{ marginBottom: 20, minHeight: 100 }}
                    />

                    <Text style={{ fontSize: 16, color: "#555", marginBottom: 6 }}>Image</Text>
                    <TouchableOpacity
                      onPress={pickEditImage}
                      style={{
                        borderWidth: 2,
                        borderColor: Colors.primary,
                        borderStyle: "dashed",
                        borderRadius: 12,
                        padding: 16,
                        alignItems: "center",
                      }}
                    >
                      {editImage || editingItem?.imageUrl ? (
                        <Image
                          source={{ uri: editImage || `${API_BASE}${editingItem?.imageUrl}` }}
                          style={{ width: "100%", height: 160, borderRadius: 8 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <>
                          <Ionicons name="image-outline" size={48} color={Colors.primary} />
                          <Text style={{ color: Colors.primary, marginTop: 8 }}>Change image</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </ScrollView>

                  <View style={{ flexDirection: "row", marginTop: 24, gap: 12 }}>
                    <Button mode="outlined" onPress={() => setEditModalVisible(false)} style={{ flex: 1 }}>
                      Cancel
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleSubmitEdit}
                      loading={editLoading}
                      disabled={editLoading}
                      buttonColor={Colors.primary}
                      style={{ flex: 1 }}
                    >
                      Save
                    </Button>
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaProvider>
        </Modal>

        {/* Feedback messages */}
        <Snackbar
          visible={!!errorMessage}
          onDismiss={() => setErrorMessage("")}
          duration={4000}
          style={{ backgroundColor: "#d32f2f" }}
        >
          {errorMessage}
        </Snackbar>

        <Snackbar
          visible={!!successMessage}
          onDismiss={() => setSuccessMessage("")}
          duration={2800}
          style={{ backgroundColor: Colors.primary }}
        >
          {successMessage}
        </Snackbar>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}