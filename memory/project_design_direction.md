---
name: project-design-direction
description: Direction artistique et décisions de design validées pour l'éditeur AccessCity — référence visuelle pour toutes les sessions
type: project
---

# Direction de design — AccessCity Editor

> Capitalisé le 2026-04-04 depuis les sessions de refonte UI (Vague 12+).
> Ces décisions ont été validées visuellement par l'utilisateur.
> **Why:** Éviter de repartir de zéro à chaque session sur la direction artistique.
> **How to apply:** Avant toute modification UI, vérifier que la direction proposée est cohérente avec ces choix.

---

## Référence visuelle principale — macOS

Le langage de design cible est **macOS** : élégance, lisibilité, hiérarchie claire, composants qui respirent.
Pas Figma (trop technique), pas Material Design (trop coloré), pas Windows (trop plat).

Quand on hésite entre deux options visuelles → choisir celle qui ressemble le plus à une app macOS native.

---

## Pattern de card validé — NSGroupBox

Toutes les sections de panneau utilisent ce style :

```
background : rgba(255,255,255,0.03)
border     : 1px solid rgba(255,255,255,0.08)
borderRadius : 10-12px
padding    : 10-12px
```

**Cartes actives** (toggle ON) :
```
background  : rgba(139,92,246,0.08)
border      : 1px solid rgba(139,92,246,0.22)
borderLeft  : 3px solid var(--color-primary)
```

Ce pattern est appliqué dans : EffectsSection, DialogueBoxSection (Personnage, Texte, Humeurs, Choix, Effet sonore), AtmosphereSection.

---

## Icônes — pill container

Les icônes dans les headers de section ne flottent pas seules.
Elles sont dans une **pill 22×28px** avec fond teinté de la couleur de la section :

| Section | Couleur pill |
|---|---|
| Humeurs | `rgba(16,185,129,0.18)` — vert emerald |
| Choix | `rgba(139,92,246,0.18)` — violet |
| Effet sonore | `rgba(245,158,11,0.18)` — amber |
| Effets animation | `rgba(139,92,246,0.22)` quand actif |

---

## Titres de section — sp-lbl style

```
fontSize      : 12px
fontWeight    : 700
textTransform : uppercase
letterSpacing : 1px
color         : var(--color-text-primary)  ← blanc pur, pas muted
background    : rgba(255,255,255,0.05)
padding       : 5px 8px
borderRadius  : 5px
```

Pas de couleur accent sur les titres (vert, violet, amber) — blanc pur uniquement.
La couleur accent est réservée aux icônes et aux états actifs.

---

## Chips / boutons de sélection

État actif : fond plein `var(--color-primary)` + texte blanc + ombre `rgba(139,92,246,0.3)`
État inactif : fond `rgba(255,255,255,0.05)` + texte `var(--color-text-secondary)`

Scroll horizontal sans scrollbar visible (`scrollbarWidth: 'none'`) quand il y a beaucoup de chips.

---

## Emoji dans les composants

Les emojis sont des **pill containers** carrés (28×28px, borderRadius 7) :
- Actif : `rgba(139,92,246,0.22)` + emoji pleine couleur
- Inactif : `rgba(255,255,255,0.07)` + `filter: grayscale(1) opacity(0.45)`

---

## Hiérarchie de contraste — états actif/inactif

L'utilisateur doit distinguer au premier coup d'œil ce qui est activé :

| Élément | Actif | Inactif |
|---|---|---|
| Label de card | `--color-text-primary` (100%) | `--color-text-muted` (62%) |
| Emoji pill | Couleur pleine | Grayscale + opacity 45% |
| Border card | Violet `rgba(139,92,246,0.22)` | Quasi-invisible `rgba(255,255,255,0.07)` |
| Border left | 3px solid violet | 3px transparent |

---

## Hover feedback — Miyamoto §1.1

Toute carte interactive doit réagir au survol en < 100ms :
- `translateY(-2px)` + `boxShadow: 0 4px 12px rgba(0,0,0,0.3)`
- Fond légèrement plus lumineux sur les cartes inactives

---

## Panneaux validés comme référence

- **EffectsSection** après refonte 2026-04-04 = référence pour les autres panneaux
- **DialogueBoxSection** après refonte 2026-04-04 = référence pour les sections accordéon

---

## Ce qui N'EST PAS la direction

- Pas de couleurs accent hardcodées (pas de `#10b981` en dur — utiliser les CSS variables)
- Pas de borders visibles et colorées sur les sections inactives
- Pas de titres de section en couleur (emerald, purple, amber) — c'était l'ancien style
- Pas de layout avec trop de vide (Will Wright §4.2 — taux d'utilisation ≥ 70%)

---

**Dernière mise à jour :** 2026-04-04 par Claude Sonnet 4.6
