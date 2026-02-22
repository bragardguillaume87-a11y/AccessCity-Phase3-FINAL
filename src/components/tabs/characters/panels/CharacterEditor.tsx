import React, { useState } from 'react';
import { AvatarPicker } from '../components/AvatarPicker';
import { useCharacterValidation } from '@/hooks/useCharacterValidation';
import type { Character } from '@/types';
import type { CharactersTabLabels } from '../CharactersTab';
import { Z_INDEX } from '@/utils/zIndexLayers';

/**
 * Props for CharacterEditor component
 */
export interface CharacterEditorProps {
  character: Character;
  characters: Character[];
  onSave: (character: Character) => void;
  onClose: () => void;
  labels?: CharactersTabLabels;
}

/**
 * CharacterEditor - Character editing modal
 * Permet d'éditer le nom, la description et les avatars d'un personnage
 */
const modalStyles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: Z_INDEX.DIALOG_NESTED
  },
  dialog: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    minWidth: '600px',
    maxWidth: '90%',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e2e8f0'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#1e293b'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '1rem',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '1rem',
    minHeight: '100px',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const
  },
  error: {
    color: '#dc2626',
    fontSize: '0.875rem',
    marginTop: '4px'
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0'
  }
};

export const CharacterEditor: React.FC<CharacterEditorProps> = ({ character, characters, onSave, onClose, labels = {} as CharactersTabLabels }) => {
  const [formData, setFormData] = useState({
    ...character,
    moods: character.moods || ['neutral'],
    sprites: character.sprites || {}
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [activeMood, setActiveMood] = useState(formData.moods[0] || 'neutral');
  const { validateAll } = useCharacterValidation(characters, character);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[field];
        return newErrs;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateAll(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    onSave(formData);
  };

  const handleSpriteSelect = (mood: string, url: string) => {
    setFormData(prev => ({
      ...prev,
      sprites: { ...prev.sprites, [mood]: url }
    }));
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.dialog} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header style={modalStyles.header}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
            {labels.editCharacter || 'Éditer le personnage'}
          </h2>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '2rem',
              cursor: 'pointer',
              color: '#64748b',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Fermer"
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          {/* Nom */}
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>
              {labels.name || 'Nom'} <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              style={{
                ...modalStyles.input,
                borderColor: errors.name ? '#dc2626' : '#cbd5e1'
              }}
              placeholder="Nom du personnage"
            />
            {errors.name && <div style={modalStyles.error}>{errors.name[0]}</div>}
          </div>

          {/* Description */}
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>
              {labels.description || 'Description'}
            </label>
            <textarea
              value={formData.description || ''}
              onChange={e => handleChange('description', e.target.value)}
              style={{
                ...modalStyles.textarea,
                borderColor: errors.description ? '#dc2626' : '#cbd5e1'
              }}
              placeholder="Description du personnage (optionnel)"
            />
            {errors.description && <div style={modalStyles.error}>{errors.description[0]}</div>}
          </div>

          {/* Avatars */}
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Avatars par humeur</label>

            {/* Sélecteur d'humeur */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {formData.moods.map(mood => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => setActiveMood(mood)}
                  style={{
                    padding: '6px 14px',
                    background: activeMood === mood ? '#3b82f6' : '#e2e8f0',
                    color: activeMood === mood ? 'white' : '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: activeMood === mood ? '600' : '400',
                    transition: 'all 0.2s'
                  }}
                >
                  {mood}
                </button>
              ))}
            </div>

            {/* Sélecteur d'avatar */}
            <AvatarPicker
              currentSprites={formData.sprites}
              onSelect={handleSpriteSelect}
              mood={activeMood}
              labels={labels as Record<string, string>}
            />
          </div>

          {/* Boutons */}
          <footer style={modalStyles.footer}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                cursor: 'pointer',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: 'white',
                color: '#475569',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              {labels.cancel || 'Annuler'}
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'background-color 0.2s'
              }}
            >
              {labels.save || 'Enregistrer'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
