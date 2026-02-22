import { Textarea } from '@/components/ui/textarea';

interface TextEditorSectionProps {
  text: string;
  stageDirections: string;
  isCosmosTheme: boolean;
  textColor: string;
  mutedColor: string;
  onTextChange: (text: string) => void;
  onStageDirectionsChange: (stageDirections: string) => void;
}

export function TextEditorSection({
  text, stageDirections, isCosmosTheme, textColor, mutedColor,
  onTextChange, onStageDirectionsChange,
}: TextEditorSectionProps) {
  return (
    <>
      {/* Stage Directions */}
      <div className="space-y-3">
        <label
          htmlFor="stage-directions"
          className="flex items-center gap-2 text-sm font-bold"
          style={{ color: textColor }}
        >
          <span className="text-xl">{isCosmosTheme ? '🎬' : '🎭'}</span>
          {isCosmosTheme ? 'Que fait-il ?' : 'Didascalies'}
          <span className="text-xs font-normal opacity-70">(optionnel)</span>
        </label>
        <div
          className="rounded-xl overflow-hidden"
          style={{
            border: `2px solid ${isCosmosTheme ? '#f59e0b' : 'var(--color-border-base)'}`,
            boxShadow: isCosmosTheme ? '0 0 15px rgba(245, 158, 11, 0.2)' : undefined,
          }}
        >
          <Textarea
            id="stage-directions"
            value={stageDirections}
            onChange={(e) => onStageDirectionsChange(e.target.value)}
            rows={2}
            className="w-full resize-none font-sans border-0 focus:ring-0 italic"
            style={{
              background: isCosmosTheme ? 'rgba(245, 158, 11, 0.1)' : 'var(--color-bg-base)',
              color: textColor,
              fontSize: '13px',
              lineHeight: '1.5',
            }}
            placeholder={isCosmosTheme ? 'Ex: Il hésite, regarde par la fenêtre...' : 'Actions, émotions, contexte...'}
          />
        </div>
        <p className="text-xs" style={{ color: mutedColor }}>
          {isCosmosTheme
            ? '💡 Décris ce que fait le personnage (sans parler)'
            : 'Instructions de mise en scène (comme au théâtre)'}
        </p>
      </div>

      {/* Text Editor */}
      <div className="space-y-3">
        <label
          htmlFor="dialogue-text"
          className="flex items-center gap-2 text-sm font-bold"
          style={{ color: textColor }}
        >
          <span className="text-xl">{isCosmosTheme ? '💬' : '✍️'}</span>
          {isCosmosTheme ? 'Que dit-il ?' : 'Texte du dialogue'}
        </label>
        <div
          className="rounded-xl overflow-hidden"
          style={{
            border: `3px solid ${isCosmosTheme ? '#10b981' : 'var(--color-border-base)'}`,
            boxShadow: isCosmosTheme ? '0 0 20px rgba(16, 185, 129, 0.3)' : undefined,
          }}
        >
          <Textarea
            id="dialogue-text"
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            rows={6}
            className="w-full resize-none font-sans border-0 focus:ring-0"
            style={{
              background: isCosmosTheme ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-bg-base)',
              color: textColor,
              fontSize: '15px',
              lineHeight: '1.6',
            }}
            placeholder={isCosmosTheme ? 'Écris ton message ici... 🚀' : 'Entrez le texte...'}
          />
          <div
            className="px-3 py-2 flex items-center justify-between"
            style={{
              background: isCosmosTheme ? 'rgba(16, 185, 129, 0.2)' : 'var(--color-bg-elevated)',
            }}
          >
            <span className="text-xs" style={{ color: mutedColor }}>
              {text.length} caractères
            </span>
            <div className="flex gap-1">
              {[...Array(Math.min(5, Math.ceil(text.length / 50)))].map((_, i) => (
                <span key={i} className="text-sm">⭐</span>
              ))}
              {text.length === 0 && (
                <span className="text-xs" style={{ color: mutedColor }}>
                  {isCosmosTheme ? 'Écris pour gagner des étoiles !' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
