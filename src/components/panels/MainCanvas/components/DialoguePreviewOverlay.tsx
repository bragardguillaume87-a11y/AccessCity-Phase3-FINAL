import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTypewriter } from '@/hooks/useTypewriter';
import { Z_INDEX } from '@/utils/zIndexLayers';
import type { Dialogue, DialogueChoice } from '@/types';

export interface DialoguePreviewOverlayProps {
  dialogue: Dialogue | null;
  dialogueIndex: number;
  totalDialogues: number;
  speakerName: string;
  currentDialogueText: string;
  onNavigate: (direction: 'prev' | 'next') => void;
}

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
}: DialoguePreviewOverlayProps) {
  const { displayText, isComplete, skip } = useTypewriter(currentDialogueText, {
    speed: 40,
    cursor: true,
    contextAware: true
  });

  if (!dialogue) return null;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-background/95 to-transparent px-4 py-3 pointer-events-none"
      style={{ zIndex: Z_INDEX.CANVAS_DIALOGUE_OVERLAY }}
    >
      {/* Dialogue Box - compact */}
      <div className="bg-background/90 backdrop-blur-sm border border-border rounded-xl p-2 shadow-lg max-w-2xl mx-auto pointer-events-auto max-h-[200px] overflow-y-auto">
        {/* Speaker Name + Nav */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="px-2 py-0.5 bg-blue-600 rounded-lg">
            <span className="text-white font-bold text-xs">{speakerName}</span>
          </div>
          <div className="flex-1 h-px bg-muted" />
          {/* Compact navigation - icon only */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('prev');
              }}
              disabled={dialogueIndex === 0}
              className="h-6 w-6 p-0 disabled:opacity-30 transition-all"
              aria-label="Dialogue précédent"
            >
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
            <span className="text-[10px] text-muted-foreground font-mono">{dialogueIndex + 1}/{totalDialogues}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('next');
              }}
              disabled={dialogueIndex >= totalDialogues - 1}
              className="h-6 w-6 p-0 disabled:opacity-30 transition-all"
              aria-label="Dialogue suivant"
            >
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Dialogue Text with Typewriter + Skip */}
        <p
          className="text-white text-sm leading-relaxed mb-1.5 cursor-pointer transition-opacity hover:opacity-90 line-clamp-3"
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

        {/* Choices - clickable */}
        {dialogue.choices && dialogue.choices.length > 0 && (
          <div className="space-y-1">
            {dialogue.choices.map((choice, cIdx) => (
              <button
                key={cIdx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('next');
                }}
                className="w-full text-left bg-card/50 hover:bg-muted/50 border border-border hover:border-blue-500 rounded-lg px-3 py-1.5 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-foreground text-sm group-hover:text-white transition-colors">
                    {choice.text}
                  </span>
                  {choice.effects && choice.effects.length > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-amber-900/30 border border-amber-700 text-amber-300 rounded">
                      {choice.effects.length} effet{choice.effects.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
