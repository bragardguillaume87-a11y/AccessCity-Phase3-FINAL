import type { BackgroundFilter } from '@/types/scenes';

/** Valeurs par défaut (neutre — aucun filtre appliqué). */
export const BACKGROUND_FILTER_DEFAULTS: Required<BackgroundFilter> = {
  blur: 0,
  brightness: 100,
  saturation: 100,
  contrast: 100,
};

/**
 * Convertit un `BackgroundFilter` en chaîne CSS `filter`.
 *
 * Retourne `'none'` si aucun filtre n'est défini ou si toutes les valeurs
 * sont neutres (blur=0, brightness=100, saturation=100, contrast=100).
 *
 * @example
 * buildFilterCSS({ blur: 3, brightness: 80 })
 * // → "blur(3px) brightness(0.8)"
 */
export function buildFilterCSS(f: BackgroundFilter | undefined): string {
  if (!f) return 'none';
  const parts: string[] = [];
  if (f.blur)                                                parts.push(`blur(${f.blur}px)`);
  if (f.brightness !== undefined && f.brightness !== 100)   parts.push(`brightness(${f.brightness / 100})`);
  if (f.saturation !== undefined && f.saturation !== 100)   parts.push(`saturate(${f.saturation / 100})`);
  if (f.contrast   !== undefined && f.contrast   !== 100)   parts.push(`contrast(${f.contrast / 100})`);
  return parts.length ? parts.join(' ') : 'none';
}
