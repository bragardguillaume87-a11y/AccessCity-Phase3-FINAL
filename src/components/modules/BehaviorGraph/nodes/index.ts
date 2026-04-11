import { TriggerZoneNode }    from './TriggerZoneNode';
import { ConditionNode }      from './ConditionNode';
import { ActionNode }         from './ActionNode';
import { DialogueTriggerNode } from './DialogueTriggerNode';
import { MapExitNode }        from './MapExitNode';

/**
 * nodeTypes — passé au composant <ReactFlow nodeTypes={...} />.
 * ⚠️ Doit être défini en dehors du render (constante module-level) pour éviter
 * les re-renders infinis (@xyflow/react best practice).
 */
export const behaviorNodeTypes = {
  'trigger-zone':     TriggerZoneNode,
  'condition':        ConditionNode,
  'action':           ActionNode,
  'dialogue-trigger': DialogueTriggerNode,
  'map-exit':         MapExitNode,
} as const;

export type { TriggerZoneNode, ConditionNode, ActionNode, DialogueTriggerNode, MapExitNode };
