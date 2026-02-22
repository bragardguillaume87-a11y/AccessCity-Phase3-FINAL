

export interface SceneInfoBarProps {
  charactersCount: number;
  dialoguesCount: number;
}

/**
 * SceneInfoBar - Display scene statistics
 */
export function SceneInfoBar({ charactersCount, dialoguesCount }: SceneInfoBarProps) {
  return (
    <div className="bg-card px-4 py-2 border-t border-border flex items-center justify-between text-xs">
      <div className="text-muted-foreground">
        Characters in scene: <span className="text-white font-semibold">{charactersCount}</span>
      </div>
      <div className="text-muted-foreground">
        Dialogues: <span className="text-white font-semibold">{dialoguesCount}</span>
      </div>
    </div>
  );
}
