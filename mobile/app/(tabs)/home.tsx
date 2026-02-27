import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Button, TextInput, Snackbar } from "react-native-paper";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import styles from "../styles/home.style";
import Colors from "../constant/color";

const API_BASE = "http://localhost:5000"; // ← CHANGE TO YOUR COMPUTER'S REAL IP

export default function Home() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    checkAuth();
    fetchItems();
    fetchUnreadCount();
  }, []);

  const checkAuth = async () => {
    const token = await SecureStore.getItemAsync("authToken");
    setIsLoggedIn(!!token);
  };

  const fetchItems = async (query = "") => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      let url = `${API_BASE}/api/items/search`;
      if (query.trim()) {
        url += `?q=${encodeURIComponent(query.trim())}`;
      }

      const token = await SecureStore.getItemAsync("authToken");
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Fetch items error:", error);
      setErrorMessage(error.message || "Could not load items");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.log("Unread count fetch failed:", err);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setSearchQuery("");
    setShowSearch(false);
    fetchItems();
    fetchUnreadCount();
  }, []);

  const handleSearch = () => {
    fetchItems(searchQuery.trim());
    setShowSearch(false);
  };

  const handleClaim = async (itemId) => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    try {
      const token = await SecureStore.getItemAsync("authToken");
      const response = await fetch(`${API_BASE}/api/claims/${itemId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Claim failed");
      }

      // Immediately update badge (optimistic update)
      setUnreadCount(prev => prev + 1);

      // Refresh items list
      fetchItems(searchQuery);

      // Show message telling user to go to notifications
      setErrorMessage(
        "Claim submitted! Please go to notifications (bell icon) to provide your details and attach your ID photo."
      );
    } catch (error) {
      setErrorMessage(error.message || "Could not claim item");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          backgroundColor: '#f9f9f9',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        }}
      >
        {item.ownerId?.profilePicture ? (
          <Image
            source={{ uri: item.ownerId.profilePicture }}
            style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
          />
        ) : (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: Colors.secondary,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}
          >
            <Ionicons name="person" size={24} color="white" />
          </View>
        )}

        <View>
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
            {item.ownerId?.name || 'Unknown User'}
          </Text>
          <Text style={{ color: '#666', fontSize: 12 }}>
            Posted {item.date ? new Date(item.date).toLocaleDateString() : 'recently'}
          </Text>
        </View>
      </View>

      {item.imageUrl ? (
        <Image
          source={{
            uri: item.imageUrl.startsWith("http")
              ? item.imageUrl
              : `${API_BASE}${item.imageUrl}`,
          }}
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

        {item.status !== "resolved" && isLoggedIn && (
          <Button
            mode="contained"
            onPress={() => handleClaim(item._id)}
            buttonColor={item.status === "claimed" ? "#757575" : Colors.secondary}
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
            <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
              <Ionicons name="search" size={24} color="#535050" style={{ marginRight: 20 }} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/notifications")}
              style={{ position: "relative" }}
            >
              <Ionicons name="notifications-outline" size={24} color="#535050" />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    right: -8,
                    top: -8,
                    backgroundColor: "red",
                    borderRadius: 12,
                    minWidth: 24,
                    height: 24,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white", fontSize: 12, fontWeight: "bold" }}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        {showSearch && (
          <View style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "#fff" }}>
            <TextInput
              mode="outlined"
              placeholder="Search by category or location..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              outlineStyle={{ borderRadius: 12 }}
              style={{ backgroundColor: "white" }}
              right={<TextInput.Icon icon="magnify" color={Colors.textSecondary} />}
            />

            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 8 }}>
              <Button mode="text" onPress={handleSearch} textColor={Colors.secondary} style={{ marginRight: 12 }}>
                Search
              </Button>
              <Button
                mode="text"
                onPress={() => {
                  setSearchQuery("");
                  setShowSearch(false);
                  fetchItems();
                }}
                textColor={Colors.textSecondary}
              >
                Cancel
              </Button>
            </View>
          </View>
        )}

        {/* Items List */}
        <FlatList
          data={items}
          keyExtractor={(item) => item._id || String(Math.random())}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.secondary]}
              tintColor={Colors.secondary}
            />
          }
          ListEmptyComponent={
            isLoading ? null : (
              <Text style={{ textAlign: "center", marginTop: 100, color: Colors.textSecondary, fontSize: 16 }}>
                {searchQuery.trim() ? "No matching items found." : "No items found yet."}
              </Text>
            )
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        />

        {isLoading && !refreshing && (
          <ActivityIndicator
            size="large"
            color={Colors.secondary}
            style={{ position: "absolute", top: "50%", left: "50%", marginLeft: -20 }}
          />
        )}
      </SafeAreaView>
      <Snackbar
        visible={!!errorMessage}
        onDismiss={() => setErrorMessage("")}
        duration={6000} 
        action={{ label: "Go to Notifications", onPress: () => router.push("/notifications") }}
        style={{ backgroundColor: errorMessage.includes("success") ? Colors.success : Colors.error }}
      >
        {errorMessage}
      </Snackbar>
    </SafeAreaProvider>
  );
}