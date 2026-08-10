import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import HymnScreen from "../screens/HymnScreen";

export type RootStackParamList = {
  Home: undefined;
  Hymn: { number: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="Hymn"
          component={HymnScreen}
          options={{ presentation: "fullScreenModal", animation: "fade" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
