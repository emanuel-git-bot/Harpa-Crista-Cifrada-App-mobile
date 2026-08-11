import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadFavorites, saveFavorites } from "../storage/favorites";

type FavoritesContextValue = {
  favorites: string[];
  isFavorite: (songId: string) => boolean;
  toggleFavorite: (songId: string) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    loadFavorites().then(setFavorites);
  }, []);

  const toggleFavorite = (songId: string) => {
    setFavorites((current) => {
      const next = current.includes(songId)
        ? current.filter((id) => id !== songId)
        : [...current, songId];
      saveFavorites(next);
      return next;
    });
  };

  const value = useMemo(
    () => ({
      favorites,
      isFavorite: (songId: string) => favorites.includes(songId),
      toggleFavorite,
    }),
    [favorites]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites deve ser usado dentro de FavoritesProvider");
  return ctx;
}
