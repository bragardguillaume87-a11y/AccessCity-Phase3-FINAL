// core/characterLoader.js
// Charge et valide le fichier data/characters.json

import { sanitizeObject } from './sanitizer.js';
import { validateSchema } from './schema.js';
import { sampleCharacters } from './sampleData.js';

export async function loadCharactersFromJson(jsonPath, schema, useFallback = true) {
  try {
    const response = await fetch(jsonPath);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} while loading characters.json`);
    }

    const data = await response.json();
    const sanitized = sanitizeObject(data);
    
    if (schema) {
        const errors = validateSchema(sanitized, schema);
        if (errors.length > 0) {
            throw new Error('Character validation failed: ' + errors.join(', '));
        }
    }

    console.log('✅ Characters loaded from', jsonPath);
    return sanitized;

  } catch (err) {
    console.warn('⚠️ Failed to load characters from', jsonPath, ':', err.message);
    
    if (useFallback) {
      console.log('🔄 Using fallback sample characters');
      return sanitizeObject(sampleCharacters);
    }
    throw err;
  }
}
