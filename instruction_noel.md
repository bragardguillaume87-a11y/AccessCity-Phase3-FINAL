Je te fournis les spécifications complètes de refonte UI/UX d'AccessCity Studio
(éditeur de visual novels React+Vite).

Ces specs sont le résultat d'un conseil de 5 IA experts (Narrative Design, UX Systems,
Accessibility, Game Editor Patterns, DataViz) qui ont voté sur 15 recommandations.

Les 8 tâches prioritaires sont détaillées avec le code complet dans le document joint.

IMPORTANT :

- Analyse d'abord ma structure actuelle de projet AccessCity
- Identifie les fichiers existants (composants, hooks, styles)
- Adapte les imports et noms de variables à mon code existant
- NE touche PAS à la logique métier / state management
- Crée les nouveaux composants AVANT de modifier les anciens

Commence par la TÂCHE 1 uniquement : Design Tokens (tokens.css + Button.jsx).
Propose-moi le code adapté à ma structure. On testera avant de passer à la Tâche 2.

DOCUMENT COMPLET POUR CLAUDE CODE
✅ CE QUI A ÉTÉ PRODUIT (3 parties)
PARTIE 1/4 : Contexte & Analyse
✅ Contexte projet AccessCity

✅ Analyse état actuel
​

✅ Méthodologie conseil des 5 IA experts

✅ Résultats du vote (15 recommandations → top 8)

✅ Architecture cible avec wireframes

PARTIE 2/4 : Tâches 1-4 (Phase 1A - Fondations)
✅ Tâche 1 : Design Tokens complet (tokens.css) + Button.jsx + Button.css

✅ Tâche 2 : Architecture 4 zones (EditorShell, TopBar, Sidebar, MainCanvas, Inspector)

✅ Tâche 3 : Vue Graph Dialogue (DialogueGraph.jsx avec ReactFlow)

✅ Tâche 4 : Shortcuts clavier (useKeyboardShortcuts.js)

PARTIE 3/4 : Tâches 5-8 (Phase 1B - Polish)
✅ Tâche 5 : Affordances boutons (DangerButton avec confirmation)

✅ Tâche 6 : Structure ARIA complète (landmarks, headings, skip links)

✅ Tâche 7 : Indicateurs narratifs (Badge.jsx + utilisation)

✅ Tâche 8 : Undo/Redo toolbar visible

✅ Instructions pour Claude Code

🎯 INSTRUCTIONS FINALES POUR TOI
Option 1 : Donner tout en un seul fichier Markdown
Copie-colle toutes les 3 parties ci-dessus dans un fichier REFONTE_ACCESSCITY.md et attache-le à Claude Code dans VS Code avec ce message :

text
Voici les spécifications complètes pour refondre l'UI/UX d'AccessCity Studio.

Analyse d'abord la structure actuelle de mon projet, puis implémente les 8 tâches dans l'ordre (Phase 1A puis 1B).

Commence par la Tâche 1 (Design Tokens). Propose-moi le code à créer fichier par fichier.
Option 2 : Approche itérative (recommandée)
Plutôt que tout donner d'un coup, donne à Claude Code tâche par tâche :

Session 1 : "Crée les design tokens (tokens.css) et le composant Button selon ces specs [coller Tâche 1]"

Session 2 : "Refactore le layout en 4 zones selon ces specs [coller Tâche 2]"

Session 3 : "Intègre ReactFlow pour le dialogue graph [coller Tâche 3]"

etc.

📊 RÉCAPITULATIF FINAL
Ce que le conseil IA a décidé
​
Priorité Tâche Score Impact
🥇 Architecture 4 zones 47/50 Clarté structurelle, navigation
🥈 Design tokens cohérents 44/50 Cohérence visuelle, WCAG AA
🥉 Vue Graph dialogue 42/50 Compréhension narrative
4 Shortcuts clavier 41/50 Productivité
5 Affordances boutons 38/50 Usabilité
6 Structure ARIA 37/50 Accessibilité
7 Badges narratifs 37/50 Feedback visuel
8 Undo/Redo toolbar 36/50 Confiance utilisateur
Résultat attendu
Une interface AccessCity Studio transformée avec :
​

✅ 3 panneaux clairs (Sidebar 240px | Canvas flex | Inspector 320px)

✅ Dialogue Flow en vue graphique interactive (ReactFlow)

✅ Design system cohérent (tokens CSS, composants UI)

✅ Accessibilité WCAG 2.2 AA (ARIA, contraste, clavier)

✅ Shortcuts clavier pour productivité

✅ Feedback visuel renforcé (badges, animations, confirmations)

Dépendances à installer
bash
npm install @xyflow/react

CONTEXTE PROJET
1.1 AccessCity Studio
Mission : Éditeur de visual novels accessible (formation/sensibilisation handicap)

Stack technique : React + Vite, Tailwind CSS probable

URL développement : localhost:5173

Public cible : Créateurs/formateurs non-techniques, exigences accessibilité élevées (WCAG 2.2 AA)

1.2 Objectifs de la refonte
Clarifier l'architecture : Passer d'une interface "tout-en-un" confuse à une structure 3 panneaux explicite

Renforcer l'accessibilité : ARIA complet, contraste WCAG AA, navigation clavier optimale

Améliorer l'UX narrative : Vue graphique du dialogue flow (node-based) au lieu de liste linéaire

Standardiser le design : Design tokens, composants réutilisables, affordances claires

