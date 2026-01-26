Pipeline qualité - AccessCity Studio
Outils de qualité
Tests

Jest : Framework de test unitaire et d'intégration
React Testing Library : Tests de composants orientés utilisateur
@testing-library/jest-dom : Matchers personnalisés pour le DOM
@testing-library/user-event : Simulation d'interactions utilisateur

Qualité du code

ESLint : Analyse statique et détection d'erreurs
Prettier : Formatage automatique du code
TypeScript : Vérification de types (si configuré)

Couverture

Jest Coverage : Rapport de couverture de code
Formats : HTML, JSON, LCOV, text

Outils complémentaires

Husky : Git hooks (recommandé)
lint-staged : Linting sur fichiers stagés (recommandé)
commitlint : Validation des messages de commit (recommandé)


Configuration
ESLint
Fichier : .eslintrc.cjs
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended', // Accessibilité
    'prettier', // Désactive les règles conflictuelles avec Prettier
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  plugins: ['react-refresh', 'jsx-a11y'],
  rules: {
    // React
    'react/prop-types': 'warn',
    'react/jsx-no-target-blank': 'error',
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    
    // Accessibilité
    'jsx-a11y/anchor-is-valid': 'warn',
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',
    
    // Bonnes pratiques
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-debugger': 'warn',
    
    // Code quality
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
  },
  ignorePatterns: ['dist', 'node_modules', 'coverage'],
};
Prettier
Fichier : .prettierrc.json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "jsxSingleQuote": false,
  "jsxBracketSameLine": false
}
Fichier : .prettierignore
# Build
dist
build
coverage

# Dependencies
node_modules

# Config
pnpm-lock.yaml
package-lock.json
yarn.lock

# Env
.env
.env.*

# IDE
.vscode
.idea
Jest
Fichier : jest.config.js
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/tests/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', { configFile: './babel.config.test.cjs' }],
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/**/*.test.{js,jsx}',
    '!src/**/__tests__/**',
    '!src/tests/**',
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 75,
      statements: 75,
    },
  },
  coverageReporters: ['text', 'html', 'lcov', 'json-summary'],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
};
Babel (pour Jest)
Fichier : babel.config.test.cjs
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
};
Configuration Vite pour les tests
Ajout dans vite.config.js (optionnel, si utilisation de Vitest)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
  },
});

Scripts disponibles
Package.json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2",
    
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext js,jsx --fix",
    
    "format": "prettier --write \"src/**/*.{js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{js,jsx,json,css,md}\"",
    
    "quality": "npm run lint && npm run format:check && npm run test:coverage",
    "quality:fix": "npm run lint:fix && npm run format && npm run test",
    
    "prepare": "husky install"
  }
}
Descriptions des scripts



Script
Description



npm run lint
Vérifie les erreurs ESLint


npm run lint:fix
Corrige automatiquement les erreurs ESLint


npm run format
Formate le code avec Prettier


npm run format:check
Vérifie le formatage sans modifier


npm run test
Lance tous les tests


npm run test:watch
Tests en mode watch


npm run test:coverage
Tests avec rapport de couverture


npm run quality
Exécute toutes les vérifications


npm run quality:fix
Corrige et vérifie la qualité



Checklist pré-commit
Vérifications automatiques
# 1. Formater le code
npm run format

# 2. Vérifier le linting
npm run lint:fix

# 3. Lancer les tests concernés
npm run test -- --onlyChanged

# 4. Vérifier les types (si TypeScript)
# npm run type-check
Vérifications manuelles

 Le code compile sans erreur (npm run build)
 Pas de console.log ou debugger oubliés
 Les nouveaux composants ont des tests
 Les props sont documentées
 L'accessibilité est respectée (labels, aria-*)
 Les messages de commit suivent la convention

Configuration Husky (recommandé)
Installation :
npm install -D husky lint-staged
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
Fichier : .lintstagedrc.json
{
  "*.{js,jsx}": [
    "eslint --fix",
    "prettier --write",
    "jest --bail --findRelatedTests"
  ],
  "*.{json,css,md}": [
    "prettier --write"
  ]
}

Checklist pré-PR
Tests et qualité
# Pipeline de qualité complète
npm run quality

# OU étape par étape :
npm run lint          # Pas d'erreurs ESLint
npm run format:check  # Code formaté
npm run test:coverage # Couverture >= seuils
npm run build         # Build réussi
Checklist détaillée
Code

 Pas d'erreurs ESLint (0 warnings max autorisés)
 Code formaté avec Prettier
 Pas de code commenté ou TODO non nécessaires
 Variables et fonctions bien nommées
 Pas de duplication de code

Tests

 Tous les tests passent
 Couverture globale ≥ 75%
 Nouveaux composants testés (≥ 80%)
 Tests des cas limites (erreurs, loading, vide)
 Tests d'accessibilité (roles, labels)

