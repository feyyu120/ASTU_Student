import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { Button } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import Colors from './constant/color';

const API_BASE = 'http://localhost:5000'; 

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);

    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const res = await fetch(`${API_BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to load notifications');
      }

      const data = await res.json();
      setNotifications(data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      Alert.alert('Error', 'Could not load notifications. Check connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (id) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.log('Mark read failed:', err);
    }
  };

  const goToSendDetails = () => {
    router.push('/send'); // ← pushes to send.tsx
  };

  const renderNotification = ({ item }) => {
    const isIdRequest = item.title?.toLowerCase().includes('provide') || item.body?.toLowerCase().includes('details');

    return (
      <TouchableOpacity
        onPress={() => markAsRead(item._id)}
        style={{
          padding: 16,
          backgroundColor: item.read ? '#ffffff' : '#f8faff',
          borderBottomWidth: 1,
          borderBottomColor: '#e0e0e0',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          {!item.read && (
            <View style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: Colors.secondary,
              marginRight: 12,
            }} />
          )}
          <Text style={{
            flex: 1,
            fontWeight: item.read ? '500' : '700',
            fontSize: 16,
            color: '#1a1a1a',
          }}>
            {item.title || 'Notification'}
          </Text>
        </View>

        <Text style={{ color: '#444', lineHeight: 20, marginBottom: 8 }}>
          {item.body || 'No content'}
        </Text>

        {item.imageUrl && (
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: '100%', height: 180, marginTop: 8, borderRadius: 10 }}
            resizeMode="contain"
          />
        )}

        <Text style={{ color: '#888', fontSize: 12, marginTop: 8 }}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>

        {/* Special "Send Details" button for ID request notifications */}
        {isIdRequest && (
          <Button
            mode="contained"
            onPress={goToSendDetails}
            buttonColor={Colors.secondary}
            style={{ marginTop: 12, borderRadius: 12 }}
            labelStyle={{ fontSize: 14, fontWeight: '600' }}
          >
            Send Details & ID Photo
          </Button>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
       
        {/* Content */}
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.secondary} />
          </View>
        ) : notifications.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, color: '#777', textAlign: 'center' }}>
              No notifications yet
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={item => item._id}
            renderItem={renderNotification}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchNotifications();
                }}
                colors={[Colors.secondary]}
              />
            }
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}