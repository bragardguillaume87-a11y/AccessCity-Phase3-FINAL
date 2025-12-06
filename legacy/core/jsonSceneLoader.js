import { sanitizeObject } from './sanitizer.js';
import { validateSchema } from './schema.js';
import { sampleScenes } from './sampleData.js';

export async function loadScenesFromJson(jsonPath, schema, useFallback = true) {
  try {
    const response = await fetch(jsonPath);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const sanitized = sanitizeObject(data);
    const errors = validateSchema(sanitized, schema);
    if (errors.length > 0) throw new Error('Scene validation failed: ' + errors.join(', '));
    console.log('✅ Scenes loaded from', jsonPath);
    return sanitized;
  } catch (err) {
    console.warn('⚠️ Failed to load scenes from', jsonPath, ':', err.message);
    if (useFallback) {
      console.log('🔄 Using fallback sample data');
      return sanitizeObject(sampleScenes);
    }
    throw err;
  }
}