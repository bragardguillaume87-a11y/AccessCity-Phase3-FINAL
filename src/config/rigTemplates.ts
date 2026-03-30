/**
 * Templates de rig pré-câblés pour le module Distribution.
 * Permettent à un débutant de démarrer avec un squelette complet
 * sans avoir à créer et relier les os manuellement.
 *
 * Les `key` sont des identifiants locaux résolus en UUIDs à la création (rigStore.addRigFromTemplate).
 */

export interface RigTemplateNode {
  key: string;
  name: string;
  parentKey: string | null;
  localX: number;
  localY: number;
  length: number;
  rotation: number;
  color: string;
}

export interface RigTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  bones: RigTemplateNode[];
}

/**
 * Template "Personnage simple" — 7 os pré-connectés en T-pose.
 *
 * Hiérarchie :
 *   corps (racine, pointe vers le HAUT)
 *     ├── cou    (continue vers le haut)
 *     │     └── tête   (continue vers le haut)
 *     ├── épaule_g  (pointe à GAUCHE)
 *     │     └── avant_bras_g (continue à gauche)
 *     └── épaule_d  (pointe à DROITE)
 *           └── avant_bras_d (continue à droite)
 *
 * Règle FK :
 *   - BoneGroup place les enfants à la POINTE du parent (<Group x={bone.length}>).
 *   - localX/localY des enfants = offset SUPPLÉMENTAIRE au-delà de la pointe.
 *   - → Tous les os enfants ont localX=0, localY=0 pour s'attacher exactement à la pointe.
 *
 * Rotations (Konva, degrés, sens horaire, Y vers le bas) :
 *   - corps   : rotation=-90 → pointe VERS LE HAUT  (axe X local = direction monde UP)
 *   - cou     : rotation=0   → continue dans même sens que corps (UP)
 *   - tête    : rotation=0   → continue vers le haut
 *   - epaule_g: rotation=-90 → dans l'espace du corps (local X=UP), -90° = monde GAUCHE ✓
 *   - epaule_d: rotation=+90 → dans l'espace du corps, +90° = monde DROITE ✓
 *   - avant-bras: rotation=0 → continue dans le même sens que l'épaule
 *
 * Résultat visuel (T-pose) :
 *        O ← head tip
 *        |  30px
 *        O ← neck tip
 *        |  20px
 *   O----O----O ← shoulder level (corps tip)
 *   45px | 45px
 *   O    |    O ← forearm tips
 *        |  70px
 *        O ← hips (rig origin, canvas center)
 */
