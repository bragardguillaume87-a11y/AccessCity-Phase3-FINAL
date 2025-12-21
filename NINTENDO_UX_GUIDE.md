# 🎮 AccessCity - Guide UX Nintendo-Level

## Philosophie de design

> **"Un enfant de 8 ans doit comprendre comment l'utiliser en 30 secondes, un expert doit pouvoir créer des histoires complexes en 5 minutes."**
> — Inspiré de Shigeru Miyamoto

---

## 1. Vocabulaire User-Friendly

### ❌ AVANT (jargon technique)

| Terme technique | Problème |
|-----------------|----------|
| Variables | Trop abstrait, développeur-centrique |
| Dialogues | Formel, pas engageant |
| Background | Anglais technique |
| Scene | Neutre, pas de métaphore |
| Characters | Froid |
| Assets | Jargon technique |
| Context | Abstrait |

### ✅ APRÈS (langage naturel)

| Nouveau terme | Métaphore | Icône |
|---------------|-----------|-------|
| **Jauges** (ou Traits) | Barres d'énergie RPG | ⚡ 💪 🧠 |
| **Répliques** | Théâtre / BD | 💬 |
| **Décor** | Scène de théâtre | 🏞️ |
| **Tableau** | Peinture / Acte théâtre | 🎬 |
| **Personnages** | Plus chaleureux | 👤 |
| **Bibliothèque** | Collection organisée | 📚 |
| **Univers de l'histoire** | Contexte narratif | 🌍 |

### Jauges spécifiques

| Ancien | Nouveau | Icône | Couleur |
|--------|---------|-------|---------|
| Physique | **Force** | 💪 | Orange |
| Mentale | **Moral** | 🧠 | Bleu |
| Empathie | **Empathie** (OK) | ❤️ | Rose |
| Autonomie | **Confiance en soi** | ⭐ | Jaune |
| Confiance | **Lien social** | 🤝 | Vert |

---

## 2. Design Patterns Nintendo

### Pattern 1 : **Feedback Immédiat** (Super Mario Maker)

**Principe** : Chaque action donne un retour visuel/sonore instantané.

```jsx
// AVANT : Bouton sans feedback
<button onClick={addScene}>Ajouter</button>

// APRÈS : Feedback multi-sensoriel
<button
  onClick={addScene}
  className="hover:scale-105 active:scale-95 transition-transform"
  onMouseEnter={() => playHoverSound()}
  onMouseDown={() => playClickSound()}
>
  <span className="inline-block animate-bounce">+</span>
  Nouveau Tableau
</button>
```

**Animations requises** :
- Hover : Scale 1.05 + shadow grow
- Click : Scale 0.95 (bounce)
- Apparition : Fade + slide from top
- Suppression : Fade + shrink to point

### Pattern 2 : **Preview en Temps Réel** (Animal Crossing)

**Principe** : Voir le résultat avant de valider.

```jsx
// Éditeur de personnage avec preview live
<div className="grid grid-cols-2">
  {/* Gauche : Formulaire */}
  <CharacterForm onChange={handleChange} />

  {/* Droite : Preview temps réel */}
  <CharacterPreview
    character={formData}
    animate={true}
    showMoods={true}
  />
</div>
```

**Implémentation** :
- Split screen : 40% formulaire / 60% preview
- Preview update en < 16ms (60fps)
- Animations de transition entre moods

### Pattern 3 : **Drag & Drop Intuitif** (Super Smash Bros Stage Builder)

**Principe** : Manipuler directement les éléments visuels.

```jsx
// Bibliothèque de personnages → Drag vers scène
<CharacterLibrary>
  {characters.map(char => (
    <CharacterCard
      key={char.id}
      character={char}
      draggable={true}
      onDragStart={() => setCursor('grabbing')}
      onDragEnd={(position) => addToScene(char.id, position)}
      preview={<CharacterAvatar src={char.sprite} />}
    />
  ))}
</CharacterLibrary>

// Scène reçoit le drop
<SceneCanvas
  onDrop={(char, x, y) => placeCharacter(char, x, y)}
  showDropZone={isDragging}
  gridSnap={true}
/>
```