Accessibilité

 Tous les formulaires ont des labels
 Navigation au clavier fonctionnelle
 Contraste suffisant (WCAG AA minimum)
 Attributs ARIA appropriés
 Pas d'erreurs d'accessibilité ESLint

Documentation

 README.md à jour si nécessaire
 Commentaires JSDoc pour fonctions complexes
 PropTypes ou TypeScript types définis
 Changements documentés dans CHANGELOG.md

Performance

 Pas de re-renders inutiles
 Mémoïsation appropriée (useMemo, useCallback)
 Images optimisées
 Bundle size acceptable

Sécurité

 Pas de données sensibles en dur
 Validation des entrées utilisateur
 Pas de dangerouslySetInnerHTML sans sanitization
 Dépendances à jour (npm audit)

Commande complète de validation
#!/bin/bash
# pre-pr-check.sh

echo "🔍 Vérification pré-PR..."

echo "\n📝 Linting..."
npm run lint || exit 1

echo "\n✨ Formatage..."
npm run format:check || exit 1

echo "\n🧪 Tests..."
npm run test:coverage || exit 1

echo "\n🔨 Build..."
npm run build || exit 1

echo "\n✅ Tous les contrôles sont passés !"
echo "📊 Consultez coverage/index.html pour les détails"

CI/CD (futur)
GitHub Actions
Fichier : .github/workflows/quality.yml
name: Quality Check

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  quality:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Format check
        run: npm run format:check

      - name: Run tests
        run: npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: accesscity-coverage

      - name: Build
        run: npm run build

      - name: Check bundle size
        run: npx bundlesize

  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - name: Run accessibility tests
        run: npm run test:a11y # À créer
GitLab CI
Fichier : .gitlab-ci.yml
image: node:18

stages:
  - install
  - quality
  - test
  - build

cache:
  paths:
    - node_modules/

install:
  stage: install
  script:
    - npm ci
  artifacts:
    paths:
      - node_modules/

lint:
  stage: quality
  script:
    - npm run lint
    - npm run format:check

test:
  stage: test
  script:
    - npm run test:ci
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

build:
  stage: build
  script:
    - npm run build
  artifacts:
    paths:
      - dist/
  only:
    - main
    - develop

Seuils de qualité
Couverture de code



Métrique
Minimum
Cible
Excellent



Lignes (lines)
75%
80%
90%


Branches
70%
75%
85%


Fonctions
70%
80%
90%


Statements
75%
80%
90%


Complexité

Complexité cyclomatique : < 10 par fonction
Profondeur d'imbrication : < 4 niveaux
Longueur de fonction : < 50 lignes (idéalement)
Longueur de fichier : < 300 lignes (idéalement)

Performance

Build time : < 30 secondes
Test execution : < 10 secondes
Bundle size (gzipped) :
Total : < 200 KB
Initial chunk : < 100 KB
Vendor chunk : < 150 KB



Accessibilité

Violations ESLint a11y : 0
Contraste : WCAG AA minimum (4.5:1)
Navigation clavier : 100% fonctionnelle
Screen reader : Compatible

Linting

Erreurs ESLint : 0
Warnings ESLint : 0 (max 5 toléré temporairement)
Code non formaté : 0 fichiers


Workflow complet
Développement quotidien
# 1. Créer une branche
git checkout -b feature/nouvelle-fonctionnalite

# 2. Développer avec feedback immédiat
npm run dev
npm run test:watch  # Dans un autre terminal

# 3. Avant chaque commit
npm run quality:fix

# 4. Commit
git add .
git commit -m "feat: ajoute nouvelle fonctionnalité"
Avant une Pull Request
# 1. Mettre à jour depuis main
git checkout main
git pull origin main
git checkout feature/ma-branche
git rebase main

# 2. Vérification complète
npm run quality

# 3. Vérifier le build
npm run build
npm run preview

# 4. Push et créer la PR
git push origin feature/ma-branche
Revue de code
Pour le reviewer :
# 1. Récupérer la branche
git fetch origin
git checkout feature/branche-a-reviewer

# 2. Installer et tester
npm install
npm run quality
npm run dev

# 3. Vérifier manuellement
# - Fonctionnalités
# - Accessibilité (clavier, lecteur d'écran)
# - Responsive
# - Performance

Outils de monitoring
Badges pour README
![Tests](https://github.com/username/accesscity/workflows/quality/badge.svg)
![Coverage](https://codecov.io/gh/username/accesscity/branch/main/graph/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
Rapports générés
# Après npm run test:coverage
open coverage/index.html        # Rapport de couverture

# Analyse du bundle
npm run build
npx vite-bundle-visualizer      # Visualisation du bundle
Métriques à suivre

Code coverage : Tendance de la couverture
Test duration : Temps d'exécution des tests
Build time : Temps de compilation
Bundle size : Taille des bundles générés
Eslint errors : Nombre d'erreurs/warnings
Dependencies : Vulnérabilités (npm audit)


Dernière mise à jour : Décembre 2024Mainteneur : Équipe AccessCity