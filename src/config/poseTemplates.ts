/**
 * Templates de poses de base pour le module Distribution.
 *
 * boneRotations : indexé par bone.name (valeur exacte de bone.name dans le rig).
 * La résolution nom → id se fait à l'application (voir DistributionModule.handleApplyPoseTemplate).
 *
 * Valeurs = rotation LOCALE absolue en degrés (Konva, sens horaire, Y vers le bas).
 * Conçu pour "Personnage simple" / "Grand héros". Les autres templates héritent
 * des os dont les noms coïncident.
 *
 * Noms de bones par template :
 *   personnage-simple / personnage-grand :
 *     Corps, Cou, Tête, Épaule G, Av. bras G, Épaule D, Av. bras D,
 *     Cuisse G, Jambe G, Cuisse D, Jambe D
 *   robot :
 *     Torse, Cou, Tête, Bras G, Pince G, Bras D, Pince D,
 *     Jambe G (racine), Pied G, Jambe D (racine), Pied D
 *   créature :
 *     Corps, Cou, Tête, Patte G, Griffe G, Patte D, Griffe D,
 *     Patte arr. G, Griffe arr. G, Patte arr. D, Griffe arr. D
 */

export interface PoseTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  /** Rotations locales absolues en degrés, indexées par bone.name */
  boneRotations: Record<string, number>;
}

/**
 * T-Pose — posture de référence, bras à l'horizontale.
 * Correspond aux rotations par défaut du template "Personnage simple".
 */
const T_POSE: PoseTemplate = {
  id: 'tpose',
  name: 'T-Pose',
  emoji: '🧍',
  description: "Posture de référence, bras à l'horizontale",
  boneRotations: {
    // Tronc supérieur — personnage-simple/grand + robot
    Corps: -90,
    Torse: -90,
    Cou: 0,
    Tête: 0,
    // Bras gauche
    'Épaule G': -90,
    'Bras G': -90,
    'Patte G': -90,
    'Av. bras G': 0,
    'Pince G': 0,
    'Griffe G': 20,
    // Bras droit
    'Épaule D': 90,
    'Bras D': 90,
    'Patte D': 90,
    'Av. bras D': 0,
    'Pince D': 0,
    'Griffe D': -20,
    // Jambes personnage-simple/grand
    'Cuisse G': 90,
    'Cuisse D': 90,
    'Jambe G': 0,
    'Jambe D': 0,
    // Pattes arrière créature
    'Patte arr. G': 90,
    'Patte arr. D': 90,
    'Griffe arr. G': 15,
    'Griffe arr. D': -15,
    // Pieds robot
    'Pied G': 0,
    'Pied D': 0,
  },
};

/**
 * Repos — posture détendue, bras légèrement baissés.
 * Idéale pour une idle breathing animation (P0 VN).
 */
const REPOS: PoseTemplate = {
  id: 'repos',
  name: 'Repos',
  emoji: '😌',
  description: 'Bras détendus, posture naturelle',
  boneRotations: {
    Corps: -90,
    Torse: -90,
    Cou: 0,
    Tête: 5,
    'Épaule G': -70,
    'Bras G': -70,
    'Patte G': -70,
    'Av. bras G': 15,
    'Pince G': 0,
    'Épaule D': 70,
    'Bras D': 70,
    'Patte D': 70,
    'Av. bras D': -15,
    'Pince D': 0,
    'Cuisse G': 90,
    'Cuisse D': 90,
    'Jambe G': 0,
    'Jambe D': 0,
    'Pied G': 0,
    'Pied D': 0,
  },
};

/**
 * Salut — bras droit levé, geste de bonjour ou d'interpellation.
 * Pose expressive fréquente dans les visual novels.
 */
const SALUT: PoseTemplate = {
  id: 'salut',
  name: 'Salut',
  emoji: '👋',
  description: 'Bras droit levé, geste de bienvenue',
  boneRotations: {
    Corps: -90,
    Torse: -90,
    Cou: 0,
    Tête: -10,
    'Épaule G': -70,
    'Bras G': -70,
    'Av. bras G': 15,
    'Pince G': 0,
    'Épaule D': 140,
    'Bras D': 140,
    'Av. bras D': 25,
    'Pince D': 0,
    'Cuisse G': 90,
    'Cuisse D': 90,
    'Jambe G': 0,
    'Jambe D': 0,
    'Pied G': 0,
    'Pied D': 0,
  },
};

/**
 * Victoire — bras levés, expression de joie ou de triomphe.
 * Corps légèrement penché en arrière, tête relevée.
 */
const VICTOIRE: PoseTemplate = {
  id: 'victoire',
  name: 'Victoire',
  emoji: '🙌',
  description: 'Bras levés, joie ou triomphe',
  boneRotations: {
    Corps: -85,
    Torse: -85,
    Cou: 0,
    Tête: -20,
    'Épaule G': -145,
    'Bras G': -145,
    'Patte G': -145,
    'Av. bras G': -20,
    'Pince G': 0,
    'Griffe G': -10,
    'Épaule D': 145,
    'Bras D': 145,
    'Patte D': 145,
    'Av. bras D': 20,
    'Pince D': 0,
    'Griffe D': 10,
    'Cuisse G': 92,
    'Cuisse D': 88,
    'Jambe G': 0,
    'Jambe D': 0,
    'Pied G': 0,
    'Pied D': 0,
  },
};

/**
 * Abattement — épaules tombantes, tête baissée.
 * Corps légèrement voûté — tristesse, défaite, fatigue.
 */
const ABATTEMENT: PoseTemplate = {
  id: 'abattement',
  name: 'Abattement',
  emoji: '😔',
  description: 'Tête baissée, épaules tombantes',
  boneRotations: {
    Corps: -80,
    Torse: -80,
    Cou: 20,
    Tête: 30,
    'Épaule G': -55,
    'Bras G': -55,
    'Patte G': -55,
    'Av. bras G': 20,
    'Pince G': 0,
    'Épaule D': 55,
    'Bras D': 55,
    'Patte D': 55,
    'Av. bras D': -20,
    'Pince D': 0,
    'Cuisse G': 90,
    'Cuisse D': 90,
    'Jambe G': 0,
    'Jambe D': 0,
    'Pied G': 0,
    'Pied D': 0,
  },
};

/**
 * Parler — geste d'un bras pendant le dialogue, corps légèrement tourné.
 * Pose dynamique idéale pour les séquences de conversation.
 */
const PARLER: PoseTemplate = {
  id: 'parler',
  name: 'Parler',
  emoji: '💬',
  description: 'Bras droit tendu, geste de conversation',
  boneRotations: {
    Corps: -88,
    Torse: -88,
    Cou: 0,
    Tête: 0,
    'Épaule G': -70,
    'Bras G': -70,
    'Av. bras G': 10,
    'Pince G': 0,
    'Épaule D': 110,
    'Bras D': 110,
    'Av. bras D': 35,
    'Pince D': 0,
    'Cuisse G': 90,
    'Cuisse D': 90,
    'Jambe G': 0,
    'Jambe D': 0,
    'Pied G': 0,
    'Pied D': 0,
  },
};

export const POSE_TEMPLATES: PoseTemplate[] = [T_POSE, REPOS, SALUT, VICTOIRE, ABATTEMENT, PARLER];
