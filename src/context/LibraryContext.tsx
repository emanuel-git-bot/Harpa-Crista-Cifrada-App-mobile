import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { harpaCategory, harpaSongs, HARPA_CATEGORY_ID } from "../data/builtinCategory";
import * as store from "../storage/library";
import type { Category, Song } from "../types";

type AddSongParams = {
  title: string;
  pickedImages: { uri: string; width: number; height: number }[];
};

type PickedImage = { uri: string; width: number; height: number };

type LibraryContextValue = {
  categories: Category[];
  loading: boolean;
  songsFor: (categoryId: string) => Song[];
  createCategory: (name: string) => Promise<Category>;
  deleteCategory: (categoryId: string) => Promise<void>;
  addSong: (categoryId: string, params: AddSongParams) => Promise<void>;
  deleteSong: (categoryId: string, songId: string) => Promise<void>;
  moveSong: (categoryId: string, songId: string, direction: "up" | "down") => Promise<void>;
  moveSongImage: (
    categoryId: string,
    songId: string,
    imageIndex: number,
    direction: "up" | "down"
  ) => Promise<void>;
  removeSongImage: (categoryId: string, songId: string, imageIndex: number) => Promise<void>;
  addSongImages: (categoryId: string, songId: string, pickedImages: PickedImage[]) => Promise<void>;
};

const LibraryContext = createContext<LibraryContextValue | undefined>(undefined);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [songsByCategory, setSongsByCategory] = useState<Record<string, Song[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const cats = await store.loadCategories();
      const entries = await Promise.all(
        cats.map(async (c) => [c.id, await store.loadSongs(c.id)] as const)
      );
      setUserCategories(cats);
      setSongsByCategory(Object.fromEntries(entries));
      setLoading(false);
    })();
  }, []);

  const categories = useMemo(() => [harpaCategory, ...userCategories], [userCategories]);

  const songsFor = useCallback(
    (categoryId: string) =>
      categoryId === HARPA_CATEGORY_ID ? harpaSongs : songsByCategory[categoryId] ?? [],
    [songsByCategory]
  );

  const setSongs = useCallback((categoryId: string, songs: Song[]) => {
    setSongsByCategory((prev) => ({ ...prev, [categoryId]: songs }));
  }, []);

  const createCategory = useCallback(async (name: string) => {
    const category = await store.createCategory(name);
    setUserCategories((prev) => [...prev, category]);
    setSongsByCategory((prev) => ({ ...prev, [category.id]: [] }));
    return category;
  }, []);

  const deleteCategory = useCallback(async (categoryId: string) => {
    await store.deleteCategory(categoryId);
    setUserCategories((prev) => prev.filter((c) => c.id !== categoryId));
    setSongsByCategory((prev) => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
  }, []);

  const addSong = useCallback(async (categoryId: string, params: AddSongParams) => {
    const song = await store.addSong(categoryId, params);
    setSongsByCategory((prev) => ({
      ...prev,
      [categoryId]: [...(prev[categoryId] ?? []), song],
    }));
  }, []);

  const deleteSong = useCallback(async (categoryId: string, songId: string) => {
    await store.deleteSong(categoryId, songId);
    setSongsByCategory((prev) => ({
      ...prev,
      [categoryId]: (prev[categoryId] ?? []).filter((s) => s.id !== songId),
    }));
  }, []);

  const moveSong = useCallback(
    async (categoryId: string, songId: string, direction: "up" | "down") => {
      const next = await store.moveSong(categoryId, songId, direction);
      setSongs(categoryId, next);
    },
    [setSongs]
  );

  const moveSongImage = useCallback(
    async (categoryId: string, songId: string, imageIndex: number, direction: "up" | "down") => {
      const next = await store.moveSongImage(categoryId, songId, imageIndex, direction);
      setSongs(categoryId, next);
    },
    [setSongs]
  );

  const removeSongImage = useCallback(
    async (categoryId: string, songId: string, imageIndex: number) => {
      const next = await store.removeSongImage(categoryId, songId, imageIndex);
      setSongs(categoryId, next);
    },
    [setSongs]
  );

  const addSongImages = useCallback(
    async (categoryId: string, songId: string, pickedImages: PickedImage[]) => {
      const next = await store.addSongImages(categoryId, songId, pickedImages);
      setSongs(categoryId, next);
    },
    [setSongs]
  );

  const value = useMemo<LibraryContextValue>(
    () => ({
      categories,
      loading,
      songsFor,
      createCategory,
      deleteCategory,
      addSong,
      deleteSong,
      moveSong,
      moveSongImage,
      removeSongImage,
      addSongImages,
    }),
    [
      categories,
      loading,
      songsFor,
      createCategory,
      deleteCategory,
      addSong,
      deleteSong,
      moveSong,
      moveSongImage,
      removeSongImage,
      addSongImages,
    ]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary deve ser usado dentro de LibraryProvider");
  return ctx;
}
