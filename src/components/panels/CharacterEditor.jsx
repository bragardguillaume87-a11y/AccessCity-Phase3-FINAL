import React, { useState, useEffect } from 'react';
import { useCharacterValidation } from '../hooks/useCharacterValidation';

const CharacterEditor = ({ character, characters, onSave, onClose, labels }) => {
  const [formData, setFormData] = useState(character);
  
  useEffect(() => { setFormData(character); }, [character]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!character) return null;

  return (
    <div style={{ padding: '20px', background: 'white', border: '1px solid #ccc', position: 'absolute', top: '10%', left: '50%', transform: 'translate(-50%, 0)', zIndex: 1000, width: '400px' }}>
      <h2>{labels.editCharacter}</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>{labels.name}</label>
          <input name="name" value={formData.name || ''} onChange={handleChange} style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>{labels.description}</label>
          <textarea name="description" value={formData.description || ''} onChange={handleChange} style={{ width: '100%' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={onClose}>{labels.cancel}</button>
          <button type="submit">{labels.save}</button>
        </div>
      </form>
    </div>
  );
};
export default CharacterEditor;
