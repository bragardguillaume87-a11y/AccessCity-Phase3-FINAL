# AccessCity Scene Editor - Phase 4.5
Modular narrative scene editor with ASCII-strict compliance.
## Setup
1. Clone repo
2. Open index.html
3. Run tests with `node test/run-all-tests.js`

## Fonctionnalités principales
- **Éditeur de scènes narratives** : Créez, modifiez et gérez des scènes interactives.
- **Conformité ASCII stricte** : Garantit la compatibilité avec les systèmes limités.
- **Système de dialogue dynamique** : Gérez les dialogues avec des conditions et des variables.
- **Interface utilisateur modulaire** : Personnalisez les panneaux et les composants.

## Exemples d'utilisation
### Chargement d'une scène
```javascript
const sceneLoader = new SceneLoader();
sceneLoader.load('scenes.json');
```

### Ajout d'un personnage
```javascript
const character = {
  id: 'hero',
  name: 'Héros',
  sprite: 'assets/characters/player/neutral.svg'
};
characterLoader.add(character);
```

## Badges
![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen)

## Contribution
Pour contribuer, consultez le fichier [CONTRIBUTING.md](CONTRIBUTING.md).

## Utilisation des outils de test

### Mode Direct (test-direct.html)
Ce fichier HTML permet de tester rapidement les fonctionnalités principales sans serveur. Il inclut un logger visuel et une implémentation simplifiée de l'EventBus.

#### Instructions :
1. Ouvrez `test-direct.html` dans un navigateur.
2. Observez les événements et messages dans la console visuelle.

### Génération de contexte complet (pack_project.py)
Le script `pack_project.py` génère un fichier `AccessCity-FULL-Context.md` contenant une vue d'ensemble de tous les fichiers pertinents du projet.

#### Instructions :
1. Exécutez le script avec Python :
   ```bash
   python pack_project.py
   ```
2. Consultez le fichier généré pour une documentation complète.

### Scénario de démonstration (demo_scenario.json)
Ce fichier JSON illustre les fonctionnalités principales, comme les dialogues, les choix, et les effets conditionnels.

#### Exemple :
```json
{
  "id": "demo_start",
  "title": "Le Dilemme du Parc",
  "dialogues": [
    {
      "speaker": "narrator",
      "text": "Vous arrivez devant le vieux parc de la ville."
    }
  ]
}
```
