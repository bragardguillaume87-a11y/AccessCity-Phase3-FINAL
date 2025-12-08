# Principes fondamentaux & standards qualité

> **Statut** : ✅ À jour pour le Scenario Editor MVP  
> **Dernière mise à jour** : Décembre 2025

- Cohérence visuelle : respect du design system, tokens centralisés, modularité.
- Accessibilité : conformité WCAG, navigation clavier, aria, feedback utilisateur explicite.
- Inclusivité : langage neutre, accueil des débutants, contenu accessible à tous.
- Documentation actionnable et IA-friendly : exemples prêts à copier, sections bien délimitées, sémantique explicite.
- Automatisation & CI/CD : scripts clairs, pipeline robuste, artefacts coverage.
- Contribution : workflow PR, guide, code of conduct, conventions de commit.

> Ces principes garantissent une expérience optimale, accélèrent la contribution (+20 à +30 %), réduisent les bugs et facilitent l’onboarding.

---

# Contributing

Bienvenue et merci de contribuer à AccessCity ! Ce projet accueille toutes les contributions : code, documentation, design, organisation, accessibilité, sécurité, etc. Les débutants et non-développeurs sont encouragés à participer.

## Avant de contribuer
- Lisez le README, le changelog et les issues existantes.
- Vérifiez que le projet est actif et accueillant.
- Respectez le code de conduite (si présent).

## Types de contributions acceptées
- Code (core, UI, tests)
- Documentation et guides
- Design, accessibilité, organisation
- Support, relecture, triage d'issues
- Sécurité (signaler une faille par email ou issue privée)

## Processus de contribution
1. Forkez le projet et créez une branche dédiée.
2. Décrivez clairement votre PR (liée à une issue si possible, précisez si WIP).
3. Testez vos modifications (voir section Tests et CI/CD).
4. Respectez le style et les conventions du projet (noms, modularité, ASCII Only).
5. Privilégiez les échanges publics (issues, PR), soyez concis et respectueux.
6. Soyez ouvert aux retours et aux demandes de modification.

## Tests et CI/CD
- Lancer les tests :
  ```pwsh
  npm test
  npm run e2e:vite
  ```
- Vérifier la couverture :
  ```pwsh
  npm run coverage
  npm run coverage:merge
  npm run coverage:reports
  ```
- Vérifier que la CI passe avant tout commit ou PR.

## Documentation
- Mettez à jour les guides et README si vous ajoutez ou modifiez des fonctionnalités.
- Documentez les nouveaux scripts npm ou workflows CI.

## Bonnes pratiques
- Privilégiez le code auto-documenté et la clarté des noms.
- Respectez la modularité et la structure des dossiers (core/, ui/, data/, test/, tools/, assets/, docs/).
- Relisez PROJECT_MEMORY_SEED.md pour la vision et les règles.
- Encouragez l'accessibilité et l'inclusion dans toutes les contributions.

## Code de conduite
- Adoptez un comportement respectueux et inclusif. Si un code de conduite est présent, veuillez le lire et le respecter.

## Ressources utiles
- [Guide GitHub : Comment contribuer à l'Open Source](https://opensource.guide/fr/how-to-contribute/)
- [Exemple de Pull Request](https://github.com/Roshanjossey/first-contributions)
- [Conventions de nommage](https://www.smashingmagazine.com/2024/05/naming-best-practices/)

---
Merci pour votre contribution ! N'hésitez pas à ouvrir une issue pour toute question ou suggestion.
