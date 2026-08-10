import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@harpa_cifra/favoritos";

export async function loadFavorites(): Promise<number[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveFavorites(favorites: number[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(favorites));
}
