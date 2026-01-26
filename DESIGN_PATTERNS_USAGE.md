# Design Patterns - Guide d'utilisation

Ce document explique comment utiliser les nouveaux design patterns implémentés dans AccessCity.

## Vue d'ensemble

Les patterns suivants ont été implémentés :

1. **Factory Pattern** - Pour la création cohérente d'objets (Dialogue, Scene)
2. **Builder Pattern** - Pour la construction complexe étape par étape (SceneBuilder)
3. **Facade Pattern** - Pour une API simplifiée de l'éditeur (EditorFacade)
4. **State Management** - Gestion centralisée de la sélection (SelectionStore)

---

## 1. Factory Pattern

### DialogueFactory

Crée des dialogues avec des valeurs par défaut cohérentes.

#### Exemples

```typescript
import { DialogueFactory } from '@/factories';

// Dialogue simple
const dialogue = DialogueFactory.createText('Character1', 'Hello world!');

// Dialogue avec audio
const audioDialogue = DialogueFactory.createWithAudio(
  'Narrator',
  'Welcome to the story.',
  '/assets/audio/welcome.mp3'
);

// Dialogue avec choix (branching)
const choiceDialogue = DialogueFactory.createWithChoices(
  'Character1',
  'What do you want to do?',
  [
    { text: 'Go left', nextDialogue: 5 },
    { text: 'Go right', nextDialogue: 8 }
  ]
);

// Cloner un dialogue existant
const cloned = DialogueFactory.clone(existingDialogue, {
  speaker: 'Character2',
  text: 'Modified text'
});

// Valider un dialogue
const isValid = DialogueFactory.validate(dialogue);
```

### SceneFactory

Crée des scènes avec des valeurs par défaut cohérentes.

#### Exemples

```typescript
import { SceneFactory } from '@/factories';

// Scène vide
const scene = SceneFactory.createEmpty('Living Room');

// Scène avec background
const sceneWithBg = SceneFactory.createWithBackground(
  'Kitchen',
  '/assets/backgrounds/kitchen.jpg'
);

// Scène avec background et musique
const fullScene = SceneFactory.createWithBackgroundAndMusic(
  'Park',
  '/assets/backgrounds/park.jpg',
  '/assets/music/nature.mp3'
);

// Cloner une scène
const cloned = SceneFactory.clone(existingScene, {
  name: 'Kitchen Copy'
});

// Valider une scène
const isValid = SceneFactory.validate(scene);

// Obtenir des statistiques
const stats = SceneFactory.getStats(scene);
console.log(stats);
// {
//   characterCount: 3,
//   dialogueCount: 15,
//   propCount: 2,
//   textBoxCount: 1,
//   hasBackground: true,
//   hasMusic: true,
//   hasAmbient: false
// }
```

---

## 2. Builder Pattern

### SceneBuilder

Construit des scènes complexes avec une API fluide chainable.

#### Exemple simple

```typescript
import { SceneBuilder } from '@/builders';

const scene = new SceneBuilder('Living Room')
  .withBackground('/assets/backgrounds/living-room.jpg')
  .withMusic('/assets/music/calm.mp3')
  .addCharacter('char-1', { x: 200, y: 300 }, 'happy')
  .addCharacter('char-2', { x: 500, y: 300 }, 'neutral')
  .addDialogue('Character1', 'Hello there!')
  .addDialogue('Character2', 'Hi! How are you?')
  .addDialogue('Character1', 'I am doing great!')
  .linkDialogues() // Auto-link dialogues sequentially
  .build();
```

#### Exemple avancé avec branching

