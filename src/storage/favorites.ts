import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@harpa_cifra/favoritos";

export async function loadFavorites(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  // migrate the old format, which stored bare Harpa Cristã hymn numbers
  return parsed.map((entry: unknown) =>
    typeof entry === "number" ? `harpa:${entry}` : String(entry)
  );
}

export async function saveFavorites(favorites: string[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(favorites));
}
