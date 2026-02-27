import { Stack } from "expo-router";
import { StatusBar,Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Provider } from "react-native-paper";


export default function RootLayout() {
      const insets = useSafeAreaInsets();

  return (
    <> 
 
   <Stack>
    
     <Stack.Screen name="(auth)" options={{title:"", headerShown:false}} />
   
      <Stack.Screen name="(tabs)" options={{title:"", headerShown:false}} />
   </Stack>

   <StatusBar barStyle="dark-content" backgroundColor="#3b3434" translucent={true} />
  
    </> 
  )


}