```typescript
const complexScene = new SceneBuilder('Mystery Room')
  .withBackground('/assets/backgrounds/mystery-room.jpg')
  .withAmbient('/assets/sounds/thunder.mp3')
  .addCharacter('detective', { x: 300, y: 400 }, 'serious')
  .addProp(
    'Key',
    '/assets/props/key.png',
    { x: 100, y: 200 },
    { width: 50, height: 20 }
  )
  .addDialogue('Detective', 'There is something strange here.')
  .addDialogueWithChoices(
    'Detective',
    'What should I investigate?',
    [
      { text: 'Examine the key', nextDialogue: 2 },
      { text: 'Check the window', nextDialogue: 5 }
    ]
  )
  .addDialogue('Detective', 'This key looks unusual...')
  .addTextBox(
    'Found: Mysterious Key',
    { x: 50, y: 50 },
    { width: 200, height: 50 }
  )
  .withMetadata('chapter', 'introduction')
  .build();
```

#### Méthodes utiles

```typescript
const builder = new SceneBuilder('Test Scene');

// Prévisualiser sans finaliser
const preview = builder
  .addDialogue('Narrator', 'Test')
  .preview();

// Obtenir des statistiques
const stats = builder.getStats();

// Réutiliser le builder
builder
  .reset('New Scene')
  .addDialogue('Character1', 'Starting fresh!')
  .build();
```

---

## 3. Facade Pattern

### EditorFacade

API unifiée pour toutes les opérations de l'éditeur.

#### Utilisation dans un composant

```typescript
import { useEditorFacade } from '@/facades';

function MyEditorComponent() {
  const editor = useEditorFacade();

  const handleCreateScene = () => {
    // Créer une scène simple
    const scene = editor.createScene('New Scene');

    // Ou créer avec background
    const sceneWithBg = editor.createSceneWithBackground(
      'Beach Scene',
      '/assets/backgrounds/beach.jpg'
    );

    // Ajouter des dialogues
    editor.addDialogue(scene.id, 'Narrator', 'Welcome to the beach!');
    editor.addDialogue(scene.id, 'Character1', 'The water is so blue!');

    // Sélectionner la scène
    editor.selectScene(scene.id);
  };

  const handleComplexSceneCreation = () => {
    // Utiliser le builder via la facade
    const builder = editor.getSceneBuilder('Complex Scene')
      .withBackground('/assets/backgrounds/forest.jpg')
      .addCharacter('hero', { x: 200, y: 300 }, 'determined')
      .addDialogue('Hero', 'I must find the treasure!')
      .linkDialogues();

    // Construire et ajouter directement
    const scene = editor.buildAndAddScene(builder);

    // Naviguer vers la nouvelle scène
    editor.selectScene(scene.id);
    editor.selectDialogue(scene.id, 0);
  };

  const handleCharacterManagement = () => {
    // Créer un personnage
    const character = editor.createCharacter('John', 'Male', ['brave', 'kind']);

    // Obtenir tous les personnages
    const allCharacters = editor.getAllCharacters();

    // Mettre à jour un personnage
    editor.updateCharacter(character.id, { name: 'John Smith' });

    // Ajouter le personnage à une scène
    const scene = editor.getAllScenes()[0];
    editor.addCharacterToScene(
      scene.id,
      character.id,
      { x: 300, y: 400 },
      'happy'
    );
  };

  const handleNavigation = () => {
    // Navigation dans les dialogues
    editor.navigateToNextDialogue();
    editor.navigateToPreviousDialogue();

    // Sélection
    editor.selectScene('scene-id');
    editor.selectDialogue('scene-id', 0);
    editor.clearSelection();
  };

  return (
    <div>
      <button onClick={handleCreateScene}>Create Scene</button>
      <button onClick={handleComplexSceneCreation}>Create Complex Scene</button>
      <button onClick={handleCharacterManagement}>Manage Characters</button>
    </div>
  );
}
```

#### API complète

