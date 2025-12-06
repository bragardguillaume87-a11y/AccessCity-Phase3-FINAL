import { sanitizeObject } from './sanitizer.js';
import { validateSchema } from './schema.js';

export async function applyScenesPatch(currentScenes, patch, schema) {
  const sanitized = sanitizeObject(patch);
  const errors = validateSchema(sanitized, schema);
  if (errors.length > 0) throw new Error('Schema validation failed: ' + errors.join(', '));

  const existingScenes = currentScenes.scenes || [];
  const existingIds = new Set(existingScenes.map(scene => scene.id));
  const mergedScenes = existingScenes.slice();

  sanitized.scenes.forEach(scene => {
    if (existingIds.has(scene.id)) {
      console.warn(`[applyScenesPatch] Scene id '${scene.id}' already exists. Skipping duplicate.`);
      return;
    }
    existingIds.add(scene.id);
    mergedScenes.push(scene);
  });

  return { ...currentScenes, scenes: mergedScenes };
}