**Interactions** :
- Ghost preview pendant drag
- Drop zones highlighted
- Snap to grid avec feedback visuel
- Undo immédiat si mauvais placement

### Pattern 4 : **Undo/Redo Visuel** (Mario Maker Timeline)

**Principe** : Historique visible, navigation temporelle intuitive.

```jsx
// Timeline d'actions en bas de l'écran
<UndoTimeline>
  <TimelineTrack>
    {history.map((action, i) => (
      <TimelineNode
        key={i}
        icon={getActionIcon(action)} // + 👤 ✏️ 🗑️
        active={i === currentIndex}
        onClick={() => jumpToState(i)}
        tooltip={action.description}
      />
    ))}
  </TimelineTrack>

  <div className="flex gap-2">
    <UndoButton disabled={!canUndo} shortcut="Ctrl+Z" />
    <RedoButton disabled={!canRedo} shortcut="Ctrl+Y" />
  </div>
</UndoTimeline>
```

**Features** :
- Timeline horizontale en bas
- Nodes cliquables pour jump to state
- Icônes pour chaque type d'action
- Shortcuts clavier toujours visibles

### Pattern 5 : **Bibliothèque Visuelle** (Pokémon Box)

**Principe** : Organiser et filtrer visuellement, pas via des listes.

```jsx
<CharacterLibrary>
  {/* Barre de recherche avec filtres visuels */}
  <SearchBar
    placeholder="Chercher un personnage..."
    filters={[
      { label: 'Tous', icon: '🌐' },
      { label: 'Principaux', icon: '⭐' },
      { label: 'Secondaires', icon: '👥' },
      { label: 'Figurants', icon: '👤' },
    ]}
  />

  {/* Grille de cartes visuelles */}
  <Grid cols={4} gap={4}>
    {characters.map(char => (
      <CharacterCard
        sprite={char.sprite}
        name={char.name}
        badges={char.moods} // Pastilles pour chaque mood
        onClick={() => editCharacter(char)}
        onDrag={() => dragToScene(char)}
      />
    ))}
  </Grid>
</CharacterLibrary>
```

**Organisation** :
- Grille de cartes (pas de liste texte)
- Avatars/sprites visibles immédiatement
- Filtres à 1 clic (tags visuels)
- Recherche instantanée avec highlight

### Pattern 6 : **Tutoriel Progressif** (Splatoon Onboarding)

**Principe** : Apprendre en faisant, pas en lisant.

```jsx
<TutorialOverlay
  step={currentStep}
  totalSteps={5}
  onComplete={markTutorialComplete}
>
  {/* Step 1 : Créer un personnage */}
  <TutorialStep
    target="#character-library"
    message="Commençons par créer votre premier personnage !"
    action="Cliquez sur + Nouveau Personnage"
    arrow="bottom-right"
  />

  {/* Step 2 : Drag vers scène */}
  <TutorialStep
    target="#scene-canvas"
    message="Glissez-déposez votre personnage sur la scène"
    highlightDropZone={true}
  />
</TutorialOverlay>
```

**Progression** :
1. Créer personnage
2. Le placer sur scène
3. Ajouter une réplique
4. Choisir un décor
5. Tester en preview

### Pattern 7 : **États Impossibles Impossibles** (Zelda Design)

**Principe** : Désactiver les actions invalides, pas d'erreurs.

```jsx
// AVANT : Erreur si pas de personnage sélectionné
<button onClick={addDialogue}>
  Ajouter Réplique
</button>
{error && <span className="text-red-500">{error}</span>}

// APRÈS : Bouton disabled avec tooltip explicatif
<Tooltip content="Sélectionnez d'abord un personnage">
  <button
    onClick={addDialogue}
    disabled={!selectedCharacter}
    className={!selectedCharacter && 'opacity-50 cursor-not-allowed'}
  >
    Ajouter Réplique
  </button>
</Tooltip>
```

