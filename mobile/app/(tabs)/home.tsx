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
import { Button,  TextInput, Snackbar } from "react-native-paper";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import styles from "../styles/home.style";
import Colors from "../constant/color"; 

// Use your computer's real IP (not localhost)
const API_BASE = "http://localhost:5000"; // ← CHANGE THIS

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
    console.log("Fetched items:", data); 
    setItems(data);
  } catch (error) {
    console.error("Fetch error:", error);
    setErrorMessage(error.message || "Could not load items");
  } finally {
    setIsLoading(false);
    setRefreshing(false);
  }
};

 const onRefresh = useCallback(() => {
  setRefreshing(true);
  setSearchQuery("");      
  setShowSearch(false);   
  fetchItems();  
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

      fetchItems(searchQuery);
      setErrorMessage("Claim submitted successfully!");
    } catch (error) {
      setErrorMessage(error.message || "Could not claim item");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item.imageUrl ? (
        <Image
          source={{
            uri: item.imageUrl.startsWith("http")
              ? item.imageUrl
              : `${API_BASE}${item.imageUrl}`,
          }}
          style={styles.cardImage}
          resizeMode="cover"
          onError={(e) => console.log("Image load failed:", item.imageUrl, e.nativeEvent.error)}
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
      
        <View style={styles.header}>
          <Text style={styles.title}>Lost Materials</Text>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
              <Ionicons name="search" size={24} color="#535050" style={{ marginRight: 20 }} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/notifications")}>
              <Ionicons name="notifications-outline" size={24} color="#535050" />
            </TouchableOpacity>
          </View>
        </View>

        
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
              <Button
                mode="text"
                onPress={handleSearch}
                textColor={Colors.secondary}
                style={{ marginRight: 12 }}
              >
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
        duration={4000}
        action={{ label: "OK", onPress: () => setErrorMessage("") }}
        style={{ backgroundColor: errorMessage.includes("success") ? Colors.success : Colors.error }}
      >
        {errorMessage}
      </Snackbar>
    </SafeAreaProvider>
  );
}