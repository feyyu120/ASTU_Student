
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
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
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');

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
      console.error('Notifications fetch error:', err);
      setError(err.message || 'Could not load notifications');
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

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => markAsRead(item._id)}
      style={{
        padding: 16,
        backgroundColor: item.read ? '#fff' : '#f0f8ff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {!item.read && (
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.secondary, marginRight: 12 }} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: item.read ? 'normal' : 'bold', fontSize: 16 }}>
            {item.title}
          </Text>
          <Text style={{ color: '#555', marginTop: 4 }}>{item.body}</Text>
          <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginLeft: 16 }}>Notifications</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.secondary} style={{ marginTop: 50 }} />
        ) : error ? (
          <Text style={{ textAlign: 'center', marginTop: 50, color: 'red' }}>{error}</Text>
        ) : notifications.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 50, color: '#777' }}>No notifications yet</Text>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}