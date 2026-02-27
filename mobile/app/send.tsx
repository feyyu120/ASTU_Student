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
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { TextInput, Button } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';
import Colors from './constant/color';

const API_BASE = 'http://localhost:5000'; 

export default function SendDetails() {
  const [replyText, setReplyText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [sending, setSending] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const sendDetails = async () => {
    if (!replyText.trim() && !selectedImage) {
      Alert.alert('Required', 'Please add details or attach photo');
      return;
    }

    setSending(true);

    try {
      const token = await SecureStore.getItemAsync('authToken');
      const formData = new FormData();

      if (replyText.trim()) {
        formData.append('content', replyText.trim());
      }

      if (selectedImage) {
        const uriParts = selectedImage.split('.');
        const fileType = uriParts[uriParts.length - 1];

        formData.append('image', {
          uri: selectedImage,
          name: `id.${fileType}`,
          type: `image/${fileType}`,
        });
      }

      const res = await fetch(`${API_BASE}/api/notifications/reply`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed');
      }

      setReplyText('');
      setSelectedImage(null);
      Alert.alert('Success', 'Details & ID sent to admin!');
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to send. Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>


        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          <View style={{ padding: 20 }}>
            <Text style={{
              fontSize: 16,
              color: '#555',
              marginBottom: 20,
              lineHeight: 24,
            }}>
              Please provide your full name, phone number, and any other details admin might need. Attach a clear photo of your student ID.
            </Text>

            <TextInput
              mode="outlined"
              placeholder="Full name, phone, additional info..."
              value={replyText}
              onChangeText={setReplyText}
              multiline
              numberOfLines={6}
              style={{
                backgroundColor: 'white',
                marginBottom: 20,
                borderRadius: 12,
              }}
              outlineStyle={{ borderRadius: 12 }}
              contentStyle={{paddingTop:10}}
            />

            <TouchableOpacity
              onPress={pickImage}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                backgroundColor: '#f0f8ff',
                borderRadius: 12,
                marginBottom: 20,
              }}
            >
              <Ionicons name="image-outline" size={28} color={Colors.secondary} />
              <Text style={{
                marginLeft: 12,
                color: Colors.secondary,
                fontSize: 16,
                fontWeight: '600',
              }}>
                Attach ID Photo
              </Text>
            </TouchableOpacity>

            {selectedImage && (
              <View style={{ marginBottom: 20, position: 'relative' }}>
                <Image
                  source={{ uri: selectedImage }}
                  style={{ width: '100%', height: 200, borderRadius: 12 }}
                  resizeMode="contain"
                />
                <TouchableOpacity
                  onPress={() => setSelectedImage(null)}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    borderRadius: 20,
                    padding: 6,
                  }}
                >
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}

            <Button
              mode="contained"
              onPress={sendDetails}
              loading={sending}
              disabled={sending || (!replyText.trim() && !selectedImage)}
              buttonColor={Colors.secondary}
              style={{ borderRadius: 12, paddingVertical: 4 }}
              labelStyle={{ fontSize: 16, fontWeight: '600' }}
            >
              Send to Admin
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}