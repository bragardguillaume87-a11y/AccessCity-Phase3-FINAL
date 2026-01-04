import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button.jsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTypewriter } from '@/hooks/useTypewriter.js';
import { Z_INDEX } from '@/utils/zIndexLayers.js';

/**
 * DialoguePreviewOverlay - Preview selected dialogue with typewriter effect
 */
export function DialoguePreviewOverlay({
  dialogue,
  dialogueIndex,
  totalDialogues,
  speakerName,
  currentDialogueText,
  onNavigate
}) {
  const { displayText, isComplete, skip } = useTypewriter(currentDialogueText, {
    speed: 40,
    cursor: true,
    contextAware: true
  });

  if (!dialogue) return null;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent px-4 py-3 pointer-events-none"
      style={{ zIndex: Z_INDEX.CANVAS_DIALOGUE_OVERLAY }}
    >
      {/* Dialogue Box */}
      <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-xl p-3 shadow-lg max-w-2xl mx-auto pointer-events-auto">
        {/* Speaker Name */}
        <div className="flex items-center gap-2 mb-2">
          <div className="px-2 py-0.5 bg-blue-600 rounded-lg">
            <span className="text-white font-bold text-xs">{speakerName}</span>
          </div>
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-xs text-slate-500 font-medium">PREVIEW</span>
        </div>

        {/* Dialogue Text with Typewriter + Skip */}
        <p
          className="text-white text-sm leading-relaxed mb-3 cursor-pointer transition-opacity hover:opacity-90"
          onClick={() => skip()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              skip();
            }
          }}
          aria-label="Cliquez ou appuyez sur espace pour passer l'animation"
        >
          {displayText || '(empty dialogue)'}
        </p>

        {/* Choices */}
        {dialogue.choices && dialogue.choices.length > 0 && (
          <div className="space-y-1.5">
            {dialogue.choices.map((choice, cIdx) => (
              <div
                key={cIdx}
                className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 hover:border-blue-500 rounded-lg px-3 py-2 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-slate-200 text-sm group-hover:text-white transition-colors">
                    {choice.text}
                  </span>
                  {choice.effects && choice.effects.length > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-amber-900/30 border border-amber-700 text-amber-300 rounded">
                      {choice.effects.length} effet{choice.effects.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation Controls */}
        <div className="mt-3 pt-2 border-t border-slate-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('prev');
              }}
              disabled={dialogueIndex === 0}
              className="h-7 px-2 text-xs hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all group"
              aria-label="Dialogue précédent"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
              Précédent
            </Button>
            <Button
              variant="gaming-primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('next');
              }}
              disabled={dialogueIndex >= totalDialogues - 1}
              className="h-7 px-2 text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-all group"
              aria-label="Dialogue suivant"
            >
              Suivant
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-mono">{dialogueIndex + 1} / {totalDialogues}</span>
            <span className="opacity-70">{isComplete ? '✓' : '...'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

DialoguePreviewOverlay.propTypes = {
  dialogue: PropTypes.shape({
    text: PropTypes.string,
    choices: PropTypes.array
  }),
  dialogueIndex: PropTypes.number.isRequired,
  totalDialogues: PropTypes.number.isRequired,
  speakerName: PropTypes.string.isRequired,
  currentDialogueText: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired
};
