# DialoguesPanel - Exemples de code AVANT / APRÈS

## 1. Sidebar des scènes

### AVANT
```jsx
<div className="bg-panel-bg border border-border rounded-app p-2 space-y-1">
  <h3 className="text-sm font-semibold text-txt-primary px-2 py-1">Scènes</h3>
  {scenes.map((s, index) => (
    <button
      key={s.id}
      className={`w-full px-2 py-2 flex items-center gap-2 text-left text-sm rounded-app transition-colors ${
        selectedSceneForEdit === s.id
          ? 'bg-accent/10 text-accent font-medium'
          : 'hover:bg-panel-bg-alt text-txt-primary'
      }`}
      onClick={() => setSelectedSceneForEdit(s.id)}
    >
      <MessageSquare className="w-4 h-4 flex-shrink-0" />
      <span className="truncate flex-1">#{index + 1} {s.title}</span>
      <span className="px-1.5 py-0.5 text-xs rounded bg-panel-bg-alt text-txt-secondary">
        {(s.dialogues || []).length}
      </span>
    </button>
  ))}
</div>
```

### APRÈS
```jsx
<div className="bg-panel-bg border border-border rounded-app shadow-app overflow-hidden">
  {/* Header séparé avec fond distinct */}
  <div className="px-3 py-2.5 bg-panel-bg-alt border-b border-border">
    <h3 className="text-xs font-bold text-txt-secondary uppercase tracking-wide">Scènes</h3>
  </div>

  <div className="p-2 space-y-0.5">
    {scenes.map((s, index) => (
      <button
        key={s.id}
        className={`w-full px-3 py-2.5 flex items-center gap-3 text-left text-sm rounded-app transition-all ${
          selectedSceneForEdit === s.id
            ? 'bg-accent text-white shadow-app font-medium'  // Sélection forte
            : 'hover:bg-panel-bg-alt text-txt-primary'
        }`}
        onClick={() => setSelectedSceneForEdit(s.id)}
      >
        {/* Icône contextuelle */}
        <MessageSquare className={`w-4 h-4 flex-shrink-0 ${
          selectedSceneForEdit === s.id ? 'text-white' : 'text-txt-tertiary'
        }`} />

        <span className="truncate flex-1 text-sm">
          <span className="font-medium">#{index + 1}</span> {s.title}
        </span>

        {/* Badge dynamique */}
        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
          selectedSceneForEdit === s.id
            ? 'bg-white/20 text-white'
            : 'bg-accent/10 text-accent'
        }`}>
          {(s.dialogues || []).length}
        </span>
      </button>
    ))}
  </div>
</div>
```

**Différences clés** :
- Header séparé avec `border-b`
- Sélection : `bg-accent text-white` (au lieu de `bg-accent/10`)
- Badge : couleurs inversées selon l'état
- Icône : couleur contextuelle
- `shadow-app` et `overflow-hidden` pour la profondeur

---

## 2. Header avec boutons Template et Ajouter

### AVANT
```jsx
<div className="bg-white rounded-lg p-4 shadow-lg">
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-lg font-bold text-slate-900">
      Dialogues : {scene.title}
    </h3>
    <div className="flex gap-2">
      <button
        onClick={() => setTemplateSelectorOpen(true)}
        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-app shadow-app transition-all text-sm flex items-center gap-1.5"
        title="Utiliser un template pré-configuré"
      >
        📦 Template
      </button>
      <button
        onClick={onAdd}
        className="px-3 py-1.5 bg-success hover:bg-success/90 text-white font-medium rounded-app shadow-app transition-all text-sm flex items-center gap-1"
      >
        <Plus className="w-4 h-4" />
        Ajouter dialogue
      </button>
    </div>
  </div>
  <p className="text-xs text-slate-600">
    💡 Astuce : Utilisez un template pour créer rapidement des structures de dialogue courantes
  </p>
</div>
```

### APRÈS
```jsx
<div className="bg-panel-bg border border-border rounded-app shadow-app p-4">
  <div className="flex items-center justify-between mb-3">
    {/* Titre avec icône */}
    <h3 className="text-base font-bold text-txt-primary flex items-center gap-2">
      <MessageSquare className="w-5 h-5 text-accent" />
      Dialogues : {scene.title}
    </h3>

    <div className="flex gap-2">
      {/* Bouton Template - SECONDAIRE */}
      <button
        onClick={() => setTemplateSelectorOpen(true)}
        className="px-3 py-2 bg-panel-bg-alt hover:bg-border text-txt-primary font-medium rounded-app border border-border transition-all text-sm flex items-center gap-2 shadow-app"
        title="Utiliser un template pré-configuré"
      >
        <Layers className="w-4 h-4" />
        Template
      </button>

      {/* Bouton Ajouter - PRIMAIRE */}
      <button
        onClick={onAdd}
        className="px-3 py-2 bg-success hover:bg-success/90 text-white font-medium rounded-app shadow-app transition-all text-sm flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Ajouter dialogue
      </button>
    </div>
  </div>

  <p className="text-xs text-txt-secondary flex items-start gap-2">
    <span className="text-accent font-semibold">💡</span>
    <span>Utilisez un template pour créer rapidement des structures de dialogue courantes</span>
  </p>
