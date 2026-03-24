import { useState, useEffect } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import SkipToContent from './components/SkipToContent';
import HomePage from './components/HomePage';
import EditorShell from './components/EditorShell';
import TokensDemo from './pages/TokensDemo';
import { Toaster } from 'sonner';
import { usePortableAutoload } from '@/hooks/usePortableAutoload';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  THEME_GLOBAL_COLORS,
  DIALOGUE_COMPOSER_THEMES,
  hexAlpha,
} from '@/config/dialogueComposerThemes';
import type { DialogueComposerTheme } from '@/config/dialogueComposerThemes';

// Variables fond/texte custom — removeProperty() restaure les valeurs de tokens.css.
const BG_TEXT_VARS = [
  '--color-bg-base',
  '--color-bg-elevated',
  '--color-bg-hover',
  '--color-bg-active',
  '--color-bg-overlay',
  '--color-text-primary',
  '--color-text-secondary',
  '--color-text-muted',
  '--color-text-disabled',
  '--color-border-base',
  '--color-border-hover',
  // Legacy aliases hardcodés dark dans tokens.css
  '--bg-secondary',
  '--bg-tertiary',
  '--border-medium',
] as const;

// Variables shadcn/ui — contrôlent bg-background, bg-card, text-foreground, border-border, etc.
// index.html a class="dark" en dur : .dark { } donne les tokens sombres par défaut.
// Pour les thèmes clairs, on retire la classe dark ET on override ces tokens.
const SHADCN_VARS = [
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--popover',
  '--popover-foreground',
  '--muted',
  '--muted-foreground',
  '--border',
  '--input',
] as const;

// Tokens shadcn Catppuccin Latte (format HSL "H S% L%" sans hsl() — Tailwind l'ajoute).
const LATTE_SHADCN: [string, string][] = [
  ['--background', '220 23% 95%'], // #eff1f5 Latte Base
  ['--foreground', '235 16% 35%'], // #4c4f69 Latte Text
  ['--card', '220 13% 92%'], // #e6e9ef Latte Mantle
  ['--card-foreground', '235 16% 35%'],
  ['--popover', '220 13% 92%'],
  ['--popover-foreground', '235 16% 35%'],
  ['--muted', '220 16% 88%'], // #dce0e8 Latte Crust
  ['--muted-foreground', '235 10% 47%'], // #6c6f85 Latte Subtext0
  ['--border', '235 13% 75%'], // approx rgba(76,79,105,0.35)
  ['--input', '235 13% 75%'],
];

// Échelle alpha complète — recalculée à chaque changement de thème pour
// correspondre à la couleur primaire (tokens.css hardcode rgba(139,92,246,X)).
const PRIMARY_ALPHA_STEPS: [string, number][] = [
  ['--color-primary-04', 0.04],
  ['--color-primary-05', 0.05],
  ['--color-primary-06', 0.06],
  ['--color-primary-07', 0.07],
  ['--color-primary-08', 0.08],
  ['--color-primary-10', 0.1],
  ['--color-primary-15', 0.15],
  ['--color-primary-20', 0.2],
  ['--color-primary-22', 0.22],
  ['--color-primary-25', 0.25],
  ['--color-primary-28', 0.28],
  ['--color-primary-30', 0.3],
  ['--color-primary-35', 0.35],
  ['--color-primary-45', 0.45],
  ['--color-primary-55', 0.55],
  ['--color-primary-60', 0.6],
  ['--color-primary-70', 0.7],
  ['--color-primary-80', 0.8],
  ['--color-primary-90', 0.9],
];

