Je vais lire ces deux fichiers et les fusionner selon votre structure.
# Guide de contribution - AccessCity Studio

> **Statut** : ✅ À jour  
> **Dernière mise à jour** : 17 décembre 2024  

## 1. Objectifs du projet

AccessCity Studio est une plateforme collaborative dédiée à l'amélioration de l'accessibilité urbaine. Le projet vise à :

- **Centraliser les données d'accessibilité** : Collecter et structurer les informations sur l'accessibilité des lieux publics
- **Faciliter la contribution citoyenne** : Permettre à tous de signaler et documenter les problèmes d'accessibilité
- **Améliorer l'expérience utilisateur** : Offrir une interface intuitive et accessible à tous les utilisateurs
- **Garantir la qualité du code** : Maintenir des standards élevés de développement et de documentation

### Valeurs fondamentales

- **Accessibilité first** : Chaque fonctionnalité doit être accessible (WCAG 2.1 AA minimum)
- **Qualité avant quantité** : Préférer du code bien testé et documenté
- **Collaboration** : Favoriser les échanges et les revues de code constructives
- **Transparence** : Documenter les décisions et maintenir une communication claire

## 2. Workflow de contribution

### 2.1 Préparation

1. **Fork** le dépôt principal
2. **Clone** votre fork localement :
   ```bash
   git clone https://github.com/VOTRE-USERNAME/AccessCity-Phase3-FINAL.git
   cd AccessCity-Phase3-FINAL

Configure le remote upstream :git remote add upstream https://github.com/bragardguillaume87-a11y/AccessCity-Phase3-FINAL.git

Installe les dépendances :npm install


2.2 Développement

Crée une branche depuis mvp-properties :
git checkout mvp-properties
git pull upstream mvp-properties
git checkout -b feature/ma-fonctionnalite

Nomme ta branche selon la convention :

feature/ : Nouvelle fonctionnalité
fix/ : Correction de bug
docs/ : Documentation
refactor/ : Refactorisation
test/ : Ajout/modification de tests
chore/ : Tâches de maintenance


Développe en suivant les standards de code (section 3)

Commit régulièrement avec des messages clairs :
git commit -m "feat: ajoute la validation du formulaire de signalement"
git commit -m "fix: corrige l'affichage des marqueurs sur mobile"
Format des messages de commit :

feat: Nouvelle fonctionnalité
fix: Correction de bug
docs: Documentation
style: Formatage (pas de changement de code)
refactor: Refactorisation
test: Ajout/modification de tests
chore: Maintenance



2.3 Tests et validation
Avant de soumettre ta Pull Request :
# Vérifie le linting
npm run lint

# Lance les tests
npm test

# Vérifie la couverture de tests
npm run test:coverage

# Vérifie l'accessibilité (si applicable)
npm run test:a11y

# Build de production
npm run build
2.4 Pull Request

Push ta branche :
git push origin feature/ma-fonctionnalite

Ouvre une Pull Request sur GitHub vers mvp-properties

Remplis le template de PR avec :

Description claire des changements
Références aux issues liées
Captures d'écran si pertinent
Checklist de validation


Réponds aux commentaires de revue de code

Effectue les modifications demandées si nécessaire


2.5 Revue de code
Toute PR doit être revue par au moins un mainteneur avant fusion. Les critères de validation :

✅ Code respecte les standards (section 3)
✅ Tests passent (couverture > 80%)
✅ Documentation à jour
✅ Accessibilité validée
✅ Pas de régression
✅ Commits clairs et atomiques

3. Standards de code
3.1 Règles ASCII / Encodage
Règle fondamentale : Tous les fichiers sources doivent être en ASCII pur (caractères 0-127).
Pourquoi ASCII ?

✅ Portabilité maximale : Compatible avec tous les systèmes et éditeurs
✅ Pas de corruption : Évite les problèmes d'encodage entre environnements
✅ Git friendly : Diffs clairs et sans ambiguïté
✅ Performance : Parsing plus rapide

Application concrète
// ❌ INTERDIT - Accents dans le code
const créerUtilisateur = (nom, prénom) => {
  return { nom, prénom };
};

// ✅ CORRECT - ASCII uniquement
const createUser = (lastName, firstName) => {
  return { lastName, firstName };
};

// ❌ INTERDIT - Symboles non-ASCII
const prix = "15€";
const température = "25°C";

// ✅ CORRECT - ASCII + données externalisées
const price = "15 EUR"; // ou utiliser i18n
const temperature = "25 C"; // ou "25 degrees C"
Gestion du contenu multilingue
Le contenu utilisateur (textes affichés) doit être externalisé :
// ❌ INTERDIT - Texte français dans le code
function showError() {
  alert("Erreur : données invalides");
}

// ✅ CORRECT - Utilisation de i18n
import { t } from '@/i18n';

function showError() {
  alert(t('errors.invalidData'));
}
Fichiers de traduction (JSON/YAML) :
// locales/fr.json - ICI les accents sont autorisés
{
  "errors": {
    "invalidData": "Erreur : données invalides"
  }
}
Commentaires et documentation
// ❌ INTERDIT
// Vérifie si l'utilisateur est connecté

// ✅ CORRECT
// Check if user is authenticated
Exception : Les fichiers .md peuvent contenir des caractères UTF-8 pour la documentation utilisateur.
3.2 Structure des fichiers
Organisation du projet
src/
├── components/        # Composants React
│   ├── common/       # Composants réutilisables
│   ├── forms/        # Formulaires
│   ├── layout/       # Layout et navigation
│   └── map/          # Composants carte
├── services/         # Logique métier et API
├── hooks/            # Custom React hooks
├── utils/            # Fonctions utilitaires
├── types/            # Types TypeScript
├── styles/           # Styles globaux
├── assets/           # Images, fonts, etc.
└── locales/          # Fichiers i18n

tests/
├── unit/             # Tests unitaires
├── integration/      # Tests d'intégration
└── e2e/              # Tests end-to-end
Structure d'un composant
ComponentName/
├── index.ts                    # Export public
├── ComponentName.tsx           # Composant principal
├── ComponentName.test.tsx      # Tests
├── ComponentName.styles.css    # Styles (si nécessaire)
├── ComponentName.types.ts      # Types spécifiques
└── README.md                   # Documentation
Structure d'un fichier React
// 1. Imports externes
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// 2. Imports internes (absolus avec @/)
import { Button } from '@/components/common';
import { useAuth } from '@/hooks';
import { apiService } from '@/services';

// 3. Imports de types
import type { User } from '@/types';

// 4. Imports de styles
import styles from './ComponentName.styles.css';

// 5. Types locaux
interface ComponentNameProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

// 6. Constantes
const DEFAULT_TIMEOUT = 5000;

// 7. Composant
export const ComponentName: React.FC<ComponentNameProps> = ({
  userId,
  onUpdate
}) => {
  // 7.1 Hooks
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // 7.2 Effects
  useEffect(() => {
    // Effect logic
  }, [userId]);

  // 7.3 Handlers
  const handleClick = () => {
    // Handler logic
  };

  // 7.4 Render helpers
  const renderContent = () => {
    // Helper logic
  };

  // 7.5 Return
  return (
    <div className={styles.container}>
      {renderContent()}
    </div>
  );
};
3.3 Conventions de nommage
Fichiers
// Composants React
ComponentName.tsx
ComponentName.test.tsx
ComponentName.stories.tsx

// Services et utils
userService.ts
dateUtils.ts
apiClient.ts

// Types
user.types.ts
api.types.ts

// Hooks
useAuth.ts
useLocalStorage.ts

// Constants
constants.ts
config.ts
Variables et fonctions
// camelCase pour variables et fonctions
const userName = 'John';
const isAuthenticated = true;
const fetchUserData = async () => {};

// PascalCase pour classes et composants
class UserService {}
const ButtonComponent = () => {};

// UPPER_SNAKE_CASE pour constantes
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;

// Prefixes conventionnels
const isLoading = false;      // boolean
const hasAccess = true;       // boolean
const shouldUpdate = false;   // boolean
const handleClick = () => {}; // event handler
const onSubmit = () => {};    // callback
Types TypeScript
// PascalCase pour interfaces et types
interface User {
  id: string;
  name: string;
}

type UserRole = 'admin' | 'user' | 'guest';

// Suffix pour types spécifiques
interface ButtonProps {}
type ApiResponse<T> = {};
enum UserStatus {}
3.4 Gestion des imports / exports
Ordre des imports
// 1. React et frameworks
import React from 'react';
import { NextPage } from 'next';

// 2. Bibliothèques externes
import { motion } from 'framer-motion';
import axios from 'axios';

// 3. Imports absolus internes (@/)
import { Button } from '@/components/common';
import { useAuth } from '@/hooks';
import { formatDate } from '@/utils';

// 4. Imports relatifs
import { Header } from './Header';
import { Footer } from './Footer';

// 5. Types
import type { User, Post } from '@/types';

// 6. Styles et assets
import styles from './Page.module.css';
import logo from '@/assets/logo.svg';
Exports
// ✅ Named exports (préféré)
export const Button = () => {};
export const formatDate = () => {};

// ✅ Export groupé
export { Button, Input, Select } from './forms';

// ❌ Default export (éviter sauf Next.js pages)
export default Component;

// ✅ Index files pour exports groupés
// components/forms/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Select } from './Select';
3.5 Tests et couverture
Objectifs de couverture

Minimum requis : 80% globale
Cible : 90%
Fonctions critiques : 100%

Types de tests
Tests unitaires (Jest + React Testing Library)
// ComponentName.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when loading', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
Tests d'intégration
// userService.integration.test.ts
import { userService } from '@/services';
import { setupTestDatabase, cleanupTestDatabase } from '@/tests/utils';

describe('UserService Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  it('should create and retrieve user', async () => {
    const userData = { name: 'John', email: 'john@example.com' };
    const user = await userService.createUser(userData);
    
    const retrieved = await userService.getUserById(user.id);
    expect(retrieved).toMatchObject(userData);
  });
});
Tests e2e (Playwright/Cypress)
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  
  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
Bonnes pratiques de test
// ✅ Tests descriptifs
it('should display error message when email is invalid', () => {});

// ❌ Tests vagues
it('should work', () => {});

// ✅ Arrange-Act-Assert
it('should update user name', () => {
  // Arrange
  const user = { id: '1', name: 'John' };
  
  // Act
  const updated = updateUserName(user, 'Jane');
  
  // Assert
  expect(updated.name).toBe('Jane');
});

// ✅ Test des cas limites
it('should handle empty array', () => {});
it('should handle null input', () => {});
it('should handle very long strings', () => {});
Mocking
// Mock d'un service
jest.mock('@/services/userService', () => ({
  getUserById: jest.fn().mockResolvedValue({ id: '1', name: 'John' })
}));

// Mock d'un hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'John' },
    isAuthenticated: true
  })
}));

// Mock d'un module externe
jest.mock('axios');
4. Accessibilité (A11y)
L'accessibilité est une priorité absolue pour AccessCity Studio.
4.1 Standards

WCAG 2.1 niveau AA minimum
ARIA : Utiliser les attributs ARIA appropriés
Sémantique HTML : Utiliser les balises appropriées
Navigation clavier : Toutes les fonctionnalités accessibles au clavier
Contraste : Ratio minimum 4.5:1 pour le texte

4.2 Checklist composant accessible
// ✅ Exemple de composant accessible
export const AccessibleButton: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  type = 'button'
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      className={styles.button}
    >
      {children}
    </button>
  );
};
4.3 Bonnes pratiques
Structure sémantique
// ✅ CORRECT
<header>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/">Home</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Title</h1>
    <p>Content</p>
  </article>
</main>

<footer>
  <p>Footer content</p>
</footer>

// ❌ INTERDIT
<div class="header">
  <div class="nav">
    <div class="link">Home</div>
  </div>
</div>
Labels et descriptions
// ✅ CORRECT
<label htmlFor="email">
  Email address
  <input
    id="email"
    type="email"
    name="email"
    aria-required="true"
    aria-describedby="email-help"
  />
</label>
<span id="email-help">We'll never share your email</span>

// ❌ INTERDIT
<input type="email" placeholder="Email" />
Navigation clavier
// ✅ Gestion complète du clavier
const Modal = ({ onClose, children }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {children}
      <button onClick={onClose} aria-label="Close modal">
        ×
      </button>
    </div>
  );
};
Images et médias
// ✅ Images avec alt text
<img src="/logo.png" alt="AccessCity Studio logo" />

// ✅ Images décoratives
<img src="/decoration.png" alt="" role="presentation" />

// ✅ Vidéos avec sous-titres
<video controls>
  <source src="video.mp4" type="video/mp4" />
  <track kind="captions" src="captions.vtt" srclang="en" label="English" />
</video>
Contraste et couleurs
/* ✅ Contraste suffisant */
.text {
  color: #333333; /* sur fond blanc = ratio 12.6:1 */
  background-color: #ffffff;
}

/* ❌ Contraste insuffisant */
.text-low-contrast {
  color: #cccccc; /* sur fond blanc = ratio 1.6:1 ❌ */
  background-color: #ffffff;
}

/* ✅ Ne pas utiliser uniquement la couleur */
.error {
  color: #d32f2f;
  font-weight: bold;
  /* Icon + text */
}
.error::before {
  content: '⚠️ ';
}
4.4 Tests d'accessibilité
// Test automatique avec jest-axe
import { axe } from 'jest-axe';
import { render } from '@testing-library/react';

it('should not have accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
5. Qualité & Revues
5.1 Outils de qualité
ESLint
Configuration dans .eslintrc.js :
module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:jsx-a11y/recommended',
    'prettier'
  ],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'jsx-a11y/anchor-is-valid': 'error'
  }
};
Prettier
Configuration dans .prettierrc :
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid"
}
Husky + lint-staged
Hooks Git automatiques :
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "npm run test -- --findRelatedTests"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
5.2 Processus de revue de code
Critères de revue
Structure et clarté

 Code lisible et bien organisé
 Nommage explicite
 Pas de code dupliqué
 Complexité raisonnable

Fonctionnalité

 Répond au besoin
 Pas de régression
 Gestion des erreurs appropriée
 Edge cases gérés

Tests

 Tests unitaires présents
 Couverture > 80%
 Tests pertinents
 Tests passent

Performance

 Pas de fuites mémoire
 Optimisations appropriées
 Chargement lazy si nécessaire

Accessibilité

 WCAG 2.1 AA respecté
 Navigation clavier fonctionnelle
 ARIA approprié
 Tests a11y passent

Sécurité

 Pas de failles évidentes
 Validation des entrées
 Sanitization des données
 Secrets non exposés

Commentaires de revue
# ✅ Commentaire constructif
Je suggère d'extraire cette logique dans un hook personnalisé pour améliorer la réutilisabilité. Exemple :
\`\`\`typescript
const useUserData = (userId: string) => {
  // logic here
};
\`\`\`

# ❌ Commentaire non constructif
C'est pas bon.
5.3 Documentation
README de composant
# ComponentName

Description courte du composant.

## Usage

\`\`\`tsx
import { ComponentName } from '@/components/ComponentName';

<ComponentName prop1="value" prop2={42} />
\`\`\`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| prop1 | string | Yes | - | Description of prop1 |
| prop2 | number | No | 0 | Description of prop2 |

## Accessibility

- Keyboard navigation: Tab, Enter, Escape
- ARIA: role="button", aria-label supported
- Screen reader tested

## Examples

### Basic usage
\`\`\`tsx
<ComponentName prop1="value" />
\`\`\`

### Advanced usage
\`\`\`tsx
<ComponentName prop1="value" prop2={42} onAction={handleAction} />
\`\`\`
Commentaires dans le code
// ✅ Commentaires utiles

/**
 * Calculate the total price including tax
 * @param basePrice - Price before tax
 * @param taxRate - Tax rate as decimal (e.g., 0.20 for 20%)
 * @returns Total price with tax applied
 */
const calculateTotalPrice = (basePrice: number, taxRate: number): number => {
  return basePrice * (1 + taxRate);
};

// Complex algorithm - explain the why, not the what
// Using binary search because dataset can be large (>10k items)
const findUser = (users: User[], id: string) => {
  // implementation
};

// ❌ Commentaires inutiles
// Increment counter by 1
counter++;

// Loop through users
users.forEach(user => {});

Questions ou problèmes ?

💬 Discussions : GitHub Discussions
🐛 Bugs : Issues GitHub
📧 Contact direct : Maintainers


Merci de contribuer à AccessCity Studio ! 🚀
Ensemble, nous rendons les villes plus accessibles à tous.

Voilà ! J'ai fusionné les deux fichiers en :

✅ **Intégrant tout CODING_RULES.md** dans la section 3 (Standards de code)
✅ **Supprimant les redondances** entre les deux fichiers
✅ **Gardant un ton homogène** en français avec anglais technique
✅ **Structurant selon votre plan** exact
✅ **Conservant tous les exemples de code** pertinents
✅ **Ajoutant des détails** sur les tests, l'accessibilité et la qualité

Le fichier est prêt à remplacer `docs/CONTRIBUTING.md` ! 🎯