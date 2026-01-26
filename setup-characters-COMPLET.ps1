Write-Host "🚀 Creating COMPLETE CharactersTab structure..." -ForegroundColor Cyan

# Create all directories
$directories = @(
    "src\components\tabs\characters\panels",
    "src\components\tabs\characters\components",
    "src\components\tabs\characters\hooks",
    "src\locales\en",
    "src\locales\fr",
    "public\assets\characters\presets"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        Write-Host "✓ Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "○ Already exists: $dir" -ForegroundColor Yellow
    }
}

Write-Host "`n📝 Creating hooks..." -ForegroundColor Cyan

# useCharacters.js
$useCharactersContent = @'
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
'@

$useCharactersContent | Out-File -FilePath "src\components\tabs\characters\hooks\useCharacters.js" -Encoding UTF8 -NoNewline
Write-Host "✓ Created: useCharacters.js" -ForegroundColor Green

# useCharacterValidation.js
$useValidationContent = @'
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
'@

$useValidationContent | Out-File -FilePath "src\components\tabs\characters\hooks\useCharacterValidation.js" -Encoding UTF8 -NoNewline
Write-Host "✓ Created: useCharacterValidation.js" -ForegroundColor Green

Write-Host "`n🌐 Creating i18n files..." -ForegroundColor Cyan

# EN i18n
$enI18nContent = @'
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
'@

$enI18nContent | Out-File -FilePath "src\locales\en\characters.json" -Encoding UTF8 -NoNewline
Write-Host "✓ Created: en/characters.json" -ForegroundColor Green

# FR i18n
$frI18nContent = @'
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
'@

$frI18nContent | Out-File -FilePath "src\locales\fr\characters.json" -Encoding UTF8 -NoNewline
Write-Host "✓ Created: fr/characters.json" -ForegroundColor Green

Write-Host "`n✅ Part 1 COMPLETE!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Verify files created in VS Code"
Write-Host "  2. Wait for Part 2 (React components)"
Write-Host "  3. Test the complete feature"
