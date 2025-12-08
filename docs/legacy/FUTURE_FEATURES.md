# Principes fondamentaux & standards qualité

- Cohérence visuelle : respect du design system, tokens centralisés, modularité pour chaque nouvelle fonctionnalité.
- Accessibilité : conformité WCAG, navigation clavier, aria, feedback utilisateur explicite, prise en compte dans chaque évolution.
- Inclusivité : langage neutre, contenu accessible à tous, roadmap ouverte aux débutants et agents IA.
- Documentation actionnable et IA-friendly : exemples prêts à copier, sections bien délimitées, sémantique explicite, documentation avant suppression ou migration.
- Automatisation & CI/CD : scripts clairs, validation automatisée, intégration continue des bonnes pratiques.
- Contribution : workflow PR, guide, code of conduct, conventions de commit, feedback encouragé.

> Ces principes guident l’ajout et la migration des futures fonctionnalités pour garantir une expérience optimale, accélérer le développement (+20 à +30 %), réduire les bugs et faciliter l’onboarding.

---

# FUTURE FEATURES (Modules préparés mais non activés)

> **Contexte technique :** Ce projet utilise désormais Vite, React et TypeScript. Les modules listés ci-dessous sont à adapter ou migrer selon la roadmap moderne.

## Modules "Patch" (Prêts pour Phase 6.0)
- `core/applyScenesPatch.js` - Application incrémentale de patches scènes
- `core/applyUiLayoutPatch.js` - Application incrémentale de patches UI
- **Usage futur** : Permettre modifications partielles sans recharger tout

## Panneaux UI additionnels (Masqués)
- `ui/DevToolsPanel.js` - Panneau debug (écoute event 'ready')
- `ui/DialogueList.js` - Liste dialogues isolée
- **Activation** : Mettre `visible: true` dans `ui_layout.json`

## Fichiers legacy/inutilisés
- `test/test-phase3.js` - Stub vide (legacy)
- `test/run-all.js` - À implémenter pour lancer tous tests
- `test-direct.html` - Mode debug standalone

## Notes
- Ces modules sont fonctionnels mais non intégrés
- Garder pour compatibilité ascendante
- Documenter avant suppression
