import { useState } from 'react';
import type { Dialogue, Scene, SceneMetadata, Character, ModalType } from '@/types';
import { Button } from '@/components/ui/button';
import { AutoSaveIndicator } from '../../../ui/AutoSaveIndicator';
import { Copy, SlidersHorizontal, GitBranch, Type } from 'lucide-react';
import { useIsKidMode } from '@/hooks/useIsKidMode';
import { useTranslation } from '@/i18n';
import { PropertiesTab } from './PropertiesTab';
import { TextTab } from './TextTab';
import { ChoicesTab } from './ChoicesTab';

export interface DialoguePropertiesFormProps {
  dialogue: Dialogue;
  dialogueIndex: number;
  scene: Scene;
  characters: Character[];
  scenes: SceneMetadata[];
  onUpdate: (sceneId: string, dialogueIndex: number, updates: Partial<Dialogue>) => void;
  onDuplicate: () => void;
  onOpenModal?: (modalType: ModalType, config?: { category?: string; targetSceneId?: string }) => void;
  lastSaved?: number;
  isSaving?: boolean;
}

type TabType = 'properties' | 'text' | 'choices';

export function DialoguePropertiesForm({
  dialogue,
  dialogueIndex,
  scene,
  characters,
  scenes,
  onUpdate,
  onDuplicate,
  onOpenModal,
  lastSaved,
  isSaving,
}: DialoguePropertiesFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>('properties');
  const { t } = useTranslation();
  const isKid = useIsKidMode();

  const handleUpdate = (updates: Partial<Dialogue>) => {
    onUpdate(scene.id, dialogueIndex, updates);
  };

  const handleAddChoice = () => {
    const newChoice = {
      id: `choice-${Date.now()}`,
      text: 'New choice',
      nextSceneId: '',
      effects: []
    };
    handleUpdate({ choices: [...(dialogue.choices || []), newChoice] });
  };

  const handleUpdateChoice = (choiceIndex: number, updatedChoice: Dialogue['choices'][number]) => {
    const updatedChoices = [...(dialogue.choices || [])];
    updatedChoices[choiceIndex] = updatedChoice;
    handleUpdate({ choices: updatedChoices });
  };

  const handleDeleteChoice = (choiceIndex: number) => {
    handleUpdate({ choices: dialogue.choices.filter((_, i) => i !== choiceIndex) });
  };

  return (
    <div className="h-full flex flex-col bg-card">

      {/* Header */}
      <div className="flex-shrink-0 border-b border-border px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wide">{t('dialogueEditor.title')}</h3>
        {!isKid && (
          <Button variant="outline" size="sm" onClick={onDuplicate} title={t('dialogueEditor.duplicate')}>
            <Copy className="h-3 w-3" />
            {t('dialogueEditor.duplicate')}
          </Button>
        )}
      </div>

      {/* Tabs — Pro mode only */}
      {!isKid && (
        <div className="flex-shrink-0 border-b border-border bg-transparent p-1 grid grid-cols-3 gap-1">
          {([
            { id: 'properties' as TabType, icon: <SlidersHorizontal className="w-4 h-4 flex-shrink-0" />, label: t('dialogueEditor.propertiesTab') },
            { id: 'text'       as TabType, icon: <Type            className="w-4 h-4 flex-shrink-0" />, label: 'Texte' },
            { id: 'choices'    as TabType, icon: <GitBranch       className="w-4 h-4 flex-shrink-0" />, label: `${t('dialogueEditor.choicesTab')} (${dialogue.choices?.length || 0})` },
          ] as const).map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg h-11 flex flex-col items-center justify-center gap-1 px-1 transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-[var(--color-primary)] text-white shadow-none'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {tab.icon}
              <span className="text-xs leading-none font-semibold">{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      {(isKid || activeTab === 'properties') && (
        <PropertiesTab
          dialogue={dialogue}
          scene={scene}
          characters={characters}
          dialogueIndex={dialogueIndex}
          isKid={isKid}
          t={t}
          onUpdate={handleUpdate}
          onOpenModal={onOpenModal}
        />
      )}

      {!isKid && activeTab === 'text' && (
        <TextTab
          dialogue={dialogue}
          characters={characters}
          onUpdate={handleUpdate}
        />
      )}

      {!isKid && activeTab === 'choices' && (
        <ChoicesTab
          dialogue={dialogue}
          dialogueIndex={dialogueIndex}
          scenes={scenes}
          sceneId={scene.id}
          onAddChoice={handleAddChoice}
          onUpdateChoice={handleUpdateChoice}
          onDeleteChoice={handleDeleteChoice}
        />
      )}

      {/* Auto-save indicator */}
      <div className="flex-shrink-0 border-t border-border p-3">
        <AutoSaveIndicator lastSaved={lastSaved ? new Date(lastSaved) : null} isSaving={isSaving} />
      </div>

    </div>
  );
}
