import React, { useState, useEffect, useRef } from 'react';
import { AvatarPicker } from './tabs/characters/components/AvatarPicker.jsx';
import { useCharacterValidation } from '../hooks/useCharacterValidation.js';

// Styles inline temporaires pour la modale pour garantir l'affichage
const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  dialog: { background: 'white', padding: '20px', borderRadius: '8px', minWidth: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  formGroup: { marginBottom: '15px' },
  label: { display: 'block', marginBottom: '5px', fontWeight: 'bold' },
  input: { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' },
  error: { color: 'red', fontSize: '0.875rem' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }
};

export const CharacterEditor = ({ character, characters, onSave, onClose, labels }) => {
  const [formData, setFormData] = useState(character);
  const [errors, setErrors] = useState({});
  const [activeMood, setActiveMood] = useState('neutral');
  const { validateAll } = useCharacterValidation(characters, character);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrs = {...prev};
        delete newErrs[field];
        return newErrs;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateAll(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    onSave(formData);
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.dialog} role="dialog" aria-modal="true">
        <header style={modalStyles.header}>
          <h2>{labels?.editCharacter || 'Éditer'}</h2>
          <button onClick={onClose} style={{border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer'}}>×</button>
        </header>

        <form onSubmit={handleSubmit}>
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>{labels?.name || 'Nom'}</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={e => handleChange('name', e.target.value)}
              style={modalStyles.input}
            />
            {errors.name && <span style={modalStyles.error}>{errors.name[0]}</span>}
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>{labels?.description || 'Description'}</label>
            <textarea 
              value={formData.description || ''}
              onChange={e => handleChange('description', e.target.value)}
              style={{...modalStyles.input, minHeight: '100px'}}
            />
          </div>

          <div style={modalStyles.formGroup}>
            <h3>Avatars</h3>
            <div style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
              {formData.moods && formData.moods.map(mood => (
                <button 
                  key={mood}
                  type="button"
                  onClick={() => setActiveMood(mood)}
                  style={{
                    padding: '5px 10px',
                    background: activeMood === mood ? '#2563eb' : '#eee',
                    color: activeMood === mood ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {mood}
                </button>
              ))}
            </div>
            
            <AvatarPicker 
              currentSprites={formData.sprites}
              onSelect={(mood, url) => setFormData(prev => ({
                ...prev, sprites: {...prev.sprites, [mood]: url}
              }))}
              mood={activeMood}
              labels={labels}
            />
          </div>

          <footer style={modalStyles.footer}>
            <button type="button" onClick={onClose} style={{padding: '8px 16px', cursor: 'pointer'}}>{labels?.cancel || 'Annuler'}</button>
            <button type="submit" style={{padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>{labels?.save || 'Sauvegarder'}</button>
          </footer>
        </form>
      </div>
    </div>
  );
};
