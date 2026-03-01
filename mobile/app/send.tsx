import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { TextInput, Button } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';
import Colors from './constant/color';
import { router } from 'expo-router';

const API_BASE = 'http://localhost:5000'; // ← CHANGE TO YOUR COMPUTER'S REAL IP WHEN TESTING ON PHONE

export default function SendDetails() {
  const [details, setDetails] = useState('');
  const [image, setImage] = useState(null);
  const [sending, setSending] = useState(false);
  const insets = useSafeAreaInsets();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const submitDetails = async () => {
    if (!details.trim()) {
      Alert.alert('Missing Details', 'Please write your full name, phone, and any extra info.');
      return;
    }

    if (!image) {
      Alert.alert('Missing Photo', 'Please attach a clear photo of your ID or proof.');
      return;
    }

    setSending(true);

    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        Alert.alert('Login Required', 'Please log in again.');
        router.replace('/login');
        return;
      }

      const formData = new FormData();

      // Add text details
      formData.append('content', details.trim());

      // Add photo
      const uriParts = image.split('.');
      const type = uriParts[uriParts.length - 1];
      formData.append('image', {
        uri: image,
        name: `id-proof.${type}`,
        type: `image/${type}`,
      });

      const res = await fetch(`${API_BASE}/api/claimDetails/reply`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to send');
      }

      Alert.alert('Success', 'Your details and ID photo have been sent to admin!');
      router.back();
      setImage(null);
      setDetails('');
    } catch (err) {
      console.error('Submit error:', err);
      Alert.alert('Error', err.message || 'Failed to send. Check connection and try again.');
    } finally {
      setSending(false);
    }
  };

  const goBack = () => router.back();

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
        {/* Top Header with Back Arrow */}
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
          <TouchableOpacity onPress={goBack} style={{ padding: 8 }}>
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
              marginRight: 40, // balance for back button
            }}
          >
            Send Details
          </Text>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} 
          keyboardDismissMode='on-drag'
        >
          <View style={{ padding: 20 }}>
            {/* Instruction Text */}
            <Text style={{
              fontSize: 16,
              color: '#444',
              lineHeight: 24,
              marginBottom: 24,
            }}>
              Please provide your full name, phone number, and any other relevant information.  
              Attach a clear photo of your ID card or student ID (both are required).
            </Text>

            {/* Details Input */}
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#333',
              marginBottom: 8,
            }}>
              Your Details (required)
            </Text>
            <TextInput
              mode="outlined"
              placeholder="Full name, phone number, additional info..."
              value={details}
              onChangeText={setDetails}
              multiline
              numberOfLines={5}
              style={{
                backgroundColor: 'white',
                marginBottom: 24,
                borderRadius: 12,
              }}
              outlineStyle={{ borderRadius: 12 }}
              error={!details.trim() && sending}
            />

            {/* Photo Upload */}
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#333',
              marginBottom: 8,
            }}>
              Attach ID Photo (required)
            </Text>

            <TouchableOpacity
              onPress={pickImage}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                backgroundColor: '#f0f8ff',
                borderRadius: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: image ? Colors.secondary : '#ddd',
              }}
            >
              <Ionicons name="image-outline" size={28} color={Colors.secondary} />
              <Text style={{
                marginLeft: 12,
                color: Colors.secondary,
                fontSize: 16,
                fontWeight: '600',
              }}>
                {image ? 'Change Photo' : 'Tap to Select ID Photo'}
              </Text>
            </TouchableOpacity>

            {/* Preview Selected Image */}
            {image && (
              <View style={{ marginBottom: 24, position: 'relative' }}>
                <Image
                  source={{ uri: image }}
                  style={{ width: '100%', height: 220, borderRadius: 12 }}
                  resizeMode="contain"
                />
                <TouchableOpacity
                  onPress={() => setImage(null)}
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    borderRadius: 20,
                    padding: 8,
                  }}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
            )}

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={submitDetails}
              loading={sending}
              disabled={sending || !details.trim() || !image}
              buttonColor={Colors.secondary}
              style={{ borderRadius: 12, paddingVertical: 4 }}
              labelStyle={{ fontSize: 16, fontWeight: '700' }}
            >
              {sending ? 'Sending...' : 'Send Details & ID to Admin'}
            </Button>

            {/* Helper Text */}
            <Text style={{
              fontSize: 13,
              color: '#777',
              textAlign: 'center',
              marginTop: 16,
            }}>
              Both details and photo are required. Admin will review your claim after this.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}