import { sanitizeObject } from './sanitizer.js';
import { validateSchema } from './schema.js';
import { sampleUiLayout } from './sampleData.js';

export async function loadUiLayoutFromJson(jsonPath, schema, useFallback = true) {
  try {
    const response = await fetch(jsonPath);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const sanitized = sanitizeObject(data);
    const errors = validateSchema(sanitized, schema);
    if (errors.length > 0) throw new Error('UI Layout validation failed: ' + errors.join(', '));
    console.log('✅ UI Layout loaded from', jsonPath);
    return sanitized;
  } catch (err) {
    console.warn('⚠️ Failed to load UI layout from', jsonPath, ':', err.message);
    if (useFallback) {
      console.log('🔄 Using fallback sample layout');
      return sanitizeObject(sampleUiLayout);
    }
    throw err;
  }
}