2. ANALYSE DE L'ÉTAT ACTUEL
   2.1 Structure observée (capture localhost:5173)
   text
   ┌────────────────────────────────────────────────────────────────┐
   │ TopBar: [← Retour] ACCESSCITY STUDIO - Editor │
   │ [⚙️Settings][👥Personnages][📦Assets][Export][Preview] │
   ├────────────────────────────────────────────────────────────────┤
   │ │
   │ Sidebar gauche (240px) Main Area (centre, flex) │
   │ ┌─────────────────────┐ ┌──────────────────────────────┐ │
   │ │ Scenes (2) │ │ Rencontre Mairie │ │
   │ │ + New Scene │ │ Premiere scene de test. │ │
   │ │ │ │ │ │
   │ │ ▶️ Rencontre Mairie │ │ [Scene Preview Area] │ │
   │ │ 3 dialogues │ │ No background set │ │
   │ │ │ │ [Set Background] (button) │ │
   │ │ ▶️ Suite de l'avent │ │ [Add Character to Scene] │ │
   │ │ 1 dialogue │ │ │ │
   │ │ │ │ Characters in scene: 0 │ │
   │ │ Characters (3) │ │ Dialogues: 3 │ │
   │ └─────────────────────┘ │ │ │
   │ │ 💬 Dialogue Flow │ │
   │ │ 1. narrator │ │
   │ │ Vous arrivez devant... │ │
   │ │ 2. counsellor │ │
   │ │ Bonjour ! Discutons... │ │
   │ │ 3. player │ │
   │ │ ... │ │
   │ │ CHOICES: │ │
   │ │ • Bonjour, motivé ! │ │
   │ │ • Pas beaucoup de temps │ │
   │ └──────────────────────────────┘ │
   │ │
   │ [SCENE PROPERTIES panel sur droite, 320px, caché dans scroll]│
   │ Contient: Title, Description, Background URL, Statistics │
   └────────────────────────────────────────────────────────────────┘
   2.2 Problèmes identifiés (8 critiques)

# Problème Impact UX Impact A11y Priorité

1 Pas de séparation visuelle claire entre zones Navigation mentale confuse, impossible de scanner rapidement Landmarks ARIA absents, navigation screen reader difficile 🔴 Critique
2 Dialogue Flow = liste linéaire Structure narrative invisible (branches, dead ends, boucles) Relations entre dialogues non exposées sémantiquement 🔴 Critique
3 Hiérarchie typographique faible Tous titres semblent égaux, pas de priorité visuelle Headings H1-H6 probablement non hiérarchisés 🟡 Important
4 Actions peu visibles "Set Background", "Add Character", "Delete scene" noyés dans texte Boutons sans labels explicites, affordances faibles 🟡 Important
5 Statut sauvegarde confus "3 Not saved yet" ambigu, notification non persistante Live region manquante, feedback inaccessible 🟡 Important
6 Pas de shortcuts clavier Productivité limitée, actions répétitives fastidieuses Navigation clavier incomplète, power users frustrés 🟠 Moyen
7 Contraste insuffisant Texte gris sur fond sombre difficile à lire WCAG AA non respecté (ratio < 4.5:1) 🔴 Critique
8 Properties panel mal intégré Scroll, perte de contexte, zone flottante Zone non annoncée, rôle ARIA manquant 🟡 Important 3. MÉTHODOLOGIE : CONSEIL DES IA
3.1 Profils des 5 experts IA consultés
IA Narrative Design

Spécialité : Visual Novels, interactive storytelling

Référence : PageOn.ai, ChatGPT for Visual Novels

Focus : Structure narrative, flow dialogue, player agency

IA UX/UI Systems

Spécialité : Design systems, éditeurs web complexes

Référence : Cieden Design, Superside

Focus : Architecture layout, composants, design tokens

IA Accessibility

Spécialité : WCAG 2.2 AA, ARIA, inclusive design

Référence : Standards APF France Handicap

Focus : Navigation clavier, screen readers, contraste

IA Game Editor Patterns

Spécialité : Unity/Unreal UI patterns, workflow optimization

Référence : Unity Editor, Godot UI

Focus : Productivité, shortcuts, undo/redo, context menus

IA Data Visualization

Spécialité : Graph visualization, narrative flow

Référence : D3.js, Twine, Arcweave

Focus : Représentation visuelle dialogues, détection problèmes

3.2 Processus de vote
Chaque expert a évalué 15 recommandations selon 3 critères (échelle 0-10) :

Impact UX : Amélioration expérience utilisateur

Faisabilité technique : Complexité d'implémentation (10 = facile)

Alignement mission : Pertinence pour AccessCity/accessibilité

Score final = Moyenne des 5 votes (max 50 points)

4. RÉSULTATS DU VOTE
   4.1 Tableau complet des recommandations (15 total)
   Rang Recommandation Narrative UX Sys A11y Game Ed DataViz TOTAL Phase
   🥇 1 Architecture 4 zones claires 10 10 9 10 8 47/50 1A
   🥈 2 Design tokens cohérents 8 10 10 9 7 44/50 1A
   🥉 3 Vue Graph dialogue (node-based) 10 8 6 9 9 42/50 1A
   4 Shortcuts clavier essentiels 8 9 9 10 5 41/50 1A
   5 Affordances boutons renforcées 7 9 8 8 6 38/50 1B
   6 Structure ARIA complète 7 9 10 6 5 37/50 1B
   7 Indicateurs narratifs (badges) 9 7 5 7 9 37/50 1B
   8 Undo/Redo toolbar visible 6 8 7 10 5 36/50 1B
   9 Preview contextuel nœuds 9 7 5 8 6 35/50 2
   10 Live regions + feedback 6 8 10 7 4 35/50 1B*
   11 Focus management complet 5 7 10 7 3 32/50 2
   12 Context menu right-click 7 8 6 9 5 35/50 2
   13 Dashboard projet (vue globale) 8 6 4 7 10 35/50 2
   14 Contraste WCAG AA 5 7 10 6 4 32/50 1B*
   15 Mini-map dialogue flow 7 6 3 6 10 32/50 2
   Légende :

Phase 1A : Fondations critiques (tâches 1-4)

Phase 1B : Polish essentiel (tâches 5-8)

Phase 2 : Améliorations futures (hors scope actuel)

1B\* : Intégré dans d'autres tâches (Contraste → Design tokens, Live regions → Affordances)