**Prévention** :
- Désactiver actions impossibles (pas les cacher)
- Tooltips explicatifs sur disabled
- Guidance visuelle (flèches, highlight)
- Jamais de crash ou erreur rouge

---

## 3. Layout "Nintendo-Like"

### Architecture : **Editor-First** (pas de Wizard)

```
┌─────────────────────────────────────────────────────────┐
│ [AccessCity] [📁 Projet] [▶️ Tester] [⚙️]    [⏮️ ⏯️ ⏭️] │ ← Top Bar
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌────────────────────────┐ ┌─────────────┐│
│ │📚        │ │   🎬 TABLEAU 1         │ │  Propriétés ││
│ │Biblio    │ │                        │ │             ││
│ │          │ │   [Décor: Mairie]      │ │ 🏞️ Décor    ││
│ │👤 Alice  │ │                        │ │             ││
│ │👤 Bob    │ │    👤     👤           │ │ 💬 Répliques││
│ │👤 Clara  │ │   Alice   Bob          │ │  - Intro    ││
│ │          │ │                        │ │  - Choix    ││
│ │🏞️ Décors │ │                        │ │             ││
│ │  Mairie  │ │                        │ │ ⚡ Effets    ││
│ │  Parc    │ │                        │ │  Force +5   ││
│ │          │ │                        │ │             ││
│ └──────────┘ └────────────────────────┘ └─────────────┘│
├─────────────────────────────────────────────────────────┤
│ ⏪ ⏮️  [═══════●═════════════] ⏭️ ⏩   [Ctrl+Z] [Ctrl+Y]│ ← Timeline
└─────────────────────────────────────────────────────────┘
```

**Zones** :
1. **Top Bar** : Actions globales (Save, Test, Settings)
2. **Left Panel** : Bibliothèque (Personnages, Décors, Sons)
3. **Center Canvas** : Scène active avec preview temps réel
4. **Right Panel** : Propriétés contextuelles
5. **Bottom Timeline** : Undo/Redo + Navigation tableaux

---

## 4. Composants à Créer

### 4.1 CharacterCard (style Pokémon Card)

```jsx
<CharacterCard character={char}>
  {/* Avatar circulaire avec border mood */}
  <Avatar
    src={char.sprite}
    mood={char.currentMood}
    size="lg"
    borderColor={getMoodColor(char.currentMood)}
  />

  {/* Nom + badges */}
  <h4>{char.name}</h4>
  <MoodBadges moods={char.moods} />

  {/* Actions rapides au hover */}
  <QuickActions>
    <IconButton icon="✏️" tooltip="Modifier" />
    <IconButton icon="🎭" tooltip="Changer humeur" />
    <IconButton icon="👁️" tooltip="Aperçu" />
  </QuickActions>
</CharacterCard>
```

### 4.2 JaugeEditor (style RPG)

```jsx
<JaugeEditor>
  {/* Pas de "Variables" mais des jauges visuelles */}
  <Jauge
    label="Force 💪"
    value={force}
    max={100}
    color="orange"
    onChange={setForce}
    showPreview={true} // Barre visuelle en temps réel
  />

  <Jauge
    label="Moral 🧠"
    value={moral}
    max={100}
    color="blue"
    onChange={setMoral}
  />

  {/* Effets sur les jauges (pas "effects") */}
  <EffetsSurJauges>
    <EffetCard>
      <span>Choix A</span>
      <JaugeChange jauge="Force" delta={+5} /> {/* +5 avec flèche verte */}
    </EffetCard>
  </EffetsSurJauges>
</JaugeEditor>
```

