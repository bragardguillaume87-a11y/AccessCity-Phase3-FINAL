/**
 * Asset Preloading Utility
 *
 * PERFORMANCE: Preloads images and assets to improve perceived loading times
 * - Uses browser's native Image() preloading
 * - Parallel loading with concurrency control
 * - Progress tracking for UX feedback
 * - Promise-based API for async/await usage
 */

import { logger } from './logger';

export interface PreloadProgress {
  loaded: number;
  total: number;
  percentage: number;
  currentAsset: string | null;
}

export interface PreloadOptions {
  /**
   * Maximum number of assets to load in parallel
   * @default 6 (browser connection limit)
   */
  concurrency?: number;

  /**
   * Timeout per asset in milliseconds
   * @default 10000 (10 seconds)
   */
  timeout?: number;

  /**
   * Callback for progress updates
   */
  onProgress?: (progress: PreloadProgress) => void;

  /**
   * Callback when an individual asset fails
   * By default, failures are logged but don't stop the preload
   */
  onError?: (url: string, error: Error) => void;
}

/**
 * Preload a single image
 * @param url - Image URL to preload
 * @param timeout - Timeout in milliseconds
 * @returns Promise that resolves when image is loaded
 */
function preloadImage(url: string, timeout: number = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let timeoutId: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      clearTimeout(timeoutId);
      img.onload = null;
      img.onerror = null;
    };

    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout loading image: ${url}`));
    }, timeout);

    img.onload = () => {
      cleanup();
      resolve();
    };

    img.onerror = () => {
      cleanup();
      reject(new Error(`Failed to load image: ${url}`));
    };

    img.src = url;
  });
}

/**
 * Preload multiple assets with concurrency control
 *
 * @param urls - Array of asset URLs to preload
 * @param options - Preload options
 * @returns Promise that resolves when all assets are loaded (or attempted)
 *
 * @example
 * ```ts
 * const urls = ['/assets/bg1.jpg', '/assets/char1.png'];
 * await preloadAssets(urls, {
 *   concurrency: 4,
 *   onProgress: (progress) => {
 *     console.log(`${progress.percentage}% loaded`);
 *   }
 * });
 * ```
 */
export async function preloadAssets(
  urls: string[],
  options: PreloadOptions = {}
): Promise<void> {
  const {
    concurrency = 6,
    timeout = 10000,
    onProgress,
    onError
  } = options;

  if (!urls || urls.length === 0) {
    logger.warn('[AssetPreloader] No assets to preload');
    return;
  }

  // Remove duplicates and filter out empty strings
  const uniqueUrls = Array.from(new Set(urls.filter(url => url && url.trim() !== '')));
  const total = uniqueUrls.length;
  let loaded = 0;

  logger.info(`[AssetPreloader] Starting preload of ${total} assets with concurrency ${concurrency}`);

  const updateProgress = (currentAsset: string | null) => {
    const percentage = Math.round((loaded / total) * 100);
    onProgress?.({ loaded, total, percentage, currentAsset });
  };

  // Initial progress
  updateProgress(null);

  // Create a queue of URLs to process
  const queue = [...uniqueUrls];
  const workers: Promise<void>[] = [];

  // Worker function that processes URLs from the queue
  const worker = async (): Promise<void> => {
    while (queue.length > 0) {
      const url = queue.shift();
      if (!url) break;

      try {
        updateProgress(url);
        await preloadImage(url, timeout);
        loaded++;
        updateProgress(null);
      } catch (error) {
        loaded++;
        const err = error instanceof Error ? error : new Error(String(error));
        logger.warn(`[AssetPreloader] Failed to load asset: ${url}`, err);
        onError?.(url, err);
        updateProgress(null);
      }
    }
  };

  // Start concurrent workers
  const workerCount = Math.min(concurrency, uniqueUrls.length);
  for (let i = 0; i < workerCount; i++) {
    workers.push(worker());
  }

  // Wait for all workers to complete
  await Promise.all(workers);

  logger.info(`[AssetPreloader] Preload complete: ${loaded}/${total} assets`);
}

/**
 * Preload assets from a scene
 *
 * @param scene - Scene object containing backgroundUrl and character sprites
 * @param options - Preload options
 * @returns Promise that resolves when all scene assets are loaded
 *
 * @example
 * ```ts
 * import { preloadSceneAssets } from '@/utils/assetPreloader';
 *
 * await preloadSceneAssets(currentScene, {
 *   onProgress: (progress) => setLoadingProgress(progress.percentage)
 * });
 * ```
 */
export async function preloadSceneAssets(
  scene: {
    backgroundUrl?: string;
    characters?: Array<{
      characterId: string;
      mood?: string;
    }>;
    props?: Array<{
      assetUrl: string;
    }>;
  },
  characters: Array<{
    id: string;
    sprites: Record<string, string>;
  }>,
  options: PreloadOptions = {}
): Promise<void> {
  const urls: string[] = [];

  // Add background
  if (scene.backgroundUrl) {
    urls.push(scene.backgroundUrl);
  }

  // Add character sprites
  if (scene.characters && characters) {
    scene.characters.forEach(sceneChar => {
      const character = characters.find(c => c.id === sceneChar.characterId);
      if (character && character.sprites) {
        const mood = sceneChar.mood || 'neutral';
        const spriteUrl = character.sprites[mood];
        if (spriteUrl) {
          urls.push(spriteUrl);
        }
      }
    });
  }

  // Add props
  if (scene.props) {
    scene.props.forEach(prop => {
      if (prop.assetUrl) {
        urls.push(prop.assetUrl);
      }
    });
  }

  await preloadAssets(urls, options);
}

/**
 * Preload all scenes' assets in background
 *
 * Useful for preloading the entire game on app startup
 *
 * @param scenes - Array of all scenes
 * @param characters - Array of all characters
 * @param options - Preload options
 */
export async function preloadAllScenes(
  scenes: Array<{
    backgroundUrl?: string;
    characters?: Array<{
      characterId: string;
      mood?: string;
    }>;
    props?: Array<{
      assetUrl: string;
    }>;
  }>,
  characters: Array<{
    id: string;
    sprites: Record<string, string>;
  }>,
  options: PreloadOptions = {}
): Promise<void> {
  const allUrls: string[] = [];

  // Collect all URLs from all scenes
  scenes.forEach(scene => {
    if (scene.backgroundUrl) {
      allUrls.push(scene.backgroundUrl);
    }

    if (scene.characters && characters) {
      scene.characters.forEach(sceneChar => {
        const character = characters.find(c => c.id === sceneChar.characterId);
        if (character && character.sprites) {
          Object.values(character.sprites).forEach(spriteUrl => {
            if (spriteUrl) {
              allUrls.push(spriteUrl);
            }
          });
        }
      });
    }

    if (scene.props) {
      scene.props.forEach(prop => {
        if (prop.assetUrl) {
          allUrls.push(prop.assetUrl);
        }
      });
    }
  });

  await preloadAssets(allUrls, options);
}
