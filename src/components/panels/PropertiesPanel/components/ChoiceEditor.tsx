import * as React from 'react';
import type { DialogueChoice, SceneMetadata, Dialogue } from '@/types';
import type { DiceCheck, DiceCheckBranch } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Trash2, Info } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDialoguesStore } from '@/stores/dialoguesStore';
import { GAME_STATS } from '@/i18n';
import { EffectsEditor } from '@/components/dialogue-editor/DialogueWizard/components/ComplexChoiceBuilder/EffectsEditor';

export interface ChoiceEditorProps {
  choice: DialogueChoice;
  choiceIndex: number;
  onUpdate: (choiceIndex: number, updatedChoice: DialogueChoice) => void;
  onDelete: (choiceIndex: number) => void;
  scenes: SceneMetadata[];
  currentSceneId: string;
}

// ─── Sub-component: BranchEditor ──────────────────────────────────────────────

interface BranchEditorProps {
  branch: DiceCheckBranch;
  onChange: (updates: Partial<DiceCheckBranch>) => void;
  scenes: SceneMetadata[];
  currentSceneDialogues: Dialogue[];
  getDialoguePreview: (d: Dialogue, idx: number) => string;
}

function BranchEditor({
  branch,
  onChange,
  scenes,
  currentSceneDialogues,
  getDialoguePreview,
}: BranchEditorProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {/* Scène cible */}
      <Select
        value={branch.nextSceneId || undefined}
        onValueChange={(value) => onChange({ nextSceneId: value })}
      >
        <SelectTrigger className="w-full bg-card border-border h-7 text-xs">
          <SelectValue placeholder="🎬 Scène (optionnel)" />
        </SelectTrigger>
        <SelectContent>
          {scenes.map((scene) => (
            <SelectItem key={scene.id} value={scene.id}>
              🎬 {scene.title || `Scène ${scene.id}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Dialogue cible */}
      <Select
        value={branch.nextDialogueId || undefined}
        onValueChange={(value) => onChange({ nextDialogueId: value || undefined })}
      >
        <SelectTrigger className="w-full bg-card border-border h-7 text-xs">
          <SelectValue placeholder="💬 Dialogue (optionnel)" />
        </SelectTrigger>
        <SelectContent>
          {currentSceneDialogues.length === 0 ? (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">Aucun dialogue</div>
          ) : (
            currentSceneDialogues.map((d, idx) => (
              <SelectItem key={d.id} value={d.id}>
                💬 {getDialoguePreview(d, idx)}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {/* Effet sur une stat */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
        <Select
          value={branch.statEffect?.stat || GAME_STATS.PHYSIQUE}
          onValueChange={(stat) =>
            onChange({ statEffect: { stat, amount: branch.statEffect?.amount ?? 5 } })
          }
        >
          <SelectTrigger className="bg-card border-border h-7 text-xs" style={{ flex: 1 }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={GAME_STATS.PHYSIQUE}>💪 Physique</SelectItem>
            <SelectItem value={GAME_STATS.MENTALE}>🧠 Mentale</SelectItem>
          </SelectContent>
        </Select>
        <input
          type="number"
          value={branch.statEffect?.amount ?? 0}
          onChange={(e) =>
            onChange({
              statEffect: {
                stat: branch.statEffect?.stat ?? GAME_STATS.PHYSIQUE,
                amount: parseInt(e.target.value) || 0,
              },
            })
          }
          style={{
            width: '3.5rem',
            padding: 'var(--space-1) var(--space-2)',
            background: 'var(--color-bg-base)',
            border: '1px solid var(--color-border-base)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-primary)',
            textAlign: 'center',
          }}
          placeholder="±5"
          aria-label="Valeur de l'effet"
        />
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function ChoiceEditor({
  choice,
  choiceIndex,
  onUpdate,
  onDelete,
  scenes,
  currentSceneId,
}: ChoiceEditorProps) {
  const updateChoice = (updates: Partial<DialogueChoice>) => {
    onUpdate(choiceIndex, { ...choice, ...updates });
  };

  const currentSceneDialogues = useDialoguesStore((s) => s.getDialoguesByScene(currentSceneId));

  const getDialoguePreview = React.useCallback((dialogue: Dialogue, index: number) => {
    if (!dialogue.text || dialogue.text.trim() === '') return `Dialogue ${index + 1} (vide)`;
    return dialogue.text.length > 50 ? `${dialogue.text.substring(0, 50)}…` : dialogue.text;
  }, []);

  const diceEnabled = !!choice.diceCheck;

  const toggleDice = () => {
    if (diceEnabled) {
      updateChoice({ diceCheck: undefined });
    } else {
      updateChoice({
        diceCheck: {
          stat: GAME_STATS.PHYSIQUE,
          difficulty: 12,
          success: {},
          failure: {},
        },
      });
    }
  };

  const updateDiceCheck = (updates: Partial<DiceCheck>) => {
    const current = choice.diceCheck ?? { stat: GAME_STATS.PHYSIQUE, difficulty: 12 };
    updateChoice({ diceCheck: { ...current, ...updates } });
  };

  const updateBranch = (branch: 'success' | 'failure', updates: Partial<DiceCheckBranch>) => {
    const current = choice.diceCheck ?? { stat: GAME_STATS.PHYSIQUE, difficulty: 12 };
    updateChoice({
      diceCheck: {
        ...current,
        [branch]: { ...(current[branch] ?? {}), ...updates },
      },
    });
  };

  return (
    <div
      style={{
        padding: 'var(--space-3)',
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-base)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      {/* En-tête : Choix N + corbeille */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--accent-blue)',
          }}
        >
          Choix {choiceIndex + 1}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="danger-ghost"
              size="sm"
              onClick={() => onDelete(choiceIndex)}
              aria-label={`Supprimer le choix ${choiceIndex + 1}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" portal={false}>
            Supprimer ce choix
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Texte du choix */}
      <input
        type="text"
        value={choice.text || ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          updateChoice({ text: e.target.value })
        }
        style={{
          width: '100%',
          padding: 'var(--space-2) var(--space-3)',
          background: 'var(--color-bg-base)',
          border: '1px solid var(--color-border-base)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-primary)',
          outline: 'none',
          boxSizing: 'border-box',
        }}
        placeholder="Texte du choix…"
        aria-label={`Texte du choix ${choiceIndex + 1}`}
      />

      {/* Scène suivante */}
      <div>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
            marginBottom: 'var(--space-1)',
          }}
        >
          🎬 Scène suivante
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3" style={{ cursor: 'help', flexShrink: 0 }} />
            </TooltipTrigger>
            <TooltipContent side="right" portal={false}>
              Changer de lieu. Laisser vide pour rester dans cette scène.
            </TooltipContent>
          </Tooltip>
        </label>
        <Select
          value={choice.nextSceneId || undefined}
          onValueChange={(value) => updateChoice({ nextSceneId: value })}
        >
          <SelectTrigger className="w-full bg-card border-border h-8 text-xs">
            <SelectValue placeholder="— Rester dans cette scène —" />
          </SelectTrigger>
          <SelectContent>
            {scenes.map((scene) => (
              <SelectItem key={scene.id} value={scene.id}>
                🎬 {scene.title || `Scène ${scene.id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Dialogue suivant */}
      <div>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
            marginBottom: 'var(--space-1)',
          }}
        >
          💬 Dialogue suivant
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3" style={{ cursor: 'help', flexShrink: 0 }} />
            </TooltipTrigger>
            <TooltipContent side="right" portal={false}>
              Sauter à un dialogue spécifique dans cette scène. Laisser vide pour avancer
              normalement.
            </TooltipContent>
          </Tooltip>
        </label>
        <Select
          value={choice.nextDialogueId || undefined}
          onValueChange={(value) => updateChoice({ nextDialogueId: value || undefined })}
        >
          <SelectTrigger className="w-full bg-card border-border h-8 text-xs">
            <SelectValue placeholder="— Avancer naturellement —" />
          </SelectTrigger>
          <SelectContent>
            {currentSceneDialogues.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                ⚠ Aucun dialogue dans cette scène
              </div>
            ) : (
              currentSceneDialogues.map((dialogue, idx) => (
                <SelectItem key={dialogue.id} value={dialogue.id}>
                  💬 {getDialoguePreview(dialogue, idx)}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Toggle jet de dé */}
      <div
        style={{ paddingTop: 'var(--space-1)', borderTop: '1px solid var(--color-border-base)' }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggleDice}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-1) var(--space-3)',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${diceEnabled ? 'var(--accent-purple)' : 'var(--color-border-base)'}`,
                background: diceEnabled ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                color: diceEnabled ? 'var(--accent-purple)' : 'var(--color-text-muted)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}
              aria-pressed={diceEnabled}
            >
              🎲 Jet de dé{diceEnabled ? ' (actif)' : ''}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" portal={false}>
            {diceEnabled
              ? 'Désactiver le jet de dé'
              : 'Ajouter un jet de dé (Physique ou Mentale, difficulté 1-20)'}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Configuration du jet de dé */}
      {diceEnabled && choice.diceCheck && (
        <div
          style={{
            padding: 'var(--space-3)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(139, 92, 246, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          {/* Stat */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              Stat :
            </span>
            {[
              { value: GAME_STATS.PHYSIQUE, label: '💪 Physique' },
              { value: GAME_STATS.MENTALE, label: '🧠 Mentale' },
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateDiceCheck({ stat: value })}
                style={{
                  padding: 'var(--space-1) var(--space-2)',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${choice.diceCheck!.stat === value ? 'var(--accent-purple)' : 'var(--color-border-base)'}`,
                  background:
                    choice.diceCheck!.stat === value ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                  color:
                    choice.diceCheck!.stat === value
                      ? 'var(--accent-purple)'
                      : 'var(--color-text-muted)',
                  fontSize: 'var(--font-size-xs)',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Difficulté */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              Difficulté :
            </span>
            <input
              type="range"
              min="1"
              max="20"
              value={choice.diceCheck.difficulty || 12}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateDiceCheck({ difficulty: parseInt(e.target.value) || 12 })
              }
              style={{ flex: 1 }}
              aria-label="Difficulté du jet de dé"
            />
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--accent-purple)',
                minWidth: '2ch',
                textAlign: 'right',
              }}
            >
              {choice.diceCheck.difficulty || 12}
            </span>
          </div>

          {/* Branche Succès */}
          <div
            style={{
              padding: 'var(--space-2)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(16, 185, 129, 0.05)',
            }}
          >
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-success)',
                marginBottom: 'var(--space-2)',
              }}
            >
              ✅ Si ça réussit
            </div>
            <BranchEditor
              branch={choice.diceCheck.success ?? {}}
              onChange={(updates) => updateBranch('success', updates)}
              scenes={scenes}
              currentSceneDialogues={currentSceneDialogues}
              getDialoguePreview={getDialoguePreview}
            />
          </div>

          {/* Branche Échec */}
          <div
            style={{
              padding: 'var(--space-2)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.05)',
            }}
          >
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-danger)',
                marginBottom: 'var(--space-2)',
              }}
            >
              ❌ Si ça rate
            </div>
            <BranchEditor
              branch={choice.diceCheck.failure ?? {}}
              onChange={(updates) => updateBranch('failure', updates)}
              scenes={scenes}
              currentSceneDialogues={currentSceneDialogues}
              getDialoguePreview={getDialoguePreview}
            />
          </div>
        </div>
      )}

      {/* Effets — éditables */}
      <EffectsEditor
        effects={choice.effects ?? []}
        onChange={(effects) => updateChoice({ effects })}
      />
    </div>
  );
}
