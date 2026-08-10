import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadFavorites, saveFavorites } from "../storage/favorites";

type FavoritesContextValue = {
  favorites: number[];
  isFavorite: (hymnNumber: number) => boolean;
  toggleFavorite: (hymnNumber: number) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    loadFavorites().then(setFavorites);
  }, []);

  const toggleFavorite = (hymnNumber: number) => {
    setFavorites((current) => {
      const next = current.includes(hymnNumber)
        ? current.filter((n) => n !== hymnNumber)
        : [...current, hymnNumber];
      saveFavorites(next);
      return next;
    });
  };

  const value = useMemo(
    () => ({
      favorites,
      isFavorite: (hymnNumber: number) => favorites.includes(hymnNumber),
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
