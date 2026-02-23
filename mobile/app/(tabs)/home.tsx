import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Button, Snackbar } from "react-native-paper";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import styles from "../styles/home.style";

const API_URL = "http://localhost:5000"; // Change to production later

export default function Home() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchItems();
  }, []);

  const checkAuth = async () => {
    const token = await SecureStore.getItemAsync("authToken");
    setIsLoggedIn(!!token);
  };

  const fetchItems = async (query = "") => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      let url = `${API_URL}/api/items/search`;
      if (query.trim()) {
        url += `?category=${encodeURIComponent(query.trim())}&location=${encodeURIComponent(query.trim())}`;
      }

      const token = await SecureStore.getItemAsync("authToken");
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load items");
      }

      setItems(data);
    } catch (error) {
      setErrorMessage(error.message || "Could not load items. Try again.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchItems(searchQuery); // Refresh with current search or all
  }, [searchQuery]);

  const handleSearch = () => {
    fetchItems(searchQuery);
    setShowSearch(false);
  };

  const handleClaim = async (itemId) => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    try {
      const token = await SecureStore.getItemAsync("authToken");
      const response = await fetch(`${API_URL}/api/claims/${itemId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit claim");
      }

      fetchItems(searchQuery); // Refresh list
      setErrorMessage("Claim submitted successfully!");
    } catch (error) {
      setErrorMessage(error.message || "Could not claim item");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item.imageUrl && (
        <Image
          source={{ uri: `${API_URL}${item.imageUrl}` }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.cardContent}>
        <Text style={styles.itemTitle}>
          {item.type.toUpperCase()} - {item.category}
        </Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.location}>Location: {item.location}</Text>
        <Text style={styles.date}>
          {new Date(item.date).toLocaleDateString()}
        </Text>

        {item.status !== "resolved" && isLoggedIn && (
          <Button
            mode="contained"
            onPress={() => handleClaim(item._id)}
            buttonColor={item.status === "claimed" ? "#757575" : "#16bd93"}
            style={{ marginTop: 12, borderRadius: 8 }}
            disabled={item.status === "claimed"}
          >
            {item.status === "claimed" ? "Claimed" : "Claim Item"}
          </Button>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Lost Materials</Text>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity onPress={() => setShowSearch(true)}>
              <Ionicons name="search" size={24} color="#535050" style={{ marginRight: 20 }} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/notifications")}>
              <Ionicons name="notifications-outline" size={24} color="#535050" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar (shown when icon tapped) */}
        {showSearch && (
          <View style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "#fff" }}>
            <TextInput
              mode="outlined"
              placeholder="Search by category or location..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch} // Search when pressing "Enter" on keyboard
              right={
                <TextInput.Icon
                  icon="magnify"
                  onPress={handleSearch} // Now safe – no crash
                  color="#16bd93"
                />
              }
              outlineStyle={{ borderRadius: 12 }}
              style={{ backgroundColor: "white" }}
            />
            <Button
              mode="text"
              onPress={() => {
                setSearchQuery("");
                setShowSearch(false);
                fetchItems();
              }}
              textColor="#757575"
              style={{ alignSelf: "flex-end", marginTop: 4 }}
            >
              Cancel
            </Button>
          </View>
        )}

        {/* Main Content with Pull-to-Refresh */}
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListEmptyComponent={
            isLoading ? null : (
              <Text style={{ textAlign: "center", marginTop: 100, color: "#666" }}>
                No items found. Try searching differently.
              </Text>
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#16bd93"]}
              tintColor="#16bd93"
            />
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        />

        {isLoading && !refreshing && (
          <ActivityIndicator size="large" color="#16bd93" style={{ position: "absolute", top: "50%", left: "50%" }} />
        )}
      </SafeAreaView>

      {/* Snackbar for messages */}
      <Snackbar
        visible={!!errorMessage}
        onDismiss={() => setErrorMessage("")}
        duration={4000}
        action={{
          label: "OK",
          onPress: () => setErrorMessage(""),
        }}
        style={{ backgroundColor: errorMessage.includes("success") ? "#16bd93" : "#d32f2f" }}
      >
        {errorMessage}
      </Snackbar>
    </SafeAreaProvider>
  );
}