# Guide de collaboration avec les IA

> **Niveau** : 2 (Guide pratique)  
> **Statut** : ✅ À jour  
> **Dernière mise à jour** : 17 décembre 2024  

## 1. Objectif

Ce guide explique comment utiliser plusieurs IA (Perplexity, Claude, GPT, Gemini…) pour contribuer efficacement au projet AccessCity Studio, sans casser l’architecture ni la cohérence du code.

## 2. Rôles recommandés des IA

- **Perplexity** :  
  Orchestrateur, synthèse de documentation, planification de refactoring, génération de guides.

- **Claude** :  
  Refactoring complexe, architecture React, respect strict des règles de code, plans techniques détaillés.

- **GPT** :  
  Rédaction de textes (UI, documentation, exemples de scénarios), micro-UX, wording.

- **Gemini** :  
  Analyse de gros volumes (audit de docs, inventaire de code incomplet, synthèses globales).

## 3. Workflow recommandé

1. **Définir la tâche** avec Perplexity  
   - Clarifier l’objectif (doc, refactor, test, UX, etc.)
   - Découper en étapes atomiques
   - Choisir l’IA la plus adaptée

2. **Déléguer à l’IA spécialisée**  
   - Fournir le contexte minimal suffisant (fichiers, liens raw GitHub, contraintes)
   - Demander une sortie **directement copiable** (code, Markdown, patch Git)

3. **Revue humaine + Perplexity**  
   - Relire le résultat généré
   - Valider la cohérence avec les autres parties du projet
   - Adapter si besoin avant commit

4. **Commit atomique**  
   - Un commit = une responsabilité
   - Message clair (`docs: …`, `refactor: …`, `fix: …`)

## 4. Bonnes pratiques avec les IA

- Toujours rappeler :
  - Le nom du projet
  - La branche (`mvp-properties`)
  - L’objectif (refactor, doc, test…)
  - Les fichiers concernés (liens raw GitHub si possible)
- Ne jamais laisser une IA :
  - Modifier simultanément trop de fichiers critiques sans supervision
  - Ignorer les règles de `CONTRIBUTING.md`
- Toujours :
  - Tester (`npm test`, `npm run lint`, `npm run dev`)
  - Vérifier l’accessibilité si UI modifiée

## 5. Exemples de prompts types

### Exemple 1 : Refactoring avec Claude

> « Analyse `src/components/StudioShell.jsx` sur la branche `mvp-properties` et propose un refactoring pour passer à une interface 3 volets. Respecte les règles de CONTRIBUTING.md et retourne un diff Git clair. »

### Exemple 2 : Documentation avec GPT

> « Génère un guide utilisateur pour expliquer comment utiliser le panneau Scenes dans l’éditeur, en français simple et accessible. »

### Exemple 3 : Audit avec Gemini

> « Analyse tous les fichiers Markdown de `docs/` et identifie les doublons, fichiers obsolètes et liens cassés. Propose un plan de restructuration. »

## 6. Limites et vigilance

- Les IA peuvent :
  - Halluciner des fichiers ou props qui n’existent pas
  - Oublier des règles particulières du projet
- Contre-mesures :
  - Toujours croiser avec le code réel
  - Toujours relire avant de committer
  - Utiliser les IA comme assistants, pas comme sources de vérité absolue

---

Pour démarrer une session IA efficace :  
👉 Commencer par `[START_HERE.md](../START_HERE.md)` puis suivre ce guide.
