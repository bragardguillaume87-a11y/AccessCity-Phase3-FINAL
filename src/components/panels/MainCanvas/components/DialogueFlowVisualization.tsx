import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, Network } from 'lucide-react';
import DialogueGraph from '../../../features/DialogueGraph';
import type { Scene, SelectedElementType } from '@/types';

export interface DialogueFlowVisualizationProps {
  selectedScene: Scene;
  selectedElement: SelectedElementType;
  viewMode: 'visual' | 'graph';
  onViewModeChange: (mode: 'visual' | 'graph') => void;
  onDialogueClick: (sceneId: string, index: number) => void;
  onOpenModal?: (modalType: string) => void;
}

/**
 * DialogueFlowVisualization - Display dialogue flow as list or graph
 */
export function DialogueFlowVisualization({
  selectedScene,
  selectedElement,
  viewMode,
  onViewModeChange,
  onDialogueClick,
  onOpenModal
}: DialogueFlowVisualizationProps) {
  const dialogues = selectedScene.dialogues || [];

  return (
    <div className="space-y-4">
      {/* Header with toggle buttons */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Déroulement
        </h3>

        {/* View mode toggle */}
        <Tabs value={viewMode} onValueChange={onViewModeChange}>
          <TabsList>
            <TabsTrigger value="visual">
              <List className="h-4 w-4" />
              Liste
            </TabsTrigger>
            <TabsTrigger value="graph">
              <Network className="h-4 w-4" />
              Arbre
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conditional rendering: Visual list or Graph view */}
      {viewMode === 'graph' ? (
        // Graph view with ReactFlow
        <div className="rounded-xl overflow-hidden border-2 border-slate-700 shadow-xl bg-slate-950" style={{ height: '600px' }}>
          <DialogueGraph
            selectedScene={selectedScene}
            selectedElement={selectedElement}
            onSelectDialogue={onDialogueClick}
            onOpenModal={onOpenModal}
          />
        </div>
      ) : (
        // Visual list view
        <div className="space-y-4">
          {dialogues.map((dialogue, idx) => {
            const isSelected = selectedElement?.type === 'dialogue' &&
              selectedElement?.sceneId === selectedScene.id &&
              selectedElement?.index === idx;

            return (
              <div
                key={idx}
                onClick={() => onDialogueClick(selectedScene.id, idx)}
                className={`rounded-lg border-2 p-4 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-500/20'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-slate-300">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-blue-400 mb-1">
                      {dialogue.speaker || 'Unknown'}
                    </div>
                    <p className="text-sm text-slate-300">
                      {dialogue.text || '(empty dialogue)'}
                    </p>
                    {dialogue.choices && dialogue.choices.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs font-semibold text-slate-500 uppercase">
                          Choices:
                        </div>
                        {dialogue.choices.map((choice, cIdx) => (
                          <div
                            key={cIdx}
                            className="text-sm text-slate-400 pl-4 border-l-2 border-slate-600 hover:border-blue-500 transition-colors"
                          >
                            {choice.text}
                            {choice.effects && choice.effects.length > 0 && (
                              <span className="ml-2 text-xs text-amber-500">
                                ({choice.effects.length} effet{choice.effects.length !== 1 ? 's' : ''})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
