---
name: feedback-visual-review-protocol
description: Protocole de révision visuelle UI — 3 niveaux selon contexte. Puppeteer autonome sur localhost:5173 est le workflow principal.
type: feedback
---

Ne pas attendre que l'utilisateur envoie des captures d'écran si le serveur de dev est accessible.

## Règle principale

Le serveur Vite tourne sur `localhost:5173` pendant les sessions de travail.
Puppeteer MCP (`mcp__puppeteer__*`) est disponible et opérationnel — confirmé 2026-03-24.

**Avant de demander une capture à l'utilisateur** : tenter d'abord le workflow Puppeteer autonome.

---

## Niveau 1 — Capture manuelle de l'utilisateur

Format optimal (5 lignes) :
```
Composant  : [nom du fichier]
État       : [ce qui est ouvert/actif/sélectionné]
Problème   : [une phrase]
Priorité   : P0 | P1 | P2
```

Bonus : `copy(getComputedStyle(document.querySelector('.selecteur')).cssText)` dans DevTools Console → valeurs computed exactes.

**Why:** Les captures JPEG compressées rendent les couleurs dark-on-dark impossibles à distinguer (ex : `#0f172a` vs `#10131e` sont identiques visuellement). Sans valeurs computed, les corrections sont des estimations.

---

## Niveau 2 — Puppeteer autonome (workflow principal)

```javascript
// Pattern standard d'audit Puppeteer
// 1. Navigate
mcp__puppeteer__puppeteer_navigate({ url: 'http://localhost:5173' })

// 2. Reproduire l'état (clic, évaluation JS)
mcp__puppeteer__puppeteer_evaluate({ script: `
  document.querySelector('.toolbar-btn[data-section="dialogue"]')?.click()
` })

// 3. Screenshot ciblé
mcp__puppeteer__puppeteer_screenshot({ name: 'audit-dialogue-panel', width: 560, height: 900 })

// 4. Mesures computed
mcp__puppeteer__puppeteer_evaluate({ script: `
  const el = document.querySelector('.sp-sec');
  JSON.stringify({
    fontSize: getComputedStyle(el).fontSize,
    color: getComputedStyle(el).color,
    padding: getComputedStyle(el).padding,
  })
` })
```

**Limitation Tauri :** Puppeteer ne peut PAS se connecter au WebView2 Tauri sans `--remote-debugging-port`. Ce workflow fonctionne uniquement en mode Vite browser (`npm run dev:vite`). Pour des bugs spécifiques au rendu Tauri, utiliser le Niveau 1.

**Hover states :** Non capturables directement en non-headless. Workaround : injecter une classe CSS qui force les styles `:hover` via `page.evaluate` avant le screenshot.

---

## Niveau 3 — Playwright audit (infra existante)

Fichiers déjà présents dans le projet :
- `playwright.config.audit.ts`
- `e2e/ux-audit.spec.ts`
- `tools/audit-vn-panel.js`

Peut être étendu pour capturer `element.screenshot() + boundingBox() + computedStyle` dans `test-artifacts/`.
Commande : `npm run audit:ux`

---

## Métriques collectées lors de l'audit 2026-03-24 (référence)

Panneau Style (`TextSection.tsx`) après Alt 3 :
- Hauteur totale 7 sections : 839px
- APERÇU sticky : confirmé `position: sticky`, z-index 2
- Labels `.sp-lbl` : 11px bold, `rgba(238,240,248,0.62)` → contraste ~3.7:1 (sous WCAG AA 4.5:1 — pré-existant)
- Badges SubSections : 9px, opacity 0.7 — accessibilité limite mais acceptable (info complémentaire)
- Preview box : `rgba(3,7,18,0.65)` — réactif aux tokens cfg ✅

**How to apply:** Utiliser le Niveau 2 (Puppeteer) par défaut pour tout audit visuel. Réserver le Niveau 1 aux captures de l'utilisateur pointant un problème précis.
