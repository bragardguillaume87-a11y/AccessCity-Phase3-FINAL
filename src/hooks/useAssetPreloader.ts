import { useState, useCallback, useEffect } from 'react';
import { preloadAssets, preloadSceneAssets, preloadAllScenes, type PreloadProgress, type PreloadOptions } from '@/utils/assetPreloader';
import { logger } from '@/utils/logger';
import type { Scene, Character } from '@/types';

/**
 * Asset Preloader Hook
 *
 * PERFORMANCE: React hook for preloading game assets with progress tracking
 * - Manages preload state (loading, progress, errors)
 * - Provides imperative API for manual preloading
 * - Supports auto-preload on mount
 */

export interface UseAssetPreloaderOptions extends PreloadOptions {
  /**
   * Automatically start preloading on mount
   * @default false
   */
  autoPreload?: boolean;

  /**
   * URLs to preload (used when autoPreload is true)
   */
  urls?: string[];
}

export interface UseAssetPreloaderReturn {
  /**
   * Whether assets are currently being preloaded
   */
  isLoading: boolean;

  /**
   * Current preload progress (0-100)
   */
  progress: number;

  /**
   * Detailed progress information
   */
  progressInfo: PreloadProgress | null;

  /**
   * List of URLs that failed to load
   */
  errors: string[];

  /**
   * Preload a list of URLs
   */
  preload: (urls: string[], options?: PreloadOptions) => Promise<void>;

  /**
   * Preload assets for a specific scene
   */
  preloadScene: (scene: Scene, characters: Character[], options?: PreloadOptions) => Promise<void>;

  /**
   * Preload all scenes
   */
  preloadAll: (scenes: Scene[], characters: Character[], options?: PreloadOptions) => Promise<void>;

  /**
   * Reset preloader state
   */
  reset: () => void;
}

/**
 * Hook for preloading game assets
 *
 * @param options - Preloader options
 * @returns Preloader state and functions
 *
 * @example
 * ```tsx
 * function GameLoader() {
 *   const { isLoading, progress, preloadScene } = useAssetPreloader();
 *   const currentScene = useScenesStore(state => state.scenes[0]);
 *   const characters = useCharactersStore(state => state.characters);
 *
 *   useEffect(() => {
 *     preloadScene(currentScene, characters);
 *   }, [currentScene.id]);
 *
 *   if (isLoading) {
 *     return <LoadingBar progress={progress} />;
 *   }
 *
 *   return <Game />;
 * }
 * ```
 */
export function useAssetPreloader(options: UseAssetPreloaderOptions = {}): UseAssetPreloaderReturn {
  const { autoPreload = false, urls = [], ...preloadOptions } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [progressInfo, setProgressInfo] = useState<PreloadProgress | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setProgressInfo(null);
    setErrors([]);
  }, []);

  const preload = useCallback(async (
    urlsToPreload: string[],
    opts: PreloadOptions = {}
  ): Promise<void> => {
    if (!urlsToPreload || urlsToPreload.length === 0) {
      logger.warn('[useAssetPreloader] No URLs provided for preloading');
      return;
    }

    setIsLoading(true);
    setProgressInfo({ loaded: 0, total: urlsToPreload.length, percentage: 0, currentAsset: null });
    setErrors([]);

    const failedUrls: string[] = [];

    try {
      await preloadAssets(urlsToPreload, {
        ...preloadOptions,
        ...opts,
        onProgress: (progress) => {
          setProgressInfo(progress);
          opts.onProgress?.(progress);
          preloadOptions.onProgress?.(progress);
        },
        onError: (url, error) => {
          failedUrls.push(url);
          setErrors(prev => [...prev, url]);
          opts.onError?.(url, error);
          preloadOptions.onError?.(url, error);
        }
      });
    } finally {
      setIsLoading(false);
    }
  }, [preloadOptions]);

  const preloadScene = useCallback(async (
    scene: Scene,
    characters: Character[],
    opts: PreloadOptions = {}
  ): Promise<void> => {
    setIsLoading(true);
    setProgressInfo({ loaded: 0, total: 0, percentage: 0, currentAsset: null });
    setErrors([]);

    const failedUrls: string[] = [];

    try {
      await preloadSceneAssets(scene, characters, {
        ...preloadOptions,
        ...opts,
        onProgress: (progress) => {
          setProgressInfo(progress);
          opts.onProgress?.(progress);
          preloadOptions.onProgress?.(progress);
        },
        onError: (url, error) => {
          failedUrls.push(url);
          setErrors(prev => [...prev, url]);
          opts.onError?.(url, error);
          preloadOptions.onError?.(url, error);
        }
      });
    } finally {
      setIsLoading(false);
    }
  }, [preloadOptions]);

  const preloadAll = useCallback(async (
    scenes: Scene[],
    characters: Character[],
    opts: PreloadOptions = {}
  ): Promise<void> => {
    setIsLoading(true);
    setProgressInfo({ loaded: 0, total: 0, percentage: 0, currentAsset: null });
    setErrors([]);

    const failedUrls: string[] = [];

    try {
      await preloadAllScenes(scenes, characters, {
        ...preloadOptions,
        ...opts,
        onProgress: (progress) => {
          setProgressInfo(progress);
          opts.onProgress?.(progress);
          preloadOptions.onProgress?.(progress);
        },
        onError: (url, error) => {
          failedUrls.push(url);
          setErrors(prev => [...prev, url]);
          opts.onError?.(url, error);
          preloadOptions.onError?.(url, error);
        }
      });
    } finally {
      setIsLoading(false);
    }
  }, [preloadOptions]);

  // Auto-preload on mount if enabled
  useEffect(() => {
    if (autoPreload && urls.length > 0) {
      preload(urls);
    }
  }, []); // Only run on mount

  return {
    isLoading,
    progress: progressInfo?.percentage ?? 0,
    progressInfo,
    errors,
    preload,
    preloadScene,
    preloadAll,
    reset
  };
}
