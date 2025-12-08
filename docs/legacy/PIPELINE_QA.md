# Principes fondamentaux & standards qualité

- Cohérence visuelle : respect du design system, modularité et uniformité dans les scripts et tests.
- Accessibilité : conformité WCAG, vérification a11y dans la QA, feedback utilisateur explicite.
- Inclusivité : langage neutre, contenu accessible à tous, QA ouverte aux débutants et agents IA.
- Documentation actionnable et IA-friendly : exemples prêts à copier, sections bien délimitées, sémantique explicite, liens vers les scripts et workflows.
- Automatisation & CI/CD : scripts clairs, validation automatisée, intégration continue des bonnes pratiques.
- Contribution : feedback encouragé, documentation et scripts à jour, conventions de commit.

> Ces principes guident le pipeline QA pour garantir une expérience optimale, accélérer le développement (+20 à +30 %), réduire les bugs et faciliter l’onboarding.

## Vérification & Statut (fusionné)

### Principes fondamentaux & standards qualité
- Cohérence visuelle : respect du design system et des standards qualité dans la vérification.
- Accessibilité : conformité WCAG, feedback utilisateur explicite, rapport accessible à tous.
- Inclusivité : langage neutre, contenu accessible à tous, rapport utilisable par IA et humains.
- Documentation actionnable et IA-friendly : sections bien délimitées, sémantique explicite, exemples de statuts et dates.
- Automatisation & CI/CD : validation automatisée, intégration continue des bonnes pratiques.
- Contribution : feedback encouragé, rapport à jour, conventions de commit.

> Ces principes garantissent la fiabilité et la traçabilité des vérifications, facilitent l’onboarding et accélèrent la maintenance.

#### Rapport de vérification
- Status: PASSED
- Date: 2025-11-20

---

# QA Pipeline

Ce projet utilise une stack moderne : Vite, React, TypeScript, Playwright (tests E2E), c8/Istanbul (couverture), GitHub Actions (CI).

1. **ASCII Check**
   - Script : `test/ascii-check.js` (vérifie l'encodage et la conformité des fichiers)
2. **Unit Tests**
   - Framework : Playwright (via `npx playwright test`)
   - Couverture : c8/Istanbul (`npx c8 --reporter=lcov npx playwright test`)
3. **Integration Tests**
   - Playwright, scénarios complexes, mock API si besoin
4. **Manual Verification**
   - Vérification UI/UX, accessibilité, tests exploratoires
5. **CI/CD**
   - Pipeline GitHub Actions : build, test, coverage, déploiement

> Pour plus de détails, voir `package.json` (scripts) et `.github/workflows/ci.yml`.
