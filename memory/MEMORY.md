# MEMORY INDEX

> Pointeurs vers les fichiers mémoire persistants.
> Ne pas écrire le contenu ici — ce fichier est un index uniquement.

## Feedback (comportements à maintenir)

- [feedback_dual_caller_pattern.md](feedback_dual_caller_pattern.md) — DialogueBox doit être passée dans PreviewPlayer ET DialoguePreviewOverlay
- [feedback_protocol_compliance.md](feedback_protocol_compliance.md) — Protocole Claude : WebSearch obligatoire + branche git avant de coder
- [feedback_visual_review_protocol.md](feedback_visual_review_protocol.md) — Puppeteer autonome sur localhost:5173 = workflow principal pour révisions visuelles (3 niveaux)

## Patterns validés

- [validated_ux_panel_organisation.md](validated_ux_panel_organisation.md) — Organisation confirmée des panneaux Dialogue + Style (audit 2026-03-24)
- [validated_patterns.md](validated_patterns.md) — clés stables disponibles, zone Konva déjà conforme, resolveCharacterSprite, generateId, dual-caller DialogueBox (audit 2026-03-28)

## Direction de design

- [project_design_direction.md](project_design_direction.md) — Référence visuelle validée : macOS, NSGroupBox cards, pills, contraste actif/inactif (2026-04-04)

## Hallucinations connues

- [hallucination_patterns.md](hallucination_patterns.md) — key={idx} zones corrigées, fuites audio, faux positifs agents IA, grep texte visible, framer-motion Tauri overlays, imports cross-dossiers (mise à jour 2026-04-03)
