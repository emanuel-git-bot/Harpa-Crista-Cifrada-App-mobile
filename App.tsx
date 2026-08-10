import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { FavoritesProvider } from "./src/context/FavoritesContext";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <FavoritesProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </FavoritesProvider>
    </GestureHandlerRootView>
  );
}
