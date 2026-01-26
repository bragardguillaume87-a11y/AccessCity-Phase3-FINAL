/**
 * Constantes pour les assets prédéfinis de l'application
 */

/**
 * Asset de fond prédéfini
 */
export interface GalleryAsset {
  /** URL de l'asset */
  url: string;
  /** Nom affiché dans l'interface */
  name: string;
  /** Nom de fichier de secours */
  fallback: string;
}

/**
 * Galerie d'assets de fond prédéfinis
 * Utilisé par BackgroundPanel et AssetsPanel
 */
export const GALLERY_ASSETS: readonly GalleryAsset[] = [
  { url: '/assets/backgrounds/city_street.svg', name: 'Rue de la ville', fallback: 'city_street.svg' },
  { url: '/assets/backgrounds/city_hall.svg', name: 'Hotel de ville', fallback: 'city_hall.svg' },
  { url: '/assets/backgrounds/park.svg', name: 'Parc', fallback: 'park.svg' },
  { url: '/assets/backgrounds/office.svg', name: 'Bureau', fallback: 'office.svg' }
] as const;

/**
 * Type des humeurs disponibles
 */
export type Mood = 'neutral' | 'happy' | 'sad' | 'angry';

/**
 * Moods par défaut pour les personnages
 */
export const DEFAULT_MOODS: readonly Mood[] = ['neutral', 'happy', 'sad', 'angry'] as const;
