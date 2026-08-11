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

type LibraryContextValue = {
  categories: Category[];
  loading: boolean;
  songsFor: (categoryId: string) => Song[];
  createCategory: (name: string) => Promise<Category>;
  deleteCategory: (categoryId: string) => Promise<void>;
  addSong: (categoryId: string, params: AddSongParams) => Promise<void>;
  deleteSong: (categoryId: string, songId: string) => Promise<void>;
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

  const value = useMemo<LibraryContextValue>(
    () => ({ categories, loading, songsFor, createCategory, deleteCategory, addSong, deleteSong }),
    [categories, loading, songsFor, createCategory, deleteCategory, addSong, deleteSong]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary deve ser usado dentro de LibraryProvider");
  return ctx;
}