4.2 Consensus : Top 8 priorités retenues
text
PHASE 1A - FONDATIONS
├─ Tâche 1: Design Tokens + Composants UI base (44/50)
├─ Tâche 2: Architecture 4 zones (47/50)
├─ Tâche 3: Vue Graph dialogue ReactFlow (42/50)
└─ Tâche 4: Shortcuts clavier (41/50)

PHASE 1B - POLISH
├─ Tâche 5: Affordances boutons (38/50)
├─ Tâche 6: Structure ARIA (37/50)
├─ Tâche 7: Indicateurs narratifs badges (37/50)
└─ Tâche 8: Undo/Redo toolbar (36/50) 5. ARCHITECTURE CIBLE
5.1 Layout final (wireframe)
text
┌──────────────────────────────────────────────────────────────────┐
│ TopBar (60px height, fixed, z-index: 1200) │
│ [AccessCity Studio] [💾 Saved ✓] [⚙️][📤Export][🎮Preview] │
├───────────────┬──────────────────────────┬───────────────────────┤
│ Sidebar │ Main Canvas │ Inspector │
│ (240px fixed) │ (flex: 1, min 400px) │ (320px, collapsible) │
│ │ │ │
│ 📂 SCENES │ [👁️ Visual | 🕸️ Graph] │ SCENE PROPERTIES │
│ + New Scene │ │ ┌───────────────────┐ │
│ • Scene 1 │ ┌────────────────────┐ │ │ Title │ │
│ 3 💬 │ │ │ │ │ [Input] │ │
│ • Scene 2 │ │ Scene Preview │ │ │ │ │
│ 1 💬 │ │ OR │ │ │ Description │ │
│ │ │ Dialogue Graph │ │ │ [Textarea] │ │
│ 👥 CHARACTERS │ │ (ReactFlow) │ │ │ │ │
│ + New Char │ │ │ │ │ Background │ │
│ • Narrator │ │ │ │ │ [Input + Browse] │ │
│ • Player │ └────────────────────┘ │ └───────────────────┘ │
│ • Counsellor │ │ │
│ │ [+ Add Dialogue Node] │ STATISTICS │
│ ⚙️ SETTINGS │ │ • Dialogues: 3 │
│ 📦 ASSETS │ │ • Characters: 2 │
│ │ │ • Est. duration: 2min │
│ │ │ │
│ │ │ ACTIONS │
│ │ │ [🗑️ Delete Scene] │
└───────────────┴──────────────────────────┴───────────────────────┘
5.2 Landmarks ARIA (structure sémantique)
xml

<div className="editor-shell">
  <header role="banner" aria-label="Application header">
    <TopBar />
  </header>
  
  <div className="editor-body">
    <nav role="navigation" aria-label="Project navigation">
      <Sidebar />
    </nav>
    
    <main role="main" aria-label="Scene editor">
      <MainCanvas />
    </main>
    
    <aside role="complementary" aria-label="Scene properties and actions">
      <Inspector />
    </aside>
  </div>
</div>
5.3 Hiérarchie des headings
text
H1: "AccessCity Studio" (TopBar, visually hidden ou petit)
  H2: "Scenes" (Sidebar)
    H3: "Scene 1: Rencontre Mairie" (item)
  H2: "Characters" (Sidebar)
    H3: "Narrator" (item)

📘 REFONTE UI/UX ACCESSCITY - PARTIE 2/4
Les 8 Tâches Prioritaires (Spécifications complètes) 6. CONTRAINTES DE MIGRATION
6.1 ❌ NE PAS TOUCHER (sauf instruction explicite)
❌ Logique métier : State management, Context, hooks métier existants

❌ Structure de données : Format JSON scenes/dialogues/characters

❌ API calls : Fonctions de sauvegarde, export, preview (logique uniquement)

❌ Routes : Navigation entre pages/vues

❌ Fonctionnalités existantes : Ne pas casser save/export/preview

6.2 ✅ RÈGLES DE MIGRATION
Créer d'abord, supprimer ensuite : Nouveaux composants avant de toucher aux anciens

Feature flag : const USE_NEW_LAYOUT = true; pour basculer facilement

Tests progressifs : Tester chaque tâche individuellement

Garder l'ancien code commenté : Pendant 1-2 commits minimum

Documenter les changements : Commentaires dans le code

6.3 Conventions de nommage
text
src/
├── components/
│ ├── ui/ ← Composants génériques réutilisables
│ │ ├── Button.jsx
│ │ ├── Input.jsx
│ │ └── Card.jsx
│ ├── layout/ ← Composants de structure
│ │ ├── TopBar.jsx
│ │ ├── Sidebar.jsx
│ │ └── Inspector.jsx
│ └── features/ ← Composants métier
│ ├── SceneEditor.jsx
│ └── DialogueGraph.jsx
├── hooks/
│ └── useKeyboardShortcuts.js
└── styles/
├── tokens.css ← Variables globales
└── globals.css ← Styles de base 7. PHASE 1A : FONDATIONS (4 tâches critiques)
TÂCHE 1 : Design Tokens + Composants UI de base
Score consensus : 44/50
Priorité : 🔴 CRITIQUE

Objectif
Créer la fondation visuelle cohérente pour toute l'application : variables CSS, composants standardisés.

