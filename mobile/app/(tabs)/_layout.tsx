import { Stack, Tabs } from "expo-router";
import { Platform } from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useEffect } from 'react';

function AnimatedTabIcon({ focused, color, size, name }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.25 : 1, { damping: 12, stiffness: 150 });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}

export default function Layout() {
    const insets = useSafeAreaInsets();
  return (
   <Tabs screenOptions={{
          contentStyle: {
          paddingTop: Platform.select({
              ios: insets.top,             
              android: insets.top + 3,      
            }),
            backgroundColor:"#fff",
          
          },
          tabBarActiveTintColor:"#296d5c",
          tabBarInactiveTintColor:"#6c757d",
        
        }}>
  <Tabs.Screen name="home" options={{title:"Home", headerShown:false, tabBarIcon:({focused,color,size}) => {
    return <AnimatedTabIcon name="grid-outline" size={size} color={color} />;
  }}} />
  <Tabs.Screen name="post" options={{title:"Post", headerShown:false,tabBarIcon:({focused,color,size}) => {
    return <AnimatedTabIcon focused={focused} color={color} size={size} name="add-circle-outline" />;
  }}} />
  <Tabs.Screen name="profile" options={{title:"Profile", headerShown:false,tabBarIcon:({focused,color,size}) => {
    return <AnimatedTabIcon focused={focused} color={color} size={size} name="person-outline" />;
  }}} />

   </Tabs>
)

}