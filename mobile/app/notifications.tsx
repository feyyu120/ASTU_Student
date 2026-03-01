import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import Colors from './constant/color';

const API_BASE = 'http://localhost:5000';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

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
      console.error('Fetch notifications error:', err);
      Alert.alert('Error', 'Could not load notifications. Please check connection.');
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

  const renderNotification = ({ item }) => {
    const needsDetails =
      item.title?.toLowerCase().includes('id') ||
      item.title?.toLowerCase().includes('verify') ||
      item.title?.toLowerCase().includes('upload') ||
      item.body?.toLowerCase().includes('id') ||
      item.body?.toLowerCase().includes('details') ||
      item.body?.toLowerCase().includes('photo') ||
      item.body?.toLowerCase().includes('verification');

    return (
      <TouchableOpacity
        onPress={() => markAsRead(item._id)}
        style={{
          padding: 16,
          backgroundColor: item.read ? '#ffffff' : '#f0f7ff',
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          {!item.read && (
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: Colors.secondary || '#3b82f6',
                marginRight: 12,
              }}
            />
          )}
          <Text
            style={{
              flex: 1,
              fontWeight: item.read ? '500' : '700',
              fontSize: 16,
              color: '#111827',
            }}
          >
            {item.title || 'Notification'}
          </Text>
        </View>

        <Text style={{ color: '#374151', lineHeight: 22, marginBottom: 8 }}>
          {item.body || 'No content available'}
        </Text>

        {item.imageUrl && (
          <Image
            source={{ uri: item.imageUrl.startsWith('http') ? item.imageUrl : `${API_BASE}${item.imageUrl}` }}
            style={{ width: '100%', height: 180, borderRadius: 12, marginTop: 8 }}
            resizeMode="cover"
          />
        )}

        <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 8 }}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>

        {needsDetails && (
          <Button
            mode="contained"
            onPress={() => router.push('/send')}
            buttonColor={Colors.secondary || '#3b82f6'}
            textColor="white"
            style={{ marginTop: 16, borderRadius: 12 }}
            labelStyle={{ fontSize: 15, fontWeight: '600' }}
            icon="upload"
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
        {/* Custom Header with Back Arrow */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: insets.top + 8,
            paddingHorizontal: 16,
            paddingBottom: 12,
            backgroundColor: '#ffffff',
            borderBottomWidth: 1,
            borderBottomColor: '#e5e7eb',
          }}
        >
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
            <Ionicons
              name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
              size={28}
              color="#111827"
            />
          </TouchableOpacity>

          <Text
            style={{
              flex: 1,
              fontSize: 20,
              fontWeight: '700',
              color: '#111827',
              textAlign: 'center',
              marginRight: 40, // balance back button
            }}
          >
            Notifications
          </Text>
        </View>

        {/* Content */}
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.secondary || '#3b82f6'} />
          </View>
        ) : notifications.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
            <Ionicons name="notifications-off-outline" size={80} color="#9ca3af" />
            <Text style={{ fontSize: 18, color: '#6b7280', marginTop: 16, textAlign: 'center' }}>
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
                onRefresh={onRefresh}
                colors={[Colors.secondary || '#3b82f6']}
                tintColor={Colors.secondary || '#3b82f6'}
              />
            }
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}