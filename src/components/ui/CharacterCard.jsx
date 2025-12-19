import React, { useState } from 'react';
import PropTypes from 'prop-types';
// Note: Assurez-vous d'avoir créé le fichier AvatarPicker.module.css ou utilisez un style inline temporaire si manquant
// Pour l'instant, je mets des styles inline basiques pour éviter les erreurs si le CSS manque
const styles = {
  picker: { padding: '10px' },
  presets: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' },
  presetBtn: { border: '1px solid #ddd', background: 'white', padding: '5px', cursor: 'pointer', borderRadius: '4px' },
  selected: { borderColor: '#2563eb', background: '#eff6ff' },
  img: { width: '40px', height: '40px', objectFit: 'contain' }
};

const DEFAULT_AVATARS = [
  { id: 'avatar-1', url: 'assets/characters/presets/avatar-1.svg', label: 'Avatar 1' },
  { id: 'avatar-2', url: 'assets/characters/presets/avatar-2.svg', label: 'Avatar 2' }
];

export const AvatarPicker = ({ currentSprites, onSelect, mood, labels }) => {
  const [selectedPreset, setSelectedPreset] = useState(null);

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset.id);
    onSelect(mood, preset.url);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(labels?.fileTooLarge || 'Fichier trop volumineux');
      return;
    }

    const url = URL.createObjectURL(file);
    onSelect(mood, url);
  };

  return (
    <div style={styles.picker}>
      <h4>{labels?.selectAvatar || 'Sélectionner un avatar'} ({mood})</h4>

      <div style={styles.presets}>
        {DEFAULT_AVATARS.map(preset => (
          <button
            key={preset.id}
            onClick={() => handlePresetSelect(preset)}
            style={{...styles.presetBtn, ...(selectedPreset === preset.id ? styles.selected : {})}}
          >
            {/* Utilisation d'un placeholder si l'image n'existe pas encore */}
            <div style={{...styles.img, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              {preset.id}
            </div>
          </button>
        ))}
      </div>

      <div style={{margin: '10px 0'}}>
        <input type="file" accept="image/*" onChange={handleFileUpload} />
      </div>

      {currentSprites && currentSprites[mood] && (
        <div style={{marginTop: '10px'}}>
          <p>Avatar actuel :</p>
          <img src={currentSprites[mood]} alt="Preview" style={{maxWidth: '100px', maxHeight: '100px'}} />
        </div>
      )}
    </div>
  );
};

AvatarPicker.propTypes = {
  currentSprites: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
  mood: PropTypes.string.isRequired,
  labels: PropTypes.object
};
