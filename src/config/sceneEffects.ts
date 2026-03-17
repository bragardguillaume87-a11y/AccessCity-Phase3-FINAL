/**
 * sceneEffects — Presets par défaut pour chaque type d'effet atmosphérique
 *
 * Convention : suit le même pattern que LPC_PRESET (src/types/sprite.ts) et
 * TILESET_CATEGORIES (src/types/tileset.ts) — config externalisée, jamais hardcodée.
 *
 * @module config/sceneEffects
 */

import type {
  SceneEffectConfig,
  SceneEffectType,
  RainEffectParams,
  DrizzleEffectParams,
  SnowEffectParams,
  FogEffectParams,
  BloomEffectParams,
  GodrayEffectParams,
} from '@/types/sceneEffect';

// ============================================================================
// METADATA — icônes + labels pour les sélecteurs UI
// ============================================================================

export interface SceneEffectMeta {
  type: SceneEffectType;
  label: string;
  emoji: string;
  description: string;
}

export const SCENE_EFFECT_TYPES: SceneEffectMeta[] = [
  { type: 'none', emoji: '✨', label: 'Aucun', description: "Pas d'effet atmosphérique" },
  { type: 'rain', emoji: '🌧', label: 'Pluie', description: 'Pluie avec éclaboussures réalistes' },
  { type: 'drizzle', emoji: '🌦', label: 'Bruine', description: 'Bruine fine et légère' },
  { type: 'snow', emoji: '❄️', label: 'Neige', description: 'Flocons de neige drifting' },
  {
    type: 'fog',
    emoji: '🌫',
    label: 'Brouillard',
    description: 'Brouillard volumétrique animé (WebGL2)',
  },
  {
    type: 'bloom',
    emoji: '💫',
    label: 'Bloom',
    description: 'Lueur atmosphérique et bokeh de lumière',
  },
  {
    type: 'godrays',
    emoji: '☀️',
    label: 'God rays',
    description: 'Rayons de lumière atmosphériques',
  },
] as const;

// ============================================================================
// DEFAULTS PAR TYPE
// ============================================================================

export const RAIN_DEFAULTS: RainEffectParams = {
  density: 300,
  angle: 10,
  length: 12,
  color: 'rgba(160, 200, 255, 0.55)',
  splashScale: 1.0,
  groundLevel: 0.82,
};

export const DRIZZLE_DEFAULTS: DrizzleEffectParams = {
  density: 250,
  angle: 5,
  opacity: 0.18,
  speed: 2.5,
  color: 'rgba(200, 220, 255, 1)',
};

export const SNOW_DEFAULTS: SnowEffectParams = {
  density: 200,
  drift: 0.6,
  size: 3,
  color: 'rgba(255, 255, 255, 0.75)',
};

export const FOG_DEFAULTS: FogEffectParams = {
  color: '#b0c8e0',
  opacity: 0.45,
  speed: 0.8,
  scale: 1.5,
};

export const BLOOM_DEFAULTS: BloomEffectParams = {
  intensity: 0.6,
  radius: 3,
  threshold: 0.5,
  color: '#ffe8b0',
};

export const GODRAYS_DEFAULTS: GodrayEffectParams = {
  color: '#ffe090',
  intensity: 0.5,
  angle: 20,
  density: 0.9,
};

// ============================================================================
// AMBIENT OVERLAY — couleur par effet (mix-blend-mode: color sur scène)
// Simule le color math SNES / palette Square Soft
// ============================================================================

export const EFFECT_AMBIENT_COLORS: Record<SceneEffectType, string | null> = {
  none: null,
  rain: 'rgba(20,60,130,0.08)',
  drizzle: 'rgba(30,70,140,0.06)',
  snow: 'rgba(180,200,235,0.07)',
  fog: 'rgba(148,165,185,0.09)',
  bloom: 'rgba(255,230,160,0.07)',
  godrays: 'rgba(255,215,95,0.09)',
};

// ============================================================================
// CSS FILTER — opt-in, appliqué sur le wrapper de scène parent
// ============================================================================

export const EFFECT_CSS_FILTERS: Record<SceneEffectType, string | null> = {
  none: null,
  rain: 'saturate(0.88) brightness(0.93)',
  drizzle: 'saturate(0.92) brightness(0.96)',
  snow: 'saturate(0.75) brightness(1.04)',
  fog: 'saturate(0.70) brightness(0.88)',
  bloom: 'saturate(1.12) brightness(1.05)',
  godrays: 'saturate(1.08) brightness(1.04)',
};

// ============================================================================
// SPRITE LIGHTING — tint ambiant + rim color par effet
// ============================================================================

export const EFFECT_SPRITE_TINT: Record<
  SceneEffectType,
  { r: number; g: number; b: number; a: number } | null
> = {
  none: null,
  rain: { r: 20, g: 60, b: 130, a: 0.1 },
  drizzle: { r: 30, g: 70, b: 140, a: 0.07 },
  snow: { r: 180, g: 200, b: 235, a: 0.08 },
  fog: { r: 148, g: 165, b: 185, a: 0.09 },
  bloom: { r: 255, g: 230, b: 160, a: 0.08 },
  godrays: { r: 255, g: 215, b: 95, a: 0.1 },
};

export const EFFECT_RIM_COLOR: Record<SceneEffectType, string | null> = {
  none: null,
  rain: 'rgba(30,80,200,0.55)',
  drizzle: 'rgba(40,90,200,0.40)',
  snow: 'rgba(200,220,255,0.50)',
  fog: 'rgba(160,180,210,0.45)',
  bloom: 'rgba(255,220,140,0.55)',
  godrays: 'rgba(255,200,80,0.60)',
};

// ============================================================================
// PRESET FACTORY — retourne un preset config complet depuis un type
// ============================================================================

export function makeDefaultEffect(type: SceneEffectType): SceneEffectConfig {
  switch (type) {
    case 'rain':
      return { type: 'rain', ...RAIN_DEFAULTS };
    case 'drizzle':
      return { type: 'drizzle', ...DRIZZLE_DEFAULTS };
    case 'snow':
      return { type: 'snow', ...SNOW_DEFAULTS };
    case 'fog':
      return { type: 'fog', ...FOG_DEFAULTS };
    case 'bloom':
      return { type: 'bloom', ...BLOOM_DEFAULTS };
    case 'godrays':
      return { type: 'godrays', ...GODRAYS_DEFAULTS };
    default:
      return { type: 'none' };
  }
}
