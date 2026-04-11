import { useSceneDialogues } from '@/stores/selectors';
import type { MinigameConfig } from '@/types';
import { DEFAULT_MINIGAME_CONFIG } from '@/config/minigames';
import { TypePicker } from './components/TypePicker';
import { ParamsCard } from './components/ParamsCard';
import { FalcSection } from './components/FalcSection';
import { QteSection } from './components/QteSection';
import { BrailleSection } from './components/BrailleSection';
import { BranchesPanel } from './components/BranchesPanel';

interface MinigameChoiceBuilderProps {
  config: MinigameConfig | undefined;
  onUpdate: (config: MinigameConfig) => void;
  currentSceneId: string;
}

export function MinigameChoiceBuilder({
  config,
  onUpdate,
  currentSceneId,
}: MinigameChoiceBuilderProps) {
  const cfg = config ?? DEFAULT_MINIGAME_CONFIG;
  const dialogues = useSceneDialogues(currentSceneId);
  const update = (partial: Partial<MinigameConfig>) => onUpdate({ ...cfg, ...partial });

  return (
    <div className="space-y-4 p-1">
      <TypePicker cfg={cfg} update={update} />
      <ParamsCard cfg={cfg} update={update} />
      {cfg.type === 'falc' && <FalcSection cfg={cfg} update={update} />}
      {cfg.type === 'qte' && <QteSection cfg={cfg} update={update} />}
      {cfg.type === 'braille' && <BrailleSection cfg={cfg} update={update} />}
      <BranchesPanel cfg={cfg} update={update} dialogues={dialogues} />
    </div>
  );
}

export default MinigameChoiceBuilder;
