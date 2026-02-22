/**
 * nodeIdCodec.ts — Encode / decode dialogue node IDs
 *
 * Format: `{sceneId}-d-{dialogueIndex}`
 */

/** Dialogue node ID separator */
const NODE_ID_SEPARATOR = '-d-';

/** Build a dialogue node ID from sceneId and dialogue index */
export function dialogueNodeId(sceneId: string, index: number): string {
  return `${sceneId}${NODE_ID_SEPARATOR}${index}`;
}

/** Extract the dialogue index from a node ID. Returns NaN if invalid. */
export function extractDialogueIndex(nodeId: string): number {
  const parts = nodeId.split(NODE_ID_SEPARATOR);
  return parseInt(parts[parts.length - 1], 10);
}

/** Extract dialogue index with validation. Returns -1 if invalid or negative. */
export function safeExtractDialogueIndex(nodeId: string): number {
  const index = extractDialogueIndex(nodeId);
  return (Number.isNaN(index) || index < 0) ? -1 : index;
}

/** Extract scene ID from a dialogue node ID (format: "sceneId-d-index") */
export function extractSceneId(nodeId: string): string {
  const sepIndex = nodeId.indexOf(NODE_ID_SEPARATOR);
  return sepIndex === -1 ? nodeId : nodeId.substring(0, sepIndex);
}
