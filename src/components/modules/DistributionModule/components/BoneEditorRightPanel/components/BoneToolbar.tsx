import type { BoneTool } from '@/types/bone';
import { SliderRow } from '@/components/ui/SliderRow';
import { uiSounds } from '@/utils/uiSounds';

// Débutant : 2 outils seulement (Nintendo UX — découverte progressive §1.3)
const BEGINNER_TOOLS: { id: BoneTool; label: string; emoji: string; title: string }[] = [
  { id: 'select', emoji: '↖', label: 'Choisir un os', title: 'Cliquer pour sélectionner un os' },
  { id: 'rotate', emoji: '↻', label: 'Faire tourner', title: 'Maintenir pour faire pivoter un os' },
];

const EXPERT_TOOLS: { id: BoneTool; label: string; emoji: string; title: string }[] = [
  { id: 'select', emoji: '↖', label: 'Sélect.', title: 'Sélectionner un os' },
  { id: 'rotate', emoji: '↻', label: 'Pivoter', title: 'Faire pivoter un os' },
  { id: 'add-bone', emoji: '🦴', label: '+ Os', title: 'Ajouter un os (clic sur canvas)' },
  { id: 'add-part', emoji: '🖼', label: '+ Part', title: 'Ajouter une partie sprite' },
  {
    id: 'ik',
    emoji: '🎯',
    label: 'IK',
    title: 'Tirer le bout du bras — les os suivent tout seuls !',
  },
];

export interface BoneToolbarProps {
  activeTool: BoneTool;
  isBeginnerMode: boolean;
  showRefImage: boolean;
  onToggleRefImage?: () => void;
  refScale: number;
  refOpacity: number;
  onRefScaleChange?: (v: number) => void;
  onRefOpacityChange?: (v: number) => void;
  canUndo: boolean;
  onUndo?: () => void;
  canRedo: boolean;
  onRedo?: () => void;
  onToolChange: (tool: BoneTool) => void;
}

export function BoneToolbar({
  activeTool,
  isBeginnerMode,
  showRefImage,
  onToggleRefImage,
  refScale,
  refOpacity,
  onRefScaleChange,
  onRefOpacityChange,
  canUndo,
  onUndo,
  canRedo,
  onRedo,
  onToolChange,
}: BoneToolbarProps) {
  const toolButtons = isBeginnerMode ? BEGINNER_TOOLS : EXPERT_TOOLS;

  return (
    <div
      data-tutorial-id="bone-tools"
      style={{ padding: '10px 10px 8px', borderBottom: '1px solid var(--color-border-base)' }}
    >
      <p style={sectionLabel}>Outils</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {/* Bouton sprite de référence — Spine/DragonBones style */}
        <button
          type="button"
          onClick={onToggleRefImage}
          title="Afficher/masquer le sprite du personnage derrière le squelette"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 7px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: showRefImage ? 700 : 400,
            border: showRefImage
              ? '1.5px solid var(--color-primary)'
              : '1.5px solid var(--color-border-base)',
            background: showRefImage ? 'var(--color-primary-subtle)' : 'transparent',
            color: showRefImage ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            transition: 'background 0.1s, border-color 0.1s',
          }}
        >
          <span>🖼</span>
          <span>Réf.</span>
        </button>
        {/* Sliders Réf. — visibles uniquement quand le sprite de référence est actif */}
        {showRefImage && (
          <div
            style={{
              gridColumn: '1 / -1',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              marginTop: 2,
            }}
          >
            <SliderRow
              label="Opacité réf."
              value={Math.round(refOpacity * 100)}
              min={10}
              max={80}
              step={5}
              unit="%"
              onChange={(v) => onRefOpacityChange?.(v / 100)}
            />
            <SliderRow
              label="Taille réf."
              value={Math.round(refScale * 100)}
              min={30}
              max={150}
              step={10}
              unit="%"
              onChange={(v) => onRefScaleChange?.(v / 100)}
            />
          </div>
        )}
        {toolButtons.map((t) => (
          <button
            key={t.id}
            type="button"
            title={t.title}
            data-tutorial-id={t.id === 'rotate' ? 'tool-rotate' : undefined}
            onClick={() => onToolChange(t.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 7px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: activeTool === t.id ? 700 : 400,
              border:
                activeTool === t.id
                  ? '1.5px solid var(--color-primary)'
                  : '1.5px solid var(--color-border-base)',
              background: activeTool === t.id ? 'var(--color-primary-subtle)' : 'transparent',
              color: activeTool === t.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              transition: 'background 0.1s, border-color 0.1s',
            }}
          >
            <span>{t.emoji}</span>
            <span>{t.label}</span>
          </button>
        ))}

        {/* Boutons Undo/Redo — côte à côte (Meier §10.3 : affordance premier ordre) */}
        {onUndo && (
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 4 }}>
            <button
              type="button"
              onClick={
                canUndo
                  ? () => {
                      onUndo?.();
                      uiSounds.advance();
                    }
                  : undefined
              }
              disabled={!canUndo}
              title={canUndo ? 'Annuler (Ctrl+Z)' : 'Rien à annuler'}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '5px 7px',
                borderRadius: 6,
                cursor: canUndo ? 'pointer' : 'not-allowed',
                fontSize: 11,
                border: '1.5px solid var(--color-border-hover)',
                background: 'transparent',
                color: 'var(--color-text-muted)',
                opacity: canUndo ? 1 : 0.38,
                transition: 'opacity 0.15s',
              }}
            >
              <span>↩</span>
              <span>Annuler</span>
            </button>
            <button
              type="button"
              onClick={
                canRedo
                  ? () => {
                      onRedo?.();
                      uiSounds.advance();
                    }
                  : undefined
              }
              disabled={!canRedo}
              title={canRedo ? 'Rétablir (Ctrl+Shift+Z)' : 'Rien à rétablir'}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '5px 7px',
                borderRadius: 6,
                cursor: canRedo ? 'pointer' : 'not-allowed',
                fontSize: 11,
                border: '1.5px solid var(--color-border-hover)',
                background: 'transparent',
                color: 'var(--color-text-muted)',
                opacity: canRedo ? 1 : 0.38,
                transition: 'opacity 0.15s',
              }}
            >
              <span>↪</span>
              <span>Rétablir</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles locaux ─────────────────────────────────────────────────────────────

const sectionLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  margin: 0,
};
