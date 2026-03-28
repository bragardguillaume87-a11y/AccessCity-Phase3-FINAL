import { useState } from 'react';
import { motion } from 'framer-motion';
import { Panel, Group as PanelGroup, Separator } from 'react-resizable-panels';
import type { DistributionView } from '@/types/bone';
import { useBoneEditor } from './hooks/useBoneEditor';
import { CharacterRoster } from './components/CharacterRoster';
import { CastingTableView } from './components/CastingTableView';
import { BoneCanvasView } from './components/BoneCanvasView';
import { AnimationPreviewView } from './components/AnimationPreviewView';
import { BoneEditorRightPanel } from './components/BoneEditorRightPanel';
import { AnimationRightPanel } from './components/AnimationRightPanel';
import { useCharactersStore } from '@/stores';
import { resolveCharacterSprite } from '@/utils/characterSprite';

const TAB_ITEMS: { id: DistributionView; emoji: string; label: string }[] = [
  { id: 'casting-table', emoji: '🎭', label: 'Casting' },
  { id: 'bone-editor', emoji: '🦴', label: 'Squelette' },
  { id: 'animation-preview', emoji: '🎬', label: 'Animation' },
];

const SEP_STYLE: React.CSSProperties = {
  width: 4,
  cursor: 'col-resize',
  background: 'var(--color-border-base)',
  flexShrink: 0,
};

const ROSTER_PANEL_STYLE: React.CSSProperties = {
  overflowY: 'auto',
  background: 'var(--color-bg-elevated)',
  borderRight: '1px solid var(--color-border-base)',
};

const RIGHT_PANEL_STYLE: React.CSSProperties = {
  overflowY: 'auto',
  background: 'var(--color-bg-elevated)',
  borderLeft: '1px solid var(--color-border-base)',
};

/**
 * DistributionModule — Shell 3 colonnes (bone-editor / animation)
 *                   ou pleine largeur (casting-table).
 *
 * Correction UX : le PanelGroup ne change plus de structure selon la vue
 * pour éviter l'écrasement du panneau roster lors des transitions.
 * Chaque vue non-casting a son propre layout stable :
 *   [CharacterRoster ~18%] | [Vue centrale flex] | [Panel droit ~22%]
 */
