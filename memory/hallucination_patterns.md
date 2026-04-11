---
name: hallucination-patterns
description: Anti-patterns et pièges spécifiques découverts sur CE projet — bugs réels corrigés lors des audits (rounds 2-5, 2026-03-28)
type: project
---

# Anti-patterns connus — AccessCity VN Editor

> Capitalisé lors des audits rounds 2–5 (2026-03-28).
> Chaque entrée correspond à un bug **réel corrigé par grep + build confirmé**.
> Ne pas réintroduire ces patterns lors de modifications futures.

---

## 1. key={idx} / key={i} sur listes mutables

**Règle :** Ne jamais utiliser l'index de `.map()` comme `key` React sur une liste dont l'ordre ou la taille peut changer.

### Zones corrigées dans ce projet

| Fichier | Objet de la liste | Clé correcte |
|---|---|---|
| `src/components/ui/ContextMenu.tsx` | items du menu | `item.label` |
| `src/components/ui/DialogueBox.tsx` (×2) | effets StatEffect sur choix | `` `${eff.variable}-${eff.operation}` `` |
| `src/components/ui/DialogueBox.tsx` | mots typewriter narrateur | `` `word-${i}` `` |
| `src/components/panels/PreviewPlayer/MinigameBraille.tsx` | lettres du mot Braille | `` `letter-${idx}` `` |
| `src/components/panels/MainCanvas/components/DialogueFlowVisualization.tsx` | dialogues | `dialogue.id` |
| `src/components/panels/MainCanvas/components/DialogueFlowVisualization.tsx` | choices | `choice.id` |
| `src/components/dialogue-editor/DialogueComposer/components/BinaryChoiceField.tsx` | conditions | `` `cond-${idx}` `` |
| `src/components/dialogue-editor/DialogueWizard/components/ComplexChoiceBuilder/ComplexChoiceCard.tsx` | conditions | `` `cond-${idx}` `` |
| `src/components/dialogue-editor/DialogueWizard/components/ComplexChoiceBuilder/EffectsEditor.tsx` | effets StatEffect | `` `${effect.variable}-${effect.operation}-${originalIndex}` `` |
| `src/components/dialogue-editor/DialogueWizard/components/MinigameChoiceBuilder/index.tsx` | cfg.items | `` `item-${idx}` `` |
| `src/components/dialogue-editor/DialogueWizard/components/MinigameChoiceBuilder/index.tsx` | cfg.keySequence | `` `seq-${idx}` `` |
| `src/components/dialogue-editor/DialogueWizard/components/MinigameChoiceBuilder/index.tsx` | cfg.brailleWords | `` `bword-${idx}` `` |
| `src/components/character-editor/CharacterWizard/components/StepAppearance.tsx` (×2) | assets récents / filtrés | `assetPath` / `asset.path` |

**⚠️ Exception valide :** `key={i}` est acceptable sur des tableaux **vraiment fixes** :
- `[...Array(6)].map((_, i) =>` — les 6 points Braille (jamais reordonné)
- `Array.from({ length: maxLives }).map((_, i) =>` — lives fixes par partie

---

## 2. Fuites mémoire Audio — onended après démontage

**Fichier corrigé :** `src/components/panels/UnifiedPanel/AudioSection.tsx`

**Pattern dangereux :**
```typescript
// ❌ MAUVAIS — onended appelle setIsPlaying après démontage
const player = new Audio(url);
player.onended = () => setIsPlaying(false);
audioRef.current = player;
// Pas de cleanup → setState sur composant démonté
```

**Correction :**
```typescript
// ✅ BON — cleanup dans useEffect
useEffect(() => {
  return () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current = null;
    }
  };
}, []);
```

**⚠️ Exception valide :** `new Audio(url).play()` fire-and-forget pour les SFX ponctuels
(`CinematicPlayer.tsx` case `'sfx'`) — pas de cleanup nécessaire pour les sons one-shot courts.

---

## 3. setTimeout sans cleanup dans les wizards

**Fichier corrigé :** `src/components/character-editor/CharacterWizard/index.tsx`