/** Injecte les variables CSS de thème dans :root. */
function applyEditorTheme(theme: DialogueComposerTheme) {
  const colors = THEME_GLOBAL_COLORS[theme];
  const root = document.documentElement;
  const isLight = DIALOGUE_COMPOSER_THEMES[theme].isLight ?? false;

  // ── 1. Toggle class dark sur <html> ────────────────────────────────────────
  // Retire "dark" pour les thèmes clairs → les tokens shadcn :root {} (clairs) s'activent.
  // Remet "dark" pour les thèmes sombres → .dark { } (valeurs dark Midnight Bloom).
  root.classList.toggle('dark', !isLight);

  // ── 2. Tokens shadcn — nettoyer les overrides précédents, puis injecter si clair ──
  for (const v of SHADCN_VARS) root.style.removeProperty(v);
  if (isLight) {
    for (const [varName, value] of LATTE_SHADCN) root.style.setProperty(varName, value);
  }

  // ── 3. Couleurs primaires + toute l'échelle alpha (toujours appliquées) ────
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-primary-hover', colors.hover);
  root.style.setProperty('--color-primary-glow', hexAlpha(colors.primary, 0.5));
  root.style.setProperty('--color-primary-subtle', hexAlpha(colors.primary, 0.12));
  root.style.setProperty('--color-primary-muted', hexAlpha(colors.primary, 0.18));
  root.style.setProperty('--color-primary-40', hexAlpha(colors.primary, 0.4));
  for (const [varName, opacity] of PRIMARY_ALPHA_STEPS) {
    root.style.setProperty(varName, hexAlpha(colors.primary, opacity));
  }

  // ── 4. Fond / texte custom — seulement si le thème override (Latte, Mocha, Dracula) ─
  if (colors.bgBase) {
    root.style.setProperty('--color-bg-base', colors.bgBase);
    root.style.setProperty('--color-bg-elevated', colors.bgElevated ?? colors.bgBase);
    if (colors.bgHover) root.style.setProperty('--color-bg-hover', colors.bgHover);
    if (colors.bgActive) root.style.setProperty('--color-bg-active', colors.bgActive);
    if (colors.bgOverlay) root.style.setProperty('--color-bg-overlay', colors.bgOverlay);
    if (colors.textPrimary) root.style.setProperty('--color-text-primary', colors.textPrimary);
    if (colors.textSecondary)
      root.style.setProperty('--color-text-secondary', colors.textSecondary);
    if (colors.textMuted) root.style.setProperty('--color-text-muted', colors.textMuted);
    if (colors.textDisabled) root.style.setProperty('--color-text-disabled', colors.textDisabled);
    if (colors.borderBase) root.style.setProperty('--color-border-base', colors.borderBase);
    if (colors.borderHover) root.style.setProperty('--color-border-hover', colors.borderHover);
    // Legacy aliases hardcodés dark dans tokens.css
    root.style.setProperty('--bg-secondary', colors.bgElevated ?? colors.bgBase);
    root.style.setProperty('--bg-tertiary', colors.bgHover ?? colors.bgBase);
    root.style.setProperty(
      '--border-medium',
      colors.borderHover ?? colors.borderBase ?? 'rgba(76,79,105,0.35)'
    );
  } else {
    // Thèmes dark sans override (dark, aurora, candy) — restaurer tokens.css
    for (const v of BG_TEXT_VARS) root.style.removeProperty(v);
  }
}

// État initial des quêtes (données de démo)
const DEMO_QUESTS = [
  {
    id: 'demo-1',
    name: 'La visite à la mairie',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function App() {
  usePortableAutoload();

  // ── Thème global — injecte --color-primary dans :root à chaque changement ──
  const editorTheme = useSettingsStore((s) => s.dialogueComposerTheme);
  useEffect(() => {
    applyEditorTheme(editorTheme);
  }, [editorTheme]);

  const [quests, setQuests] = useState(() => {
    // On peut charger depuis localStorage ici si besoin
    return DEMO_QUESTS;
  });
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [newQuestName, setNewQuestName] = useState('');
  // Check URL for demo mode (?demo=true) and tokens mode (?tokens=true)
  const urlParams = new URLSearchParams(window.location.search);
  const isTokensMode = urlParams.get('tokens') === 'true';
  // DEV: skip home page, go directly to editor
  const [currentView, setCurrentView] = useState(isTokensMode ? 'tokens-demo' : 'studio'); // 'home' | 'studio' | 'tokens-demo'

  // Créer une nouvelle quête
  function handleCreateQuest() {
    if (!newQuestName.trim()) return;
    if (quests.length >= 5) return;
    const newQuest = {
      id: `quest-${Date.now()}`,
      name: newQuestName.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setQuests([...quests, newQuest]);
    setNewQuestName('');
    setSelectedQuestId(newQuest.id);
  }

  // Sélectionner une quête
  function handleSelectQuest(id: string) {
    setSelectedQuestId(id);
  }

  // Lancer le studio pour la quête sélectionnée
  function handleLaunchEditor() {
    if (!selectedQuestId) return;
    setCurrentView('studio');
  }

  // Supprimer la quête sélectionnée
  function handleDeleteQuest() {
    if (!selectedQuestId) return;
    setQuests(quests.filter((q) => q.id !== selectedQuestId));
    setSelectedQuestId(null);
  }

  // Retour à l'accueil
  function handleBackHome() {
    setCurrentView('home');
  }

  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={100}>
      <SkipToContent />
      {currentView === 'tokens-demo' ? (
        <TokensDemo />
      ) : currentView === 'studio' ? (
        <EditorShell onBack={handleBackHome} />
      ) : (
        <HomePage
          quests={quests}
          selectedQuestId={selectedQuestId}
          newQuestName={newQuestName}
          onNewQuestNameChange={setNewQuestName}
          onCreateQuest={handleCreateQuest}
          onSelectQuest={handleSelectQuest}
          onLaunchEditor={handleLaunchEditor}
          onDeleteQuest={handleDeleteQuest}
        />
      )}
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={5000}
        theme={DIALOGUE_COMPOSER_THEMES[editorTheme].isLight ? 'light' : 'dark'}
      />
    </TooltipProvider>
  );
}

export default App;
