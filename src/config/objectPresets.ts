/**
 * objectPresets.ts — Catalogue de définitions d'objets prédéfinies
 *
 * Principe BotW / GDevelop : chaque preset est un blueprint nommé
 * avec des composants pré-configurés et des valeurs par défaut sensées.
 * L'utilisateur choisit un preset → objet créé → personnalise si besoin.
 *
 * Règle : pas de magic values dans le code métier.
 * Les valeurs par défaut sont ici, éditables via ObjectDefinitionDialog.
 */

import type { ObjectComponent, SpriteCategoryId } from '@/types/sprite';

export interface ObjectPreset {
  /** Identifiant stable du preset (ne change pas) */
  id: string;
  /** Emoji affiché dans le catalogue */
  emoji: string;
  /** Nom court affiché */
  label: string;
  /** Description pédagogique */
  description: string;
  /** Catégorie dans ObjectsPanel */
  category: SpriteCategoryId | string;
  /** Composants pré-attachés avec valeurs par défaut */
  components: ObjectComponent[];
  /** Couleur d'accent dans le catalogue */
  accent: string;
}

// ── Constantes collider par défaut (en px, pour un tileSize de 32) ───────────

const COLLIDER_FOOT: Extract<ObjectComponent, { type: 'collider' }> = {
  type: 'collider',
  shape: 'box',
  offsetX: 0,
  offsetY: 8, // décalé vers le bas → hitbox au niveau des pieds
  w: 24,
  h: 16,
  radius: 12,
};

const COLLIDER_FULL: Extract<ObjectComponent, { type: 'collider' }> = {
  type: 'collider',
  shape: 'box',
  offsetX: 0,
  offsetY: 0,
  w: 28,
  h: 28,
  radius: 14,
};

const COLLIDER_NONE: Extract<ObjectComponent, { type: 'collider' }> = {
  type: 'collider',
  shape: 'none',
  offsetX: 0,
  offsetY: 0,
  w: 0,
  h: 0,
  radius: 0,
};

const ANIMATED_SPRITE_EMPTY: Extract<ObjectComponent, { type: 'animatedSprite' }> = {
  type: 'animatedSprite',
  spriteAssetUrl: '',
  spriteSheetConfigUrl: '',
};

const SPRITE_EMPTY: Extract<ObjectComponent, { type: 'sprite' }> = {
  type: 'sprite',
  spriteAssetUrl: '',
  srcX: 0,
  srcY: 0,
  srcW: 32,
  srcH: 32,
};

// ── Catalogue des presets ─────────────────────────────────────────────────────

export const OBJECT_PRESETS: ObjectPreset[] = [
  // ── HÉROS ──────────────────────────────────────────────────────────────────
  {
    id: 'hero',
    emoji: '🦸',
    label: 'Héros',
    description: 'Personnage contrôlé par le joueur. Ajoute ensuite le spritesheet.',
    category: 'hero',
    accent: '#facc15',
    components: [ANIMATED_SPRITE_EMPTY, COLLIDER_FOOT],
  },

  // ── PNJ ────────────────────────────────────────────────────────────────────
  {
    id: 'npc',
    emoji: '🧑',
    label: 'PNJ',
    description: 'Personnage non-joueur. Parle quand le joueur appuie sur E.',
    category: 'npc',
    accent: '#34d399',
    components: [
      ANIMATED_SPRITE_EMPTY,
      COLLIDER_FOOT,
      {
        type: 'dialogue',
        sceneId: '',
        text: 'Bonjour !',
        condition: '',
      },
    ],
  },

  // ── PNJ PATROUILLEUR ───────────────────────────────────────────────────────
  {
    id: 'npc-patrol',
    emoji: '🚶',
    label: 'PNJ patrouille',
    description: 'PNJ qui se déplace entre deux points et parle au contact.',
    category: 'npc',
    accent: '#fb923c',
    components: [
      ANIMATED_SPRITE_EMPTY,
      COLLIDER_FOOT,
      {
        type: 'dialogue',
        sceneId: '',
        text: 'Bonjour !',
        condition: '',
      },
      {
        type: 'patrol',
        targetCx: 5,
        targetCy: 0,
        speed: 60,
        loop: true,
      },
    ],
  },

  // ── PORTE ──────────────────────────────────────────────────────────────────
  {
    id: 'door',
    emoji: '🚪',
    label: 'Porte',
    description: 'Passage vers une autre carte. Auto ou sur pression de E.',
    category: 'object',
    accent: '#a78bfa',
    components: [
      SPRITE_EMPTY,
      COLLIDER_FULL,
      {
        type: 'portal',
        targetMapId: '',
        targetCx: 0,
        targetCy: 0,
        interactionMode: 'auto',
        locked: false,
        unlockCondition: '',
      },
    ],
  },

  // ── PANNEAU ────────────────────────────────────────────────────────────────
  {
    id: 'sign',
    emoji: '🪧',
    label: 'Panneau',
    description: 'Affiche un texte quand le joueur appuie sur E.',
    category: 'object',
    accent: '#60a5fa',
    components: [
      SPRITE_EMPTY,
      COLLIDER_NONE,
      {
        type: 'dialogue',
        sceneId: '',
        text: 'Panneau vide — modifie le texte.',
        condition: '',
      },
    ],
  },

  // ── COFFRE ─────────────────────────────────────────────────────────────────
  {
    id: 'chest',
    emoji: '📦',
    label: 'Coffre',
    description: "Objet qu'on ouvre une fois. Peut déclencher une scène ou un son.",
    category: 'object',
    accent: '#fbbf24',
    components: [
      SPRITE_EMPTY,
      COLLIDER_FULL,
      {
        type: 'dialogue',
        sceneId: '',
        text: 'Le coffre est vide.',
        condition: '',
      },
      {
        type: 'sound',
        assetUrl: '',
        radius: 3,
        volume: 0.8,
        loop: false,
      },
    ],
  },

  // ── LUMIÈRE ────────────────────────────────────────────────────────────────
  {
    id: 'light',
    emoji: '💡',
    label: 'Lumière',
    description: 'Source lumineuse (torche, lampe, fenêtre). Rendu Phase 3.',
    category: 'object',
    accent: '#fde68a',
    components: [
      SPRITE_EMPTY,
      COLLIDER_NONE,
      {
        type: 'light',
        color: '#ffdd88',
        radius: 4,
        intensity: 0.8,
      },
    ],
  },

  // ── ARBRE / PLANTE ─────────────────────────────────────────────────────────
  {
    id: 'tree',
    emoji: '🌳',
    label: 'Arbre / Plante',
    description: 'Végétation animée par le vent (style Stardew Valley).',
    category: 'plant',
    accent: '#4ade80',
    components: [
      ANIMATED_SPRITE_EMPTY,
      COLLIDER_FOOT,
      {
        type: 'wind',
        amplitude: 3,
        frequency: 0.8,
        phaseOffset: 0,
      },
    ],
  },

  // ── ZONE DÉCLENCHEUR ───────────────────────────────────────────────────────
  {
    id: 'trigger',
    emoji: '⚡',
    label: 'Zone déclencheur',
    description: 'Zone invisible qui déclenche un événement au passage.',
    category: 'object',
    accent: '#f87171',
    components: [
      COLLIDER_NONE,
      {
        type: 'dialogue',
        sceneId: '',
        text: '',
        condition: '',
      },
    ],
  },
];