Fichiers à créer
text
src/styles/tokens.css ← NOUVEAU
src/styles/globals.css ← METTRE À JOUR
src/components/ui/Button.jsx ← NOUVEAU
src/components/ui/Button.css ← NOUVEAU
src/components/ui/Input.jsx ← NOUVEAU
src/components/ui/Card.jsx ← NOUVEAU
src/components/ui/Badge.jsx ← NOUVEAU
Code complet : tokens.css
css
/_ src/styles/tokens.css _/
:root {
/_ ========== COLORS ========== _/

/_ Brand _/
--color-primary: #3B82F6; /_ Blue 500 _/
--color-primary-hover: #2563EB; /_ Blue 600 _/
--color-primary-active: #1D4ED8; /_ Blue 700 _/

/_ Semantic _/
--color-success: #10B981; /_ Green 500 _/
--color-success-hover: #059669;
--color-warning: #F59E0B; /_ Amber 500 _/
--color-warning-hover: #D97706;
--color-danger: #EF4444; /_ Red 500 _/
--color-danger-hover: #DC2626;
--color-info: #06B6D4; /_ Cyan 500 _/

/_ Backgrounds - Dark theme (WCAG AA compliant) _/
--color-bg-base: #0F172A; /_ Slate 900 - Base canvas _/
--color-bg-elevated: #1E293B; /_ Slate 800 - Cards, panels _/
--color-bg-hover: #334155; /_ Slate 700 - Hover states _/
--color-bg-active: #475569; /_ Slate 600 - Active/selected _/
--color-bg-overlay: rgba(15, 23, 42, 0.95); /_ Modals backdrop _/

/_ Text - Contrast ratios WCAG AA on dark bg _/
--color-text-primary: #F1F5F9; /_ Slate 100 - 14:1 ratio ✓ _/
--color-text-secondary: #CBD5E1; /_ Slate 300 - 7:1 ratio ✓ _/
--color-text-muted: #94A3B8; /_ Slate 400 - 4.5:1 ratio ✓ _/
--color-text-disabled: #64748B; /_ Slate 500 - 3:1 ratio _/

/_ Borders _/
--color-border-base: #334155; /_ Slate 700 _/
--color-border-hover: #475569; /_ Slate 600 _/
--color-border-focus: #3B82F6; /_ Blue 500 (focus ring) _/
--color-border-error: #EF4444;

/_ ========== TYPOGRAPHY ========== _/

--font-family-base: 'Inter', system-ui, -apple-system, BlinkMacSystemFont,
'Segoe UI', sans-serif;
--font-family-mono: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;

/_ Font sizes (base 16px) _/
--font-size-xs: 0.75rem; /_ 12px _/
--font-size-sm: 0.875rem; /_ 14px _/
--font-size-base: 1rem; /_ 16px _/
--font-size-lg: 1.125rem; /_ 18px _/
--font-size-xl: 1.25rem; /_ 20px _/
--font-size-2xl: 1.5rem; /_ 24px _/
--font-size-3xl: 2rem; /_ 32px _/

/_ Font weights _/
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

/_ Line heights _/
--line-height-tight: 1.25;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;

/_ ========== SPACING (base 4px) ========== _/

--space-0: 0;
--space-1: 0.25rem; /_ 4px _/
--space-2: 0.5rem; /_ 8px _/
--space-3: 0.75rem; /_ 12px _/
--space-4: 1rem; /_ 16px _/
--space-5: 1.25rem; /_ 20px _/
--space-6: 1.5rem; /_ 24px _/
--space-8: 2rem; /_ 32px _/
--space-10: 2.5rem; /_ 40px _/
--space-12: 3rem; /_ 48px _/
--space-16: 4rem; /_ 64px _/

/_ ========== BORDERS & RADIUS ========== _/

--border-width-thin: 1px;
--border-width-base: 2px;
--border-width-thick: 4px;

--radius-none: 0;
--radius-sm: 0.25rem; /_ 4px _/
--radius-md: 0.5rem; /_ 8px _/
--radius-lg: 0.75rem; /_ 12px _/
--radius-xl: 1rem; /_ 16px _/
--radius-full: 9999px;

/_ ========== SHADOWS ========== _/

--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
0 2px 4px -2px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
0 4px 6px -4px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
0 8px 10px -6px rgba(0, 0, 0, 0.1);
--shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);

/_ Focus ring _/
--shadow-focus: 0 0 0 3px var(--color-border-focus);

/_ ========== TRANSITIONS ========== _/

--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);

/_ ========== Z-INDEX ========== _/

--z-base: 0;
--z-dropdown: 1000;
--z-sticky: 1100;
--z-fixed: 1200;
--z-modal-backdrop: 1300;
--z-modal: 1400;
--z-popover: 1500;
--z-tooltip: 1600;
}
Code complet : Button.jsx
jsx
// src/components/ui/Button.jsx
import React from 'react';
import './Button.css';

/\*\*

- Button component with multiple variants and sizes
- @param {Object} props
- @param {'primary'|'secondary'|'danger'|'ghost'} props.variant - Visual style
- @param {'sm'|'md'|'lg'} props.size - Size variant
- @param {React.ReactNode} props.icon - Icon before text
- @param {React.ReactNode} props.iconRight - Icon after text
- @param {boolean} props.loading - Show loading spinner
- @param {boolean} props.disabled - Disable button
- @param {string} props.className - Additional CSS classes
- @param {React.ReactNode} props.children - Button content
  \*/
  export const Button = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
  }) => {
  const classes = [
  'btn',
  `btn--${variant}`,
  `btn--${size}`,
  loading && 'btn--loading',
  className
  ].filter(Boolean).join(' ');

return (
<button
className={classes}
disabled={disabled || loading}
aria-busy={loading}
{...props} >
{loading && (
<span className="btn__spinner" aria-hidden="true" role="status">
<svg className="animate-spin" viewBox="0 0 24 24">
ircle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"
fill="none" opacity="0.25"/>
<path fill="currentColor" opacity="0.75"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
</svg>
</span>
)}
{!loading && icon && (
<span className="btn__icon" aria-hidden="true">{icon}</span>
)}
<span className="btn__label">{children}</span>
{!loading && iconRight && (
<span className="btn__icon" aria-hidden="true">{iconRight}</span>
)}
</button>
);
};
Code complet : Button.css
css
/_ src/components/ui/Button.css _/
.btn {
/_ Base styles _/
display: inline-flex;
align-items: center;
justify-content: center;
gap: var(--space-2);

font-family: var(--font-family-base);
font-weight: var(--font-weight-medium);
line-height: var(--line-height-tight);
text-align: center;
text-decoration: none;
white-space: nowrap;

border: var(--border-width-base) solid transparent;
border-radius: var(--radius-md);

cursor: pointer;
user-select: none;

transition: all var(--transition-fast);

/_ Focus visible (accessibility) _/
&:focus-visible {
outline: none;
box-shadow: var(--shadow-focus);
}

/_ Disabled state _/
&:disabled {
opacity: 0.5;
cursor: not-allowed;
pointer-events: none;
}
}

