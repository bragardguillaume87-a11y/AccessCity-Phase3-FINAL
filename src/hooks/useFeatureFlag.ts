import { useFeatureFlagsStore } from '@/stores/featureFlagsStore';

/**
 * Lit l'état enabled d'un feature flag.
 *
 * Selector granulaire — ne re-rend que si ce flag précis change.
 *
 * @example
 * const isEnabled = useFeatureFlag('visual-filters');
 * if (!isEnabled) return null;
 */
export function useFeatureFlag(key: string): boolean {
  return useFeatureFlagsStore((s) => s.flags[key]?.enabled ?? false);
}
