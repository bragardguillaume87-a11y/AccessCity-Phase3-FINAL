/**
 * SceneEffect — effets visuels atmosphériques
 *
 * Stocké dans :
 * - MapMetadata.sceneEffect  → par carte topdown (mapsStore)
 * - SceneMetadata.sceneEffect → par scène VN (scenesStore)
 *
 * Rendu via :
 * - <SceneEffectCanvas> (HTML overlay) → VN + MapCanvas éditeur + PreviewPlayer
 * - Excalibur GpuParticleEmitter + PostProcessor → GamePreview
 *
 * @module types/sceneEffect
 */

// ============================================================================
// EFFECT TYPES
// ============================================================================

export type SceneEffectType = 'none' | 'rain' | 'snow' | 'fog' | 'bloom' | 'godrays' | 'drizzle';

// ============================================================================
// CONFIG PER EFFECT
// ============================================================================

export interface RainEffectParams {
  /** Nombre de gouttes (50–800, défaut 300) */
  density: number;
  /** Angle de chute en degrés depuis la verticale (0 = droit, positif = vers la droite) */
  angle: number;
  /** Longueur des streaks en px (4–30) */
  length: number;
  /** Couleur RGBA des gouttes */
  color: string;
  /**
   * Intensité des éclaboussures au sol (0 = désactivé, 0.5–2 = léger à intense).
   * Génère 2–5 micro-particules en arc à l'impact de chaque goutte.
   */
  splashScale?: number;
  /**
   * Hauteur du "sol" virtuel, en fraction de la hauteur du canvas (0.5–1.0).
   * Les éclaboussures apparaissent quand une goutte dépasse ce seuil.
   * Défaut : 0.82 (bas du canvas).
   */
  groundLevel?: number;
}

export interface DrizzleEffectParams {
  /** Nombre de gouttes (100–600, défaut 250) */
  density: number;
  /** Angle de dérive en degrés (−20 à +20) */
  angle: number;
  /** Opacité des streaks (0.05–0.35) */
  opacity: number;
  /** Vitesse de chute (1–5) */
  speed: number;
  /** Couleur de base */
  color: string;
}

export interface SnowEffectParams {
  /** Nombre de flocons (50–600, défaut 200) */
  density: number;
  /** Vitesse de dérive horizontale (0–2) */
  drift: number;
  /** Taille moyenne des flocons en px (1–8) */
  size: number;
  /** Couleur des flocons */
  color: string;
}

export interface FogEffectParams {
  /** Couleur de base du brouillard */
  color: string;
  /** Opacité maximale (0–1) */
  opacity: number;
  /** Vitesse de mouvement du bruit (0.1–3) */
  speed: number;
  /** Echelle du bruit Simplex (0.5–4, 1 = neutre) */
  scale: number;
}

export interface BloomEffectParams {
  /** Intensité du bloom (0.1–1.5) */
  intensity: number;
  /** Rayon de flou (1–8) */
  radius: number;
  /** Seuil — bokeh actif si brightness > threshold (0.2–0.9) */
  threshold: number;
  /** Couleur de base des halos (hex #rrggbb ou rgba(r,g,b,...)) — défaut warm gold */
  color?: string;
}

export interface GodrayEffectParams {
  /** Couleur des rayons */
  color: string;
  /** Intensité (0.1–1) */
  intensity: number;
  /**
   * Position horizontale de la source lumineuse (−90 = gauche, 0 = centre, +90 = droite).
   * Détermine depuis où partent les rayons.
   */
  angle: number;
  /** Nombre de rayons (0.3–1.5 → 4–12 rayons) */
  density: number;
}

// ============================================================================
// CHARACTER HITBOX — bounding box canvas-pixels d'un sprite personnage
// Passé par ref au renderer de pluie pour les collisions goutte → sprite.
// ============================================================================

export interface CharacterHitbox {
  x: number; // pixel canvas — coin gauche
  y: number; // pixel canvas — coin haut
  w: number; // largeur en pixels canvas
  h: number; // hauteur en pixels canvas
}

// ============================================================================
// SHARED OPTIONS — disponibles sur tout effet actif
// ============================================================================

export interface SceneEffectShared {
  /**
   * Mode d'éclairage des sprites personnages (style Square Soft).
   * 'tint'     → overlay coloré ambiant (SNES color math)
   * 'rimlight' → halo de contour radial (style FF7)
   * 'both'     → les deux combinés
   * 'off'      → aucun effet sur les sprites (défaut)
   */
  spriteLight?: 'off' | 'tint' | 'rimlight' | 'both';
  /**
   * Active le filtre CSS recommandé pour cet effet (saturate + brightness).
   * Appliqué par le parent (PreviewPlayer, MapCanvas) sur le fond de scène.
   */
  cssFilter?: boolean;
}

// ============================================================================
// DISCRIMINATED UNION
// ============================================================================

export type SceneEffectConfig =
  | { type: 'none' }
  | ({ type: 'rain' } & RainEffectParams & SceneEffectShared)
  | ({ type: 'drizzle' } & DrizzleEffectParams & SceneEffectShared)
  | ({ type: 'snow' } & SnowEffectParams & SceneEffectShared)
  | ({ type: 'fog' } & FogEffectParams & SceneEffectShared)
  | ({ type: 'bloom' } & BloomEffectParams & SceneEffectShared)
  | ({ type: 'godrays' } & GodrayEffectParams & SceneEffectShared);
