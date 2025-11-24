import { sanitizeObject } from './sanitizer.js';
import { validateSchema } from './schema.js';
export async function loadScenesFromJson(jsonPath, schema) {
  try {
    const response = await fetch(jsonPath);
    const data = await response.json();
    const sanitized = sanitizeObject(data);
    const errors = validateSchema(sanitized, schema);
    if (errors.length > 0) throw new Error('Scene validation failed: ' + errors.join(', '));
    return sanitized;
  } catch (err) { console.error('Failed to load scenes:', err); throw err; }
}