</div>
```

**Différences clés** :
- Background : `bg-panel-bg` + `border` (au lieu de `bg-white`)
- Icône Layers au lieu de emoji 📦
- Template en style secondaire (bg-panel-bg-alt + border)
- Icône dans le titre
- Gap uniforme : `gap-2`

---

## 3. Card de dialogue

### AVANT
```jsx
<div key={idx} className={`dialogue-card border-2 rounded-xl p-4 bg-white hover:shadow-md transition-all ${
  hasErrors ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
}`}>
  <div className="dialogue-number-badge">{idx + 1}</div>
  <div className="space-y-3">
    {/* Speaker */}
    <div>
      <label htmlFor={`speaker-${idx}`} className="block text-xs font-semibold text-slate-700 mb-1">
        Locuteur
      </label>
      <select
        id={`speaker-${idx}`}
        className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white text-sm transition-all"
        value={d.speaker || ''}
        onChange={(e) => updateDialogue(scene.id, idx, { speaker: e.target.value })}
      >
        {/* options... */}
      </select>
    </div>
  </div>
</div>
```

### APRÈS
```jsx
<div key={idx} className={`dialogue-card bg-panel-bg ${
  hasErrors ? 'border-error/40 bg-error/5' : ''
}`}>
  <div className="dialogue-number-badge">{idx + 1}</div>
  <div className="space-y-4 pt-2">
    {/* Speaker */}
    <div>
      <label htmlFor={`speaker-${idx}`} className="block text-xs font-bold text-txt-secondary uppercase tracking-wide mb-1.5">
        Locuteur
      </label>
      <select
        id={`speaker-${idx}`}
        className="w-full px-3 py-2 border border-border rounded-app focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none bg-white text-sm transition-all"
        value={d.speaker || ''}
        onChange={(e) => updateDialogue(scene.id, idx, { speaker: e.target.value })}
      >
        {/* options... */}
      </select>
    </div>
  </div>
</div>
```

**Différences clés** :
- Pas de `border-2`, juste border-left dans CSS
- `bg-panel-bg` au lieu de `bg-white`
- Label : `uppercase tracking-wide`
- Select : `border border-border` au lieu de `border-2 border-slate-300`
- Focus : `focus:border-accent` avec ring accent
- Espacement : `space-y-4` au lieu de `space-y-3`

---

## 4. Card de choix avec icônes

### AVANT
```jsx
<div key={choiceIdx} className={`choice-card border border-l-4 rounded-app p-3 ${
  hasChoiceErrors ? 'border-error/40 border-l-error bg-error/5' : 'border-border border-l-purple-500 bg-panel-bg'
}`}>
  <div className="space-y-3">
    {/* Texte du choix */}
    <div>
      <label htmlFor={`choice-text-${idx}-${choiceIdx}`} className="block text-xs font-semibold text-slate-600 mb-1">
        Texte du choix
      </label>
      <TextInputWithSnippets
        value={choice.text || ''}
        onChange={(newValue) => updateChoice(idx, choiceIdx, 'text', newValue)}
        context="choices"
        placeholder="Ex: Accepter la mission"
        multiline={false}
        className="text-xs px-2 py-1.5"
      />
    </div>

    {/* Scene suivante */}
    <div>
      <label htmlFor={`choice-next-${idx}-${choiceIdx}`} className="block text-xs font-semibold text-slate-600 mb-1">
        Scène suivante
      </label>
      <select
        id={`choice-next-${idx}-${choiceIdx}`}
        className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none bg-white"
        value={choice.nextScene || ''}
        onChange={(e) => updateChoice(idx, choiceIdx, 'nextScene', e.target.value)}
      >
        {/* options... */}
      </select>
      <p className="text-xs text-slate-500 mt-1">Optionnel si lancer de dé actif</p>
    </div>
  </div>