/_ ========== SIZES ========== _/
.btn--sm {
padding: var(--space-1) var(--space-3);
font-size: var(--font-size-sm);
min-height: 32px;
}

.btn--md {
padding: var(--space-2) var(--space-4);
font-size: var(--font-size-base);
min-height: 40px;
}

.btn--lg {
padding: var(--space-3) var(--space-6);
font-size: var(--font-size-lg);
min-height: 48px;
}

/_ ========== VARIANTS ========== _/

/_ Primary _/
.btn--primary {
background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
color: white;
border-color: transparent;
box-shadow: var(--shadow-sm);
}

.btn--primary:hover:not(:disabled) {
background: linear-gradient(135deg, var(--color-primary-hover), var(--color-primary-active));
box-shadow: var(--shadow-md);
transform: translateY(-1px);
}

.btn--primary:active:not(:disabled) {
transform: translateY(0);
box-shadow: var(--shadow-sm);
}

/_ Secondary _/
.btn--secondary {
background: transparent;
color: var(--color-text-primary);
border-color: var(--color-border-base);
}

.btn--
Suite de la PARTIE 2/4 :

css
/_ Suite Button.css _/

/_ Secondary _/
.btn--secondary {
background: transparent;
color: var(--color-text-primary);
border-color: var(--color-border-base);
}

.btn--secondary:hover:not(:disabled) {
background: var(--color-bg-hover);
border-color: var(--color-border-hover);
}

.btn--secondary:active:not(:disabled) {
background: var(--color-bg-active);
}

/_ Danger _/
.btn--danger {
background: linear-gradient(135deg, var(--color-danger), var(--color-danger-hover));
color: white;
border-color: transparent;
box-shadow: var(--shadow-sm);
}

.btn--danger:hover:not(:disabled) {
background: var(--color-danger-hover);
box-shadow: var(--shadow-md);
transform: translateY(-1px);
}

/_ Ghost _/
.btn--ghost {
background: transparent;
color: var(--color-text-secondary);
border-color: transparent;
}

.btn--ghost:hover:not(:disabled) {
background: var(--color-bg-hover);
color: var(--color-text-primary);
}

/_ ========== LOADING STATE ========== _/
.btn--loading {
pointer-events: none;
position: relative;
}

.btn\_\_spinner {
display: inline-flex;
width: 1em;
height: 1em;
}

.btn\_\_spinner svg {
width: 100%;
height: 100%;
}

@keyframes spin {
to { transform: rotate(360deg); }
}

.animate-spin {
animation: spin 1s linear infinite;
}

/_ ========== ICON ========== _/
.btn\_\_icon {
display: inline-flex;
flex-shrink: 0;
}

.btn--sm .btn\_\_icon {
width: 16px;
height: 16px;
}

.btn--md .btn\_\_icon {
width: 20px;
height: 20px;
}

.btn--lg .btn\_\_icon {
width: 24px;
height: 24px;
}
Autres composants UI (résumés)
jsx
// src/components/ui/Input.jsx
export const Input = ({ label, error, helperText, ...props }) => (

  <div className="input-wrapper">
    {label && <label className="input-label">{label}</label>}
    <input 
      className={`input ${error ? 'input--error' : ''}`}
      aria-invalid={!!error}
      aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
      {...props}
    />
    {error && <span className="input-error" id={`${props.id}-error`}>{error}</span>}
    {helperText && !error && <span className="input-helper" id={`${props.id}-helper`}>{helperText}</span>}
  </div>
);

// src/components/ui/Card.jsx
export const Card = ({ title, children, actions, className = '' }) => (

  <div className={`card ${className}`}>
    {title && <div className="card-header">{title}</div>}
    <div className="card-body">{children}</div>
    {actions && <div className="card-footer">{actions}</div>}
  </div>
);

// src/components/ui/Badge.jsx
export const Badge = ({ variant = 'default', children, ...props }) => (
<span className={`badge badge--${variant}`} {...props}>
{children}
</span>
);
TÂCHE 2 : Architecture 4 zones (Layout refactor)
Score consensus : 47/50
Priorité : 🔴 CRITIQUE

Objectif
Restructurer le layout en 4 zones clairement séparées avec landmarks ARIA.

Fichiers à créer/modifier
text
src/components/layout/
├── EditorShell.jsx ← REFACTOR (layout principal)
├── TopBar.jsx ← NOUVEAU
├── Sidebar.jsx ← REFACTOR/NOUVEAU
├── MainCanvas.jsx ← NOUVEAU
└── Inspector.jsx ← REFACTOR (ancien SceneProperties)
Code : EditorShell.jsx
jsx
// src/components/layout/EditorShell.jsx
import React, { useState } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { MainCanvas } from './MainCanvas';
import { Inspector } from './Inspector';
import './EditorShell.css';

