# AccessCity - AI Context Documentation

**Version**: 5.5.0 (stack moderne)
**Date**: 30 novembre 2025
**Pour**: GitHub Copilot, Claude Sonnet 4.5, IA agents

---

## VISION STRATEGIQUE

### Objectif Métier
- **Client**: APF France Handicap
- **Produit**: Éditeur de scènes narratives interactives + moteur de jeu accessible
- **Public cible**: Personnes en situation de handicap (trackball, eViacam, navigation clavier)
- **Cas d'usage**: Ateliers inclusion, formation, communication, storytelling accessible
- **Export final**: GDevelop (moteur de jeu 2D) avec variables narratives enrichies

### Philosophie Technique
- **Accessibilité d'abord**: Chaque feature doit être utilisable au clavier, trackball, lecteur d'écran
- **Modularité stricte**: Séparation claire core/services/ui/models/tests/docs
- **Stack moderne**: Vite, React, Playwright, Istanbul/c8, CI GitHub Actions
- **ASCII-only**: Code 100% ASCII (32-126) pour diff/patch/validation facile
- **Code complet uniquement**: Jamais de fragments, toujours fichiers entiers fonctionnels
- **Interopérabilité IA**: L’IA doit interagir avec tous les modules (core, UI, data, tests) via des schémas et API documentés.
- **Sécurité & éthique IA**: Respect de la confidentialité, auditabilité des décisions IA, transparence sur les données traitées.

---

## ARCHITECTURE ACTUELLE (v5.5)

### Structure Dossiers
```
AccessCity-Phase3-FINAL/
├── core/               # Modules fondamentaux (eventBus, sanitizer, schema, etc.)
├── ui/                 # Composants React/UI
├── data/               # Données JSON (scenes, characters, layouts, schemas)
├── test/               # Tests unitaires et d'intégration (Playwright, Node)
├── tools/              # Scripts d'automatisation (coverage, résumé, etc.)
├── assets/             # Images, backgrounds, sprites
├── docs/               # Documentation projet
├── .github/            # Workflows CI/CD
```

---

## BONNES PRATIQUES IA
- **Structuration claire** : sections délimitées, schémas, liens directs vers les fichiers et scripts.
- **Accessibilité** : garantir que les outils IA respectent les standards WCAG et sont utilisables par tous.
- **Exemples concrets** : cas d’usage IA (génération de scènes, validation de schémas, automatisation de tests).
- **Contribution** : expliquer comment améliorer le contexte IA, taguer les issues “AI”, encourager les PRs.
- **Versioning** : documenter les évolutions du contexte IA, tenir à jour la version et la date.
- **Nommage** : conventions claires pour les variables, schémas, prompts IA ([naming best practices](https://www.smashingmagazine.com/2024/05/naming-best-practices/)).

---

## EXEMPLES D’USAGE IA
- Génération automatique de scènes narratives à partir d’un prompt métier.
- Validation et correction de schémas JSON pour la structure des données.
- Automatisation des tests E2E et de la couverture via Playwright et c8.
- Suggestion de corrections de code ou de documentation selon les standards du projet.

---

## Principes fondamentaux & standards qualité

- Cohérence visuelle : respect du design system, uniformité dans la documentation et les schémas IA.
- Accessibilité : structure claire, respect des standards WCAG, feedback utilisateur explicite, contexte IA utilisable par tous.
- Inclusivité : langage neutre, contenu accessible à tous, documentation ouverte aux débutants et agents IA.
- Documentation actionnable et IA-friendly : exemples prêts à copier, sections bien délimitées, sémantique explicite, conventions de nommage et versioning clairs.
- Automatisation & CI/CD : validation automatisée, intégration continue des bonnes pratiques IA dans les workflows.
- Contribution : feedback encouragé, documentation et contexte IA à jour, conventions de commit.

> Ces principes guident l’intégration et l’évolution du contexte IA pour garantir une expérience optimale, accélérer le développement (+20 à +30 %), réduire les bugs et faciliter l’onboarding.

---

*Ce contexte IA intègre les meilleures pratiques open source (structuration, sécurité, accessibilité, contribution, versioning, exemples concrets) pour garantir la robustesse et l’éthique du projet.*
