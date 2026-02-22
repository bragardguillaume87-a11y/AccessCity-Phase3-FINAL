import type { Dialogue, DialogueChoice } from './scenes';
import type { ValidationProblem } from './validation';

export interface SerpentineNodeData {
  rowIndex: number;
  positionInRow: number;
  rowLength: number;
  flowDirection: 'ltr' | 'rtl';
  isFirst: boolean;
  isLast: boolean;
  isFirstInRow: boolean;
  isLastInRow: boolean;
  /** Branch-aware clustering info (only set in 'branch-aware' mode) */
  clusterIndex?: number;
  clusterSize?: number;
  positionInCluster?: number;
}

export interface DialogueNodeData extends Record<string, unknown> {
  dialogue: Dialogue;
  index: number;
  speaker: string;
  text: string;
  speakerMood: string;
  stageDirections?: string;
  choices: DialogueChoice[];
  issues: ValidationProblem[];
  serpentine?: SerpentineNodeData;
}

export interface TerminalNodeData extends Record<string, unknown> {
  sceneId: string;
  label: string;
  choiceText?: string;
  serpentine?: SerpentineNodeData;
}

export interface ClusterNodeData extends Record<string, unknown> {
  /** Unique cluster ID (e.g. "cluster-3" for the cluster starting at dialogue index 3) */
  clusterId: string;
  /** Speaker of the choice dialogue that heads this cluster */
  speaker: string;
  /** Number of response nodes collapsed into this cluster */
  responseCount: number;
  /** Choice text preview */
  choicePreview: string;
  /** Original dialogue indices contained in this cluster */
  containedIndices: number[];
}

export interface NodeColorTheme {
  bg: string;
  border: string;
  text: string;
}
