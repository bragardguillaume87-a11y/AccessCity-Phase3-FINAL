# Guide de correction: Éditeur de scènes

## Problèmes identifiés

1. **Impossible de supprimer une scène**
2. **Impossible de créer une scène vierge** (seulement via IA)

---

## Solution 1: Fonction de suppression de scène

### Étape 1: Ajouter la fonction `deleteScene`

Dans votre composant éditeur principal (probablement `SceneEditor.jsx` ou similaire):

```javascript
/**
 * Supprime une scène et tous ses dialogues associés
 * @param {string|number} sceneId - ID de la scène à supprimer
 */
function deleteScene(sceneId) {
  // Confirmation utilisateur
  const confirmed = window.confirm(
    'Êtes-vous sûr de vouloir supprimer cette scène ?\n\n' +
    'Cette action supprimera également tous les dialogues associés et ne peut pas être annulée.'
  );
  
  if (!confirmed) return;
  
  // Supprimer la scène
  setScenes(prevScenes => prevScenes.filter(scene => scene.id !== sceneId));
  
  // Supprimer les dialogues associés
  setDialogues(prevDialogues => prevDialogues.filter(dialogue => dialogue.sceneId !== sceneId));
  
  // Log pour debug
  console.log(`[SceneEditor] Scène ${sceneId} supprimée`);
  
  // Optionnel: Afficher un message de succès
  // alert('Scène supprimée avec succès');
}
```

### Étape 2: Ajouter le bouton de suppression dans la liste des scènes

```jsx
{/* Dans la liste des scènes (style PowerPoint) */}
{scenes.map((scene, index) => (
  <div 
    key={scene.id}
    className={`scene-item ${selectedSceneIndex === index ? 'selected' : ''}`}
  >
    {/* Contenu de la scène */}
    <div className="scene-preview">
      <h3>{scene.title || `Scène ${index + 1}`}</h3>
      <p>{scene.description?.substring(0, 50)}...</p>
    </div>
    
    {/* Boutons d'action */}
    <div className="scene-actions">
      {/* Bouton Éditer */}
      <button 
        onClick={() => setSelectedSceneIndex(index)}
        className="btn-edit"
        title="Éditer cette scène"
      >
        ✏️ Éditer
      </button>
      
      {/* ✅ NOUVEAU: Bouton Supprimer */}
      <button 
        onClick={(e) => {
          e.stopPropagation(); // Éviter de sélectionner la scène
          deleteScene(scene.id);
        }}
        className="btn-delete"
        title="Supprimer cette scène"
      >
        🗑️ Supprimer
      </button>
    </div>
  </div>
))}
```

### Styles CSS pour le bouton de suppression

```css
.btn-delete {
  padding: 0.5rem 1rem;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.btn-delete:hover {
  background-color: #dc2626;
}

.btn-delete:active {
  background-color: #b91c1c;
}

.scene-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
```

---

## Solution 2: Fonction de création de scène vierge

### Étape 1: Ajouter la fonction `createBlankScene`

```javascript
/**
 * Crée une nouvelle scène vierge
 * @returns {void}
 */
function createBlankScene() {
  // Générer un ID unique
  const newId = `scene_${Date.now()}`;
  
  // Template de scène vierge
  const blankScene = {
    id: newId,
    title: `Nouvelle scène ${scenes.length + 1}`,
    description: '',
    backgroundUrl: '',
    metadata: {
      createdAt: new Date().toISOString(),
      isManual: true // Marque comme créée manuellement
    }
  };
  
  // Ajouter la scène
  setScenes(prevScenes => [...prevScenes, blankScene]);
  
  // Sélectionner automatiquement la nouvelle scène
  setSelectedSceneIndex(scenes.length);
  
  console.log(`[SceneEditor] Scène vierge créée: ${newId}`);
}
```

### Étape 2: Ajouter les boutons de création

```jsx
{/* Barre d'outils au-dessus de la liste des scènes */}
<div className="scene-toolbar">
  <h2>Scènes</h2>
  
  <div className="scene-create-buttons">
    {/* ✅ NOUVEAU: Bouton créer scène vierge */}
    <button 
      onClick={createBlankScene}
      className="btn-primary"
      title="Créer une scène vierge"
    >
      ➕ Nouvelle scène
    </button>
    
    {/* Bouton générer avec IA (existant) */}
    <button 
      onClick={generateSceneWithAI}
      className="btn-secondary"
      title="Générer une scène avec l'IA"
    >
      🤖 Générer avec IA
    </button>
  </div>
</div>
```

### Styles CSS

```css
.scene-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 2px solid #e5e7eb;
  background-color: #f9fafb;
}

.scene-create-buttons {
  display: flex;
  gap: 0.75rem;
}

.btn-primary {
  padding: 0.625rem 1.25rem;
  background-color: #8b5cf6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #7c3aed;
}

.btn-secondary {
  padding: 0.625rem 1.25rem;
  background-color: #6366f1;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background-color: #4f46e5;
}
```

---

## Solution complète: Exemple de composant SceneList

Voici un exemple complet d'intégration:

```jsx
import React from 'react';
import { Trash2, Plus, Sparkles } from 'lucide-react';

export function SceneList({ 
  scenes, 
  selectedSceneIndex, 
  setSelectedSceneIndex,
  setScenes,
  setDialogues,
  onGenerateWithAI 
}) {
  
  function createBlankScene() {
    const newId = `scene_${Date.now()}`;
    const blankScene = {
      id: newId,
      title: `Nouvelle scène ${scenes.length + 1}`,
      description: '',
      backgroundUrl: '',
      metadata: {
        createdAt: new Date().toISOString(),
        isManual: true
      }
    };
    
    setScenes(prev => [...prev, blankScene]);
    setSelectedSceneIndex(scenes.length);
  }
  
  function deleteScene(sceneId) {
    if (!window.confirm('Supprimer cette scène et tous ses dialogues ?')) return;
    
    setScenes(prev => prev.filter(s => s.id !== sceneId));
    setDialogues(prev => prev.filter(d => d.sceneId !== sceneId));
  }
  
  return (
    <div className="scene-list-container">
      {/* Barre d'outils */}
      <div className="toolbar">
        <h2 className="text-xl font-bold">Scènes</h2>
        <div className="flex gap-2">
          <button 
            onClick={createBlankScene}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvelle
          </button>
          <button 
            onClick={onGenerateWithAI}
            className="btn-secondary flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Générer IA
          </button>
        </div>
      </div>
      
      {/* Liste des scènes */}
      <div className="scenes-grid">
        {scenes.length === 0 ? (
          <div className="empty-state">
            <p>Aucune scène. Créez-en une pour commencer !</p>
          </div>
        ) : (
          scenes.map((scene, index) => (
            <div 
              key={scene.id}
              className={`scene-card ${
                selectedSceneIndex === index ? 'selected' : ''
              }`}
              onClick={() => setSelectedSceneIndex(index)}
            >
              {/* Aperçu */}
              <div className="scene-preview">
                <h3 className="font-semibold">
                  {scene.title || `Scène ${index + 1}`}
                </h3>
                <p className="text-sm text-gray-600">
                  {scene.description?.substring(0, 60) || 'Aucune description'}
                  {scene.description?.length > 60 ? '...' : ''}
                </p>
              </div>
              
              {/* Actions */}
              <div className="scene-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteScene(scene.id);
                  }}
                  className="btn-delete"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

---

## Intégration dans votre application

### Étape 1: Identifier votre composant éditeur

Cherchez dans votre code:
- `SceneEditor.jsx`
- `EditorPanel.jsx` 
- Ou tout composant qui affiche la liste des scènes

### Étape 2: Intégrer les fonctions

1. Copiez les fonctions `createBlankScene` et `deleteScene`
2. Ajoutez les boutons dans l'interface
3. Testez la suppression et la création

### Étape 3: Vérification

- [ ] Le bouton "Supprimer" apparaît sur chaque scène
- [ ] La confirmation s'affiche avant suppression
- [ ] Les dialogues sont également supprimés
- [ ] Le bouton "Nouvelle scène" crée une scène vierge
- [ ] La nouvelle scène est automatiquement sélectionnée
- [ ] Le bouton "Générer IA" reste disponible

---

## Problèmes courants et solutions

### Problème: Le bouton de suppression ne s'affiche pas

**Solution**: Vérifiez que vous avez bien ajouté le bouton dans la boucle `map` qui affiche les scènes.

### Problème: La scène se sélectionne quand je clique sur "Supprimer"

**Solution**: Ajoutez `e.stopPropagation()` dans le `onClick` du bouton:

```javascript
onClick={(e) => {
  e.stopPropagation();
  deleteScene(scene.id);
}}
```

### Problème: La nouvelle scène a un ID en double

**Solution**: Utilisez `Date.now()` ou `crypto.randomUUID()` pour générer un ID unique:

```javascript
const newId = crypto.randomUUID(); // Navigateurs modernes
// OU
const newId = `scene_${Date.now()}_${Math.random().toString(36).substring(7)}`;
```

---

## Pour aller plus loin

### Amélioration 1: Duplication de scène

```javascript
function duplicateScene(sceneId) {
  const sceneToDuplicate = scenes.find(s => s.id === sceneId);
  if (!sceneToDuplicate) return;
  
  const newId = `scene_${Date.now()}`;
  const duplicatedScene = {
    ...sceneToDuplicate,
    id: newId,
    title: `${sceneToDuplicate.title} (copie)`,
    metadata: {
      ...sceneToDuplicate.metadata,
      createdAt: new Date().toISOString(),
      isDuplicate: true,
      originalId: sceneId
    }
  };
  
  setScenes(prev => [...prev, duplicatedScene]);
  
  // Dupliquer aussi les dialogues
  const dialoguesToDuplicate = dialogues.filter(d => d.sceneId === sceneId);
  const duplicatedDialogues = dialoguesToDuplicate.map(d => ({
    ...d,
    id: `dialogue_${Date.now()}_${Math.random()}`,
    sceneId: newId
  }));
  
  setDialogues(prev => [...prev, ...duplicatedDialogues]);
}
```

### Amélioration 2: Undo/Redo

Intégrez une bibliothèque comme `use-undo` ou implémentez un système d'historique:

```javascript
const [history, setHistory] = useState([]);
const [historyIndex, setHistoryIndex] = useState(-1);

function saveState() {
  const newHistory = history.slice(0, historyIndex + 1);
  newHistory.push({ scenes: [...scenes], dialogues: [...dialogues] });
  setHistory(newHistory);
  setHistoryIndex(newHistory.length - 1);
}

function undo() {
  if (historyIndex > 0) {
    const previousState = history[historyIndex - 1];
    setScenes(previousState.scenes);
    setDialogues(previousState.dialogues);
    setHistoryIndex(historyIndex - 1);
  }
}
```

---

## Besoin d'aide ?

Si vous rencontrez des problèmes:

1. Vérifiez la console du navigateur (F12) pour les erreurs
2. Ajoutez des `console.log()` pour tracer l'exécution
3. Vérifiez que `setScenes` et `setDialogues` sont bien passés au composant
4. Testez d'abord sur une seule scène

---

**Date de création**: 2025-12-05  
**Version**: 1.0  
**Statut**: ✅ Prêt pour intégration