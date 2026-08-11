import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import CategoryScreen from "../screens/CategoryScreen";
import SongScreen from "../screens/SongScreen";
import EditSongScreen from "../screens/EditSongScreen";

export type RootStackParamList = {
  Home: undefined;
  Category: { categoryId: string };
  Song: { categoryId: string; songId: string };
  EditSong: { categoryId: string; songId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Category" component={CategoryScreen} />
        <Stack.Screen
          name="Song"
          component={SongScreen}
          options={{ presentation: "fullScreenModal", animation: "fade" }}
        />
        <Stack.Screen name="EditSong" component={EditSongScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
