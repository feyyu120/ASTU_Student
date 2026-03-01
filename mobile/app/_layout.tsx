
import { Stack } from "expo-router";
import { StatusBar, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider } from "react-native-paper";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications + save token to backend
async function registerForPushNotificationsAsync() {
  let token;

  // Android channel setup
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  // Permissions
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push notification permission");
      return;
    }

    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants?.expoConfig?.extra?.eas?.projectId,
      })
    ).data;

    console.log("Expo Push Token:", token);
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  return token;
}

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      const expoPushToken = await registerForPushNotificationsAsync();

      if (expoPushToken) {
        try {
          const authToken = await SecureStore.getItemAsync("authToken");
          if (authToken) {
            const response = await fetch("http://localhost:5000/api/auth/update-device-token", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({ deviceToken: expoPushToken }),
            });

            if (response.ok) {
              console.log("Device token saved to backend");
            } else {
              console.warn("Failed to save device token");
            }
          }
        } catch (err) {
          console.error("Error saving device token:", err);
        }
      }

      // Optional: Listen for incoming notifications (can trigger badge refresh globally)
      const subscription = Notifications.addNotificationReceivedListener((notification) => {
        console.log("New notification received:", notification.request.content);
        // You can call fetchUnreadCount() here if you have global state/context
      });

      return () => subscription.remove();
    })();
  }, []);

  return (
   
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        >
          {/* Auth screens (login, register, forgot, etc.) */}
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />

          {/* Main app tabs */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* Optional: other full-screen modals/screens */}
          <Stack.Screen name="notifications" options={{ presentation: "modal" }} />
          {/* Add more if needed */}
        </Stack>

        {/* Status Bar */}
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#3b3434"
          translucent={Platform.OS === "android"}
        />
      </SafeAreaProvider>
    
  );
}