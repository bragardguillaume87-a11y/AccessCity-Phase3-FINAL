export interface ValidationProblem {
  id: string;
  type: 'error' | 'warning';
  message: string;
  location?: {
    sceneId?: string;
    dialogueIndex?: number;
    characterId?: string;
  };
}
