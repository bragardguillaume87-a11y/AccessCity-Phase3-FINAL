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
};

export const GODRAYS_DEFAULTS: GodrayEffectParams = {
  color: '#ffe090',
  intensity: 0.5,
  angle: 20,
  density: 0.9,
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