### 4.3 RepliqueEditor (style BD)

```jsx
<RepliqueEditor>
  {/* Bulle de BD style */}
  <SpeechBubble
    speaker={selectedCharacter}
    avatar={selectedCharacter.sprite}
  >
    <textarea
      placeholder="Que dit ce personnage ?"
      value={text}
      onChange={setText}
      maxLength={200}
    />

    {/* Compteur de caractères visuel */}
    <CharacterCount current={text.length} max={200} />
  </SpeechBubble>

  {/* Choix de réponses (ramifications) */}
  <ChoicesBuilder>
    {choices.map(choice => (
      <ChoiceCard
        text={choice.text}
        effects={choice.effects} // Jauges impactées
        nextTableau={choice.nextScene}
      />
    ))}
    <AddChoiceButton />
  </ChoicesBuilder>
</RepliqueEditor>
```

### 4.4 SceneCanvas (style Super Mario Maker)

```jsx
<SceneCanvas
  background={scene.background}
  gridSize={20}
  snapToGrid={true}
>
  {/* Décor en fond */}
  <BackgroundLayer src={scene.background} />

  {/* Grille optionnelle */}
  {showGrid && <Grid size={20} color="rgba(0,0,0,0.1)" />}

  {/* Personnages draggables */}
  <CharactersLayer>
    {scene.characters.map(char => (
      <DraggableCharacter
        key={char.id}
        character={char}
        position={char.position}
        onMove={updatePosition}
        onDelete={removeFromScene}
        selected={selectedCharacterId === char.id}
      />
    ))}
  </CharactersLayer>

  {/* Drop zones pour drag from library */}
  {isDraggingFromLibrary && (
    <DropZone
      onDrop={placeCharacter}
      highlight={true}
    />
  )}
</SceneCanvas>
```

---

## 5. Micro-interactions (Polish Nintendo)

### Animations essentielles

```css
/* Hover scale */
.interactive-card:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Click bounce */
.interactive-card:active {
  transform: scale(0.95);
}

/* Apparition (slide from top) */
@keyframes slideFromTop {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Disparition (shrink to point) */
@keyframes shrinkToPoint {
  to {
    opacity: 0;
    transform: scale(0) translateY(50px);
  }
}

/* Success pulse */
@keyframes successPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

### Sons suggérés (optionnels)

| Action | Son | Référence |
|--------|-----|-----------|
| Hover bouton | Soft beep | Mario menu hover |
| Clic bouton | Pop | Mario select |
| Ajout élément | Whoosh up | Zelda item get |
| Suppression | Poof | Mario enemy defeat |
| Undo | Rewind whoosh | Mario time reverse |
| Erreur bloquée | Buzz soft | Zelda invalid action |
| Save success | Chime | Mario checkpoint |

---

## 6. Accessibilité (Nintendo fait ça bien aussi)

### Keyboard navigation

```jsx
// Toujours navigable au clavier
<CharacterCard
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') editCharacter();
    if (e.key === 'Delete') deleteCharacter();
  }}
  aria-label={`${char.name}, ${char.moods.length} humeurs`}
>
```

### Focus visible

```css
/* Ring bleu Nintendo-style */
.focusable:focus-visible {
  outline: 3px solid #3B82F6;
  outline-offset: 2px;
  border-radius: 8px;
}
```

### Labels explicites

```jsx
// AVANT : Icône seule
<button>🗑️</button>

// APRÈS : Aria + tooltip
<button aria-label="Supprimer ce personnage">
  <Tooltip content="Supprimer">
    🗑️
  </Tooltip>
