# PROJECT MEMORY SEED (AccessCity Phase 4.5)

## 1. Vision & UX (L'Ame du Projet)
- **Objectif** : Editeur de scenes narratives modulaire pour non-codeurs.
- **Philosophie UX** : Interface sombre, minimaliste, dense. Pas de scroll inutile.
- **Utilisateur Cible** : Createur narratif qui ne touche PAS au code JS. Tout passe par JSON.
- **Architecture** : "Data-Driven". L'UI se dessine entierement depuis `ui_layout.json`.

## 2. Règles Techniques (La Loi - Claude 4.5)
- **ASCII ONLY** : Le code ne doit contenir QUE des caracteres ASCII standards (codes 32-126).
- **Zero Dépendance** : Pas de npm install complexe. JS natif (ES Modules).
- **Validation Stricte** : Tout JSON charge passe par `schema.js`. Si invalide -> Erreur bloquante explicite.
- **Fallback** : Si un fichier manque, utiliser `sampleData.js` (Mode Demo).

## 3. Historique & Leçons (La Sagesse - Kimi/Gemini)
- **Erreur Passee** : Documentation trop lourde et dispersee (140ko+). Resultat : Hallucinations IA.
- **Correction** : Tout doit tenir dans <10k tokens.
- **Legacy** : Les anciens tests verbeux ont ete convertis en cas de tests unitaires stricts dans `test/`.