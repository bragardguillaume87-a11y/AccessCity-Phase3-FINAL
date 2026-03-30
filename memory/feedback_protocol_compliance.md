---
name: feedback-protocol-compliance
description: Protocole Claude — éléments souvent sautés qui doivent être faits AVANT de coder
type: feedback
---

Ne pas sauter ces deux étapes même pour des tâches "simples" :

1. **WebSearch OBLIGATOIRE** — même pour une reorganisation UX ou un renommage. La raison : confirmer que les décisions structurelles sont alignées avec les conventions des outils comparables (ex: où placer mood selector, comment nommer un panneau global).

2. **Branche git dédiée AVANT de coder** — pas après. Format :
   - `feat/nom-du-chantier` pour nouvelles features/refactos
   - `fix/nom-du-bug` pour corrections

**Why:** Session 2026-03-24 — audit panneaux Dialogue+Texte effectué sans WebSearch et sans branche dédiée. L'utilisateur a signalé le manquement et demandé une vérification complète. Les deux étapes ont dû être rattrapées après coup.

**How to apply:** Checklist mentale avant le premier Edit :
- [ ] `git checkout -b feat/...` lancé ?
- [ ] WebSearch sur le domaine de la tâche lancée (même en background) ?