```typescript
// ❌ MAUVAIS — timeout orphelin si le wizard est fermé avant les 2s
setTimeout(() => { onClose(); }, 2000);

// ✅ BON — ref + cleanup
const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
useEffect(() => {
  return () => { if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current); };
}, []);
closeTimeoutRef.current = setTimeout(() => { onClose(); }, 2000);
```

---

## 4. Arêtes @xyflow sans React.memo

**Fichiers corrigés :** `CosmosChoiceEdge`, `CosmosConvergenceEdge`, `BlenderChoiceEdge`, `BlenderConvergenceEdge`

Toutes les arêtes custom `@xyflow/react` doivent être wrappées dans `React.memo` — elles reçoivent des props à chaque mouvement de nœud même sans changement de données.

```typescript
// ✅ BON
export const CosmosChoiceEdge = React.memo(function CosmosChoiceEdge({ ... }) {
  // ...
});
```

---

## 5. StatEffect.set / StatEffect.multiply sans clamping

**Fichier corrigé :** `src/core/DialogueEngine.ts`

Les opérations `set` et `multiply` sur les stats RPG produisaient des valeurs hors limites.
Toujours clamper entre `STAT_BOUNDS.MIN` et `STAT_BOUNDS.MAX` (importé depuis `@/config/gameConstants`).

```typescript
// ✅ BON
const clamped = Math.max(STAT_BOUNDS.MIN, Math.min(STAT_BOUNDS.MAX, effect.value));
```

---

## 6. Faux positifs fréquents des agents IA sur ce projet

> Ces patterns ont été signalés comme bugs par des agents IA mais sont **corrects** dans ce projet.
> Ne pas les "corriger".

| Pattern signalé | Raison du faux positif |
|---|---|
| `batchDraw()` après `tr.nodes([node])` | `tr.nodes()` est une op impérative Konva → batchDraw REQUIS (§11) |
| `style={{ cursor }}` sur `<Stage>` | `<Stage>` est un wrapper `<div>` DOM, pas un nœud canvas |
| `ref.current = callback` hors useEffect | Pattern "latest ref" standard React — correct |
| `firstMood` string dans deps useEffect | Primitif comparé par valeur — pas de re-trigger parasite |
| `getState()` dans les stores Zustand actions | Tous dans handlers/callbacks — correct |
| `createJSONStorage(() => localStorage)` | Pas de SSR en Vite/Tauri — correct |
| `.splice()` dans `set()` Immer | Mutation directe dans Immer est le pattern voulu |
| `useGraphTheme()` retourne un objet | Retourne `GRAPH_THEMES[themeId]` — constante module-level, stable |

---

## 7. Identifier le composant par grep du texte visible — jamais par le nom

**Bug réel (session 2026-04-03) :** label "Mots à deviner" → supposé dans `MinigameChoiceBuilder` (nom proche) → édition du mauvais fichier. Le vrai composant était `MinigameFormPanel` (DialogueComposerV2).

**Règle :** avant toute modification UI, grep le texte visible exact dans `src/` pour localiser le composant qui rend réellement cette zone. Puis remonter la chaîne d'import pour confirmer le parent.

```bash
grep -r "Mots à deviner" src/ --include="*.tsx"
# → 0 résultat dans MinigameChoiceBuilder (hypothèse fausse)
# → 1 résultat dans MinigameFormPanel (fichier correct)
```

**Ne jamais supposer qu'un composant est "le bon" parce que son nom ressemble à la tâche.**

---

## 8. framer-motion invisible dans les overlays Tauri / WebView2

**Bug réel (session 2026-04-03) :** bouton quitter avec `motion.button` → invisible dans `MinigameOverlay` (3 tentatives échouées). WebView2 Tauri a des limitations de rendu sur les `motion.*` dans les contextes high z-index / overlay.

**Règle :** dans les overlays et composants à z-index élevé rendus dans Tauri, utiliser du HTML natif `<button>` avec `onMouseEnter`/`onMouseLeave` plutôt que `motion.button`. Framer-motion fonctionne dans les panneaux éditeur mais peut être invisible dans les overlays de preview.