</button>
```

---

## 7. Checklist de Quality Nintendo

Avant de dire qu'un composant est "fini" :

- [ ] **Feedback hover** : Reaction visible au survol
- [ ] **Feedback click** : Animation au clic
- [ ] **Preview temps réel** : Voir le résultat avant validation
- [ ] **Undo possible** : Toute action est réversible
- [ ] **État impossible impossible** : Pas d'erreur, juste disabled
- [ ] **Langage naturel** : Pas de jargon technique
- [ ] **Icônes partout** : Complètent le texte
- [ ] **Tooltips utiles** : Expliquent les actions désactivées
- [ ] **Keyboard navigation** : Tab, Enter, Escape fonctionnent
- [ ] **Mobile-friendly** : Touch targets 44×44px min
- [ ] **Performance 60fps** : Aucun lag sur interactions
- [ ] **Sons suggérés** : (Optionnel mais renforce le feedback)

---

## 8. Exemples de Refonte

### Exemple 1 : Formulaire de personnage

**AVANT** :
```
Nom : [________]
Description : [____________]
Sprites : { neutral: "path/to/file.svg" }
Moods : ["neutral", "happy", "sad"]
```

**APRÈS** :
```
┌─────────────────────────────────────┐
│ ✨ Créer un Personnage              │
├─────────────────────────────────────┤
│                                     │
│   👤 NOM                            │
│   ┌─────────────────────────────┐  │
│   │ Alice                        │  │
│   └─────────────────────────────┘  │
│                                     │
│   📝 DESCRIPTION (optionnel)        │
│   ┌─────────────────────────────┐  │
│   │ Conseillère municipale...    │  │
│   └─────────────────────────────┘  │
│                                     │
│   🎭 HUMEURS                        │
│   ┌─────┐ ┌─────┐ ┌─────┐          │
│   │ 😊  │ │ 😠  │ │ 😢  │  + Ajouter│
│   │Joyeux│ │Fâché│ │Triste│          │
│   └─────┘ └─────┘ └─────┘          │
│                                     │
│   🖼️ APPARENCES (une par humeur)    │
│   Joyeux : [📂 Choisir image]       │
│   Fâché :  [📂 Choisir image]       │
│                                     │
│        [Annuler]  [✅ Créer]        │
└─────────────────────────────────────┘
```

### Exemple 2 : Éditeur de réplique

**AVANT** :
```
Speaker: [dropdown]
Text: [________]
Choices: [
  { text: "...", effects: [{ variable: "Physique", value: 5, operation: "add" }] }
]
```

**APRÈS** :
```
┌─────────────────────────────────────┐
│ 💬 Nouvelle Réplique                │
├─────────────────────────────────────┤
│                                     │
│  👤 QUI PARLE ?                     │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │ 😊  │ │     │ │     │           │
│  │Alice│ │ Bob │ │Clara│ ← Clic    │
│  └─────┘ └─────┘ └─────┘           │
│         ↑ Sélectionné               │
│                                     │
│  💭 QUE DIT-ELLE ?                  │
│  ┌─────────────────────────────┐   │
│  │ Bonjour ! Discutons du      │   │
│  │ projet d'accessibilité...   │   │
│  └─────────────────────────────┘   │
│  [142/200 caractères]               │
│                                     │
│  🔀 CHOIX DE RÉPONSE (optionnel)    │
│  ┌────────────────────────────┐    │
│  │ "Je suis motivé !"         │    │
│  │ ⚡ Effets : Moral +5        │    │
│  └────────────────────────────┘    │
│  [+ Ajouter un choix]               │
│                                     │
│        [Annuler]  [✅ Ajouter]      │
└─────────────────────────────────────┘
```

---

## Conclusion

**AccessCity doit ressembler à un outil Nintendo, pas à un IDE de développeur.**

Chaque interaction doit être :
- **Joyeuse** (animations, couleurs, icônes)
- **Intuitive** (pas de manuel nécessaire)
- **Réversible** (undo/redo toujours dispo)
- **Rapide** (feedback < 100ms)
- **Guidante** (tooltips, états disabled, pas d'erreurs)

**Référence constante** : Super Mario Maker, Animal Crossing, Splatoon Stage Builder.