const SIMPLE_CHARACTER_BONES: RigTemplateNode[] = [
  // Torse — racine, pointe vers le HAUT
  {
    key: 'corps',
    name: 'Corps',
    parentKey: null,
    localX: 0,
    localY: 0,
    length: 70,
    rotation: -90,
    color: '#6366f1',
  },
  // Cou — à la pointe du torse, continue vers le haut
  {
    key: 'cou',
    name: 'Cou',
    parentKey: 'corps',
    localX: 0,
    localY: 0,
    length: 20,
    rotation: 0,
    color: '#8b5cf6',
  },
  // Tête — au bout du cou, continue vers le haut
  {
    key: 'tete',
    name: 'Tête',
    parentKey: 'cou',
    localX: 0,
    localY: 0,
    length: 30,
    rotation: 0,
    color: '#a78bfa',
  },
  // Épaule gauche — à la pointe du torse, rotation=-90 → monde GAUCHE
  {
    key: 'epaule_g',
    name: 'Épaule G',
    parentKey: 'corps',
    localX: 0,
    localY: 0,
    length: 45,
    rotation: -90,
    color: '#10b981',
  },
  // Avant-bras gauche — continue à gauche
  {
    key: 'avant_bras_g',
    name: 'Av. bras G',
    parentKey: 'epaule_g',
    localX: 0,
    localY: 0,
    length: 40,
    rotation: 0,
    color: '#34d399',
  },
  // Épaule droite — à la pointe du torse, rotation=+90 → monde DROITE
  {
    key: 'epaule_d',
    name: 'Épaule D',
    parentKey: 'corps',
    localX: 0,
    localY: 0,
    length: 45,
    rotation: 90,
    color: '#f59e0b',
  },
  // Avant-bras droit — continue à droite
  {
    key: 'avant_bras_d',
    name: 'Av. bras D',
    parentKey: 'epaule_d',
    localX: 0,
    localY: 0,
    length: 40,
    rotation: 0,
    color: '#fbbf24',
  },
  // Jambes — os racines indépendants positionnés aux hanches (rig origin).
  // rotation=90 (Konva clockwise, Y bas) = pointer vers le BAS.
  // localX ±20 = écart horizontal gauche/droite depuis le centre des hanches.
  {
    key: 'cuisse_g',
    name: 'Cuisse G',
    parentKey: null,
    localX: -20,
    localY: 0,
    length: 55,
    rotation: 90,
    color: '#6366f1',
  },
  {
    key: 'jambe_g',
    name: 'Jambe G',
    parentKey: 'cuisse_g',
    localX: 0,
    localY: 0,
    length: 50,
    rotation: 0,
    color: '#818cf8',
  },
  {
    key: 'cuisse_d',
    name: 'Cuisse D',
    parentKey: null,
    localX: 20,
    localY: 0,
    length: 55,
    rotation: 90,
    color: '#6366f1',
  },
  {
    key: 'jambe_d',
    name: 'Jambe D',
    parentKey: 'cuisse_d',
    localX: 0,
    localY: 0,
    length: 50,
    rotation: 0,
    color: '#818cf8',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Template "Grand héros" — proportions allongées (adulte / héros)
// Même hiérarchie que SIMPLE_CHARACTER_BONES, dimensions agrandies.
// ─────────────────────────────────────────────────────────────────────────────
const TALL_CHARACTER_BONES: RigTemplateNode[] = [
  {
    key: 'corps',
    name: 'Corps',
    parentKey: null,
    localX: 0,
    localY: 0,
    length: 90,
    rotation: -90,
    color: '#3b82f6',
  },
  {
    key: 'cou',
    name: 'Cou',
    parentKey: 'corps',
    localX: 0,
    localY: 0,
    length: 25,
    rotation: 0,
    color: '#60a5fa',
  },
  {
    key: 'tete',
    name: 'Tête',
    parentKey: 'cou',
    localX: 0,
    localY: 0,
    length: 35,
    rotation: 0,
    color: '#93c5fd',
  },
  {
    key: 'epaule_g',
    name: 'Épaule G',
    parentKey: 'corps',
    localX: 0,
    localY: 0,
    length: 55,
    rotation: -90,
    color: '#10b981',
  },
  {
    key: 'avant_bras_g',
    name: 'Av. bras G',
    parentKey: 'epaule_g',
    localX: 0,
    localY: 0,
    length: 50,
    rotation: 0,
    color: '#34d399',
  },
  {
    key: 'epaule_d',
    name: 'Épaule D',
    parentKey: 'corps',
    localX: 0,
    localY: 0,
    length: 55,
    rotation: 90,
    color: '#f59e0b',
  },
  {
    key: 'avant_bras_d',
    name: 'Av. bras D',
    parentKey: 'epaule_d',
    localX: 0,
    localY: 0,
    length: 50,
    rotation: 0,
    color: '#fbbf24',
  },
  // Jambes — plus longues que Personnage simple (proportions grand héros)
  {
    key: 'cuisse_g',
    name: 'Cuisse G',
    parentKey: null,
    localX: -22,
    localY: 0,
    length: 65,
    rotation: 90,
    color: '#3b82f6',
  },
  {
    key: 'jambe_g',
    name: 'Jambe G',
    parentKey: 'cuisse_g',
    localX: 0,
    localY: 0,
    length: 60,
    rotation: 0,
    color: '#60a5fa',
  },
  {
    key: 'cuisse_d',
    name: 'Cuisse D',
    parentKey: null,
    localX: 22,
    localY: 0,
    length: 65,
    rotation: 90,
    color: '#3b82f6',
  },
  {
    key: 'jambe_d',
    name: 'Jambe D',
    parentKey: 'cuisse_d',
    localX: 0,
    localY: 0,
    length: 60,
    rotation: 0,
    color: '#60a5fa',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Template "Robot" — trapu, cou très court, pinces à la place des mains
// ─────────────────────────────────────────────────────────────────────────────
const ROBOT_BONES: RigTemplateNode[] = [
  {
    key: 'corps',
    name: 'Torse',
    parentKey: null,
    localX: 0,
    localY: 0,
    length: 55,
    rotation: -90,
    color: '#64748b',
  },
  {
    key: 'cou',
    name: 'Cou',
    parentKey: 'corps',
    localX: 0,
    localY: 0,
    length: 10,
    rotation: 0,
    color: '#94a3b8',
  },
  {
    key: 'tete',
    name: 'Tête',
    parentKey: 'cou',
    localX: 0,
    localY: 0,
    length: 28,
    rotation: 0,
    color: '#cbd5e1',
  },
  {
    key: 'bras_g',
    name: 'Bras G',
    parentKey: 'corps',
    localX: 0,
    localY: 0,
    length: 38,
    rotation: -90,
    color: '#475569',
  },
  {
    key: 'pince_g',
    name: 'Pince G',
    parentKey: 'bras_g',
    localX: 0,
    localY: 0,
    length: 30,
    rotation: 0,
    color: '#64748b',
  },
  {
    key: 'bras_d',
    name: 'Bras D',
    parentKey: 'corps',
    localX: 0,
    localY: 0,
    length: 38,
    rotation: 90,
    color: '#475569',
  },
  {
    key: 'pince_d',
    name: 'Pince D',
    parentKey: 'bras_d',
    localX: 0,
    localY: 0,
    length: 30,
    rotation: 0,
    color: '#64748b',
  },
  // Jambes — courtes et trapues (style robot)
  {
    key: 'jambe_g',
    name: 'Jambe G',
    parentKey: null,
    localX: -18,
    localY: 0,
    length: 40,
    rotation: 90,
    color: '#64748b',
  },
  {
    key: 'pied_g',
    name: 'Pied G',
    parentKey: 'jambe_g',
    localX: 0,
    localY: 0,
    length: 22,
    rotation: 0,
    color: '#94a3b8',
  },
  {
    key: 'jambe_d',
    name: 'Jambe D',
    parentKey: null,
    localX: 18,
    localY: 0,
    length: 40,
    rotation: 90,
    color: '#64748b',
  },
  {
    key: 'pied_d',
    name: 'Pied D',
    parentKey: 'jambe_d',
    localX: 0,
    localY: 0,
    length: 22,
    rotation: 0,
    color: '#94a3b8',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Template "Créature" — long cou, grandes pattes avec griffes légèrement ouvertes
// rotation ±20° sur les griffes pour simuler une posture d'attaque naturelle.
// ─────────────────────────────────────────────────────────────────────────────
const CREATURE_BONES: RigTemplateNode[] = [
  {
    key: 'corps',
    name: 'Corps',
    parentKey: null,
    localX: 0,
    localY: 0,
    length: 60,
    rotation: -90,
    color: '#7c3aed',
  },
  {
    key: 'cou',
    name: 'Cou',
    parentKey: 'corps',
    localX: 0,
    localY: 0,
    length: 35,
    rotation: 0,
    color: '#8b5cf6',
  },
  {
    key: 'tete',
    name: 'Tête',
    parentKey: 'cou',
    localX: 0,
    localY: 0,
    length: 28,
    rotation: 0,
    color: '#a78bfa',
  },
  {
    key: 'patte_g',
    name: 'Patte G',
    parentKey: 'corps',
    localX: 0,
    localY: 0,
    length: 62,
    rotation: -90,
    color: '#059669',
  },
  {
    key: 'griffe_g',
    name: 'Griffe G',
    parentKey: 'patte_g',
    localX: 0,
    localY: 0,
    length: 48,
    rotation: 20,
    color: '#10b981',
  },
  {
    key: 'patte_d',
    name: 'Patte D',
    parentKey: 'corps',
    localX: 0,
    localY: 0,
    length: 62,
    rotation: 90,
    color: '#059669',
  },
  {
    key: 'griffe_d',
    name: 'Griffe D',
    parentKey: 'patte_d',
    localX: 0,
    localY: 0,
    length: 48,
    rotation: -20,
    color: '#10b981',
  },
  // Pattes arrière — os racines aux hanches, plus courtes que les pattes avant
  {
    key: 'patte_arr_g',
    name: 'Patte arr. G',
    parentKey: null,
    localX: -18,
    localY: 0,
    length: 52,
    rotation: 90,
    color: '#7c3aed',
  },
  {
    key: 'griffe_arr_g',
    name: 'Griffe arr. G',
    parentKey: 'patte_arr_g',
    localX: 0,
    localY: 0,
    length: 40,
    rotation: 15,
    color: '#8b5cf6',
  },
  {
    key: 'patte_arr_d',
    name: 'Patte arr. D',
    parentKey: null,
    localX: 18,
    localY: 0,
    length: 52,
    rotation: 90,
    color: '#7c3aed',
  },
  {
    key: 'griffe_arr_d',
    name: 'Griffe arr. D',
    parentKey: 'patte_arr_d',
    localX: 0,
    localY: 0,
    length: 40,
    rotation: -15,
    color: '#8b5cf6',
  },
];

export const RIG_TEMPLATES: RigTemplate[] = [
  {
    id: 'personnage-simple',
    name: 'Personnage simple',
    emoji: '🧍',
    description: '11 os déjà connectés — bras et jambes prêts !',
    bones: SIMPLE_CHARACTER_BONES,
  },
  {
    id: 'personnage-grand',
    name: 'Grand héros',
    emoji: '🦸',
    description: '11 os grands — bras longs et jambes solides !',
    bones: TALL_CHARACTER_BONES,
  },
  {
    id: 'robot',
    name: 'Robot',
    emoji: '🤖',
    description: '11 os mécaniques — pinces et jambes trapues !',
    bones: ROBOT_BONES,
  },
  {
    id: 'creature',
    name: 'Créature',
    emoji: '👾',
    description: '11 os — 4 pattes griffues avant et arrière !',
    bones: CREATURE_BONES,
  },
];
