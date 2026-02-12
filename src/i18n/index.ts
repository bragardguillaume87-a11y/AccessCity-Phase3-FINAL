/**
 * i18n System for AccessCity
 *
 * Type-safe internationalization with:
 * - Compile-time key validation
 * - Game stats constants (no more typos!)
 * - Simple hook-based API
 *
 * Usage:
 * ```typescript
 * import { useTranslation, GAME_STATS } from '@/i18n';
 *
 * function MyComponent() {
 *   const { t, gameStats } = useTranslation();
 *
 *   // Type-safe translations
 *   return <div>{gameStats[GAME_STATS.EMPATHY]}</div>;
 * }
 * ```
 */

import { useMemo } from 'react';
import { useSettingsStore } from '../stores';
import { fr } from './locales/fr';
import { en } from './locales/en';
import type {
  Translations,
  SupportedLocale,
  GameStatKey,
  TranslationPath,
} from './types';

// Re-export types and constants
export { GAME_STATS, SUPPORTED_LOCALES, DEFAULT_LOCALE } from './types';
export type {
  Translations,
  SupportedLocale,
  GameStatKey,
  TranslationPath,
  GameStatsTranslations,
  CommonTranslations,
  EditorTranslations,
} from './types';

// ============================================================================
// TRANSLATIONS REGISTRY
// ============================================================================

const translations: Record<SupportedLocale, Translations> = {
  fr,
  en,
};

// ============================================================================
// TRANSLATION UTILITIES
// ============================================================================

/**
 * Get translations for a specific locale
 */
export function getTranslations(locale: SupportedLocale = 'fr'): Translations {
  return translations[locale] ?? translations.fr;
}

/**
 * Get a specific translation by path
 * @param path - Dot-notation path like 'gameStats.empathy'
 * @param locale - Target locale
 */
export function translate(
  path: TranslationPath,
  locale: SupportedLocale = 'fr'
): string {
  const t = getTranslations(locale);
  const [section, key] = path.split('.') as [keyof Translations, string];

  const sectionData = t[section];
  if (sectionData && typeof sectionData === 'object' && key in sectionData) {
    return (sectionData as unknown as Record<string, string>)[key];
  }

  // Fallback to French if key not found
  const fallback = translations.fr[section];
  if (fallback && typeof fallback === 'object' && key in fallback) {
    return (fallback as unknown as Record<string, string>)[key];
  }

  return path; // Return path as fallback
}

// ============================================================================
// REACT HOOK
// ============================================================================

interface UseTranslationReturn {
  /** Current locale */
  locale: SupportedLocale;
  /** Full translations object */
  translations: Translations;
  /** Game stats translations (shortcut) */
  gameStats: Translations['gameStats'];
  /** Common translations (shortcut) */
  common: Translations['common'];
  /** Editor translations (shortcut) */
  editor: Translations['editor'];
  /** Translate by path */
  t: (path: TranslationPath) => string;
}

/**
 * Hook for accessing translations in React components
 *
 * @example
 * ```typescript
 * const { gameStats, t } = useTranslation();
 *
 * // Direct access
 * <span>{gameStats.empathy}</span>
 *
 * // Path-based access
 * <span>{t('gameStats.empathy')}</span>
 * ```
 */
export function useTranslation(): UseTranslationReturn {
  // Get locale from settings store (default to 'fr')
  const locale = useSettingsStore(
    (state) => (state.language as SupportedLocale) || 'fr'
  );

  return useMemo(() => {
    const t = getTranslations(locale);

    return {
      locale,
      translations: t,
      gameStats: t.gameStats,
      common: t.common,
      editor: t.editor,
      t: (path: TranslationPath) => translate(path, locale),
    };
  }, [locale]);
}

// ============================================================================
// GAME STATS HELPERS
// ============================================================================

/**
 * Get game stat display name by key
 * Useful for dynamic stat lookups
 */
export function getGameStatName(
  statKey: GameStatKey,
  locale: SupportedLocale = 'fr'
): string {
  const t = getTranslations(locale);
  return t.gameStats[statKey] ?? statKey;
}

/**
 * Get all game stats as key-value pairs
 * Useful for initializing default values
 */
export function getDefaultGameStats(
  locale: SupportedLocale = 'fr'
): Record<GameStatKey, { name: string; value: number }> {
  const t = getTranslations(locale);
  return {
    physique: { name: t.gameStats.physique, value: 100 },
    mentale: { name: t.gameStats.mentale, value: 100 },
  };
}

/**
 * Map from legacy French stat names to GameStatKey
 * Used for migration/compatibility
 */
export const LEGACY_STAT_MAPPING: Record<string, GameStatKey> = {
  // Former social stats → now physical/mental bars
  'Empathie': 'mentale',
  'Autonomie': 'physique',
  'Confiance': 'mentale',
  'Empathy': 'mentale',
  'Autonomy': 'physique',
  'Confidence': 'mentale',
  // New stats (for migration of any old uppercase keys)
  'Physique': 'physique',
  'Mentale': 'mentale',
};

/**
 * Convert legacy stat name to GameStatKey
 */
export function legacyToStatKey(legacyName: string): GameStatKey | null {
  return LEGACY_STAT_MAPPING[legacyName] ?? null;
}
