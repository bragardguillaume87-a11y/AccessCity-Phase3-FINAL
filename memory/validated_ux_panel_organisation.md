---
name: validated-ux-panel-organisation-dialogue-style
description: Organisation confirmée des panneaux Dialogue + Style — nommage, ordre des sections, indicateur global (audit 2026-03-24)
type: project
---

## Panneaux UnifiedPanel — état validé après audit 2026-03-24

### Nommage des icônes sidebar (`src/types/ui.ts → SECTION_LABELS`)

| SectionId | Label actuel | Raison |
|---|---|---|
| `dialogue` | `'Dialogue'` | Contenu per-dialogue (personnage, texte, choix) |
| `text` | `'Style'` | Styles globaux projet — renommé depuis 'Texte' pour éviter la collision sémantique |

**Why:** Le mot "Texte" désignait deux choses : l'éditeur rich text dans Dialogue ET le panneau de styles globaux. Renommé en "Style" (validé par l'utilisateur après présentation de 3 options : Boîte / Style / Apparence).

⚠️ Note WebSearch (2026-03-24) : "Appearance" serait plus idiomatique pour un public jeu (Godot/Unity). "Style" reste correct pour un public web/Figma. Décision utilisateur = "Style".

**How to apply:** Ne pas re-renommer sans accord utilisateur.

---

### Ordre des sections dans DialogueBoxSection (`src/components/panels/UnifiedPanel/DialogueBoxSection.tsx`)

Ordre validé :
1. **Personnage** — sélecteur speaker
2. **Humeurs** — mood cards (conditionnel: si personnages dans la scène)
3. **Texte** — éditeur rich text
4. **Choix** — accordéon
5. **Effet sonore** — accordéon SFX + voix

**Why:** HUMEURS est sémantiquement lié au PERSONNAGE (qui parle + comment il le dit). Confirmé par WebSearch : les éditeurs VN (Ren'Py, TyranoBuilder) co-localisent mood et character selection.

---

### Indicateur "paramètre global" (`SectionContentPanel.tsx`)

Implémentation : sous-titre discret sous le titre quand `activeSection === 'text'`.
Texte : "Tous les dialogues du projet"

**Why:** Confirmé par WebSearch (Unity, Godot, Figma) — muted text sous le header est le pattern cross-tool pour indiquer la portée globale.

---

### ALIGNEMENT DU NOM — section correcte (`TextSection.tsx`)

Appartient à **NOM DU PERSONNAGE**, PAS à PORTRAIT.
Contrôle l'alignement du *texte* du nom (Auto/Toujours gauche), pas du portrait image.
