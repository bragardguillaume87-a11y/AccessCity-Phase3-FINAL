import type { Dialogue, SceneMetadata } from '@/types';
import { Button } from '@/components/ui/button';
import { ChoiceEditor } from './ChoiceEditor';
import { Sparkles, Plus } from 'lucide-react';
import { useUIStore } from '@/stores';
import { useTranslation } from '@/i18n';

interface ChoicesTabProps {
  dialogue: Dialogue;
  dialogueIndex: number;
  scenes: SceneMetadata[];
  sceneId: string;
  onAddChoice: () => void;
  onUpdateChoice: (choiceIndex: number, updatedChoice: Dialogue['choices'][number]) => void;
  onDeleteChoice: (choiceIndex: number) => void;
}

export function ChoicesTab({ dialogue, dialogueIndex, scenes, sceneId, onAddChoice, onUpdateChoice, onDeleteChoice }: ChoicesTabProps) {
  const setWizardOpen = useUIStore(state => state.setDialogueWizardOpen);
  const setEditDialogueIndex = useUIStore(state => state.setDialogueWizardEditIndex);
  const { t } = useTranslation();

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      <Button
        variant="gaming-primary"
        size="default"
        onClick={() => {
          setEditDialogueIndex(dialogueIndex);
          setWizardOpen(true);
        }}
        className="w-full"
      >
        <Sparkles className="h-4 w-4" />
        {t('dialogueEditor.editWithAssistant')}
      </Button>

      <Button
        variant="gaming-success"
        size="default"
        onClick={onAddChoice}
        className="w-full"
      >
        <Plus className="h-4 w-4" />
        {t('dialogueEditor.addChoice')}
      </Button>

      {dialogue.choices && dialogue.choices.length > 0 ? (
        dialogue.choices.map((choice, choiceIdx) => (
          <ChoiceEditor
            key={choiceIdx}
            choice={choice}
            choiceIndex={choiceIdx}
            onUpdate={onUpdateChoice}
            onDelete={onDeleteChoice}
            scenes={scenes}
            currentSceneId={sceneId}
          />
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">{t('dialogueEditor.noChoices')}</p>
          <p className="text-xs mt-1">{t('dialogueEditor.noChoicesHint')}</p>
        </div>
      )}
    </div>
  );
}
