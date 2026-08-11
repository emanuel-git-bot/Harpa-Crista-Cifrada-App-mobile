import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Crypto from "expo-crypto";
import type { Category, Song } from "../types";

const CATEGORIES_KEY = "@harpa_cifra/categories";
const songsKey = (categoryId: string) => `@harpa_cifra/songs/${categoryId}`;
const LIBRARY_DIR = `${FileSystem.documentDirectory}library/`;

export async function loadCategories(): Promise<Category[]> {
  const raw = await AsyncStorage.getItem(CATEGORIES_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveCategories(categories: Category[]): Promise<void> {
  await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export async function createCategory(name: string): Promise<Category> {
  const categories = await loadCategories();
  const category: Category = { id: Crypto.randomUUID(), name, builtin: false };
  await saveCategories([...categories, category]);
  return category;
}

export async function renameCategory(categoryId: string, name: string): Promise<void> {
  const categories = await loadCategories();
  await saveCategories(categories.map((c) => (c.id === categoryId ? { ...c, name } : c)));
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const categories = await loadCategories();
  await saveCategories(categories.filter((c) => c.id !== categoryId));

  const songs = await loadSongs(categoryId);
  await Promise.all(songs.map((song) => deleteSongFile(song)));
  await AsyncStorage.removeItem(songsKey(categoryId));
}

export async function loadSongs(categoryId: string): Promise<Song[]> {
  const raw = await AsyncStorage.getItem(songsKey(categoryId));
  return raw ? JSON.parse(raw) : [];
}

async function saveSongs(categoryId: string, songs: Song[]): Promise<void> {
  await AsyncStorage.setItem(songsKey(categoryId), JSON.stringify(songs));
}

async function ensureLibraryDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(LIBRARY_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(LIBRARY_DIR, { intermediates: true });
  }
}

function deleteSongFile(song: Song): Promise<void[]> {
  return Promise.all(
    song.images.map((img) => {
      const uri = typeof img.source === "object" && "uri" in img.source ? img.source.uri : undefined;
      return uri ? FileSystem.deleteAsync(uri, { idempotent: true }) : Promise.resolve();
    })
  );
}

export async function addSong(
  categoryId: string,
  params: { title: string; pickedImages: { uri: string; width: number; height: number }[] }
): Promise<Song> {
  await ensureLibraryDir();
  const id = Crypto.randomUUID();

  const images = await Promise.all(
    params.pickedImages.map(async (picked, index) => {
      const extMatch = picked.uri.match(/\.(\w+)(\?.*)?$/);
      const ext = extMatch ? extMatch[1] : "jpg";
      const destUri = `${LIBRARY_DIR}${id}-${index}.${ext}`;
      await FileSystem.copyAsync({ from: picked.uri, to: destUri });
      return { source: { uri: destUri }, width: picked.width, height: picked.height };
    })
  );

  const song: Song = { id, number: null, title: params.title, images };

  const songs = await loadSongs(categoryId);
  await saveSongs(categoryId, [...songs, song]);
  return song;
}

export async function deleteSong(categoryId: string, songId: string): Promise<void> {
  const songs = await loadSongs(categoryId);
  const song = songs.find((s) => s.id === songId);
  await saveSongs(categoryId, songs.filter((s) => s.id !== songId));
  if (song) await deleteSongFile(song);
}
