#!/bin/bash

echo "🚀 Setting up CharactersTab - Part 1: Structure & Hooks"

# Create directories
mkdir -p src/components/tabs/characters/{panels,components,hooks}
mkdir -p src/locales/{en,fr}
mkdir -p public/assets/characters/presets

# ============================================
# HOOKS
# ============================================

cat > src/components/tabs/characters/hooks/useCharacters.js << 'ENDOFFILE'
// src/components/tabs/characters/hooks/useCharacters.js

import { useContext, useCallback } from 'react';
import AppContext from '../../../../AppContext';

export const useCharacters = () => {
  const { characters, addCharacter, updateCharacter, deleteCharacter } = useContext(AppContext);

  const createCharacter = useCallback(() => {
    const newId = addCharacter();
    return newId;
  }, [addCharacter]);

  const duplicateCharacter = useCallback((charId) => {
    const original = characters.find(c => c.id === charId);
    if (!original) return null;

    const duplicate = {
      ...original,
      name: `${original.name} (Copy)`,
    };

    // addCharacter with data
    updateCharacter({ ...duplicate, id: `char-${Date.now()}` });
    return duplicate.id;
  }, [characters, updateCharacter]);

  const removeCharacter = useCallback((charId) => {
    if (charId === 'player' || charId === 'counsellor' || charId === 'narrator') {
      return { success: false, error: 'Cannot delete core characters' };
    }

    deleteCharacter(charId);
    return { success: true };
  }, [deleteCharacter]);

  return {
    characters,
    createCharacter,
    duplicateCharacter,
    removeCharacter,
    updateCharacter
  };
};
ENDOFFILE

cat > src/components/tabs/characters/hooks/useCharacterValidation.js << 'ENDOFFILE'
// src/components/tabs/characters/hooks/useCharacterValidation.js

import { useMemo } from 'react';

export const useCharacterValidation = (characters, currentCharacter) => {
  const validate = useMemo(() => {
    return (field, value) => {
      const errors = [];

      switch (field) {
        case 'name':
          if (!value || value.trim() === '') {
            errors.push('Name is required');
          }
          
          const isDuplicate = characters.some(
            c => c.id !== currentCharacter?.id && 
                 c.name.toLowerCase() === value.toLowerCase()
          );
          
          if (isDuplicate) {
            errors.push('A character with this name already exists');
          }
          break;

        case 'description':
          if (value && value.length > 500) {
            errors.push('Description must be less than 500 characters');
          }
          break;

        default:
          break;
      }

      return errors;
    };
  }, [characters, currentCharacter]);

  const validateAll = useMemo(() => {
    return (character) => {
      const allErrors = {};
      
      const nameErrors = validate('name', character.name);
      if (nameErrors.length > 0) allErrors.name = nameErrors;

      const descErrors = validate('description', character.description);
      if (descErrors.length > 0) allErrors.description = descErrors;

      return {
        isValid: Object.keys(allErrors).length === 0,
        errors: allErrors
      };
    };
  }, [validate]);

  return { validate, validateAll };
};
ENDOFFILE

# ============================================
# I18N FILES
# ============================================

cat > src/locales/en/characters.json << 'ENDOFFILE'
{
  "characters": "Characters",
  "charactersList": "Characters list",
  "createCharacter": "Create new character",
  "new": "New",
  "noCharacters": "No characters yet. Create your first one!",
  "character": "Character",
  "duplicate": "Duplicate",
  "delete": "Delete",
  "editCharacter": "Edit Character",
  "close": "Close",
  "name": "Name",
  "description": "Description",
  "avatars": "Avatars",
  "mood": {
    "neutral": "Neutral",
    "professional": "Professional",
    "helpful": "Helpful"
  },
  "selectAvatar": "Select avatar",
  "presetAvatars": "Preset avatars",
  "or": "or",
  "uploadCustom": "Upload custom avatar",
  "currentAvatar": "Current avatar",
  "invalidFileType": "Invalid file type. Please upload PNG, JPG, SVG or WebP.",
  "fileTooLarge": "File too large. Maximum size is 5MB.",
  "cancel": "Cancel",
  "save": "Save",
  "properties": "Properties",
  "selectCharacter": "Select a character to view properties",
  "id": "ID",
  "createdAt": "Created at",
  "modifiedAt": "Modified at",
  "usedInScenes": "Used in scenes",
  "notUsed": "Not used in any scene",
  "unknown": "Unknown",
  "characterDetails": "Character details",
  "edit": "Edit",
  "selectCharacterToView": "Select a character to view details"
}
ENDOFFILE

cat > src/locales/fr/characters.json << 'ENDOFFILE'
{
  "characters": "Personnages",
  "charactersList": "Liste des personnages",
  "createCharacter": "Creer un nouveau personnage",
  "new": "Nouveau",
  "noCharacters": "Aucun personnage. Creez-en un !",
  "character": "Personnage",
  "duplicate": "Dupliquer",
  "delete": "Supprimer",
  "editCharacter": "Editer le personnage",
  "close": "Fermer",
  "name": "Nom",
  "description": "Description",
  "avatars": "Avatars",
  "mood": {
    "neutral": "Neutre",
    "professional": "Professionnel",
    "helpful": "Serviable"
  },
  "selectAvatar": "Selectionner un avatar",
  "presetAvatars": "Avatars predefinis",
  "or": "ou",
  "uploadCustom": "Televerser un avatar personnalise",
  "currentAvatar": "Avatar actuel",
  "invalidFileType": "Type de fichier invalide. Veuillez televerser PNG, JPG, SVG ou WebP.",
  "fileTooLarge": "Fichier trop volumineux. Taille maximale : 5 Mo.",
  "cancel": "Annuler",
  "save": "Enregistrer",
  "properties": "Proprietes",
  "selectCharacter": "Selectionner un personnage pour voir ses proprietes",
  "id": "ID",
  "createdAt": "Cree le",
  "modifiedAt": "Modifie le",
  "usedInScenes": "Utilise dans les scenes",
  "notUsed": "Non utilise",
  "unknown": "Inconnu",
  "characterDetails": "Details du personnage",
  "edit": "Editer",
  "selectCharacterToView": "Selectionner un personnage pour voir les details"
}
ENDOFFILE

echo "✅ Part 1 completed: Hooks & i18n files created"
echo "Run setup-characters-tab-part2.sh next"
