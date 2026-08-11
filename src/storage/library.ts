import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Crypto from "expo-crypto";
import type { Category, Song, SongImage } from "../types";

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
  await Promise.all(songs.map((song) => deleteSongFiles(song.images)));
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

function imageUri(img: SongImage): string | undefined {
  return typeof img.source === "object" && "uri" in img.source ? img.source.uri : undefined;
}

function deleteSongFiles(images: SongImage[]): Promise<void[]> {
  return Promise.all(
    images.map((img) => {
      const uri = imageUri(img);
      return uri ? FileSystem.deleteAsync(uri, { idempotent: true }) : Promise.resolve();
    })
  );
}

async function copyPickedImage(picked: { uri: string; width: number; height: number }): Promise<SongImage> {
  await ensureLibraryDir();
  const extMatch = picked.uri.match(/\.(\w+)(\?.*)?$/);
  const ext = extMatch ? extMatch[1] : "jpg";
  const destUri = `${LIBRARY_DIR}${Crypto.randomUUID()}.${ext}`;
  await FileSystem.copyAsync({ from: picked.uri, to: destUri });
  return { source: { uri: destUri }, width: picked.width, height: picked.height };
}

function moveItem<T>(list: T[], index: number, direction: "up" | "down"): T[] {
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export async function addSong(
  categoryId: string,
  params: { title: string; pickedImages: { uri: string; width: number; height: number }[] }
): Promise<Song> {
  const images = await Promise.all(params.pickedImages.map(copyPickedImage));
  const song: Song = { id: Crypto.randomUUID(), number: null, title: params.title, images };

  const songs = await loadSongs(categoryId);
  await saveSongs(categoryId, [...songs, song]);
  return song;
}

export async function deleteSong(categoryId: string, songId: string): Promise<void> {
  const songs = await loadSongs(categoryId);
  const song = songs.find((s) => s.id === songId);
  await saveSongs(categoryId, songs.filter((s) => s.id !== songId));
  if (song) await deleteSongFiles(song.images);
}

export async function moveSong(
  categoryId: string,
  songId: string,
  direction: "up" | "down"
): Promise<Song[]> {
  const songs = await loadSongs(categoryId);
  const index = songs.findIndex((s) => s.id === songId);
  if (index === -1) return songs;
  const next = moveItem(songs, index, direction);
  await saveSongs(categoryId, next);
  return next;
}

async function updateSong(categoryId: string, songId: string, update: (song: Song) => Song): Promise<Song[]> {
  const songs = await loadSongs(categoryId);
  const next = songs.map((s) => (s.id === songId ? update(s) : s));
  await saveSongs(categoryId, next);
  return next;
}

export async function moveSongImage(
  categoryId: string,
  songId: string,
  imageIndex: number,
  direction: "up" | "down"
): Promise<Song[]> {
  return updateSong(categoryId, songId, (song) => ({
    ...song,
    images: moveItem(song.images, imageIndex, direction),
  }));
}

export async function removeSongImage(
  categoryId: string,
  songId: string,
  imageIndex: number
): Promise<Song[]> {
  const songs = await loadSongs(categoryId);
  const song = songs.find((s) => s.id === songId);
  const removed = song?.images[imageIndex];

  const next = await updateSong(categoryId, songId, (s) => ({
    ...s,
    images: s.images.filter((_, i) => i !== imageIndex),
  }));

  if (removed) await deleteSongFiles([removed]);
  return next;
}

export async function addSongImages(
  categoryId: string,
  songId: string,
  pickedImages: { uri: string; width: number; height: number }[]
): Promise<Song[]> {
  const newImages = await Promise.all(pickedImages.map(copyPickedImage));
  return updateSong(categoryId, songId, (song) => ({
    ...song,
    images: [...song.images, ...newImages],
  }));
}