</div>
```

### APRÈS
```jsx
<div key={choiceIdx} className={`choice-card ${
  hasChoiceErrors ? 'border-error border-l-error bg-error/5' : ''
}`}>
  <div className="space-y-3.5">
    {/* Texte du choix - avec icône */}
    <div>
      <label htmlFor={`choice-text-${idx}-${choiceIdx}`} className="block text-xs font-bold text-txt-secondary mb-1.5 flex items-center gap-1.5">
        <ChevronRight className="w-3.5 h-3.5" />
        Texte du choix
      </label>
      <TextInputWithSnippets
        value={choice.text || ''}
        onChange={(newValue) => updateChoice(idx, choiceIdx, 'text', newValue)}
        context="choices"
        placeholder="Ex: Accepter la mission"
        multiline={false}
        className="text-sm px-3 py-2"
      />
    </div>

    {/* Scene suivante - avec icône */}
    <div>
      <label htmlFor={`choice-next-${idx}-${choiceIdx}`} className="block text-xs font-bold text-txt-secondary mb-1.5 flex items-center gap-1.5">
        <ArrowRight className="w-3.5 h-3.5" />
        Scène suivante
      </label>
      <select
        id={`choice-next-${idx}-${choiceIdx}`}
        className="w-full px-3 py-2 border border-border rounded-app text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none bg-white transition-all"
        value={choice.nextScene || ''}
        onChange={(e) => updateChoice(idx, choiceIdx, 'nextScene', e.target.value)}
      >
        {/* options... */}
      </select>
      <p className="text-xs text-txt-tertiary mt-1.5 italic">Optionnel si lancer de dé actif</p>
    </div>
  </div>
</div>
```

**Différences clés** :
- Icônes dans les labels : `<ChevronRight>`, `<ArrowRight>`
- Padding dans CSS (pas besoin de `p-3`)
- Labels : `font-bold` + `flex items-center gap-1.5`
- Inputs : taille text-sm, padding cohérent
- Note : `text-txt-tertiary italic`

---

## 5. Toggle de dés enrichi

### AVANT
```jsx
<div className="border-t border-slate-300 pt-3">
  <label className="flex items-center gap-2 cursor-pointer">
    <input
      type="checkbox"
      checked={choice.diceRoll?.enabled || false}
      onChange={(e) => updateDiceRoll(idx, choiceIdx, 'enabled', e.target.checked)}
      className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-2 focus:ring-purple-500"
    />
    <span className="text-xs font-semibold text-purple-700">
      🎲 Activer le lancer de dé
    </span>
  </label>
</div>
```

### APRÈS
```jsx
<div className="border-t border-border pt-3">
  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-app bg-panel-bg-alt border border-border hover:border-accent/40 transition-all">
    <input
      type="checkbox"
      checked={choice.diceRoll?.enabled || false}
      onChange={(e) => updateDiceRoll(idx, choiceIdx, 'enabled', e.target.checked)}
      className="w-4 h-4 text-accent border-border rounded focus:ring-2 focus:ring-accent/20"
    />

    <div className="flex items-center gap-2 flex-1">
      <Dice6 className={`w-4 h-4 ${choice.diceRoll?.enabled ? 'text-accent' : 'text-txt-tertiary'}`} />
      <span className={`text-sm font-semibold ${choice.diceRoll?.enabled ? 'text-txt-primary' : 'text-txt-secondary'}`}>
        Activer le lancer de dé
      </span>
    </div>

    {choice.diceRoll?.enabled && (
      <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs font-bold rounded">ACTIF</span>
    )}
  </label>
</div>
```

**Différences clés** :
- Background + border sur le label
- Icône `<Dice6>` au lieu de emoji 🎲
- Icône change de couleur selon l'état
- Badge "ACTIF" quand activé
- Hover state sur le label

---

## 6. Headers de dés avec icônes

### AVANT
```jsx
<div className="border-2 border-purple-300 rounded-lg p-3 bg-purple-50">
  <h4 className="text-xs font-bold text-purple-700 mb-2">🎲 Difficulté</h4>
  {/* ... */}
</div>

<div className="outcome-success">
  <h4 className="text-xs font-bold text-green-700 mb-2">✅ Réussite</h4>
  {/* ... */}
</div>

<div className="outcome-failure">
  <h4 className="text-xs font-bold text-red-700 mb-2">❌ Échec</h4>
  {/* ... */}
</div>
```

### APRÈS
```jsx
<div className="border-2 border-accent rounded-app p-3 bg-accent/5">
  <h4 className="text-xs font-bold text-accent mb-3 flex items-center gap-1.5">
    <Dice6 className="w-4 h-4" />
    Difficulté
  </h4>
  {/* ... */}
</div>

<div className="outcome-success">
  <h4 className="text-xs font-bold text-green-700 mb-3 flex items-center gap-1.5">
    <CheckCircle2 className="w-4 h-4" />
    Réussite
  </h4>
  {/* ... */}
</div>

<div className="outcome-failure">
  <h4 className="text-xs font-bold text-red-700 mb-3 flex items-center gap-1.5">
    <XCircle className="w-4 h-4" />
    Échec
  </h4>
  {/* ... */}
