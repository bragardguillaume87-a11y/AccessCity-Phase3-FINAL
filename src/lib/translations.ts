/**
 * Translations system for AccessCity
 *
 * Simple, type-safe translation system for UI labels.
 * Default language: French (fr)
 */

export type Locale = 'fr' | 'en';

const translations = {
  fr: {
    // Context Menu - Character Actions
    'contextMenu.editCharacter': 'Modifier {name}',
    'contextMenu.changeMood': 'Changer l\'humeur',
    'contextMenu.changeAnimation': 'Animation d\'entrée',
    'contextMenu.changeLayer': 'Ordre d\'affichage',
    'contextMenu.flipHorizontal': 'Inverser l\'image',
    'contextMenu.removeFromScene': 'Retirer de la scène',

    // Context Menu - Descriptions (kid-friendly)
    'contextMenu.editCharacter.desc': 'Ouvre l\'éditeur de personnage',
    'contextMenu.changeMood.desc': 'Change l\'expression du visage',
    'contextMenu.changeAnimation.desc': 'Comment le personnage apparaît',
    'contextMenu.changeLayer.desc': 'Devant ou derrière les autres',
    'contextMenu.flipHorizontal.desc': 'Retourne l\'image gauche-droite',
    'contextMenu.removeFromScene.desc': 'Retire le personnage de cette scène',

    // Mood Picker
    'moodPicker.title': 'Quelle humeur pour {name} ?',
    'moodPicker.current': 'Humeur actuelle',
    'moodPicker.select': 'Sélectionner',

    // Animation Picker
    'animationPicker.title': 'Comment {name} arrive ?',
    'animationPicker.current': 'Animation actuelle',
    'animationPicker.none': 'Normal',
    'animationPicker.fadeIn': 'Apparition douce',
    'animationPicker.slideInLeft': 'Glisse depuis la gauche',
    'animationPicker.slideInRight': 'Glisse depuis la droite',
    'animationPicker.slideInUp': 'Monte depuis le bas',
    'animationPicker.slideInDown': 'Descend depuis le haut',
    'animationPicker.pop': 'Pop !',
    'animationPicker.bounce': 'Rebondit',

    // Layer/Z-Index Picker
    'layerPicker.title': 'Position de {name}',
    'layerPicker.front': 'Devant',
    'layerPicker.back': 'Derrière',
    'layerPicker.help': 'Plus le nombre est grand, plus le personnage est devant',

    // Confirm Delete
    'confirmDelete.title': 'Retirer {name} ?',
    'confirmDelete.message': 'Tu veux vraiment retirer ce personnage de la scène ?',
    'confirmDelete.confirm': 'Oui, retirer',
    'confirmDelete.cancel': 'Non, garder',

    // Common
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.close': 'Fermer',
  },
  en: {
    // Context Menu - Character Actions
    'contextMenu.editCharacter': 'Edit {name}',
    'contextMenu.changeMood': 'Change mood',
    'contextMenu.changeAnimation': 'Entrance animation',
    'contextMenu.changeLayer': 'Display order',
    'contextMenu.flipHorizontal': 'Flip image',
    'contextMenu.removeFromScene': 'Remove from scene',

    // Context Menu - Descriptions (kid-friendly)
    'contextMenu.editCharacter.desc': 'Open character editor',
    'contextMenu.changeMood.desc': 'Change facial expression',
    'contextMenu.changeAnimation.desc': 'How the character appears',
    'contextMenu.changeLayer.desc': 'In front or behind others',
    'contextMenu.flipHorizontal.desc': 'Mirror the image left-right',
    'contextMenu.removeFromScene.desc': 'Remove character from this scene',

    // Mood Picker
    'moodPicker.title': 'What mood for {name}?',
    'moodPicker.current': 'Current mood',
    'moodPicker.select': 'Select',

    // Animation Picker
    'animationPicker.title': 'How does {name} enter?',
    'animationPicker.current': 'Current animation',
    'animationPicker.none': 'Normal',
    'animationPicker.fadeIn': 'Fade in',
    'animationPicker.slideInLeft': 'Slide from left',
    'animationPicker.slideInRight': 'Slide from right',
    'animationPicker.slideInUp': 'Slide from bottom',
    'animationPicker.slideInDown': 'Slide from top',
    'animationPicker.pop': 'Pop!',
    'animationPicker.bounce': 'Bounce',

    // Layer/Z-Index Picker
    'layerPicker.title': '{name} position',
    'layerPicker.front': 'Front',
    'layerPicker.back': 'Back',
    'layerPicker.help': 'Higher number means character is in front',

    // Confirm Delete
    'confirmDelete.title': 'Remove {name}?',
    'confirmDelete.message': 'Do you really want to remove this character from the scene?',
    'confirmDelete.confirm': 'Yes, remove',
    'confirmDelete.cancel': 'No, keep',

    // Common
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.close': 'Close',
  }
} as const;

// Current locale (can be changed at runtime)
let currentLocale: Locale = 'fr';

/**
 * Set the current locale
 */
export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

/**
 * Get the current locale
 */
export function getLocale(): Locale {
  return currentLocale;
}

// Type for translation keys
export type TranslationKey = keyof typeof translations.fr;

/**
 * Translate a key with optional interpolation
 * @param key - Translation key
 * @param params - Optional parameters for interpolation (e.g., {name: 'Max'})
 */
export function t(key: TranslationKey, params?: Record<string, string>): string {
  const localeTranslations = translations[currentLocale] || translations.fr;
  let text: string = localeTranslations[key] || translations.fr[key] || key;

  // Interpolate params (e.g., {name} -> 'Max')
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), value);
    });
  }

  return text;
}

/**
 * Hook-friendly translation function (returns same as t but typed for React)
 */
export function useTranslation() {
  return { t, locale: currentLocale, setLocale };
}

export default translations;
