# Plan d'Action Premium - AccessCity Phase 3

> **Généré le**: 22 janvier 2026
> **Basé sur**: Analyse architecture + Best practices 2026 (sources web)
> **Objectif**: Roadmap priorisée selon l'architecture du projet

---

## Table des Matières

1. [Matrice de Priorisation Architecture-Dépendante](#1-matrice-de-priorisation-architecture-dépendante)
2. [Sprint 1: Fondations Critiques (Semaine 1-2)](#2-sprint-1-fondations-critiques)
3. [Sprint 2: Infrastructure DevOps (Semaine 3-4)](#3-sprint-2-infrastructure-devops)
4. [Sprint 3: Performance & Optimisation (Semaine 5-6)](#4-sprint-3-performance--optimisation)
5. [Sprint 4: Modernisation (Semaine 7-8)](#5-sprint-4-modernisation)
6. [Configurations Production-Ready](#6-configurations-production-ready)
7. [Checklist d'Implémentation](#7-checklist-dimplémentation)

---

## 1. Matrice de Priorisation Architecture-Dépendante

### Analyse des Dépendances Critiques

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GRAPHE DE DÉPENDANCES ACCESSCITY                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐     ┌──────────┐     ┌──────────────┐                │
│  │ React 19 │────▶│ Zustand 5│────▶│ localStorage │ ⚠️ XSS Risk   │
│  └──────────┘     └──────────┘     └──────────────┘                │
│       │                │                                           │
│       ▼                ▼                                           │
│  ┌──────────┐     ┌──────────┐                                     │
│  │ Vite 7   │     │  Zundo   │ (undo/redo)                        │
│  └──────────┘     └──────────┘                                     │
│       │                                                            │
│       ▼                                                            │
│  ┌──────────────┐     ┌──────────────┐                             │
│  │@vitejs/react │────▶│ Babel (slow) │ → Migrer vers SWC          │
│  └──────────────┘     └──────────────┘                             │
│                                                                     │
│  ┌──────────────┐     ┌──────────────┐                             │
│  │ @xyflow/react│────▶│ zustand@4.x  │ → Override nécessaire      │
│  └──────────────┘     └──────────────┘                             │
│                                                                     │
│  ┌──────────────┐                                                  │
│  │ ts-migrate   │──── 🔴 Vulnérabilités (braces, micromatch)      │
│  │ @codemod/cli │──── 🔴 Vulnérabilités (esbuild)                 │
│  └──────────────┘                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Matrice Impact vs Effort

| Action | Impact Sécurité | Impact Perf | Impact Maintenabilité | Effort | Bloquant pour | **PRIORITÉ** |
|--------|-----------------|-------------|----------------------|--------|---------------|--------------|
| Supprimer ts-migrate/codemod | 🔴 CRITIQUE | - | ✅ Réduit deps | 1h | Rien | **P0** |
| Ajouter CSP headers | 🔴 CRITIQUE | - | - | 2h | Rien | **P0** |
| Améliorer CI (lint+unit+build) | - | - | 🔴 CRITIQUE | 4h | Merge sécurisé | **P0** |
| Migrer vers SWC | - | 🟡 +30% build | ✅ Moins deps | 2h | React Compiler | **P1** |
| Activer React Compiler | - | 🔴 +40% runtime | ✅ Moins useMemo | 2h | SWC migration | **P1** |
| Docker multi-stage | - | 🟡 -95% image | 🔴 Déploiement | 4h | CD pipeline | **P1** |
| CD pipeline (Vercel/Netlify) | - | - | 🔴 Automatisation | 2h | Docker | **P2** |
| Sentry monitoring | - | - | 🟡 Observabilité | 2h | Rien | **P2** |
| TailwindCSS v4 migration | - | 🟡 10x build | ⚠️ Breaking | 2 jours | Tests complets | **P3** |
| TypeScript strict mode | - | - | 🟡 Qualité | 2 sem | Tests complets | **P3** |

### Ordre d'Exécution Optimal

```
P0 (Bloquants) ──▶ P1 (Enablers) ──▶ P2 (Quick Wins) ──▶ P3 (Évolutions)
     │                  │                  │                  │
     ▼                  ▼                  ▼                  ▼
┌─────────┐       ┌─────────┐       ┌─────────┐       ┌─────────┐
│Sécurité │       │ Perf    │       │ DevOps  │       │ Modern  │
│  CI     │──────▶│ Build   │──────▶│ Deploy  │──────▶│ TypeS   │
│         │       │         │       │         │       │ Tailw   │
└─────────┘       └─────────┘       └─────────┘       └─────────┘
   2 jours          2 jours          2 jours          3 semaines
```

---

## 2. Sprint 1: Fondations Critiques

### 2.1 Supprimer les dépendances vulnérables (P0)

**Analyse**: `ts-migrate` et `@codemod/cli` sont des outils de migration one-shot, pas nécessaires en production.

```bash
# Vérifier l'utilisation actuelle
npm ls ts-migrate @codemod/cli

# Si non utilisés, supprimer
npm uninstall ts-migrate @codemod/cli

# Vérifier les vulnérabilités restantes
npm audit
```

**Si toujours utilisés**, mettre à jour vers versions sans vulnérabilités :
```bash
npm update ts-migrate @codemod/cli --force
```

### 2.2 Implémenter Content Security Policy (P0)

**Fichier**: `index.html`

```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- CSP Header - Ajuster selon vos besoins -->
    <meta http-equiv="Content-Security-Policy"
          content="default-src 'self';
                   script-src 'self' 'unsafe-inline' 'unsafe-eval';
                   style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
                   font-src 'self' https://fonts.gstatic.com;
                   img-src 'self' data: blob: https:;
                   connect-src 'self' http://localhost:* ws://localhost:*;">

    <title>AccessCity Studio</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Pour le serveur Express** (`server/index.js`), ajouter helmet :

```bash
cd server && npm install helmet
```

```javascript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
    }
  }
}));
```

### 2.3 Améliorer le Pipeline CI (P0)

**Fichier**: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: ["**"]
  pull_request:
    branches: ["**"]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ===========================================
  # JOB 1: Quality Checks (Lint, Format, Types)
  # ===========================================
  quality:
    name: Quality Checks
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run Prettier check
        run: npm run format

      - name: TypeScript type check
        run: npx tsc --noEmit

  # ===========================================
  # JOB 2: Unit Tests
  # ===========================================
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests with coverage
        run: npm run test:unit:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info
          fail_ci_if_error: false

  # ===========================================
  # JOB 3: Build Verification
  # ===========================================
  build:
    name: Build Verification
    runs-on: ubuntu-latest
    needs: [quality]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build:vite

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/
          retention-days: 7

  # ===========================================
  # JOB 4: E2E Tests (Playwright) - Vite
  # ===========================================
  e2e-vite:
    name: E2E Tests (Vite)
    runs-on: ubuntu-latest
    needs: [build]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-output
          path: dist/

      - name: Run E2E tests
        run: npx playwright test --config=playwright.config.vite.ts --reporter=list

      - name: Upload test results on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-results
          path: |
            test-results/**
            playwright-report/**
          if-no-files-found: ignore

  # ===========================================
  # JOB 5: Security Scan
  # ===========================================
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit --audit-level=high
        continue-on-error: true

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

**Ajouter scripts manquants** dans `package.json` :

```json
{
  "scripts": {
    "lint": "eslint src --ext .js,.jsx,.ts,.tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --check \"src/**/*.{js,jsx,ts,tsx,json,css}\"",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 3. Sprint 2: Infrastructure DevOps

### 3.1 Docker Multi-Stage Build (P1)

**Fichier**: `Dockerfile`

```dockerfile
# ===========================================
# Stage 1: Dependencies
# ===========================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copier uniquement les fichiers de dépendances
COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm ci --only=production=false

# ===========================================
# Stage 2: Build
# ===========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les dépendances depuis le stage précédent
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables d'environnement de build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build de l'application
RUN npm run build:vite

# ===========================================
# Stage 3: Production (Nginx)
# ===========================================
FROM nginx:alpine AS production

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/nginx.conf

# Copier les fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html

# Changer les permissions
RUN chown -R nextjs:nodejs /usr/share/nginx/html && \
    chown -R nextjs:nodejs /var/cache/nginx && \
    chown -R nextjs:nodejs /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nextjs:nodejs /var/run/nginx.pid

# Utiliser l'utilisateur non-root
USER nextjs

# Exposer le port
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Commande de démarrage
CMD ["nginx", "-g", "daemon off;"]
```

**Fichier**: `nginx.conf`

```nginx
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript
               application/rss+xml application/atom+xml image/svg+xml;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # SPA routing - redirect all requests to index.html
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "OK";
            add_header Content-Type text/plain;
        }
    }
}
```

**Fichier**: `docker-compose.yml`

```yaml
version: "3.9"

services:
  # ===========================================
  # Frontend Application
  # ===========================================
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        VITE_API_URL: ${VITE_API_URL:-http://localhost:3001}
    ports:
      - "8080:80"
    environment:
      - NODE_ENV=production
    depends_on:
      - server
    networks:
      - accesscity-network
    restart: unless-stopped

  # ===========================================
  # Backend Server (Assets Upload)
  # ===========================================
  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    volumes:
      - uploads:/app/uploads
    environment:
      - NODE_ENV=production
      - PORT=3001
    networks:
      - accesscity-network
    restart: unless-stopped

  # ===========================================
  # Development only: Hot reload
  # ===========================================
  app-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    profiles:
      - dev
    networks:
      - accesscity-network

volumes:
  uploads:

networks:
  accesscity-network:
    driver: bridge
```

**Fichier**: `.dockerignore`

```
node_modules
dist
.git
.gitignore
*.md
.env*
.vscode
coverage
test-results
playwright-report
```

### 3.2 Commandes Docker

```bash
# Build production
docker build -t accesscity:latest .

# Vérifier la taille de l'image
docker images accesscity:latest
# Attendu: ~50MB (vs ~1GB sans multi-stage)

# Lancer en production
docker-compose up -d

# Lancer en développement
docker-compose --profile dev up app-dev

# Voir les logs
docker-compose logs -f app

# Arrêter
docker-compose down
```

---

## 4. Sprint 3: Performance & Optimisation

### 4.1 Migrer vers SWC (P1)

**Source**: [Vite Performance Guide](https://vite.dev/guide/performance), [SWC vs Babel Comparison](https://www.dhiwise.com/post/maximize-performance-how-swc-enhances-vite-and-react)

```bash
# Installer le plugin SWC
npm uninstall @vitejs/plugin-react
npm install @vitejs/plugin-react-swc
```

### 4.2 Activer React Compiler (P1)

**Source**: [React Compiler Installation](https://react.dev/learn/react-compiler/installation), [React Compiler v1.0 Blog](https://react.dev/blog/2025/10/07/react-compiler-1)

```bash
# Installer le compilateur React
npm install babel-plugin-react-compiler
```

### 4.3 Configuration Vite Optimisée

**Fichier**: `vite.config.js` (version optimisée)

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// Configuration React Compiler
const ReactCompilerConfig = {
  target: '19', // React 19
};

export default defineConfig({
  plugins: [
    react({
      // Activer React Compiler via SWC
      plugins: [['@swc/plugin-react-compiler', ReactCompilerConfig]],
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Optimisation des dépendances
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'zustand',
      '@xyflow/react',
      'framer-motion',
      'react-resizable-panels',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },

  // Configuration serveur de développement
  server: {
    port: 5173,
    open: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
    watch: {
      usePolling: true, // Nécessaire pour Windows
      interval: 100,
    },
  },

  // Configuration de build production
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'esnext',
    minify: 'esbuild',

    // Code splitting optimisé
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-zustand': ['zustand', 'zundo', 'immer'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tooltip',
          ],
          'vendor-flow': ['@xyflow/react', 'dagre'],
          'vendor-motion': ['framer-motion'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
        },
        // Nommage des chunks
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },

    // Limites de taille
    chunkSizeWarningLimit: 500,
  },

  // Preview (pour tester le build)
  preview: {
    port: 4173,
    open: true,
  },
});
```

### 4.4 Lazy Loading des Modals

**Fichier**: `src/components/modals/index.ts`

```typescript
import { lazy } from 'react';

// Lazy load des modals lourds
export const AssetsLibraryModal = lazy(
  () => import('./AssetsLibraryModal')
);

export const CharactersModal = lazy(
  () => import('./CharactersModal')
);

export const CharacterEditorModal = lazy(
  () => import('../character-editor/CharacterEditorModal')
);

export const AddCharacterToSceneModal = lazy(
  () => import('./AddCharacterToSceneModal')
);

export const PreviewModal = lazy(
  () => import('./PreviewModal')
);
```

**Utilisation avec Suspense** :

```tsx
import { Suspense } from 'react';
import { AssetsLibraryModal } from '@/components/modals';

function App() {
  return (
    <Suspense fallback={<ModalSkeleton />}>
      {showAssetsLibrary && <AssetsLibraryModal />}
    </Suspense>
  );
}
```

---

## 5. Sprint 4: Modernisation

### 5.1 Migration TailwindCSS v4 (P3)

**Source**: [TailwindCSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)

```bash
# Utiliser l'outil de migration officiel
npx @tailwindcss/upgrade@next
```

**Changements majeurs** :
- Configuration CSS-first (`@theme` directive)
- Plus besoin de `tailwind.config.js`
- Build 10x plus rapide
- ⚠️ Nécessite navigateurs modernes

### 5.2 TypeScript Strict Mode (P3)

**Fichier**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,

    // Options existantes...
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Estimation**: ~100 erreurs à corriger (16 `any` identifiés)

---

## 6. Configurations Production-Ready

### 6.1 Sentry Error Monitoring (P2)

```bash
npm install @sentry/react @sentry/vite-plugin
```

**Fichier**: `src/main.tsx`

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### 6.2 CD Pipeline (Vercel)

**Fichier**: `vercel.json`

```json
{
  "buildCommand": "npm run build:vite",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

---

## 7. Checklist d'Implémentation

### Sprint 1 (Semaine 1-2) - Fondations
- [ ] Supprimer `ts-migrate` et `@codemod/cli`
- [ ] Vérifier `npm audit` = 0 vulnérabilités HIGH
- [ ] Ajouter CSP headers dans `index.html`
- [ ] Configurer `helmet` dans Express server
- [ ] Mettre à jour `.github/workflows/ci.yml`
- [ ] Ajouter scripts `lint`, `format`, `typecheck`
- [ ] Configurer Codecov pour coverage
- [ ] Tester le nouveau pipeline CI

### Sprint 2 (Semaine 3-4) - DevOps
- [ ] Créer `Dockerfile` multi-stage
- [ ] Créer `nginx.conf`
- [ ] Créer `docker-compose.yml`
- [ ] Créer `.dockerignore`
- [ ] Tester build Docker localement
- [ ] Vérifier taille image < 100MB
- [ ] Configurer Vercel/Netlify
- [ ] Tester preview deployments

### Sprint 3 (Semaine 5-6) - Performance
- [ ] Migrer vers `@vitejs/plugin-react-swc`
- [ ] Installer `babel-plugin-react-compiler`
- [ ] Mettre à jour `vite.config.js`
- [ ] Configurer code splitting (manualChunks)
- [ ] Implémenter lazy loading modals
- [ ] Analyser bundle avec visualizer
- [ ] Mesurer amélioration build time
- [ ] Vérifier React DevTools "Memo ✨"

### Sprint 4 (Semaine 7-8) - Modernisation
- [ ] Intégrer Sentry monitoring
- [ ] Planifier migration TailwindCSS v4
- [ ] Tester compatibilité navigateurs
- [ ] Activer TypeScript strict mode
- [ ] Corriger erreurs TypeScript (~100)
- [ ] Documenter les changements

---

## Références

### Performance
- [React Compiler Installation](https://react.dev/learn/react-compiler/installation)
- [React Compiler v1.0 Blog](https://react.dev/blog/2025/10/07/react-compiler-1)
- [Vite Performance Guide](https://vite.dev/guide/performance)
- [SWC vs Babel Performance](https://www.dhiwise.com/post/maximize-performance-how-swc-enhances-vite-and-react)

### DevOps
- [Docker Multi-Stage Build Guide](https://www.buildwithmatija.com/blog/production-react-vite-docker-deployment)
- [GitHub Actions Best Practices](https://levelup.gitconnected.com/deploying-a-vite-react-typescript-app-to-github-pages-using-github-actions-jest-and-pnpm-as-a-a3461ef9c4ad)
- [CodelyTV Vite Template](https://github.com/CodelyTV/typescript-react_best_practices-vite_template)

### Sécurité
- [React Security Best Practices](https://www.glorywebs.com/blog/react-security-practices)
- [Content Security Policy Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

### Modernisation
- [TailwindCSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)

---

**Généré par Claude Code** | AccessCity Phase 3 | Janvier 2026