export const EditorShell = () => {
const [activeSceneId, setActiveSceneId] = useState(null);
const [viewMode, setViewMode] = useState('visual'); // 'visual' | 'graph'
const [inspectorOpen, setInspectorOpen] = useState(true);

// Récupérer depuis votre state management existant
const { scenes, characters, saveStatus } = useYourExistingStore();
const activeScene = scenes.find(s => s.id === activeSceneId);

return (
<div className="editor-shell">
{/_ Skip link for accessibility _/}
<a href="#main-content" className="skip-link">
Aller au contenu principal
</a>

      <TopBar
        projectName="AccessCity Studio"
        saveStatus={saveStatus}
        onSave={handleSave}
        onExport={handleExport}
        onPreview={handlePreview}
      />

      <div className="editor-body">
        <Sidebar
          scenes={scenes}
          characters={characters}
          activeSceneId={activeSceneId}
          onSceneSelect={setActiveSceneId}
          onNewScene={handleNewScene}
          onNewCharacter={handleNewCharacter}
        />

        <MainCanvas
          id="main-content"
          scene={activeScene}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onAddDialogue={handleAddDialogue}
        />

        <Inspector
          scene={activeScene}
          isOpen={inspectorOpen}
          onToggle={() => setInspectorOpen(!inspectorOpen)}
          onUpdateScene={handleUpdateScene}
          onDeleteScene={handleDeleteScene}
        />
      </div>
    </div>

);
};
Code : EditorShell.css
css
/_ src/components/layout/EditorShell.css _/
.editor-shell {
display: flex;
flex-direction: column;
height: 100vh;
overflow: hidden;
background: var(--color-bg-base);
color: var(--color-text-primary);
}

/_ Skip link for accessibility _/
.skip-link {
position: absolute;
top: -40px;
left: 0;
background: var(--color-primary);
color: white;
padding: var(--space-2) var(--space-4);
text-decoration: none;
border-radius: var(--radius-md);
z-index: var(--z-tooltip);
}

.skip-link:focus {
top: var(--space-2);
left: var(--space-2);
}

/_ Main body grid _/
.editor-body {
display: grid;
grid-template-columns: 240px 1fr 320px;
flex: 1;
overflow: hidden;
gap: 0;
}

/_ Responsive layout _/
@media (max-width: 1280px) {
.editor-body {
grid-template-columns: 200px 1fr 300px;
}
}

@media (max-width: 1024px) {
.editor-body {
grid-template-columns: 200px 1fr;
}

/_ Inspector devient un panneau overlay _/
.inspector {
position: fixed;
right: 0;
top: 60px;
bottom: 0;
width: 320px;
transform: translateX(100%);
transition: transform var(--transition-base);
z-index: var(--z-fixed);
box-shadow: var(--shadow-xl);
}

.inspector.open {
transform: translateX(0);
}
}

@media (max-width: 768px) {
.editor-body {
grid-template-columns: 1fr;
}

/_ Sidebar aussi en overlay _/
.sidebar {
position: fixed;
left: 0;
top: 60px;
bottom: 0;
width: 240px;
transform: translateX(-100%);
transition: transform var(--transition-base);
z-index: var(--z-fixed);
box-shadow: var(--shadow-xl);
}

.sidebar.open {
transform: translateX(0);
}
}
Code : TopBar.jsx
jsx
// src/components/layout/TopBar.jsx
import React from 'react';
import { Button } from '../ui/Button';
import './TopBar.css';

