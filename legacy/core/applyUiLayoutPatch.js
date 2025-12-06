import { sanitizeObject } from './sanitizer.js';
import { validateSchema } from './schema.js';
export async function applyUiLayoutPatch(currentLayout, patch, schema) {
  const sanitized = sanitizeObject(patch);
  const errors = validateSchema(sanitized, schema);
  if (errors.length > 0) throw new Error('UI Layout validation failed: ' + errors.join(', '));
  return {...currentLayout, ...sanitized};
}