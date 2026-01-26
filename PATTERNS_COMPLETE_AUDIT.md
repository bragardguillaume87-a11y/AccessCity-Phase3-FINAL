# Audit COMPLET des Patterns de Conception - AccessCity

**Date**: 2026-01-25
**Objectif**: Liste EXHAUSTIVE de tous les patterns de conception (GoF + modernes) et leur statut dans AccessCity

---

## MÉTHODOLOGIE

Analyse basée sur:
1. **Gang of Four (GoF) - 23 patterns classiques** ([DigitalOcean Guide](https://www.digitalocean.com/community/tutorials/gangs-of-four-gof-design-patterns))
2. **Patterns React modernes 2024-2025** ([React Design Patterns](https://code-b.dev/blog/react-design-patterns))
3. **Patterns architecturaux Enterprise** ([Azure CQRS](https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs))

---

## 1. PATTERNS CREATIONAL (5/5 analysés)

### ✅ 1.1 Singleton Pattern
**Status**: **IMPLÉMENTÉ PARTIELLEMENT**

**Où**:
- `src/utils/logger.ts` - Logger singleton
- `src/stores/*` - Zustand stores (singletons de facto)

**Utilisation**:
```typescript
// Logger
export const logger = {
  debug: (...args) => console.log('[DEBUG]', ...args),
  info: (...args) => console.log('[INFO]', ...args),
  // ...
};

// Zustand store (singleton)
export const useScenesStore = create(...)
```

**Problème détecté**: Pas de vraie classe Singleton avec getInstance()
**Impact**: LOW - Zustand gère ça nativement

**Recommandation**: ✅ OK tel quel (pattern moderne avec modules ES6)

---

### ❌ 1.2 Factory Method Pattern
**Status**: **MANQUANT**

**Où ça devrait être**: Création de dialogues, scènes, personnages

**Problème actuel**:
```typescript
// Dans EditorShell, plusieurs endroits créent des dialogues inline
const newDialogue = {
  id: `dialogue-${Date.now()}`,
  speaker: '',
  text: '',
  // ... plein de propriétés par défaut
};
```

**Solution proposée**:
```typescript
// src/factories/DialogueFactory.ts
export class DialogueFactory {
  static create(speaker: string, text: string): Dialogue {
    return {
      id: `dialogue-${Date.now()}`,
      speaker,
      text,
      choices: [],
      nextDialogue: null,
      audioPath: null,
      soundEffect: null,
      timestamp: 0,
      metadata: {}
    };
  }

  static createFromTemplate(template: DialogueTemplate): Dialogue {
    // Créer à partir d'un template
  }

  static createChoice(text: string, targetDialogueId: string): Choice {
    return {
      id: `choice-${Date.now()}`,
      text,
      targetDialogueId,
      condition: null
    };
  }
}

// Usage
const dialogue = DialogueFactory.create('Narrateur', 'Bienvenue!');
```

**Avantages**:
- ✅ Centralise la logique de création
- ✅ Garantit que tous les objets sont bien formés
- ✅ Facile d'ajouter des variantes (player dialogue, narrator dialogue)
- ✅ Testable unitairement

**Priorité**: 🟡 MOYENNE (améliore maintenabilité)

---

### ❌ 1.3 Abstract Factory Pattern
**Status**: **MANQUANT (mais probablement pas nécessaire)**

**Cas d'usage théorique**:
- Créer des familles d'objets liés (scène + dialogues + personnages)
- Thèmes visuels différents

**Exemple**:
```typescript
interface StoryFactory {
  createScene(): Scene;
  createDialogue(): Dialogue;
  createCharacter(): Character;
}

class TutorialStoryFactory implements StoryFactory {
  createScene() { /* Scene simple */ }
  createDialogue() { /* Dialogue guidé */ }
  createCharacter() { /* Character avec hints */ }
}

class AdvancedStoryFactory implements StoryFactory {
  createScene() { /* Scene complexe */ }
  createDialogue() { /* Dialogue branché */ }
  createCharacter() { /* Character complet */ }
}
```

**Recommandation**: ⏭️ PAS NÉCESSAIRE (overkill pour ce projet)

---

### ❌ 1.4 Builder Pattern
**Status**: **MANQUANT** mais **TRÈS UTILE**

**Où ça devrait être**: Construction de scènes complexes, projets

**Problème actuel**:
```typescript
// Créer une scène complète est verbose
const scene: Scene = {
  id: 'scene-1',
  name: 'Introduction',
  backgroundUrl: '/bg.jpg',
  characters: [],
  dialogues: [],
  props: [],
  textBoxes: [],
  metadata: {
    tags: ['tutorial'],
    difficulty: 'easy'
  }
};
```

**Solution avec Builder**:
```typescript
// src/builders/SceneBuilder.ts
export class SceneBuilder {
  private scene: Partial<Scene> = {
    characters: [],
    dialogues: [],
    props: [],
    textBoxes: []
  };

  withId(id: string): SceneBuilder {
    this.scene.id = id;
    return this;
  }

  withName(name: string): SceneBuilder {
    this.scene.name = name;
    return this;
  }

  withBackground(url: string): SceneBuilder {
    this.scene.backgroundUrl = url;
    return this;
  }

  addDialogue(dialogue: Dialogue): SceneBuilder {
    this.scene.dialogues!.push(dialogue);
    return this;
  }

  addCharacter(char: SceneCharacter): SceneBuilder {
    this.scene.characters!.push(char);
    return this;
  }

  withTags(...tags: string[]): SceneBuilder {
    this.scene.metadata = { ...this.scene.metadata, tags };
    return this;
  }

  build(): Scene {
    if (!this.scene.id || !this.scene.name) {
      throw new Error('Scene must have id and name');
    }
    return this.scene as Scene;
  }

  // Static helper pour common scenarios
  static createTutorialScene(id: string, name: string): SceneBuilder {
    return new SceneBuilder()
      .withId(id)
      .withName(name)
      .withTags('tutorial')
      .withBackground('/assets/backgrounds/default.jpg');
  }
}

// Usage fluent
const scene = new SceneBuilder()
  .withId('scene-1')
  .withName('Introduction')
  .withBackground('/bg.jpg')
  .addDialogue(DialogueFactory.create('Narrateur', 'Bienvenue'))
  .withTags('intro', 'important')
  .build();

// Ou raccourci
const tutorialScene = SceneBuilder.createTutorialScene('tuto-1', 'Tutoriel')
  .addDialogue(...)
  .build();
```

**Avantages**:
- ✅ API fluente et lisible
- ✅ Validation centralisée
- ✅ Méthodes helper pour cas courants
- ✅ Impossible d'oublier des champs requis

**Priorité**: 🟡 HAUTE (très utile pour votre cas)

---

### ❌ 1.5 Prototype Pattern
**Status**: **MANQUANT** (mais pourrait être utile)

**Cas d'usage**: Dupliquer des objets existants (dialogues, scènes)

**Implémentation actuelle**:
```typescript
// src/utils/duplication.ts - Déjà une forme de Prototype!
export function duplicateDialogue(dialogue: Dialogue): Dialogue {
  return {
    ...dialogue,
    id: `dialogue-${Date.now()}`,
    metadata: { ...dialogue.metadata, isDuplicate: true }
  };
}

export function duplicateCharacter(character: Character, existingIds, existingNames): Character {
  // Clone avec nouveau id/name
}
```

**Status**: ✅ **DÉJÀ IMPLÉMENTÉ** (de manière fonctionnelle)

**Amélioration possible**:
```typescript
// Ajouter une méthode .clone() sur les objets
interface Cloneable<T> {
  clone(): T;
}

class Scene implements Cloneable<Scene> {
  // ...
  clone(): Scene {
    return {
      ...this,
      id: `scene-${Date.now()}`,
      dialogues: this.dialogues.map(d => ({ ...d, id: `dialogue-${Date.now()}` }))
    };
  }
}
```

**Recommandation**: ⏭️ PAS PRIORITAIRE (déjà fait avec spread operator)

---

## 2. PATTERNS STRUCTURAL (7/7 analysés)

### ⚠️ 2.1 Adapter Pattern
**Status**: **PARTIELLEMENT IMPLÉMENTÉ**

**Où**:
- Conversion `Prop → CanvasProp` dans MainCanvas
- Conversion `TextBox → CanvasTextBox`

**Code actuel**:
```typescript
// MainCanvas.tsx:316-322
const canvasProp: CanvasProp = {
  id: prop.id,
  emoji: prop.assetUrl,  // ← ADAPTATION
  position: prop.position,
  size: prop.size
};
```

**Problème**: Fait inline, devrait être centralisé

**Solution**:
```typescript
// src/adapters/CanvasAdapters.ts
export class PropToCanvasPropAdapter {
  static adapt(prop: Prop): CanvasProp {
    return {
      id: prop.id,
      emoji: prop.assetUrl,
      position: prop.position,
      size: prop.size
    };
  }

  static adaptMany(props: Prop[]): CanvasProp[] {
    return props.map(this.adapt);
  }
}

export class TextBoxAdapter {
  static toCanvas(textBox: TextBox): CanvasTextBox {
    return {
      id: textBox.id,
      text: textBox.content,
      fontSize: textBox.style?.fontSize,
      fontWeight: textBox.style?.fontWeight,
      color: textBox.style?.color,
      textAlign: textBox.style?.textAlign,
      position: textBox.position,
      size: textBox.size
    };
  }
}

// Usage
const canvasProps = PropToCanvasPropAdapter.adaptMany(scene.props);
```

**Priorité**: 🟢 BASSE (fonctionne mais pourrait être mieux organisé)

---

### ❌ 2.2 Bridge Pattern
**Status**: **NON APPLICABLE**

**Cas d'usage théorique**: Séparer abstraction et implémentation
**Exemple**: Renderer abstrait (Canvas, SVG, WebGL)

**Recommandation**: ⏭️ PAS NÉCESSAIRE pour ce projet

---

### ⚠️ 2.3 Composite Pattern
**Status**: **IMPLICITEMENT UTILISÉ** mais pas formalisé

**Où**: Hiérarchie Scene → Dialogues, Characters, Props

**Structure actuelle**:
```typescript
interface Scene {
  dialogues: Dialogue[];  // Composite!
  characters: SceneCharacter[];  // Composite!
  props: Prop[];  // Composite!
  textBoxes: TextBox[];  // Composite!
}
```

**C'est du Composite Pattern!** Mais pas explicite.

**Formalisation possible**:
```typescript
// Pattern Composite formel
interface SceneElement {
  id: string;
  render(): JSX.Element;
  getInfo(): string;
}

class Dialogue implements SceneElement {
  render() { return <DialogueComponent />; }
  getInfo() { return `Dialogue: ${this.text}`; }
}

class SceneCharacter implements SceneElement {
  render() { return <CharacterSprite />; }
  getInfo() { return `Character: ${this.characterId}`; }
}

class Scene implements SceneElement {
  private elements: SceneElement[] = [];

  add(element: SceneElement) {
    this.elements.push(element);
  }

  render() {
    return <>
      {this.elements.map(el => el.render())}
    </>;
  }

  getInfo() {
    return this.elements.map(el => el.getInfo()).join(', ');
  }
}
```

**Recommandation**: ⏭️ Pas nécessaire de formaliser (déjà bien avec arrays)

---

### ❌ 2.4 Decorator Pattern
**Status**: **MANQUANT** mais **POURRAIT ÊTRE UTILE**

**Cas d'usage**: Ajouter dynamiquement des comportements

**Exemples potentiels**:
```typescript
// Décorer un dialogue avec des effets
interface Dialogue {
  render(): string;
}

class BaseDialogue implements Dialogue {
  constructor(private text: string) {}
  render() { return this.text; }
}

class SoundEffectDecorator implements Dialogue {
  constructor(private dialogue: Dialogue, private sound: string) {}
  render() {
    playSound(this.sound);
    return this.dialogue.render();
  }
}

class TypewriterDecorator implements Dialogue {
  constructor(private dialogue: Dialogue) {}
  render() {
    return typewriterEffect(this.dialogue.render());
  }
}

// Usage
const dialogue = new TypewriterDecorator(
  new SoundEffectDecorator(
    new BaseDialogue('Bonjour!'),
    'notification.mp3'
  )
);
```

**Problème**: Complexe pour peu de bénéfice

**Alternative React**: Higher-Order Components (déjà utilisé)
```typescript
const withSoundEffect = (Component) => (props) => {
  useEffect(() => playSound(props.sound), []);
  return <Component {...props} />;
};
```

**Recommandation**: ⏭️ Utiliser HOCs React à la place

---

### ❌ 2.5 Facade Pattern
**Status**: **MANQUANT** - **TRÈS RECOMMANDÉ**

**Problème actuel**: Interfaces complexes pour interagir avec Zustand

**Exemple problématique**:
```typescript
// Pour ajouter un dialogue, il faut:
const { addDialogue } = useDialogueActions();
const { setSelectedElement } = useState(...);
const { updateScene } = useSceneActions();

// Et coordonner tout ça manuellement
```

**Solution avec Facade**:
```typescript
// src/facades/EditorFacade.ts
export class EditorFacade {
  constructor(
    private sceneActions = useSceneActions(),
    private dialogueActions = useDialogueActions(),
    private selectionStore = useSelectionStore()
  ) {}

  // API simplifiée
  addDialogueToCurrentScene(text: string, speaker: string) {
    const currentScene = this.sceneActions.getCurrentScene();
    const dialogue = DialogueFactory.create(speaker, text);
    this.dialogueActions.addDialogue(currentScene.id, dialogue);
    this.selectionStore.selectDialogue(currentScene.id, currentScene.dialogues.length);
  }

  duplicateCurrentDialogue() {
    const selected = this.selectionStore.getSelectedElement();
    if (selected.type === 'dialogue') {
      const dialogue = this.dialogueActions.getDialogue(selected.sceneId, selected.index);
      const duplicated = duplicateDialogue(dialogue);
      this.dialogueActions.addDialogue(selected.sceneId, duplicated);
    }
  }

  // Opération complexe simplifiée
  createSceneWithDialogues(name: string, dialogues: {speaker: string, text: string}[]) {
    const scene = SceneBuilder.createTutorialScene(`scene-${Date.now()}`, name)
      .build();

    this.sceneActions.addScene(scene);

    dialogues.forEach(({speaker, text}) => {
      const dialogue = DialogueFactory.create(speaker, text);
      this.dialogueActions.addDialogue(scene.id, dialogue);
    });

    this.selectionStore.selectScene(scene.id);
  }
}

// Usage SIMPLE
const editor = new EditorFacade();
editor.addDialogueToCurrentScene('Bonjour!', 'Narrateur');
```

**Avantages**:
- ✅ API simple pour opérations complexes
- ✅ Réduit le couplage
- ✅ Facile à tester
- ✅ Cachette la complexité de Zustand

**Priorité**: 🟡 HAUTE (améliore énormément DX)

**Source**: [Facade Pattern in JavaScript](https://www.dofactory.com/javascript/design-patterns/facade)

---

### ❌ 2.6 Flyweight Pattern
**Status**: **NON APPLICABLE**

**Cas d'usage**: Partager des données immuables entre objets (économie mémoire)
**Exemple**: Sprites de caractères partagés

**Déjà géré par React**: React mémorise automatiquement

**Recommandation**: ⏭️ PAS NÉCESSAIRE

---

### ⚠️ 2.7 Proxy Pattern
**Status**: **POURRAIT ÊTRE UTILE** pour lazy loading

**Cas d'usage**: Lazy loading des sprites de personnages

**Exemple**:
```typescript
// src/proxies/CharacterProxy.ts
export class CharacterSpriteProxy {
  private loadedSprites: Map<string, HTMLImageElement> = new Map();

  async getSprite(url: string): Promise<HTMLImageElement> {
    // Cache check
    if (this.loadedSprites.has(url)) {
      return this.loadedSprites.get(url)!;
    }

    // Lazy load
    const img = new Image();
    img.src = url;
    await img.decode();

    this.loadedSprites.set(url, img);
    return img;
  }

  preload(urls: string[]) {
    urls.forEach(url => this.getSprite(url));
  }

  clearCache() {
    this.loadedSprites.clear();
  }
}
```

**Recommandation**: 🟢 BASSE PRIORITÉ (navigateur cache déjà)

---

## 3. PATTERNS BEHAVIORAL (11/11 analysés)

### ❌ 3.1 Chain of Responsibility Pattern
**Status**: **MANQUANT** mais **POURRAIT ÊTRE UTILE**

**Cas d'usage**: Validation en cascade, event handling

**Exemple pour validation**:
```typescript
// src/validation/ValidationChain.ts
interface Validator {
  setNext(validator: Validator): Validator;
  validate(scene: Scene): ValidationResult;
}

class SceneNameValidator implements Validator {
  private nextValidator: Validator | null = null;

  setNext(validator: Validator): Validator {
    this.nextValidator = validator;
    return validator;
  }

  validate(scene: Scene): ValidationResult {
    if (!scene.name || scene.name.trim() === '') {
      return { valid: false, error: 'Scene name is required' };
    }

    if (this.nextValidator) {
      return this.nextValidator.validate(scene);
    }

    return { valid: true };
  }
}

class SceneBackgroundValidator implements Validator {
  // Same structure...
  validate(scene: Scene): ValidationResult {
    if (!scene.backgroundUrl) {
      return { valid: false, error: 'Background is required' };
    }
    return this.nextValidator?.validate(scene) || { valid: true };
  }
}

class SceneDialoguesValidator implements Validator {
  validate(scene: Scene): ValidationResult {
    if (!scene.dialogues || scene.dialogues.length === 0) {
      return { valid: false, error: 'At least one dialogue is required' };
    }
    return this.nextValidator?.validate(scene) || { valid: true };
  }
}

// Setup chain
const validator = new SceneNameValidator();
validator
  .setNext(new SceneBackgroundValidator())
  .setNext(new SceneDialoguesValidator());

// Usage
const result = validator.validate(scene);
if (!result.valid) {
  showError(result.error);
}
```

**Alternative actuelle**: Validation inline dans `useValidation.ts`

**Recommandation**: ⏭️ PAS PRIORITAIRE (validation actuelle fonctionne)

---

### ✅ 3.2 Command Pattern
**Status**: **IDENTIFIÉ COMME MANQUANT** dans analyse précédente

→ Voir PATTERNS_ANALYSIS.md pour implémentation détaillée

---

### ❌ 3.3 Interpreter Pattern
**Status**: **NON APPLICABLE**

**Cas d'usage**: Interpréter un langage (DSL, expressions)

**Exemple théorique**: Conditions dans dialogues
```
if player.hasItem("key") then show_dialogue("door_unlocked")
```

**Recommandation**: ⏭️ PAS NÉCESSAIRE (trop complexe)

---

### ⚠️ 3.4 Iterator Pattern
**Status**: **UTILISÉ IMPLICITEMENT** (arrays JavaScript)

**Où**: Partout avec `.map()`, `.forEach()`, `for...of`

```typescript
scene.dialogues.forEach(dialogue => { ... });  // Iterator!
```

**Recommandation**: ✅ DÉJÀ OK (JavaScript natif)

---

### ❌ 3.5 Mediator Pattern
**Status**: **MANQUANT** mais **RECOMMANDÉ**

**Problème actuel**: Communication directe entre composants (props drilling)

**Solution Mediator**:
```typescript
// src/mediators/EditorMediator.ts
export class EditorMediator {
  private components: Map<string, any> = new Map();

  register(name: string, component: any) {
    this.components.set(name, component);
    component.setMediator(this);
  }

  notify(sender: string, event: string, data: any) {
    // Coordonne les interactions
    switch (event) {
      case 'SCENE_SELECTED':
        this.components.get('PropertiesPanel')?.update(data);
        this.components.get('MainCanvas')?.render(data);
        this.components.get('Explorer')?.highlight(data.sceneId);
        break;

      case 'DIALOGUE_ADDED':
        this.components.get('Timeline')?.addMarker(data);
        this.components.get('MainCanvas')?.refresh();
        break;

      // ...
    }
  }
}

// Usage
const mediator = new EditorMediator();
mediator.register('Explorer', explorerPanel);
mediator.register('PropertiesPanel', propertiesPanel);
mediator.register('MainCanvas', mainCanvas);

// Dans Explorer
mediator.notify('Explorer', 'SCENE_SELECTED', { sceneId: 'scene-1' });
```

**Problème**: Complexifie l'architecture

**Alternative moderne**: Event Bus (déjà mentionné) ou Zustand subscriptions

**Recommandation**: ⏭️ Utiliser Event Bus à la place (plus simple)

---

### ⚠️ 3.6 Memento Pattern
**Status**: **IMPLÉMENTÉ** via Zundo

**Où**: `src/hooks/useUndoRedo.ts` avec temporal middleware

```typescript
// Zundo = Memento Pattern!
const scenesPastStates = useStore(useScenesStore.temporal, (state) => state?.pastStates);
```

**Recommandation**: ✅ DÉJÀ OK

---

### ⚠️ 3.7 Observer Pattern
**Status**: **IMPLÉMENTÉ** via Zustand subscriptions

**Où**: Zustand stores notifient automatiquement les composants

```typescript
// Observer pattern via Zustand
const selectedScene = useScenes((state) => state.scenes.find(...));
// ↑ Component s'abonne automatiquement

// Subscription explicite
useEffect(() => {
  const unsubscribe = useScenesStore.subscribe(
    (state) => state.scenes,
    (scenes) => console.log('Scenes changed:', scenes)
  );
  return unsubscribe;
}, []);
```

**Recommandation**: ✅ DÉJÀ OK (Zustand = Observer pattern)

---

### ✅ 3.8 State Pattern / State Machine
**Status**: **IDENTIFIÉ COMME MANQUANT** dans analyse précédente

→ Voir PATTERNS_ANALYSIS.md pour XState

---

### ❌ 3.9 Strategy Pattern
**Status**: **MANQUANT** mais **POURRAIT ÊTRE UTILE**

**Cas d'usage**: Différentes stratégies de export, validation, rendering

**Exemple pour Export**:
```typescript
// src/strategies/ExportStrategy.ts
interface ExportStrategy {
  export(project: Project): Promise<Blob>;
}

class JSONExportStrategy implements ExportStrategy {
  async export(project: Project): Promise<Blob> {
    const json = JSON.stringify(project, null, 2);
    return new Blob([json], { type: 'application/json' });
  }
}

class HTMLExportStrategy implements ExportStrategy {
  async export(project: Project): Promise<Blob> {
    const html = this.generateHTML(project);
    return new Blob([html], { type: 'text/html' });
  }

  private generateHTML(project: Project): string {
    // Generate playable HTML
  }
}

class UnityExportStrategy implements ExportStrategy {
  async export(project: Project): Promise<Blob> {
    // Generate Unity-compatible format
  }
}

// Context
class ProjectExporter {
  constructor(private strategy: ExportStrategy) {}

  setStrategy(strategy: ExportStrategy) {
    this.strategy = strategy;
  }

  async export(project: Project): Promise<Blob> {
    return this.strategy.export(project);
  }
}

// Usage
const exporter = new ProjectExporter(new JSONExportStrategy());
await exporter.export(project);

// Changer de stratégie
exporter.setStrategy(new HTMLExportStrategy());
await exporter.export(project);
```

**Priorité**: 🟡 MOYENNE (utile pour extensibilité)

---

### ❌ 3.10 Template Method Pattern
**Status**: **MANQUANT** mais **PEU UTILE**

**Cas d'usage**: Algorithme avec steps customisables

**Recommandation**: ⏭️ PAS NÉCESSAIRE (React hooks font le job)

---

### ❌ 3.11 Visitor Pattern
**Status**: **MANQUANT** et **PEU UTILE**

**Cas d'usage**: Opérations sur structures d'objets hétérogènes

**Recommandation**: ⏭️ PAS NÉCESSAIRE (trop complexe pour React)

---

## 4. PATTERNS REACT MODERNES (2024-2025)

**Sources**:
- [React Design Patterns 2024](https://code-b.dev/blog/react-design-patterns)
- [React Architecture Best Practices](https://www.geeksforgeeks.org/reactjs/react-architecture-pattern-and-best-practices/)

### ✅ 4.1 Custom Hooks Pattern
**Status**: **IMPLÉMENTÉ**

**Exemples**:
- `useUndoRedo`
- `useCanvasDragDrop`
- `useValidation`
- `useKeyboardShortcuts`

**Recommandation**: ✅ DÉJÀ OK, continuer à utiliser

---

### ⚠️ 4.2 Provider Pattern (Context API)
**Status**: **PAS UTILISÉ** (Zustand à la place)

**Actuel**: Zustand = état global sans Context

**Recommandation**: ✅ OK (Zustand est meilleur que Context pour ce cas)

---

### ⚠️ 4.3 Higher-Order Components (HOC)
**Status**: **UTILISÉ MINIMALEMENT**

**Où**: `ErrorBoundary` wrapper

```typescript
<ErrorBoundary name="MainCanvas">
  <MainCanvas ... />
</ErrorBoundary>
```

**Recommandation**: ✅ OK (HOCs moins populaires que hooks maintenant)

---

### ⚠️ 4.4 Render Props Pattern
**Status**: **PAS UTILISÉ**

**Alternative**: Custom hooks font le même job

**Recommandation**: ✅ OK (hooks sont mieux)

---

### ❌ 4.5 Compound Components Pattern
**Status**: **MANQUANT** mais **POURRAIT ÊTRE UTILE**

**Cas d'usage**: Composants configurables avec sous-composants

**Exemple**:
```typescript
// Actuel (pas flexible)
<DialogueForm dialogue={dialogue} onUpdate={update} />

// Avec Compound Components
<DialogueForm dialogue={dialogue}>
  <DialogueForm.Speaker />
  <DialogueForm.Text />
  <DialogueForm.Choices />
  <DialogueForm.AudioPicker />
</DialogueForm>
```

**Recommandation**: 🟢 BASSE (pas urgent)

---

### ✅ 4.6 Container/Presentational Pattern
**Status**: **IMPLÉMENTÉ PARTIELLEMENT**

**Exemples**:
- `MainCanvas` (container) → `CharacterSprite` (presentational)
- `PropertiesPanel` (container) → `DialoguePropertiesForm` (presentational)

**Recommandation**: ✅ DÉJÀ OK

---

## 5. PATTERNS ARCHITECTURAUX ENTERPRISE

**Sources**:
- [Azure CQRS Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs)
- [Event Sourcing Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing)

### ❌ 5.1 Repository Pattern
**Status**: **MANQUANT** - **RECOMMANDÉ**

**Problème actuel**: Logique d'accès aux données éparpillée

**Solution**:
```typescript
// src/repositories/SceneRepository.ts
export class SceneRepository {
  constructor(private store: ReturnType<typeof useScenesStore>) {}

  getAll(): Scene[] {
    return this.store.getState().scenes;
  }

  getById(id: string): Scene | undefined {
    return this.store.getState().scenes.find(s => s.id === id);
  }

  add(scene: Scene): void {
    this.store.getState().addScene(scene);
  }

  update(id: string, updates: Partial<Scene>): void {
    this.store.getState().updateScene(id, updates);
  }

  delete(id: string): void {
    this.store.getState().deleteScene(id);
  }

  // Queries complexes
  getByTag(tag: string): Scene[] {
    return this.getAll().filter(s => s.metadata?.tags?.includes(tag));
  }

  getWithCharacter(characterId: string): Scene[] {
    return this.getAll().filter(s =>
      s.characters?.some(c => c.characterId === characterId)
    );
  }
}

// Usage
const sceneRepo = new SceneRepository(useScenesStore);
const tutorialScenes = sceneRepo.getByTag('tutorial');
```

**Avantages**:
- ✅ Abstraction de la persistence
- ✅ Queries complexes centralisées
- ✅ Facile de changer de backend (localStorage → API)
- ✅ Testable avec mocks

**Priorité**: 🟡 HAUTE (améliore architecture)

---

### ❌ 5.2 Service Layer Pattern
**Status**: **MANQUANT** - **RECOMMANDÉ**

**Problème**: Logique métier mélangée dans les composants

**Solution**:
```typescript
// src/services/SceneService.ts
export class SceneService {
  constructor(
    private sceneRepo: SceneRepository,
    private dialogueRepo: DialogueRepository,
    private validationService: ValidationService
  ) {}

  async createScene(name: string, backgroundUrl?: string): Promise<Scene> {
    // Logique métier
    const scene = SceneBuilder.create()
      .withId(`scene-${Date.now()}`)
      .withName(name)
      .withBackground(backgroundUrl || '/assets/backgrounds/default.jpg')
      .build();

    // Validation
    const validation = this.validationService.validateScene(scene);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Sauvegarde
    this.sceneRepo.add(scene);

    return scene;
  }

  async duplicateScene(sceneId: string): Promise<Scene> {
    const original = this.sceneRepo.getById(sceneId);
    if (!original) throw new Error('Scene not found');

    const duplicate = {
      ...original,
      id: `scene-${Date.now()}`,
      name: `${original.name} (Copy)`,
      dialogues: original.dialogues.map(d => ({
        ...d,
        id: `dialogue-${Date.now()}`
      }))
    };

    this.sceneRepo.add(duplicate);
    return duplicate;
  }

  async exportScene(sceneId: string, format: 'json' | 'html'): Promise<Blob> {
    const scene = this.sceneRepo.getById(sceneId);
    // ... logic
  }
}

// Usage dans composants
const sceneService = new SceneService(sceneRepo, dialogueRepo, validationService);
const newScene = await sceneService.createScene('Introduction');
```

**Avantages**:
- ✅ Logique métier centralisée
- ✅ Composants UI purs (pas de business logic)
- ✅ Testable unitairement
- ✅ Réutilisable

**Priorité**: 🟡 HAUTE

---

### ❌ 5.3 CQRS (Command Query Responsibility Segregation)
**Status**: **MANQUANT** mais **OVERKILL**

**Concept**: Séparer reads et writes

**Exemple**:
```typescript
// Commands (writes)
class CreateSceneCommand { execute() { ... } }
class UpdateDialogueCommand { execute() { ... } }

// Queries (reads)
class GetAllScenesQuery { execute() { ... } }
class GetDialoguesBySceneQuery { execute() { ... } }
```

**Recommandation**: ⏭️ TROP COMPLEXE pour ce projet

---

### ❌ 5.4 Event Sourcing
**Status**: **MANQUANT** mais **OVERKILL**

**Concept**: Stocker tous les événements au lieu de l'état final

**Recommandation**: ⏭️ TROP COMPLEXE (zundo suffit)

---

### ❌ 5.5 Domain-Driven Design (DDD)
**Status**: **PAS FORMELLEMENT APPLIQUÉ**

**Concepts DDD qui pourraient aider**:
- **Entities**: Scene, Dialogue, Character (déjà là!)
- **Value Objects**: Position, Size (déjà là!)
- **Aggregates**: Scene = aggregate root
- **Domain Events**: SceneCreated, DialogueAdded, etc.

**Recommandation**: ⏭️ Concepts utiles mais pas besoin de full DDD

---

## 6. PATTERNS SPÉCIFIQUES ÉDITEUR

### ❌ 6.1 Undo Manager Pattern
**Status**: Partiellement (zundo) mais Command Pattern manque

→ Voir Command Pattern

---

### ❌ 6.2 Plugin/Extension Pattern
**Status**: **MANQUANT** mais **PAS PRIORITAIRE**

**Cas d'usage futur**: Permettre des extensions tierces

**Recommandation**: ⏭️ PHASE FUTURE

---

### ❌ 6.3 Toolbar/Action Pattern
**Status**: **IMPLICITEMENT UTILISÉ**

**Où**: `TopBar`, `QuickActionsBar`

**Recommandation**: ✅ OK

---

## RÉSUMÉ COMPLET

### Patterns Critiques MANQUANTS (À implémenter)

1. **🔴 State Machine** (XState) - CRITIQUE pour sélection
2. **🔴 SelectionStore** (Zustand) - CRITIQUE pour état global
3. **🟡 Factory Method** - HAUTE pour création objets
4. **🟡 Builder Pattern** - HAUTE pour Scene/Dialogue
5. **🟡 Facade Pattern** - HAUTE pour simplifier API
6. **🟡 Repository Pattern** - HAUTE pour accès données
7. **🟡 Service Layer** - HAUTE pour logique métier
8. **🟡 Command Pattern** - MOYENNE pour undo/redo avancé
9. **🟡 Strategy Pattern** - MOYENNE pour export

### Patterns Déjà OK

- ✅ Singleton (Zustand)
- ✅ Prototype (via spread)
- ✅ Adapter (partiel)
- ✅ Composite (implicit)
- ✅ Memento (zundo)
- ✅ Observer (Zustand)
- ✅ Iterator (JavaScript natif)
- ✅ Custom Hooks
- ✅ Container/Presentational

### Patterns Pas Nécessaires

- ⏭️ Abstract Factory
- ⏭️ Bridge
- ⏭️ Flyweight
- ⏭️ Interpreter
- ⏭️ Template Method
- ⏭️ Visitor
- ⏭️ CQRS
- ⏭️ Event Sourcing

---

## ESTIMATION COMPLÈTE

### Option 1: Patterns Critiques (Semaine 1-2)
1. State Machine + SelectionStore - 3 jours
2. Factory + Builder - 1 jour
3. Facade - 1 jour
**Total**: **5 jours**

### Option 2: + Patterns Architecture (Semaine 3-4)
4. Repository + Service Layer - 3 jours
5. Command Pattern - 2 jours
**Total**: **10 jours (2 semaines)**

### Option 3: + Patterns Avancés (Semaine 5-6)
6. Strategy (Export) - 2 jours
7. Refactoring global - 3 jours
**Total**: **15 jours (3 semaines)**

---

## RECOMMANDATION FINALE

**Commencer par Option 1** (5 jours):
1. State Machine (critique pour bugs)
2. SelectionStore (critique pour architecture)
3. Factory + Builder (améliore qualité code)
4. Facade (simplifie DX)

**Puis évaluer** si Option 2 est nécessaire selon feedback utilisateur.

---

## SOURCES COMPLÈTES

### Gang of Four
- [Gang of Four Design Patterns - DigitalOcean](https://www.digitalocean.com/community/tutorials/gangs-of-four-gof-design-patterns)
- [GoF Design Patterns - Spring Framework Guru](https://springframework.guru/gang-of-four-design-patterns/)
- [GoF Patterns List - GitHub Gist](https://gist.github.com/xnuinside/0de6418355d39a3babbd857c25457861)

### React Patterns Modernes
- [React Design Patterns 2024](https://code-b.dev/blog/react-design-patterns)
- [React Architecture Patterns 2024](https://www.bacancytechnology.com/blog/react-architecture-patterns-and-best-practices)
- [React Architecture Best Practices 2025](https://www.geeksforgeeks.org/reactjs/react-architecture-pattern-and-best-practices/)
- [Facade Pattern in JavaScript](https://www.dofactory.com/javascript/design-patterns/facade)

### Enterprise Patterns
- [CQRS Pattern - Azure](https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs)
- [Event Sourcing Pattern - Azure](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing)
- [Awesome DDD Resources - GitHub](https://github.com/heynickc/awesome-ddd)
