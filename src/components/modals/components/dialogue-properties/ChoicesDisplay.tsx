import type { DialogueChoice } from '@/types';

interface ChoicesDisplayProps {
  choices: DialogueChoice[];
  isCosmosTheme: boolean;
  textColor: string;
  mutedColor: string;
}

const CHOICE_COLORS = ['#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'];

export function ChoicesDisplay({ choices, isCosmosTheme, textColor, mutedColor }: ChoicesDisplayProps) {
  if (choices.length === 0) return null;

  return (
    <div className="space-y-3">
      <label
        className="flex items-center gap-2 text-sm font-bold"
        style={{ color: textColor }}
      >
        <span className="text-xl">🚀</span>
        {isCosmosTheme ? 'Les chemins possibles' : 'Choix'} ({choices.length})
      </label>
      <div className="space-y-2">
        {choices.map((choice, index) => {
          const color = CHOICE_COLORS[index % CHOICE_COLORS.length];
          return (
            <div
              key={choice.id}
              className="p-3 rounded-xl"
              style={{ background: `${color}20`, border: `2px solid ${color}` }}
            >
              <p className="text-sm font-medium" style={{ color }}>
                {isCosmosTheme ? '✨' : `${index + 1}.`} {choice.text}
              </p>
              {(choice.nextDialogueId || choice.nextSceneId) && (
                <p className="text-xs mt-1" style={{ color: mutedColor }}>
                  {choice.nextSceneId ? '🌟 Nouvelle scène' : '➡️ Suite...'}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p
        className="text-xs text-center p-2 rounded-lg"
        style={{
          background: isCosmosTheme ? 'rgba(168, 85, 247, 0.2)' : 'var(--color-bg-base)',
          color: mutedColor,
        }}
      >
        {isCosmosTheme ? '💡 Double-clique sur la planète pour modifier les chemins !' : 'Double-cliquez pour éditer les choix'}
      </p>
    </div>
  );
}
