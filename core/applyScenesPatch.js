import { sanitizeObject } from './sanitizer.js';
import { validateSchema } from './schema.js';
export async function applyScenesPatch(currentScenes, patch, schema) {
  const sanitized = sanitizeObject(patch);
  const errors = validateSchema(sanitized, schema);
  if (errors.length > 0) throw new Error('Schema validation failed: ' + errors.join(', '));
  return {...currentScenes, scenes: [...(currentScenes.scenes || []), ...sanitized.scenes]};
}