```typescript
const editor = useEditorFacade();

// === SCÈNES ===
editor.createScene(name);
editor.createSceneWithBackground(name, backgroundImage);
editor.getScene(sceneId);
editor.getAllScenes();
editor.updateScene(sceneId, updates);
editor.deleteScene(sceneId);
editor.duplicateScene(sceneId, newName?);

// === DIALOGUES ===
editor.addDialogue(sceneId, speaker, text, audioPath?);
editor.addDialogueWithChoices(sceneId, speaker, text, choices);
editor.updateDialogue(sceneId, dialogueIndex, updates);
editor.deleteDialogue(sceneId, dialogueIndex);
editor.moveDialogueUp(sceneId, dialogueIndex);
editor.moveDialogueDown(sceneId, dialogueIndex);

// === PERSONNAGES ===
editor.createCharacter(name, gender, traits?);
editor.getCharacter(characterId);
editor.getAllCharacters();
editor.updateCharacter(characterId, updates);
editor.deleteCharacter(characterId);
editor.addCharacterToScene(sceneId, characterId, position, mood?);
editor.removeCharacterFromScene(sceneId, sceneCharacterId);
editor.updateSceneCharacter(sceneId, sceneCharacterId, updates);

// === SÉLECTION ===
editor.selectScene(sceneId);
editor.selectDialogue(sceneId, dialogueIndex);
editor.selectCharacter(characterId);
editor.selectSceneCharacter(sceneId, sceneCharacterId);
editor.clearSelection();
editor.navigateToNextDialogue();
editor.navigateToPreviousDialogue();

// === PROPS ===
editor.addProp(sceneId, name, imagePath, position, size);
editor.updateProp(sceneId, propId, updates);
editor.deleteProp(sceneId, propId);

// === TEXT BOXES ===
editor.addTextBox(sceneId, content, position, size);
editor.updateTextBox(sceneId, textBoxId, updates);
editor.deleteTextBox(sceneId, textBoxId);

// === BUILDER ===
editor.getSceneBuilder(name);
editor.buildAndAddScene(builder);
```

---

## 4. Selection Store

Gestion centralisée de la sélection avec Zustand.

### Utilisation dans un composant

```typescript
import { useSelection } from '@/hooks/useSelection';

function MyComponent() {
  const {
    selectedElement,
    isSceneSelected,
    isDialogueSelected,
    selectScene,
    selectDialogue,
    navigateToNextDialogue,
    canNavigateNext,
  } = useSelection();

  // Afficher en fonction de la sélection
  if (isSceneSelected) {
    return <SceneProperties />;
  }

  if (isDialogueSelected) {
    return (
      <div>
        <DialogueProperties />
        <button
          onClick={navigateToNextDialogue}
          disabled={!canNavigateNext}
        >
          Next Dialogue
        </button>
      </div>
    );
  }

  return <EmptyState />;
}
```

### API complète

```typescript
const selection = useSelection();

// État
selection.selectedElement;
selection.isSceneSelected;
selection.isDialogueSelected;
selection.isCharacterSelected;
selection.isLocked;
selection.mode; // 'single' | 'multi' | 'range'

// Actions de base
selection.selectScene(id);
selection.selectDialogue(sceneId, index);
selection.selectCharacter(id);
selection.selectSceneCharacter(sceneId, sceneCharacterId);
selection.clearSelection();

// Navigation
selection.navigateToPreviousDialogue();
selection.navigateToNextDialogue();
selection.canNavigatePrevious;
selection.canNavigateNext;
selection.goBack();
selection.goForward();
selection.canGoBack;
selection.canGoForward;

// Utilitaires
selection.toggleLock();
selection.getSelectionDescription();
```

---

## Exemples complets

### Exemple 1: Créer une scène interactive complète

