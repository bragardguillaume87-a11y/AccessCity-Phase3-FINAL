// ============================================================
// ROADMAP DATA — AccessCity Studio Dev Dashboard
// Source de vérité pour les features et feature flags.
// Éditable via le Dev Dashboard (Ctrl+Shift+D en dev).
// ============================================================

export type FeatureStatus = 'done' | 'in-progress' | 'backlog' | 'broken';

export type FeatureCategory =
  | 'Visuel'
  | 'Audio'
  | 'UX'
  | 'Narratif'
  | 'Moteur'
  | 'Export'
  | 'Infrastructure';

export interface RoadmapItem {
  id: string;
  title: string;
  description?: string;
  category: FeatureCategory;
  status: FeatureStatus;
  /** Clé du feature flag associé (si toggleable en live) */
  flagKey?: string;
  notes?: string;
  /** Format 'YYYY-MM' */
  since?: string;
  priority?: 'P0' | 'P1' | 'P2' | 'P3';
}

export interface FeatureFlag {
  key: string;
  label: string;
  description?: string;
  enabled: boolean;
  category: FeatureCategory;
}

// ============================================================
// DONNÉES INITIALES — pré-remplies depuis git log + nintendo-ux.md §16
// ============================================================

export const DEFAULT_ROADMAP_ITEMS: RoadmapItem[] = [
  // ── LIVRÉ ────────────────────────────────────────────────
  {
    id: 'visual-filters',
    title: 'Filtres post-processing',
    description:
      'CRT, scanlines, grain de film, dithering — appliqués sur le rendu de prévisualisation.',
    category: 'Visuel',
    status: 'done',
    flagKey: 'visual-filters',
    since: '2026-03',
  },
  {
    id: 'bg-removal',
    title: 'Suppression de fond',
    description:
      'Mode IA (baguette magique) + mode manuel (pinceau direct). Résultat exportable en PNG transparent.',
    category: 'Visuel',
    status: 'done',
    flagKey: 'bg-removal',
    since: '2026-03',
  },
  {
    id: 'narrator-octopath',
    title: 'Style Narrateur Octopath Traveler',
    description:
      "Boîte navy+gold, serif Crimson Pro, ornements ✦. S'applique sur les dialogues sans speaker.",
    category: 'Narratif',
    status: 'done',
    flagKey: 'narrator-octopath',
    since: '2026-03',
  },
  {
    id: 'brush-preview',
    title: 'Brush preview temps réel',
    description: 'Layout 2 colonnes — aperçu du résultat du pinceau en direct côté droit.',
    category: 'UX',
    status: 'done',
    flagKey: 'brush-preview',
    since: '2026-03',
  },
  {
    id: 'dialogue-panel-refacto',
    title: 'Panneau Dialogue refacto',
    description:
      "Humeurs déplacées après Personnage (principe Gestalt — dépendance contextuelle). Validé par 4 sources (Articy, TyranoBuilder, Ren'Py, VNMaker).",
    category: 'UX',
    status: 'done',
    since: '2026-03',
  },
  {
    id: 'panel-rename-style',
    title: 'Renommage panneau "Texte" → "Style"',
    description:
      '"Style" porte la sémantique "global + réutilisable" (Figma, Gutenberg). Sous-titre "Tous les dialogues du projet" ajouté.',
    category: 'UX',
    status: 'done',
    since: '2026-03',
  },
  {
    id: 'textsection-6sections',
    title: 'TextSection réduite 8→6 sections',
    description:
      'Réduit de 8 à 6 PanelSection de premier niveau. Seuil W3C WAI (5–6) respecté. Au-delà → tabs.',
    category: 'UX',
    status: 'done',
    since: '2026-03',
  },

  // ── EN COURS ─────────────────────────────────────────────
  {
    id: 'style-panel-ergonomie',
    title: 'Style panel ergonomie',
    description:
      'Branche feat/style-panel-ergonomie — audit UX approfondi des panneaux Dialogue et Style.',
    category: 'UX',
    status: 'in-progress',
    since: '2026-03',
  },
  {
    id: 'dev-dashboard',
    title: 'Dev Dashboard + Feature Flags',
    description:
      'Modal pleine largeur avec kanban roadmap, feature flags live (Zustand persist), stats.',
    category: 'Infrastructure',
    status: 'in-progress',
    flagKey: 'dev-dashboard',
    since: '2026-03',
  },

  // ── BACKLOG ───────────────────────────────────────────────
  {
    id: 'live-preview-keystroke',
    title: 'Live preview keystroke → VN textbox',
    description:
      'Chaque frappe dans le champ texte met à jour la VN Textbox instantanément. Bret Victor §7.1.',
    category: 'UX',
    status: 'backlog',
    priority: 'P0',
  },
  {
    id: 'undo-redo-affordance',
    title: 'Undo/redo affordance visible',
    description:
      'Ctrl+Z doit être une affordance de premier ordre (toolbar visible, pas juste raccourci). Sid Meier §10.3.',
    category: 'UX',
    status: 'backlog',
    priority: 'P0',
  },
  {
    id: 'saved-state-indicator',
    title: 'Système état sauvegardé/modifié visible',
    description:
      'Header permanent montrant scène active / dialogue actif / état (modifié / sauvegardé / erreur). Don Norman §9.4.',
    category: 'UX',
    status: 'backlog',
    priority: 'P1',
  },
  {
    id: 'hsl-avatar-colors',
    title: 'Couleurs déterministes HSL depuis hash ID',
    description:
      "Avatars par défaut (initiales) avec couleur unique et stable via hash de l'ID. Inigo Quilez §14.1.",
    category: 'Visuel',
    status: 'backlog',
    priority: 'P1',
  },
  {
    id: 'dialogue-length-warning',
    title: 'Alerte douce dialogues > 80 mots',
    description: 'Soft warning (pas erreur) + temps de lecture estimé. Amy Hennig §11.3.',
    category: 'Narratif',
    status: 'backlog',
    priority: 'P1',
  },
  {
    id: 'jump-to-node',
    title: 'Jump-to-node dans le graphe (Ctrl+G)',
    description:
      'Barre de recherche dans @xyflow pour naviguer directement à un dialogue par texte ou ID. Amy Hennig §11.4.',
    category: 'UX',
    status: 'backlog',
    priority: 'P2',
  },
  {
    id: 'pre-filter-render',
    title: 'Pré-filtrage données hors du render',
    description:
      'Utiliser useMemo pour filtrer les données avant .map() dans les listes. Carmack §12.2.',
    category: 'Infrastructure',
    status: 'backlog',
    priority: 'P2',
  },
  {
    id: 'effect-row-compression',
    title: 'Semantic compression EffectRow/ConditionRow',
    description: 'Abstraire après identification du 3e use-case identique. Muratori §13.1.',
    category: 'Infrastructure',
    status: 'backlog',
    priority: 'P2',
  },
];

export const DEFAULT_FEATURE_FLAGS: FeatureFlag[] = [
  {
    key: 'visual-filters',
    label: 'Filtres post-processing',
    description: 'CRT, scanlines, grain, dithering dans la prévisualisation',
    enabled: true,
    category: 'Visuel',
  },
  {
    key: 'bg-removal',
    label: 'Suppression de fond',
    description: 'Outil baguette magique + pinceau manuel pour retirer les fonds',
    enabled: true,
    category: 'Visuel',
  },
  {
    key: 'narrator-octopath',
    label: 'Style Narrateur Octopath',
    description: 'Boîte navy+gold sur les dialogues sans speaker',
    enabled: true,
    category: 'Narratif',
  },
  {
    key: 'brush-preview',
    label: 'Brush preview temps réel',
    description: "Aperçu live en 2 colonnes dans l'outil pinceau",
    enabled: true,
    category: 'UX',
  },
  {
    key: 'dev-dashboard',
    label: 'Dev Dashboard',
    description: 'Ce dashboard — toujours actif en mode dev',
    enabled: true,
    category: 'Infrastructure',
  },
];
