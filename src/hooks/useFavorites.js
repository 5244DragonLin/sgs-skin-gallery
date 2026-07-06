import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'sgs-gallery-favorites';

/**
 * Custom hook for managing favorite skins via localStorage.
 * Favorites are stored as an array of "{generalId}:{skinId}" strings.
 *
 * @returns {{ favorites: Set<string>, toggleFavorite: (generalId: string, skinId: string) => void, isFavorite: (generalId: string, skinId: string) => boolean, clearFavorites: () => void }}
 */
export default function useFavorites() {
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return new Set(parsed);
        }
      }
    } catch (err) {
      console.warn('Failed to load favorites from localStorage:', err);
    }
    return new Set();
  });

  // Persist favorites to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
    } catch (err) {
      console.warn('Failed to save favorites to localStorage:', err);
    }
  }, [favorites]);

  /**
   * Generate a unique key for a skin.
   */
  const makeKey = useCallback((generalId, skinId) => {
    return `${generalId}::${skinId}`;
  }, []);

  /**
   * Toggle a skin's favorite status.
   */
  const toggleFavorite = useCallback((generalId, skinId) => {
    const key = makeKey(generalId, skinId);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, [makeKey]);

  /**
   * Check if a skin is favorited.
   */
  const isFavorite = useCallback((generalId, skinId) => {
    return favorites.has(makeKey(generalId, skinId));
  }, [favorites, makeKey]);

  /**
   * Clear all favorites.
   */
  const clearFavorites = useCallback(() => {
    setFavorites(new Set());
  }, []);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    count: favorites.size,
  };
}