```typescript
import { useEditorFacade } from '@/facades';

function CreateInteractiveScene() {
  const editor = useEditorFacade();

  const createTutorialScene = () => {
    // Utiliser le builder pour une construction complexe
    const builder = editor.getSceneBuilder('Tutorial Scene')
      .withBackground('/assets/backgrounds/classroom.jpg')
      .withMusic('/assets/music/tutorial-theme.mp3')

      // Ajouter le professeur
      .addCharacter('teacher', { x: 400, y: 350 }, 'friendly')

      // Dialogues d'introduction
      .addDialogue('Teacher', 'Welcome to AccessCity!')
      .addDialogue('Teacher', 'Let me show you around.')

      // Dialogue avec choix
      .addDialogueWithChoices(
        'Teacher',
        'What would you like to learn first?',
        [
          { text: 'Learn about navigation', nextDialogue: 5 },
          { text: 'Learn about characters', nextDialogue: 8 },
          { text: 'Skip tutorial', nextDialogue: 10 }
        ]
      )

      // Branche navigation
      .addDialogue('Teacher', 'Great! Let me explain navigation...')
      .addDialogue('Teacher', 'Use arrow keys to move around.')
      .addDialogue('Teacher', 'Press SPACE to continue dialogue.')

      // Branche characters
      .addDialogue('Teacher', 'Characters bring your story to life!')
      .addDialogue('Teacher', 'Each character can have different moods.')

      // Fin
      .addDialogue('Teacher', 'That completes the tutorial!')

      // Ajouter un prop décoratif
      .addProp(
        'Desk',
        '/assets/props/desk.png',
        { x: 350, y: 450 },
        { width: 200, height: 100 }
      )

      // Métadonnées
      .withMetadata('type', 'tutorial')
      .withMetadata('difficulty', 'beginner');

    // Construire et ajouter
    const scene = editor.buildAndAddScene(builder);

    // Sélectionner automatiquement
    editor.selectScene(scene.id);
    editor.selectDialogue(scene.id, 0);

    return scene;
  };

  return (
    <button onClick={createTutorialScene}>
      Create Tutorial Scene
    </button>
  );
}
```

### Exemple 2: Utiliser les factories directement

```typescript
import { DialogueFactory, SceneFactory } from '@/factories';
import { useScenesStore } from '@/stores';

function QuickSceneCreation() {
  const scenesStore = useScenesStore();

  const createQuickDialogue = () => {
    // Dialogue simple
    const dialogue1 = DialogueFactory.createText(
      'Narrator',
      'Once upon a time...'
    );

    // Dialogue avec audio
    const dialogue2 = DialogueFactory.createWithAudio(
      'Narrator',
      'In a land far away...',
      '/assets/audio/narration.mp3'
    );

    // Créer la scène
    const scene = SceneFactory.create({
      name: 'Story Beginning',
      backgroundImage: '/assets/backgrounds/fantasy.jpg',
      dialogues: [dialogue1, dialogue2]
    });

    // Valider avant d'ajouter
    if (SceneFactory.validate(scene)) {
      scenesStore.addScene(scene);
    }
  };

  return (
    <button onClick={createQuickDialogue}>
      Quick Create
    </button>
  );
}
```

### Exemple 3: Migration d'ancien code

**Avant (ancien code):**
```typescript
// ❌ Ancien code - création manuelle avec risques d'incohérence
const dialogue = {
  id: `dialogue-${Date.now()}`,
  speaker: 'Character1',
  text: 'Hello',
  choices: [],
  nextDialogue: null,
  audioPath: null,
  soundEffect: null,
  timestamp: 0,
  metadata: {}
};
```

**Après (avec Factory):**
```typescript
// ✅ Nouveau code - utiliser DialogueFactory
const dialogue = DialogueFactory.createText('Character1', 'Hello');
```

**Avant (création de scène complexe):**
```typescript
// ❌ Ancien code - difficile à lire et maintenir
const scene = {
  id: `scene-${Date.now()}`,
  name: 'Complex Scene',
  backgroundImage: '/bg.jpg',
  backgroundMusic: '/music.mp3',
  characters: [{
    id: 'sc-1',
    characterId: 'char-1',
    position: { x: 100, y: 200 },
    mood: 'happy',
    scale: 1,
    zIndex: 1
  }],
  dialogues: [/* ... */],
  props: [],
  textBoxes: []
};
```

