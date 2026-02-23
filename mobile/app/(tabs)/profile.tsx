import { View, Text } from 'react-native'
import React from 'react'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'

export default function Profile() {
  return (
    <SafeAreaProvider>
      <SafeAreaView>
     <View>
      <Text>welcome to profile page</Text>
      
       </View>

      </SafeAreaView>
    </SafeAreaProvider>
  
  )
}