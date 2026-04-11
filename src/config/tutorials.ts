/**
 * Définitions des parcours tutoriel du module Distribution.
 *
 * Chaque étape cible un élément DOM via `data-tutorial-id`.
 * Le SpotlightTutorial utilise ces IDs pour positionner son overlay.
 */

export interface TutorialStep {
  targetId: string;
  emoji: string;
  title: string;
  description: string;
  position: 'below' | 'above' | 'left' | 'right';
}

export interface TutorialDefinition {
  id: string;
  title: string;
  emoji: string;
  description: string;
  steps: TutorialStep[];
}

export const TUTORIAL_SQUELETTE: TutorialDefinition = {
  id: 'dist-squelette',
  title: 'Créer mon premier squelette',
  emoji: '🦴',
  description: 'Construis un squelette pour ton personnage, os par os.',
  steps: [
    {
      targetId: 'character-picker',
      emoji: '🧑',
      title: 'Choisis un personnage',
      description: 'Clique sur un personnage pour commencer à lui créer un squelette.',
      position: 'below',
    },
    {
      targetId: 'template-picker-button',
      emoji: '🧍',
      title: 'Utilise un modèle',
      description: 'Clique ici pour démarrer avec un personnage déjà assemblé en 7 os !',
      position: 'below',
    },
    {
      targetId: 'bone-list',
      emoji: '🎉',
      title: 'Voilà ton squelette !',
      description: 'Les 7 os sont créés et connectés. Tu peux les voir dans la liste.',
      position: 'left',
    },
    {
      targetId: 'tool-rotate',
      emoji: '🔄',
      title: 'Fais pivoter un os',
      description:
        'Clique sur "Faire tourner", puis fais glisser un os dans le canvas pour le bouger.',
      position: 'below',
    },
    {
      targetId: 'animation-tab',
      emoji: '🎬',
      title: 'Va dans Animation !',
      description:
        'Bravo, ton squelette est prêt ! Clique sur "Animation" pour capturer ta pose et créer ton premier clip.',
      position: 'below',
    },
  ],
};

export const TUTORIAL_ANIMATION: TutorialDefinition = {
  id: 'dist-animation',
  title: 'Animer mon personnage',
  emoji: '🎬',
  description: 'Fais bouger ton personnage en enchaînant des poses.',
  steps: [
    {
      targetId: 'character-picker',
      emoji: '🧑',
      title: 'Choisis un personnage',
      description: 'Sélectionne un personnage qui a déjà un squelette et des poses.',
      position: 'below',
    },
    {
      targetId: 'animation-tab',
      emoji: '🎬',
      title: 'Onglet Animation',
      description: "Clique sur cet onglet pour accéder à l'éditeur d'animation.",
      position: 'below',
    },
    {
      targetId: 'add-clip-button',
      emoji: '✨',
      title: 'Crée un clip',
      description: 'Clique sur "+ Clip" pour créer une nouvelle animation.',
      position: 'below',
    },
    {
      targetId: 'pose-capture-button',
      emoji: '📸',
      title: 'Capture et ajoute des poses',
      description:
        'Clique sur 📸 + pour capturer la pose du squelette. Capture-en au moins 2, puis ajoute-les à la séquence avec 📸 + Séq.',
      position: 'left',
    },
    {
      targetId: 'play-button',
      emoji: '▶️',
      title: "Lance l'animation !",
      description:
        "Quand tu as ≥ 2 poses dans la séquence, appuie sur Play pour voir ton personnage s'animer.",
      position: 'above',
    },
  ],
};

export const TUTORIALS: TutorialDefinition[] = [TUTORIAL_SQUELETTE, TUTORIAL_ANIMATION];

export function getTutorial(id: string): TutorialDefinition | undefined {
  return TUTORIALS.find((t) => t.id === id);
}

// ─────────────────────────────────────────────────────────────────────────────
// Défis créatifs — Meier §10.2 : montrer le but ET le hint avant de commencer.
// L'enfant voit l'objectif + le conseil avant de cliquer "Relever ce défi".
// Cliquer démarre le tutoriel dist-squelette (guide vers TemplatePicker + pose).
// ─────────────────────────────────────────────────────────────────────────────

export interface ChallengeDefinition {
  id: string;
  title: string;
  emoji: string;
  /** Conseil visible en permanence sur la card (pas en hover) — Norman §9.2 */
  hint: string;
  /** ID du template rig conseillé (RIG_TEMPLATES) */
  templateId: string;
  difficulty: 'facile' | 'moyen';
}

export const CHALLENGES: ChallengeDefinition[] = [
  {
    id: 'zombie-boite',
    title: 'Zombie qui boite',
    emoji: '🧟',
    hint: 'Utilise "Personnage simple". Incline le corps, mets un bras tendu devant et l\'autre baissé.',
    templateId: 'personnage-simple',
    difficulty: 'facile',
  },
  {
    id: 'robot-raide',
    title: 'Robot rigide',
    emoji: '🤖',
    hint: 'Démarre avec "Robot". Les robots bougent à 90° — garde tous les angles bien carrés !',
    templateId: 'robot',
    difficulty: 'facile',
  },
  {
    id: 'monstre-attaque',
    title: 'Monstre qui attaque',
    emoji: '👹',
    hint: 'Prends "Créature". Étire les pattes vers l\'avant et tourne les griffes pour attaquer.',
    templateId: 'creature',
    difficulty: 'moyen',
  },
];

export function getChallenge(id: string): ChallengeDefinition | undefined {
  return CHALLENGES.find((c) => c.id === id);
}
