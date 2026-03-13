/**
 * Behavior Graph Types — No-code behavior system
 *
 * Behavior graphs are attached to maps and define game logic via a node graph
 * built with @xyflow/react. Each node type maps to a no-code action or condition.
 *
 * @module types/behavior
 */

// ============================================================================
// NODE TYPES
// ============================================================================

export type BehaviorNodeType =
  | 'trigger-zone'      // "Quand le joueur entre dans la zone X"
  | 'condition'         // "SI variable > valeur"
  | 'action'            // "Alors : modifier variable / jouer son"
  | 'dialogue-trigger'  // "Déclencher scène VN [dropdown]"
  | 'map-exit';         // "Aller à la carte Y"

// ── Node data payloads ────────────────────────────────────────────────────

export interface TriggerZoneData {
  /** Reference to a DialogueTrigger.id or SceneExit.id in the map */
  zoneId: string;
  label: string;
}

export interface ConditionData {
  /** Variable name from settingsStore.projectSettings.game.variables */
  variable: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  value: string | number | boolean;
}

export interface ActionData {
  type: 'set-variable' | 'add-variable' | 'play-sound' | 'show-message';
  variable?: string;
  value?: string | number | boolean;
  soundPath?: string;
  message?: string;
}

export interface DialogueTriggerData {
  /** Scene ID in VN editor */
  sceneId: string;
  sceneTitle: string;
}

export interface MapExitData {
  targetMapId: string;
  targetMapName: string;
}

// ============================================================================
// NODE & EDGE
// ============================================================================

export interface BehaviorNode {
  id: string;
  type: BehaviorNodeType;
  position: { x: number; y: number };
  data:
    | TriggerZoneData
    | ConditionData
    | ActionData
    | DialogueTriggerData
    | MapExitData;
}

export interface BehaviorEdge {
  id: string;
  source: string;
  target: string;
  /** Optional: 'yes' | 'no' for ConditionNode outputs */
  label?: string;
}

// ============================================================================
// BEHAVIOR GRAPH (one per map)
// ============================================================================

export interface BehaviorGraph {
  mapId: string;
  nodes: BehaviorNode[];
  edges: BehaviorEdge[];
}