export const TopBar = ({
projectName,
saveStatus,
onSave,
onExport,
onPreview
}) => {
const getSaveStatusIcon = () => {
switch(saveStatus) {
case 'saved': return '✓';
case 'saving': return '⟳';
case 'unsaved': return '•';
default: return '?';
}
};

const getSaveStatusText = () => {
switch(saveStatus) {
case 'saved': return 'Sauvegardé';
case 'saving': return 'Sauvegarde...';
case 'unsaved': return 'Non sauvegardé';
default: return 'État inconnu';
}
};

return (
<header className="topbar" role="banner">
<div className="topbar-left">
<h1 className="topbar-title">{projectName}</h1>

        <div
          className={`topbar-status topbar-status--${saveStatus}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="topbar-status-icon" aria-hidden="true">
            {getSaveStatusIcon()}
          </span>
          <span className="topbar-status-text">
            {getSaveStatusText()}
          </span>
        </div>
      </div>

      <nav className="topbar-actions" aria-label="Actions principales">
        <Button
          variant="secondary"
          size="sm"
          onClick={onSave}
          disabled={saveStatus === 'saved' || saveStatus === 'saving'}
          aria-label="Sauvegarder le projet"
        >
          💾 Sauvegarder
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onExport}
          aria-label="Exporter le projet"
        >
          📤 Export
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onPreview}
          aria-label="Prévisualiser le projet"
        >
          🎮 Preview
        </Button>
      </nav>
    </header>

);
};
Code : TopBar.css
css
/_ src/components/layout/TopBar.css _/
.topbar {
display: flex;
align-items: center;
justify-content: space-between;
height: 60px;
padding: 0 var(--space-6);
background: var(--color-bg-elevated);
border-bottom: var(--border-width-thin) solid var(--color-border-base);
flex-shrink: 0;
}

.topbar-left {
display: flex;
align-items: center;
gap: var(--space-4);
}

.topbar-title {
font-size: var(--font-size-lg);
font-weight: var(--font-weight-semibold);
color: var(--color-text-primary);
margin: 0;
}

/_ Save status indicator _/
.topbar-status {
display: flex;
align-items: center;
gap: var(--space-2);
padding: var(--space-2) var(--space-3);
border-radius: var(--radius-md);
font-size: var(--font-size-sm);
transition: all var(--transition-fast);
}

.topbar-status--saved {
background: rgba(16, 185, 129, 0.1);
color: var(--color-success);
}

.topbar-status--saving {
background: rgba(245, 158, 11, 0.1);
color: var(--color-warning);
}

.topbar-status--unsaved {
background: rgba(239, 68, 68, 0.1);
color: var(--color-danger);
}

.topbar-status-icon {
font-size: var(--font-size-lg);
line-height: 1;
}

.topbar-status--saving .topbar-status-icon {
animation: spin 1s linear infinite;
}

/_ Actions _/
.topbar-actions {
display: flex;
align-items: center;
gap: var(--space-2);
}
TÂCHE 3 : Vue Graph Dialogue (ReactFlow)
Score consensus : 42/50
Priorité : 🔴 CRITIQUE

Objectif
Transformer le Dialogue Flow linéaire en vue graph interactive node-based.

Installation dépendance
bash
npm install @xyflow/react
Fichier à créer
text
src/components/features/DialogueGraph.jsx ← NOUVEAU
src/components/features/DialogueGraph.css ← NOUVEAU
Code : DialogueGraph.jsx
jsx
// src/components/features/DialogueGraph.jsx
import React, { useCallback, useMemo } from 'react';
import {
ReactFlow,
Background,
Controls,
MiniMap,
useNodesState,
useEdgesState
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './DialogueGraph.css';

// Custom node components
const DialogueNode = ({ data }) => (

  <div className="dialogue-node">
    <div className="dialogue-node-header">
      <span className="dialogue-node-speaker">{data.speaker}</span>
      <span className="dialogue-node-id">#{data.order}</span>
    </div>
    <div className="dialogue-node-body">
      <p className="dialogue-node-text">{data.text}</p>
    </div>
  </div>
);

const ChoiceNode = ({ data }) => (

  <div className="choice-node">
    <div className="choice-node-header">
      <span className="choice-node-speaker">{data.speaker}</span
	  
	  Suite du DialogueGraph :

jsx
// Suite DialogueGraph.jsx

const ChoiceNode = ({ data }) => (

  <div className="choice-node">
    <div className="choice-node-header">
      <span className="choice-node-speaker">{data.speaker}</span>
      <span className="choice-node-badge">CHOIX</span>
    </div>
    <div className="choice-node-body">
      <p className="choice-node-text">{data.text}</p>
      <div className="choice-node-choices">
        {data.choices && data.choices.map((choice, idx) => (
          <div key={idx} className="choice-item">
            {idx + 1}. {choice.text}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Register custom node types
const nodeTypes = {
dialogueNode: DialogueNode,
choiceNode: ChoiceNode
};

export const DialogueGraph = ({ dialogues = [], onNodeClick, onAddDialogue }) => {
// Transform dialogues array to nodes
const initialNodes = useMemo(() => {
return dialogues.map((dialogue, index) => ({
id: dialogue.id,
type: dialogue.choices && dialogue.choices.length > 0 ? 'choiceNode' : 'dialogueNode',
position: {
x: 100,
y: index \* 200
},
data: {
speaker: dialogue.speaker || 'Unknown',
text: dialogue.text || '',
order: index + 1,
choices: dialogue.choices || []
}
}));
}, [dialogues]);

// Transform dialogues to edges (connections)
const initialEdges = useMemo(() => {
const edges = [];

    dialogues.forEach((dialogue, index) => {
      if (dialogue.choices && dialogue.choices.length > 0) {
        // Dialogue with choices
        dialogue.choices.forEach((choice, choiceIdx) => {
          if (choice.nextDialogueId) {
            edges.push({
              id: `${dialogue.id}-choice${choiceIdx}-${choice.nextDialogueId}`,
              source: dialogue.id,
              target: choice.nextDialogueId,
              label: `${choiceIdx + 1}. ${choice.text.substring(0, 20)}...`,
              animated: true,
              style: { stroke: '#A78BFA' }
            });
          }
        });
      } else if (dialogue.nextDialogueId) {
        // Simple linear dialogue
        edges.push({
          id: `${dialogue.id}-${dialogue.nextDialogueId}`,
          source: dialogue.id,
          target: dialogue.nextDialogueId,
          style: { stroke: '#60A5FA' }
        });
      } else if (index < dialogues.length - 1) {
        // Auto-connect to next if no explicit next
        edges.push({
          id: `${dialogue.id}-${dialogues[index + 1].id}`,
          source: dialogue.id,
          target: dialogues[index + 1].id,
          style: { stroke: '#60A5FA', strokeDasharray: '5,5' }
        });
      }
    });

    return edges;

}, [dialogues]);

const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

const handleNodeClick = useCallback((event, node) => {
onNodeClick?.(node.id);
}, [onNodeClick]);

if (dialogues.length === 0) {
return (
<div className="dialogue-graph-empty">
<p>Aucun dialogue dans cette scène.</p>
<button onClick={onAddDialogue}>+ Ajouter un dialogue</button>
</div>
);
}

return (
<div className="dialogue-graph-container">
<ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
<Background 
          color="var(--color-border-base)" 
          gap={16} 
        />
<Controls />
<MiniMap
nodeColor={(node) => {
return node.type === 'choiceNode' ? '#A78BFA' : '#60A5FA';
}}
maskColor="rgba(15, 23, 42, 0.8)"
/>
</ReactFlow>
</div>
);
};
Code : DialogueGraph.css
css
/_ src/components/features/DialogueGraph.css _/
.dialogue-graph-container {
width: 100%;
height: 100%;
background: var(--color-bg-base);
}

/_ Empty state _/
.dialogue-graph-empty {
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
height: 100%;
gap: var(--space-4);
color: var(--color-text-muted);
}

/_ ========== DIALOGUE NODE ========== _/
.dialogue-node {
background: var(--color-bg-elevated);
border: 2px solid var(--color-border-base);
border-radius: var(--radius-lg);
min-width: 240px;
max-width: 320px;
box-shadow: var(--shadow-md);
transition: all var(--transition-fast);
}

.dialogue-node:hover {
border-color: #60A5FA;
box-shadow: var(--shadow-lg);
}

.dialogue-node-header {
display: flex;
justify-content: space-between;
align-items: center;
padding: var(--space-3);
border-bottom: 1px solid var(--color-border-base);
background: rgba(96, 165, 250, 0.1);
}

.dialogue-node-speaker {
font-weight: var(--font-weight-semibold);
color: #60A5FA;
font-size: var(--font-size-sm);
}

.dialogue-node-id {
font-size: var(--font-size-xs);
color: var(--color-text-muted);
background: var(--color-bg-hover);
padding: var(--space-1) var(--space-2);
border-radius: var(--radius-sm);
}

.dialogue-node-body {
padding: var(--space-3);
}

.dialogue-node-text {
margin: 0;
font-size: var(--font-size-sm);
color: var(--color-text-secondary);
line-height: var(--line-height-relaxed);
display: -webkit-box;
-webkit-line-clamp: 4;
-webkit-box-orient: vertical;
overflow: hidden;
}

/_ ========== CHOICE NODE ========== _/
.choice-node {
background: var(--color-bg-elevated);
border: 2px solid #7C3AED;
border-radius: var(--radius-lg);
min-width: 260px;
max-width: 340px;
box-shadow: var(--shadow-md);
}

.choice-node:hover {
border-color: #A78BFA;
box-shadow: var(--shadow-lg);
}

.choice-node-header {
display: flex;
justify-content: space-between;
align-items: center;
padding: var(--space-3);
border-bottom: 1px solid var(--color-border-base);
background: rgba(167, 139, 250, 0.1);
}

.choice-node-speaker {
font-weight: var(--font-weight-semibold);
color: #A78BFA;
font-size: var(--font-size-sm);
}

.choice-node-badge {
font-size: var(--font-size-xs);
font-weight: var(--font-weight-bold);
color: #7C3AED;
background: rgba(167, 139, 250, 0.2);
padding: var(--space-1) var(--space-2);
border-radius: var(--radius-sm);
}

.choice-node-body {
padding: var(--space-3);
}

.choice-node-text {
margin: 0 0 var(--space-3) 0;
font-size: var(--font-size-sm);
color: var(--color-text-secondary);
line-height: var(--line-height-relaxed);
}

.choice-node-choices {
display: flex;
flex-direction: column;
gap: var(--space-2);
}

.choice-item {
padding: var(--space-2);
background: var(--color-bg-hover);
border-radius: var(--radius-sm);
font-size: var(--font-size-xs);
color: var(--color-text-muted);
border-left: 2px solid #A78BFA;
}

/_ ========== REACTFLOW OVERRIDES ========== _/
.react-flow\_\_attribution {
background: transparent !important;
opacity: 0.5;
}

.react-flow\_\_controls {
background: var(--color-bg-elevated);
border: 1px solid var(--color-border-base);
border-radius: var(--radius-md);
}

.react-flow\_\_controls-button {
background: var(--color-bg-base);
border-bottom: 1px solid var(--color-border-base);
color: var(--color-text-primary);
}

.react-flow\_\_controls-button:hover {
background: var(--color-bg-hover);
}

.react-flow\_\_minimap {
background: var(--color-bg-elevated);
border: 1px solid var(--color-border-base);
border-radius: var(--radius-md);
}
TÂCHE 4 : Shortcuts clavier
Score consensus : 41/50
Priorité : 🔴 CRITIQUE

Objectif
Implémenter les raccourcis clavier essentiels pour productivité.

Fichier à créer
text
src/hooks/useKeyboardShortcuts.js ← NOUVEAU
Code : useKeyboardShortcuts.js
js
// src/hooks/useKeyboardShortcuts.js
import { useEffect, useCallback } from 'react';

/\*\*

- Hook pour gérer les raccourcis clavier globaux
- @param {Object} handlers - Objet avec les fonctions de callback
- @param {Function} handlers.onSave - Ctrl+S
- @param {Function} handlers.onUndo - Ctrl+Z
- @param {Function} handlers.onRedo - Ctrl+Y ou Ctrl+Shift+Z
- @param {Function} handlers.onDuplicate - Ctrl+D
- @param {Function} handlers.onDelete - Delete
- @param {Function} handlers.onPreview - Space
- @param {Function} handlers.onNewDialogue - N
- @param {Function} handlers.onSearch - Ctrl+F
- @param {boolean} enabled - Activer/désactiver les shortcuts
  \*/
  export const useKeyboardShortcuts = (handlers = {}, enabled = true) => {
  const handleKeyDown = useCallback((event) => {
  // Ne pas intercepter si dans un input/textarea/contenteditable
  const target = event.target;
  const isEditable =
  target.tagName === 'INPUT' ||
  target.tagName === 'TEXTAREA' ||
  target.isContentEditable;
      // Détecter le modificateur (Ctrl sur Windows/Linux, Cmd sur Mac)
      const modifier = event.ctrlKey || event.metaKey;

      // ========== SHORTCUTS AVEC MODIFICATEUR ========== //

      // Ctrl+S : Save
      if (modifier && event.key === 's') {
        event.preventDefault();
        handlers.onSave?.();
        return;
      }

      // Ctrl+Z : Undo
      if (modifier && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        handlers.onUndo?.();
        return;
      }

      // Ctrl+Y ou Ctrl+Shift+Z : Redo
      if (modifier && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault();
        handlers.onRedo?.();
        return;
      }

      // Ctrl+D : Duplicate
      if (modifier && event.key === 'd') {
        event.preventDefault();
        handlers.onDuplicate?.();
        return;
      }

      // Ctrl+F : Search
      if (modifier && event.key === 'f') {
        event.preventDefault();
        handlers.onSearch?.();
        return;
      }

      // Ctrl+P : Preview (alternative à Space)
      if (modifier && event.key === 'p') {
        event.preventDefault();
        handlers.onPreview?.();
        return;
      }

      // ========== SHORTCUTS SANS MODIFICATEUR ========== //
      // Ne fonctionnent que si pas dans un input

      if (isEditable) return;

      // Delete : Delete selected
      if (event.key === 'Delete') {
        event.preventDefault();
        handlers.onDelete?.();
        return;
      }

      // Space : Preview
      if (event.key === ' ') {
        event.preventDefault();
        handlers.onPreview?.();
        return;
      }

      // N : New dialogue
      if (event.key === 'n' || event.key === 'N') {
        event.preventDefault();
        handlers.onNewDialogue?.();
        return;
      }

      // Escape : Cancel/Close
      if (event.key === 'Escape') {
        handlers.onEscape?.();
        return;
      }

}, [handlers]);

useEffect(() => {
if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };

}, [handleKeyDown, enabled]);
};

// Export aussi un composant pour afficher les shortcuts disponibles
export const ShortcutsHelpPanel = () => {
const shortcuts =
