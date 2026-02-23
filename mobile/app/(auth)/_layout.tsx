import { Stack } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Provider } from "react-native-paper";
export default function Layout() {
    const insets = useSafeAreaInsets();
  return (

   <Stack  screenOptions={{
          contentStyle: {
          paddingTop: Platform.select({
              ios: insets.top,              // ~44–60px on iPhone (includes notch)
              android: insets.top + 3,      // Android status ~24–32px + tiny buffer
            }),
            backgroundColor:"#fff",
          
          },
        }}>
  <Stack.Screen name="login" options={{title:"Login", headerShown:false}} />
  <Stack.Screen name="register" options={{title:"Register", headerShown:false}} />

   </Stack>
   
)

}