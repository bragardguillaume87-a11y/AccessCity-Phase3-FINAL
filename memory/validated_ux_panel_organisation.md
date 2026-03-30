---
name: validated-ux-panel-organisation-dialogue-style
description: Organisation confirmée des panneaux Dialogue + Style — nommage, ordre des sections, indicateur global (audit 2026-03-24)
type: project
---

# Panneaux UnifiedPanel — état validé après audit 2026-03-24

## Nommage des icônes sidebar (`src/types/ui.ts → SECTION_LABELS`)

| SectionId | Label actuel | Raison |
| --- | --- | --- |
| `dialogue` | `'Dialogue'` | Contenu per-dialogue (personnage, texte, choix) |
| `text` | `'Style'` | Styles globaux projet — renommé depuis 'Texte' pour éviter la collision sémantique |

**Why:** Le mot "Texte" désignait deux choses : l'éditeur rich text dans Dialogue ET le panneau de styles globaux. Renommé en "Style" (validé par l'utilisateur après présentation de 3 options : Boîte / Style / Apparence).

⚠️ Note WebSearch (2026-03-24) : "Appearance" serait plus idiomatique pour un public jeu (Godot/Unity). "Style" reste correct pour un public web/Figma. Décision utilisateur = "Style".

**How to apply:** Ne pas re-renommer sans accord utilisateur.

---

## Ordre des sections dans DialogueBoxSection

Fichier : `src/components/panels/UnifiedPanel/DialogueBoxSection.tsx`

Ordre validé :

1. **Personnage** — sélecteur speaker
2. **Humeurs** — mood cards (conditionnel: si personnages dans la scène)
3. **Texte** — éditeur rich text
4. **Choix** — accordéon
5. **Effet sonore** — accordéon SFX + voix

**Why:** HUMEURS est sémantiquement lié au PERSONNAGE (qui parle + comment il le dit).
Confirmé par WebSearch 7 sources (2026-03-24) :

- **Articy:draft** (référence industrie narrative game) : l'émotion/expression est rendue *directement à l'intérieur ou en dessous* du nœud speaker — "character context owns the expression context"
- **TyranoBuilder** : character selection + emotion sont dans le même bloc drag-drop
- **Ren'Py** : `show character emotion` est syntaxiquement adjacent à l'identifiant du personnage — une seule unité logique
- **Visual Novel Maker (Degica)** : expression = sub-option de l'étape de placement du personnage

Principe Gestalt : les contrôles dépendants contextuellement appartiennent au même groupe visuel.

---

## Nommage 'Style' pour le panneau global

Fichier : `src/types/ui.ts → SECTION_LABELS.text`

**Why:** Confirmé par WebSearch (Figma, WordPress Gutenberg) :

- **Figma** : "Text Properties" = per-layer (local) ; "Text Styles" = reusable, project-scoped (global). Le mot *Style* porte la sémantique "réutilisable, global".
- **WordPress Gutenberg** : onglet "Block" = par-bloc ; onglet "Styles" = design system global.
- L'ancien label "Texte" était ambigu (contenu ? apparence ?). "Style" lève l'ambiguïté.

Sources : Figma Help (360039956634, 360039957034), WordPress Gutenberg docs.

---

## Indicateur "paramètre global" (`SectionContentPanel.tsx`)

Implémentation : sous-titre discret sous le titre quand `activeSection === 'text'`.
Texte : "Tous les dialogues du projet"

**Why:** Confirmé par WebSearch :

- **Unity** : blue vertical line + bold label = override indicator (pattern industriel de référence)
- **WordPress Customizer** : breadcrumb de scope dans le header de section
- **Figma** : nom de la bibliothèque en sous-header sous les styles groupés
- Le sous-titre texte est l'équivalent du "blue line" Unity — self-documenting sans apprendre un langage d'icônes.

Sources : Unity Manual PrefabInstanceOverrides, Articy:draft docs.

---

## Seuil d'escalade — si TextSection dépasse 6 PanelSection

État actuel : **6 sections** (APERÇU, TEXTE, APPARENCE, PORTRAIT, NOM DU PERSONNAGE, NARRATEUR).

W3C WAI + NNGroup : seuil recommandé = 5–6. Au-delà, introduire des **onglets** (pas plus de sous-accordéons).
Pattern de référence : Unity Inspector (Transform/Rendering/Physics en tabs), VS Code (Editor/Workbench/Extensions), Figma (Design/Prototype/Inspect).

Prochaine étape si besoin : tab bar `PRÉSENTATION | APPARENCE | NARRATEUR` avec accordéons à l'intérieur de chaque onglet.

Sources : W3C WAI ARIA APG, NNGroup accordions-on-desktop, Smashing Magazine accordion checklist.

---

## ALIGNEMENT DU NOM — section correcte (`TextSection.tsx`)

Appartient à **NOM DU PERSONNAGE**, PAS à PORTRAIT.
Contrôle l'alignement du *texte* du nom (Auto/Toujours gauche), pas du portrait image.
