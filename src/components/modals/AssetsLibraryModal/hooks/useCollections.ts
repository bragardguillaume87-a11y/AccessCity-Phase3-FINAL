import { useCallback } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import type { AssetCollection } from '@/types/collections';

/**
 * useCollections — CRUD sur les collections personnalisées d'assets.
 *
 * Les collections sont persistées dans settingsStore (avec le projet).
 * Les smart collections (Favoris, Récents, etc.) sont calculées dynamiquement
 * dans AssetsLibraryModal — elles ne transitent pas par ce hook.
 */
export function useCollections() {
  const collections = useSettingsStore(state => state.assetCollections);
  // Sélecteurs individuels — évite useShallow (chaque fn est une référence stable dans Zustand)
  const addAssetCollection      = useSettingsStore(state => state.addAssetCollection);
  const removeAssetCollection   = useSettingsStore(state => state.removeAssetCollection);
  const renameAssetCollection   = useSettingsStore(state => state.renameAssetCollection);
  const addAssetToCollection    = useSettingsStore(state => state.addAssetToCollection);
  const removeAssetFromCollection = useSettingsStore(state => state.removeAssetFromCollection);

  const createCollection = useCallback((name: string): string => {
    return addAssetCollection(name.trim());
  }, [addAssetCollection]);

  const deleteCollection = useCallback((id: string) => {
    removeAssetCollection(id);
  }, [removeAssetCollection]);

  const rename = useCallback((id: string, name: string) => {
    if (name.trim()) renameAssetCollection(id, name.trim());
  }, [renameAssetCollection]);

  const addAsset = useCallback((collectionId: string, assetId: string) => {
    addAssetToCollection(collectionId, assetId);
  }, [addAssetToCollection]);

  const removeAsset = useCallback((collectionId: string, assetId: string) => {
    removeAssetFromCollection(collectionId, assetId);
  }, [removeAssetFromCollection]);

  const isAssetInCollection = useCallback((collection: AssetCollection, assetId: string): boolean => {
    return collection.assetIds.includes(assetId);
  }, []);

  return {
    collections,
    createCollection,
    deleteCollection,
    rename,
    addAsset,
    removeAsset,
    isAssetInCollection,
  };
}
