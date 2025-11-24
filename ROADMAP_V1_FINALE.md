# ROADMAP V1 FINALE - AccessCity Editor

Cette roadmap détaille les étapes restantes pour passer du prototype actuel à une version V1 complète et utilisable pour la production de contenu.

## 1. Gestion des Assets (Priorité Haute)
Actuellement, les images sont gérées par des chemins ou du Base64 local.
- [ ] **Asset Manager Centralisé** : Créer un panneau "Assets" pour lister toutes les images (backgrounds, personnages, objets).
- [ ] **Upload Persistant** : Sauvegarder les images uploadées dans un dossier `assets/user/` (nécessite un backend Node.js plus robuste pour l'écriture de fichiers, ou utilisation de l'API File System Access).
- [ ] **Bibliothèque par défaut** : Intégrer un pack d'assets par défaut (SVG propres) pour ne pas démarrer à vide.

## 2. Éditeur de Scènes Visuel (Priorité Moyenne)
L'édition de texte est fonctionnelle mais austère.
- [ ] **Preview Temps Réel** : Afficher la scène (personnages + fond) directement dans l'éditeur pendant qu'on écrit le dialogue.
- [ ] **Timeline des Dialogues** : Remplacer la liste verticale par une timeline ou des blocs glisser-déposer.
- [ ] **Sélecteur Visuel** : Choisir l'humeur du personnage en cliquant sur son visage plutôt que dans une liste déroulante.

## 3. Système de Choix et Branchements (Priorité Haute)
- [ ] **Visualisation de l'Arbre** : Une vue "Graphique" (Nodes) pour voir les liens entre les scènes (Scene A -> Choix 1 -> Scene B).
- [ ] **Éditeur de Conditions Simplifié** : Une UI avec des menus déroulants (Variable > Valeur) au lieu de JSON brut.

## 4. Player & Gameplay (Priorité Moyenne)
- [ ] **Inventaire** : Ajouter la gestion d'objets (clés, documents).
- [ ] **Carte de la Ville** : Une scène spéciale "Map" pour se déplacer entre les lieux.
- [ ] **Accessibilité** : S'assurer que le jeu final est navigable au clavier et lecteur d'écran (c'est le thème du projet !).

## 5. Export / Build
- [ ] **Export Web Standalone** : Générer un dossier `dist/` avec juste le nécessaire pour héberger le jeu sur un site web (sans l'éditeur).

---

## Planning Suggéré

### Semaine 1 : Consolidation
- Finir l'upload d'images (Fait ✅).
- Afficher le joueur par défaut (Fait ✅).
- Nettoyer l'UI (CSS plus propre).

### Semaine 2 : Assets & Preview
- Créer le panneau "Asset Library".
- Ajouter la preview visuelle dans l'inspecteur.

### Semaine 3 : Logique Avancée
- Éditeur de conditions visuel.
- Vue "Graph" des scènes.
