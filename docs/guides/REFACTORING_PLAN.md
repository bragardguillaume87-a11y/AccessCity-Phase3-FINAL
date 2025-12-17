
Composants principaux à créer :
- `EditorShell.jsx` (nouveau shell 3 volets, remplaçant progressif de `StudioShell.jsx`)  
- `ExplorerPanel.jsx` (liste Scenes / Dialogues / Characters)  
- `MainCanvas.jsx` (édition visuelle, prévisualisation de la scène sélectionnée)  
- `PropertiesPanel.jsx` (propriétés de l’élément sélectionné : scène, dialogue, personnage, etc.)  

---

## 4. Phasage du refactoring

### Phase 1 – Préparation & sécurisation

Objectifs :
- Stabiliser l’existant avant la migration.  

Tâches :
- Corriger les erreurs de syntaxe évidentes (`tabs` mal formaté, virgule manquante après `Dialogues`…) [web:1].  
- Ajouter des tests de non-régression sur les fonctions critiques (validation, auto-save, navigation de base) [web:34].  
- Documenter clairement le comportement actuel dans des tests ou snapshots (pour pouvoir comparer après refactor).  

Estimation : **0,5 à 1 jour**.  

### Phase 2 – Création du nouveau shell 3 volets

Objectifs :
- Introduire la nouvelle architecture sans casser l’existant.  

Tâches :
- Créer `EditorShell.jsx` avec le layout 3 volets (sans logique métier complexe au début).  
- Définir l’API de chaque panneau :  
  - `ExplorerPanel` : reçoit la liste des scènes, dialogues, personnages + callbacks de sélection.  
  - `MainCanvas` : reçoit l’élément sélectionné + callbacks d’édition.  
  - `PropertiesPanel` : reçoit l’élément sélectionné + callbacks de mise à jour des propriétés.  
- Brancher `EditorShell` sur le même `AppContext` que `StudioShell` pour partager l’état global (scenes, dialogues, sélection courante).  

Estimation : **1 à 1,5 jours**.  

### Phase 3 – Migration progressive de la logique

Objectifs :
- Déplacer la logique métier hors de `StudioShell.jsx` vers des hooks et des panneaux dédiés.  

Tâches :
- Créer des hooks custom pour encapsuler la logique métier :  
  - `useScenarioExplorer()` : gestion de l’arbre scenes/dialogues.  
  - `useSelection()` : sélection courante (scene, dialogue, character).  
  - `useAutoSaveStatus()` : gestion du timer et du statut de sauvegarde.  
- Déplacer progressivement la logique des onglets vers les 3 panneaux, en gardant `StudioShell` comme wrapper temporaire :  
  - D’abord brancher `ExplorerPanel` sur la liste des scenes/dialogues/characters.  
  - Puis brancher `MainCanvas` sur la scène sélectionnée.  
  - Enfin, brancher `PropertiesPanel` sur l’élément sélectionné.  
- Réduire `StudioShell.jsx` pour qu’il devienne un simple routeur/compatibility layer, avant d’être retiré.  

Estimation : **1,5 à 2 jours** [web:28][web:40].  

### Phase 4 – Conformité standards & accessibilité

Objectifs :
- Aligner la nouvelle architecture sur `CONTRIBUTING.md` et les règles A11y.  

Tâches :
- **ASCII & i18n** :  
  - Retirer tous les accents, emojis et textes français du code.  
  - Externaliser les labels et descriptions vers le système i18n (fichiers de traductions) [web:1].  
- **Imports & structure** :  
  - Réordonner les imports selon la convention (React → externes → internes → relatifs → types/ styles) [web:31].  
  - Standardiser les extensions de fichiers (.jsx → .tsx/.js selon la stack choisie).  
- **Accessibilité** :  
  - Vérifier les rôles ARIA des panneaux (region, complementary, main, navigation) [web:27].  
  - Gérer le focus lors de la sélection d’éléments dans l’Explorer.  
  - Ajouter des tests d’accessibilité automatisés (jest-axe / Playwright a11y) selon `PIPELINE_QA.md`.  

Estimation : **1 à 1,5 jours** [web:27][web:22].  

---

## 5. Risques & points de vigilance

- **Risque de régression** sur la navigation entre étapes (Context → Characters → Scenes → Dialogues) si la logique de workflow est mal extraite.  
- **Complexité du state** si le découpage entre contexte global et état local des panneaux n’est pas pensé en amont [web:34][web:37].  
- **Accessibilité** : la multiplication des panneaux augmente les exigences de focus management et d’ARIA bien configuré.  

Mesures de mitigation :
- Couvrir les comportements actuels par des tests avant modification.  
- Refactoriser par petites étapes avec commits atomiques.  
- Tester avec lecteur d’écran + navigation clavier à chaque étape majeure.  

---

## 6. Checklist par commit

Chaque commit doit être **atomique** et respecter au moins l’un des types suivants : `refactor`, `feat`, `fix`, `docs`, `test`.  

Exemples de commits :
- `refactor: introduit EditorShell avec layout 3 volets`  
- `refactor: extrait useSelection depuis StudioShell`  
- `refactor: déplace la logique auto-save dans useAutoSaveStatus`  
- `fix: corrige la syntaxe du tableau de tabs dans StudioShell`  
- `docs: met à jour ARCHITECTURE_DECISION et REFACTORING_PLAN`  

Checklist rapide avant chaque commit :
- [ ] Tests unitaires passent (`npm test`)  
- [ ] Lint passe (`npm run lint`)  
- [ ] Build OK (`npm run build`)  
- [ ] Aucun nouveau warning ESLint a11y critique  
- [ ] Le comportement de base de l’éditeur est intact (chargement, navigation, preview)  

---

## 7. Prochaine étape

Une fois ce plan validé :
- Démarrer par **la Phase 1** sur une branche dédiée (ex. `refactor/editor-shell-3panes`).  
- Suivre le pipeline qualité décrit dans `reference/infrastructure/PIPELINE_QA.md`.  
- Mettre à jour ce document à chaque phase pour refléter l’état réel du refactoring.
