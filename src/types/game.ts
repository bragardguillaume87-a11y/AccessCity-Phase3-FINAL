/** Game statistics as key-value pairs */
export interface GameStats {
  [key: string]: number;
}

export interface DiceCheckBranch {
  nextSceneId?: string;
  nextDialogueId?: string;
}

export interface DiceCheck {
  stat: string;
  difficulty: number;
  success?: DiceCheckBranch;
  failure?: DiceCheckBranch;
}

export type ConditionOperator = '>=' | '<=' | '>' | '<' | '==' | '!=';

export interface Condition {
  variable: string;
  operator: ConditionOperator;
  value: number;
}

export interface Effect {
  variable: string;
  value: number;
  operation: 'add' | 'set' | 'multiply';
}
