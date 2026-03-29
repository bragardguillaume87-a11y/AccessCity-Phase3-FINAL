---
name: validated-patterns
description: Patterns confirmés corrects sur CE projet après grep + build réussi — ne pas remettre en question sans grep préalable
type: project
---

# Patterns validés — AccessCity VN Editor

> Capitalisé lors des audits rounds 2–5 (2026-03-28).
> Chaque entrée a été confirmée par grep + `npx tsc --noEmit` réussi.

---

## 1. Clés stables disponibles dans les types

`Dialogue` et `DialogueChoice` ont tous les deux un champ `id: string` — utiliser directement :
```typescript
dialogues.map(d => <div key={d.id} ... />)
dialogue.choices.map(c => <div key={c.id} ... />)
```
Source : `src/types/scenes.ts` lignes 167 et 208.

`StatEffect` n'a PAS d'id — utiliser `` `${effect.variable}-${effect.operation}-${idx}` ``.

---

## 2. EMPTY_* constants — pattern appliqué partout dans les stores Konva

Toutes les zones Konva utilisent déjà le pattern module-level constant :
```typescript
const EMPTY_GRID_TILES: MapData['layerInstances'][number]['gridTiles'] = [];
const EMPTY_BONES: CharacterRig['bones'] = [];
const EMPTY_PARTS: CharacterRig['parts'] = [];
```
Ne pas créer de doublon — vérifier par grep avant d'ajouter.

---

## 3. resolveCharacterSprite — ne pas réimplémenter inline

**Fichier :** `src/utils/characterUtils.ts` (ou `src/utils/`)
Fonction utilitaire qui résout l'URL d'un sprite depuis un personnage + mood.
Utilisée dans PreviewPlayer, DialoguePreviewOverlay, PreviewPanel.

```typescript
// ✅ BON
import { resolveCharacterSprite } from '@/utils/characterUtils';
const spriteUrl = resolveCharacterSprite(character, mood);

// ❌ MAUVAIS — réimplémenter inline
const sprite = char.sprites?.find(s => s.mood === mood)?.url ?? char.sprites?.[0]?.url;
```

---

## 4. isNarratorSpeaker — ne pas réimplémenter inline

**Fichier :** `src/utils/` ou `src/core/`
Guard pour détecter si le speaker est le narrateur (pas un personnage).

```typescript
// ✅ BON
import { isNarratorSpeaker } from '@/utils/';
if (isNarratorSpeaker(speakerId)) { ... }

// ❌ MAUVAIS — comparaisons inline non exhaustives
if (speakerId === 'narrator' || speakerId === '') { ... }
```

---

## 5. generateId — ne pas utiliser Math.random() inline

**Fichier :** `src/utils/generateId.ts`
```typescript
import { generateId } from '@/utils/generateId';
const id = generateId('scene');  // → 'scene-abc123'
```
Ne pas remplacer par `Math.random().toString(36)` — generateId garantit le préfixe domain + unicité.

---

## 6. DialogueBox — deux callers parallèles

Toute prop ajoutée à `DialogueBox` doit être passée dans les **deux** callers :
- `src/components/panels/PreviewPlayer/index.tsx`
- `src/components/panels/MainCanvas/components/DialoguePreviewOverlay.tsx`

TypeScript ne détecte pas les omissions car les props ont des valeurs par défaut.
Voir `memory/feedback_dual_caller_pattern.md` pour le détail.

---

## 7. Zone Konva — patterns déjà appliqués (ne pas "corriger")

La zone `src/components/modules/TopdownEditor/MapCanvas.tsx` et associés est **déjà conforme** à `konva-patterns.md`. Spécifiquement :
- `stage.destroy()` intentionnellement absent (react-konva 19 gère le cleanup)
- `batchDraw()` après `tr.nodes()` : correct (opération impérative)
- `style={{ cursor }}` sur `<Stage>` : correct (`<Stage>` = wrapper DOM div)
- Toutes les constantes `EMPTY_*` en module-level
- `listening={false}` sur toutes les couches non-interactives
- Guards StrictMode sur le Transformer (`if (!tr.getStage()) return`)

Audit complet confirmé le 2026-03-28 : **0 bug trouvé dans la zone Konva**.

---

## 8. Stores Zustand — patterns d'import confirmés corrects

```typescript
// ✅ Selector avec useShallow pour plusieurs actions
const { addScene, deleteScene } = useScenesStore(
  useShallow(s => ({ addScene: s.addScene, deleteScene: s.deleteScene }))
);

// ✅ getState() dans un handler — correct
const handleDuplicate = useCallback(() => {
  const chars = useSceneElementsStore.getState().getCharactersForScene(id);
}, [id]);

// ✅ createJSONStorage(() => localStorage) — correct en Vite/Tauri (pas de SSR)
```

---

**Dernière mise à jour :** 2026-03-28 par Claude Sonnet 4.6 (audits rounds 2–5)