export function DistributionModule() {
  const [activeView, setActiveView] = useState<DistributionView>('casting-table');
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedPoseId, setSelectedPoseId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const boneEditor = useBoneEditor();
  const characters = useCharactersStore((s) => s.characters);

  // ── Barre d'onglets ─────────────────────────────────────────────────────
  const TabBar = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '6px 12px',
        borderBottom: '1px solid var(--color-border-base)',
        background: 'var(--color-bg-elevated)',
        flexShrink: 0,
      }}
    >
      {TAB_ITEMS.map((tab) => {
        const isActive = activeView === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveView(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: isActive ? 700 : 500,
              border: isActive ? '1.5px solid var(--color-primary)' : '1.5px solid transparent',
              background: isActive ? 'var(--color-primary-subtle)' : 'transparent',
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
              transition: 'background 0.1s, color 0.1s, border-color 0.1s',
            }}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );

  // ── Casting — pleine largeur ─────────────────────────────────────────────
  if (activeView === 'casting-table') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {TabBar}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <CastingTableView />
        </div>
      </div>
    );
  }

  // ── Sélecteur de personnage inline (état vide) ───────────────────────────
  const InlineCharacterPicker = (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: 32,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 20, marginBottom: 6 }}>
          {activeView === 'bone-editor' ? '🦴' : '🎬'}
        </p>
        <p
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 4,
          }}
        >
          {activeView === 'bone-editor'
            ? 'Quel personnage veux-tu rigger ?'
            : 'Quel personnage veux-tu animer ?'}
        </p>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          {activeView === 'bone-editor'
            ? "Sélectionne un personnage pour ouvrir l'éditeur de squelette."
            : 'Sélectionne un personnage pour prévisualiser ses animations.'}
        </p>
      </div>

      {characters.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          Aucun personnage — crée-en un dans l'onglet Personnages.
        </p>
      ) : (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            justifyContent: 'center',
            maxWidth: 520,
          }}
        >
          {characters.map((char, idx) => {
            const portrait = resolveCharacterSprite(char);
            return (
              <motion.button
                key={char.id}
                type="button"
                onClick={() => setSelectedCharId(char.id)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.18, ease: 'easeOut' }}
                whileHover={{ y: -3, scale: 1.03 }}
                whileTap={{ scale: 0.95, y: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  border: '1.5px solid var(--color-border-base)',
                  background: 'var(--color-bg-elevated)',
                  color: 'var(--color-text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                  minWidth: 150,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 6,
                    flexShrink: 0,
                    background: 'var(--color-bg-hover)',
                    overflow: 'hidden',
                    border: '1px solid var(--color-border-base)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {portrait ? (
                    <img
                      src={portrait}
                      alt={char.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ fontSize: 18 }}>🧑</span>
                  )}
                </div>
                <span
                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {char.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── Bone-editor / Animation — layout stable 3 colonnes ──────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {TabBar}

      <PanelGroup orientation="horizontal" style={{ flex: 1, overflow: 'hidden' }}>
        {/* Roster toujours visible — valeurs en string "N%" car numerics = pixels en v4 */}
        <Panel defaultSize="18%" minSize="15%" maxSize="28%" style={ROSTER_PANEL_STYLE}>
          <CharacterRoster
            selectedCharacterId={selectedCharId}
            onSelect={(id) => {
              setSelectedCharId(id);
              boneEditor.setSelectedBoneId(null);
            }}
          />
        </Panel>

        <Separator style={SEP_STYLE} />

        {/* Vue centrale — defaultSize explicite pour éviter que le panel prenne 100% */}
        <Panel defaultSize="60%" style={{ display: 'flex', overflow: 'hidden' }}>
          {activeView === 'bone-editor' && !selectedCharId && InlineCharacterPicker}

          {activeView === 'bone-editor' && selectedCharId && (
            <BoneCanvasView
              characterId={selectedCharId}
              activeTool={boneEditor.activeTool}
              selectedBoneId={boneEditor.selectedBoneId}
              zoom={boneEditor.zoom}
              stagePos={boneEditor.stagePos}
              onSelectBone={boneEditor.setSelectedBoneId}
              onZoomChange={boneEditor.setZoom}
              onStagePosChange={boneEditor.setStagePos}
            />
          )}

          {activeView === 'animation-preview' && !selectedCharId && InlineCharacterPicker}

          {activeView === 'animation-preview' && selectedCharId && (
            <AnimationPreviewView
              characterId={selectedCharId}
              selectedClipId={selectedClipId}
              isPlaying={isPlaying}
            />
          )}
        </Panel>

        <Separator style={SEP_STYLE} />

        {/* Panneau droit — valeurs en string "N%" (numerics = pixels en v4) */}
        <Panel defaultSize="22%" minSize="18%" maxSize="32%" style={RIGHT_PANEL_STYLE}>
          {activeView === 'bone-editor' && (
            <BoneEditorRightPanel
              characterId={selectedCharId ?? ''}
              activeTool={boneEditor.activeTool}
              selectedBoneId={boneEditor.selectedBoneId}
              onSelectBone={boneEditor.setSelectedBoneId}
              onToolChange={boneEditor.setActiveTool}
            />
          )}
          {activeView === 'animation-preview' && (
            <AnimationRightPanel
              characterId={selectedCharId ?? ''}
              selectedClipId={selectedClipId}
              selectedPoseId={selectedPoseId}
              isPlaying={isPlaying}
              onSelectClip={setSelectedClipId}
              onSelectPose={setSelectedPoseId}
              onPlayToggle={() => setIsPlaying((p) => !p)}
            />
          )}
        </Panel>
      </PanelGroup>
    </div>
  );
}

export default DistributionModule;
