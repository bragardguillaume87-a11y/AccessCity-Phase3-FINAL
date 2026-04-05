/**
 * Types pour le module Distribution — éditeur osseux cut-out (FK via Groups Konva imbriqués).
 *
 * Coordonnées en pixels directs. La cinématique directe (FK) est gérée automatiquement
 * par les <Group> imbriqués de Konva — aucun calcul de position monde manuel.
 * node.getAbsoluteTransform() donne la position monde de chaque joint gratuitement.
 */

import type { EasingType, BezierPoints } from '@/utils/animationEasing';

export type { EasingType, BezierPoints };

export interface Bone {
  id: string;
  name: string;
  parentId: string | null; // null = os racine
  /** Offset LOCAL depuis le tip de l'os parent (ou origine du rig pour la racine) */
  localX: number; // pixels
  localY: number; // pixels
  /** Longueur de l'os — s'étend le long de l'axe X du Group local */
  length: number; // pixels
  /** Rotation locale en degrés, relative au Group parent */
  rotation: number;
  /** Couleur hex — cycle depuis BONE_DEFAULT_COLORS */
  color: string;
}

export interface SpritePart {
  id: string;
  boneId: string;
  /** URL display-ready : asset.url ?? asset.path (pattern Tauri) */
  assetUrl: string;
  offsetX: number; // pixels, espace local de l'os
  offsetY: number;
  width: number;
  height: number;
  /** Ordre de rendu — parties triées avant le stick visuel de l'os */
  zOrder: number;
  /**
   * Miroir horizontal — vrai pour les membres du côté opposé (ex: bras droit = bras gauche retourné).
   * Le canvas applique scaleX=-1 avec décalage x pour un flip en place (konva-patterns §17).
   * Champ optionnel : absent/undefined = false (backward compat automatique).
   */
  flipX?: boolean;
  /** Opacité du sprite 0–1 (défaut : 1). */
  opacity?: number;
  /** Rotation locale du sprite en degrés dans l'espace de l'os (défaut : 0). */
  spriteRotation?: number;
}

/** FK : seule la rotation locale est nécessaire par os dans une pose */
export interface BonePoseState {
  rotation: number; // degrés
}

export interface BonePose {
  id: string;
  name: string;
  /** Clé = boneId */
  boneStates: Record<string, BonePoseState>;
}

/**
 * Une entrée de keyframe dans un clip d'animation.
 * Remplace le simple poseId string — ajoute durée et easing.
 */
export interface KeyframeEntry {
  poseId: string;
  /** Durée en secondes (défaut : 1.0). Valeur min : 0.1 */
  duration: number;
  /** Courbe d'interpolation vers le keyframe suivant */
  easing: EasingType;
  /** Points de contrôle Bézier cubique [x1, y1, x2, y2] ∈ [0,1] — requis si easing === 'bezier' */
  bezierPoints?: BezierPoints;
}

export interface AnimationClip {
  id: string;
  name: string;
  fps: number;
  /**
   * @deprecated Conservé pour la rétrocompatibilité undo/redo Zustand.
   * Utiliser `keyframes` comme source de vérité.
   * Synchronisé automatiquement par rigStore.addClip / updateClip.
   */
  poseIds: string[];
  /** Séquence ordonnée de keyframes (durée + easing par étape). */
  keyframes: KeyframeEntry[];
  loop: boolean;
}

/**
 * Chaîne IK (Inverse Kinematics) — définit un groupe d'os résolu par FABRIK.
 * L'utilisateur déplace le end effector (endBoneId) et les os parents s'orientent automatiquement.
 */
export interface IKChain {
  id: string;
  name: string;
  /** Os racine de la chaîne (fixe pendant la résolution IK) */
  rootBoneId: string;
  /** Os extrémité — le "end effector" que l'utilisateur déplace */
  endBoneId: string;
}

export interface CharacterRig {
  id: string;
  characterId: string;
  /** Position du rig dans l'espace canvas (défaut 300, 100) */
  originX: number;
  originY: number;
  bones: Bone[];
  parts: SpritePart[];
  poses: BonePose[];
  animationClips: AnimationClip[];
  /** Chaînes IK définies sur ce rig (mode Expert) */
  ikChains: IKChain[];
}

export type BoneTool = 'select' | 'rotate' | 'add-bone' | 'add-part' | 'ik';
export type DistributionView = 'bone-editor' | 'animation-preview';

export const BONE_DEFAULT_COLORS = [
  '#a78bfa',
  '#34d399',
  '#f472b6',
  '#60a5fa',
  '#fb923c',
  '#facc15',
] as const;

export const DEFAULT_BONE_LENGTH = 60; // pixels
export const DEFAULT_ANIMATION_FPS = 24;
/** Durée par défaut d'un keyframe en secondes */
export const DEFAULT_KEYFRAME_DURATION = 1.0;
