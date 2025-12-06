// src/components/CharacterEditor.jsx
import React, { useEffect, useRef, useState } from 'react';

function trapFocus(container) {
  if (!container) return () => {};
  const selectors = ['a[href]', 'button', 'input', 'select', 'textarea', '[tabindex]:not([tabindex="-1"])'];
  const getFocusables = () => Array.from(container.querySelectorAll(selectors.join(',')))
    .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
  
  const handler = (e) => {
    if (e.key !== 'Tab') return;
    const focusables = getFocusables();
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first || !container.contains(document.activeElement)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };
  container.addEventListener('keydown', handler);
  return () => container.removeEventListener('keydown', handler);
}

export default function CharacterEditor({ character, onSave, onClose }) {
  const [edited, setEdited] = useState({ ...character });
  const [selectedMood, setSelectedMood] = useState('neutral');
  const [previewUrl, setPreviewUrl] = useState('');
  const dialogRef = useRef(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const prevActive = document.activeElement;

    if (dialogRef.current) dialogRef.current.focus();
    const cleanup = trapFocus(dialogRef.current);

    return () => {
      document.body.style.overflow = prevOverflow;
      cleanup();
      if (prevActive && typeof prevActive.focus === 'function') {
        try { prevActive.focus(); } catch {}
      }
    };
  }, []);

  useEffect(() => {
    if (edited.sprites && edited.sprites[selectedMood]) {
      setPreviewUrl(edited.sprites[selectedMood]);
    } else {
      setPreviewUrl('');
    }
  }, [selectedMood, edited.sprites]);

  function handleFileUpload(mood, event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setEdited({
        ...edited,
        sprites: { ...edited.sprites, [mood]: e.target.result }
      });
      if (mood === selectedMood) {
        setPreviewUrl(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleAddMood() {
    const newMood = prompt('Nom de la nouvelle humeur (ex: angry, surprised):');
    if (newMood && !edited.moods.includes(newMood)) {
      setEdited({
        ...edited,
        moods: [...edited.moods, newMood],
        sprites: { ...edited.sprites, [newMood]: '' }
      });
    }
  }

  function handleRemoveMood(mood) {
    if (edited.moods.length <= 1) {
      alert('Au moins une humeur est requise.');
      return;
    }
    const updatedMoods = edited.moods.filter(m => m !== mood);
    const updatedSprites = { ...edited.sprites };
    delete updatedSprites[mood];
    setEdited({
      ...edited,
      moods: updatedMoods,
      sprites: updatedSprites
    });
    if (selectedMood === mood) {
      setSelectedMood(updatedMoods[0]);
      setPreviewUrl(updatedSprites[updatedMoods[0]] || '');
    }
  }

  function handleSave() {
    onSave(edited);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="character-editor-title"
        tabIndex="-1"
        ref={dialogRef}
      >
        <div className="bg-gradient-to-r from-primary to-primary-hover text-white p-6 rounded-t-xl flex justify-between items-center">
          <h2 id="character-editor-title" className="text-2xl font-bold">Editer {edited.name}</h2>
          <button onClick={onClose} className="text-white text-3xl hover:opacity-75" aria-label="Fermer">&times;</button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Nom du personnage</label>
            <input
              type="text"
              value={edited.name}
              onChange={(e) => setEdited({ ...edited, name: e.target.value })}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Description</label>
            <textarea
              value={edited.description || ''}
              onChange={(e) => setEdited({ ...edited, description: e.target.value })}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-primary outline-none h-20"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold">Humeurs disponibles</label>
              <button
                onClick={handleAddMood}
                className="bg-primary text-white px-3 py-1 rounded-lg hover:bg-primary-hover text-sm"
              >
                + Ajouter humeur
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {edited.moods.map(mood => (
                <div key={mood} className="relative">
                  <button
                    onClick={() => setSelectedMood(mood)}
                    className={`px-4 py-2 rounded-lg transition-all ${selectedMood === mood ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >
                    {mood}
                  </button>
                  {edited.moods.length > 1 && (
                    <button
                      onClick={() => handleRemoveMood(mood)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs hover:bg-red-600"
                      aria-label={`Supprimer humeur ${mood}`}
                    >&times;</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Image pour l humeur {selectedMood}</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(selectedMood, e)}
              className="w-full mb-4"
            />
            {previewUrl && (
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">Apercu:</p>
                <img src={previewUrl} alt="Preview" className="max-w-full max-h-64 mx-auto rounded-lg shadow-md" />
              </div>
            )}
            {!previewUrl && (
              <p className="text-sm text-gray-400 text-center">Aucune image chargee pour {selectedMood}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3">Apercu de toutes les humeurs</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {edited.moods.map(mood => (
                <div key={mood} className="text-center border-2 border-gray-200 rounded-lg p-3 hover:border-primary transition-all">
                  <p className="text-xs font-medium mb-2 capitalize">{mood}</p>
                  {edited.sprites[mood] ? (
                    <img src={edited.sprites[mood]} alt={mood} className="w-full h-20 object-cover rounded" />
                  ) : (
                    <div className="w-full h-20 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                      Pas d image
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 justify-end pt-4 border-t-2">
            <button
              onClick={onClose}
              className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-all"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
