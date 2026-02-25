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
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Button, Snackbar } from "react-native-paper";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import styles from "../styles/home.style"; // Reuse or adjust

const API_BASE = "http://localhost:5000"; // ← CHANGE TO YOUR REAL IP

export default function Profile() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

      // Fetch my posted items
      const response = await fetch(`${API_BASE}/api/items/my-items`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const contentType = response.headers.get("content-type");

      if (!response.ok) {
        if (contentType && contentType.includes("application/json")) {
          const errData = await response.json();
          throw new Error(errData.message || `HTTP ${response.status}`);
        } else {
          const text = await response.text();
          console.log("Non-JSON error response:", text);
          throw new Error("Server returned unexpected response");
        }
      }

      const data = await response.json();
      console.log("My items loaded:", data); // Debug: check what comes back
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
              loadProfile(); // Refresh
            } catch (error) {
              setErrorMessage(error.message || "Could not delete");
            }
          },
        },
      ]
    );
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

        <Button
          mode="outlined"
          icon="delete"
          onPress={() => handleDeleteItem(item._id)}
          textColor="#d32f2f"
          style={{ marginTop: 12, borderColor: "#d32f2f" }}
        >
          Delete
        </Button>
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

            {/* My Items List */}
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