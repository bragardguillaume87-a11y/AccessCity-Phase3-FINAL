---
name: dual-caller-dialoguebox-pattern
description: Any new prop added to DialogueBox must be passed in BOTH PreviewPlayer AND DialoguePreviewOverlay — TypeScript won't catch omissions because props have defaults
type: feedback
---

Toute nouvelle prop ajoutée à `<DialogueBox>` doit être passée dans **deux endroits** :
- `src/components/panels/PreviewPlayer/index.tsx`
- `src/components/panels/MainCanvas/components/DialoguePreviewOverlay.tsx`

**Why:** Ces deux composants sont des callers parallèles de `DialogueBox`. Les nouvelles props ont des valeurs par défaut (`isNarrator = false`, etc.), donc TypeScript ne signale pas une prop manquante — le build passe, mais le comportement est silencieusement absent dans l'éditeur.

Ce pattern a causé deux bugs distincts :
1. `isNarrator` prop manquante dans `DialoguePreviewOverlay` → style narrateur visible en preview mais invisible dans l'éditeur (session 2026-03-23)
2. `VisualFilterLayer` manquant dans l'un des callers (session précédente)

**How to apply:** Dès qu'on ajoute une prop à `DialogueBox` (ou qu'on en modifie le comportement), chercher immédiatement les deux callers :
```bash
grep -r "DialogueBox" src/ --include="*.tsx" -l
```
Et s'assurer que la prop est passée dans les deux. Documenter dans le PR comment les deux callers ont été mis à jour.