</div>
```

**Différences clés** :
- Icônes Lucide au lieu d'emojis
- `flex items-center gap-1.5` pour aligner
- Margin-bottom uniforme : `mb-3`
- Difficulté : `border-accent bg-accent/5` au lieu de purple

---

## 7. Boutons d'action uniformes

### AVANT
```jsx
{/* Dialogue */}
<div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
  <button
    onClick={() => handleDuplicateDialogue(idx)}
    className="px-3 py-1.5 rounded-app bg-purple-600 text-white text-sm hover:bg-purple-700 transition-colors font-medium flex items-center gap-1"
  >
    <Copy className="w-4 h-4" />
    Dupliquer
  </button>
  <button
    onClick={() => askDelete(idx)}
    className="px-3 py-1.5 rounded-app bg-error text-white text-sm hover:bg-error/90 transition-colors font-medium flex items-center gap-1"
  >
    <Trash2 className="w-4 h-4" />
    Supprimer
  </button>
</div>

{/* Choix */}
<div className="flex justify-end gap-2 pt-2 border-t border-slate-300">
  <button
    onClick={() => handleDuplicateChoice(idx, choiceIdx)}
    className="px-2 py-1 rounded-app text-xs bg-purple-600 hover:bg-purple-700 text-white transition-colors font-medium flex items-center gap-1"
  >
    <Copy className="w-3 h-3" />
    Dupliquer
  </button>
  <button
    onClick={() => askDeleteChoice(idx, choiceIdx)}
    className="px-2 py-1 rounded-app text-xs bg-error hover:bg-error/90 text-white transition-colors font-medium flex items-center gap-1"
  >
    <Trash2 className="w-3 h-3" />
    Supprimer
  </button>
</div>
```

### APRÈS
```jsx
{/* Dialogue - SECONDAIRE + DANGER */}
<div className="flex justify-end gap-2 pt-4 border-t border-border">
  <button
    onClick={() => handleDuplicateDialogue(idx)}
    className="px-3 py-2 rounded-app bg-panel-bg-alt hover:bg-border text-txt-primary border border-border text-sm transition-all font-medium flex items-center gap-2 shadow-app"
  >
    <Copy className="w-4 h-4" />
    Dupliquer
  </button>
  <button
    onClick={() => askDelete(idx)}
    className="px-3 py-2 rounded-app bg-error text-white text-sm hover:bg-error/90 transition-all font-medium flex items-center gap-2 shadow-app"
  >
    <Trash2 className="w-4 h-4" />
    Supprimer
  </button>
</div>

{/* Choix - SECONDAIRE + DANGER */}
<div className="flex justify-end gap-2 pt-3 border-t border-border">
  <button
    onClick={() => handleDuplicateChoice(idx, choiceIdx)}
    className="px-3 py-1.5 rounded-app text-xs bg-panel-bg-alt hover:bg-border text-txt-primary border border-border transition-all font-medium flex items-center gap-1.5 shadow-app"
  >
    <Copy className="w-3.5 h-3.5" />
    Dupliquer
  </button>
  <button
    onClick={() => askDeleteChoice(idx, choiceIdx)}
    className="px-3 py-1.5 rounded-app text-xs bg-error hover:bg-error/90 text-white transition-all font-medium flex items-center gap-1.5 shadow-app"
  >
    <Trash2 className="w-3.5 h-3.5" />
    Supprimer
  </button>
</div>
```

**Différences clés** :
- Dupliquer : style secondaire (bg-panel-bg-alt + border) au lieu de purple-600
- Shadow-app sur tous les boutons
- Gap cohérent : `gap-2` pour dialogue, `gap-1.5` pour choix
- Icônes : `w-4 h-4` pour dialogue, `w-3.5 h-3.5` pour choix
- Border-t : `border-border` uniforme
- Padding-top : `pt-4` pour dialogue, `pt-3` pour choix

---

## Résumé des patterns de design

### Hiérarchie des boutons
- **Primaire** : `bg-success text-white` (actions positives)
- **Secondaire** : `bg-panel-bg-alt border border-border text-txt-primary` (actions neutres)
- **Danger** : `bg-error text-white` (actions destructives)

### Espacement cohérent
- Labels : `mb-1.5` uniforme
- Sections : `space-y-4` pour dialogues, `space-y-3.5` pour choix
- Borders : `pt-3` ou `pt-4` selon le niveau

### Icônes contextuelles
- Toujours Lucide React (jamais d'emojis dans le code)
- Taille : `w-4 h-4` standard, `w-3.5 h-3.5` pour small
- Couleur change selon l'état (actif/inactif)

### Focus states
- Border : `focus:border-accent`
- Ring : `focus:ring-2 focus:ring-accent/20`
- Outline : `outline-none` (remplacé par border/ring)

### Transitions
- `transition-all` pour les éléments interactifs
- 150ms cubic-bezier(0.4, 0, 0.2, 1) défini dans index.css