```tsx
// ❌ MAUVAIS en overlay Tauri
<motion.button whileHover={{ scale: 1.1 }} ...>×</motion.button>

// ✅ BON — HTML natif + handlers inline
<button onMouseEnter={e => e.currentTarget.style.background = '...'} ...>×</button>
```

---

## 9. Agents — faux positifs sur imports cross-dossiers

**Bug réel (session 2026-04-03) :** agent Explore signale `ComposerFormPanel.tsx` comme code mort. Counter-grep montre : `DialogueComposerV2/index.tsx:15` l'importe depuis `../DialogueComposer/components/ComposerFormPanel`. L'agent a raté l'import cross-dossier.

**Règle :** avant toute suppression de fichier signalé "mort" par un agent, vérifier par grep :

```bash
grep -r "ComposerFormPanel" src/ --include="*.tsx" --include="*.ts"
# Si 0 résultat → mort confirmé
# Si N résultats → vérifier le contexte (import actif ou commenté ?)
```

**Faux positifs confirmés sur DialogueComposer/ v1 :**

| Fichier                                                 | Statut réel                            |
| ------------------------------------------------------- | -------------------------------------- |
| `DialogueComposer/index.tsx`                            | Mort — supprimé                        |
| `DialogueComposer/components/TypePillSelector.tsx`      | Mort — supprimé                        |
| `DialogueComposer/components/ComposerPreviewPanel.tsx`  | Mort — supprimé                        |
| `DialogueComposer/components/ComposerFormPanel.tsx`     | Actif — importé par DialogueComposerV2 |

---

---

## 11. useAnimate / WAAPI — ne supporte pas les CSS variables

**Bug réel (session 2026-04-04) :** `useAnimate` de framer-motion utilise la Web Animations API (WAAPI) en interne. La WAAPI **ignore silencieusement** les valeurs `var(--color-primary)` — elles ne sont pas résolues. Résultat : aucune animation visible.

**Règle :** pour animer des propriétés qui utilisent des CSS variables :
- ✅ CSS transitions natives (`transition: 'background 0.35s ease'` dans le style inline) — supporte `var()`
- ✅ `motion.span` déclaratif framer-motion avec des valeurs résolues (hex/rgba hardcodés)
- ❌ `useAnimate(element, { background: 'var(--color-primary)' })` — ignoré silencieusement

**Pattern validé :**
```tsx
// Constantes module-level avec valeurs résolues (lues depuis tokens.css)
const PRIMARY = '#8b5cf6';
const PRIMARY_GLOW = 'rgba(139,92,246,0.5)';

// CSS transition pour état stable (open/closed) — supporte les var()
<span style={{ background: open ? PRIMARY : BORDER_HOVER, transition: 'background 0.35s ease' }} />

// motion.span pour animations one-shot (particle) — valeurs résolues
<motion.span animate={{ opacity: [1, 0] }} style={{ background: PRIMARY }} />
```

---

## 10. CSS ::after qui génère du contenu structurel — auditer avant d'animer

**Bug réel (session 2026-04-04) :** `.sp-lbl::after` génère une ligne grise via CSS pseudo-élément (`content: ''`, `flex: 1`, `height: 1px`). Ajout d'une ligne React animée par-dessus → deux lignes superposées, effet à moitié visible.

**Règle :** avant d'animer un élément stylé par une classe CSS existante, toujours grep + lire le CSS pour vérifier les pseudo-éléments `::before` / `::after` qui génèrent du contenu structurel.

```bash
grep -A 10 "\.sp-lbl::after" src/styles/studio.css
```

**Fix pattern :** ajouter une classe modificatrice qui supprime le pseudo-élément CSS, puis piloter la ligne depuis React.

```css
.sp-lbl--animated::after { content: none; }  /* React prend le relais */
```

**Fichiers concernés :** `src/styles/studio.css` + `src/components/ui/CollapsibleSection.tsx`

---

**Dernière mise à jour :** 2026-04-04 par Claude Sonnet 4.6