**Après (avec Builder):**
```typescript
// ✅ Nouveau code - lisible et maintenable
const scene = new SceneBuilder('Complex Scene')
  .withBackground('/bg.jpg')
  .withMusic('/music.mp3')
  .addCharacter('char-1', { x: 100, y: 200 }, 'happy')
  .build();
```

---

## Bonnes pratiques

### ✅ DO

1. **Utiliser EditorFacade** pour toutes les opérations d'édition dans les composants
```typescript
const editor = useEditorFacade();
editor.createScene('My Scene');
```

2. **Utiliser SceneBuilder** pour les scènes complexes
```typescript
const scene = new SceneBuilder('Complex')
  .withBackground(...)
  .addCharacter(...)
  .build();
```

3. **Valider avant d'ajouter**
```typescript
if (SceneFactory.validate(scene)) {
  scenesStore.addScene(scene);
}
```

4. **Utiliser useSelection** pour la gestion de sélection
```typescript
const { selectScene, selectedElement } = useSelection();
```

### ❌ DON'T

1. **Ne pas créer d'objets manuellement**
```typescript
// ❌ Éviter
const dialogue = {
  id: `dialogue-${Date.now()}`,
  speaker: 'Test',
  // ...
};

// ✅ Préférer
const dialogue = DialogueFactory.createText('Test', 'Message');
```

2. **Ne pas accéder directement aux stores** quand EditorFacade peut le faire
```typescript
// ❌ Éviter
const scenesStore = useScenesStore();
scenesStore.addScene(scene);

// ✅ Préférer
const editor = useEditorFacade();
editor.createScene('My Scene');
```

3. **Ne pas gérer la sélection avec useState** local
```typescript
// ❌ Éviter
const [selectedElement, setSelectedElement] = useState(null);

// ✅ Préférer
const { selectedElement, selectScene } = useSelection();
```

---

## Tests

### Tester avec les factories

```typescript
import { DialogueFactory, SceneFactory } from '@/factories';

describe('DialogueFactory', () => {
  it('should create a valid dialogue', () => {
    const dialogue = DialogueFactory.createText('Speaker', 'Text');

    expect(dialogue).toBeDefined();
    expect(dialogue.id).toBeTruthy();
    expect(dialogue.speaker).toBe('Speaker');
    expect(dialogue.text).toBe('Text');
    expect(DialogueFactory.validate(dialogue)).toBe(true);
  });
});
```

### Tester avec le builder

```typescript
import { SceneBuilder } from '@/builders';

describe('SceneBuilder', () => {
  it('should build a scene with dialogues', () => {
    const scene = new SceneBuilder('Test')
      .addDialogue('Speaker', 'Hello')
      .addDialogue('Speaker', 'World')
      .linkDialogues()
      .build();

    expect(scene.dialogues).toHaveLength(2);
    expect(scene.dialogues[0].nextDialogue).toBe(1);
    expect(scene.dialogues[1].nextDialogue).toBeNull();
  });
});
```

---

## Migration progressive

Vous pouvez migrer progressivement vers les nouveaux patterns :

1. **Phase 1**: Utiliser SelectionStore dans EditorShell ✅
2. **Phase 2**: Utiliser EditorFacade pour nouvelles fonctionnalités
3. **Phase 3**: Remplacer création manuelle par Factories
4. **Phase 4**: Utiliser Builder pour scènes complexes
5. **Phase 5**: Refactorer ancien code existant

Les patterns sont **rétrocompatibles** - l'ancien code continue de fonctionner pendant la migration.

---

## Ressources

- [PATTERNS_COMPLETE_AUDIT.md](./PATTERNS_COMPLETE_AUDIT.md) - Analyse complète des patterns
- [src/factories/](./src/factories/) - Code source des factories
- [src/builders/](./src/builders/) - Code source des builders
- [src/facades/](./src/facades/) - Code source des facades
- [src/stores/selectionStore.ts](./src/stores/selectionStore.ts) - SelectionStore
- [src/hooks/useSelection.ts](./src/hooks/useSelection.ts) - Hook useSelection
