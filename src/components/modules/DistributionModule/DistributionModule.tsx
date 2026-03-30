import { useState, useEffect } from 'react';
import { Panel, Group as PanelGroup, Separator } from 'react-resizable-panels';
import type { DistributionView } from '@/types/bone';
import { useBoneEditor } from './hooks/useBoneEditor';
import { CharacterRoster } from './components/CharacterRoster';
import { BoneCanvasView } from './components/BoneCanvasView';
import { AnimationPreviewView } from './components/AnimationPreviewView';
import { BoneEditorRightPanel } from './components/BoneEditorRightPanel';
import { AnimationRightPanel } from './components/AnimationRightPanel';
import { SpotlightTutorial } from './components/SpotlightTutorial';
import { TutorialPathChooser } from './components/TutorialPathChooser';
import { TutorialHelpButton } from './components/TutorialHelpButton';
import { IosToggle } from '@/components/ui/IosToggle';
import { useCharactersStore } from '@/stores';
import { resolveCharacterSprite } from '@/utils/characterSprite';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { getTutorial } from '@/config/tutorials';

const TAB_ITEMS: { id: DistributionView; emoji: string; label: string }[] = [
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
 * DistributionModule — Shell 3 colonnes (Squelette / Animation).
 * Mode Débutant / Expert : IosToggle en haut à droite de la barre d'onglets.
 * Propagé en prop à BoneEditorRightPanel et AnimationRightPanel.
 */
export function DistributionModule() {
  const [activeView, setActiveView] = useState<DistributionView>('bone-editor');
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedPoseId, setSelectedPoseId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBeginnerMode, setIsBeginnerMode] = useState(true); // débutant par défaut (§6a)
  const [showRefSprite, setShowRefSprite] = useState(false);
  const [refScale, setRefScale] = useState(0.6);
  const [refOpacity, setRefOpacity] = useState(0.45);

  const boneEditor = useBoneEditor();
  const characters = useCharactersStore((s) => s.characters);

  // URL du sprite du personnage sélectionné — pour l'overlay de référence
  const selectedChar = characters.find((c) => c.id === selectedCharId);
  const refImageUrl = selectedChar
    ? (resolveCharacterSprite(selectedChar) ?? undefined)
    : undefined;

  // ── Onboarding ───────────────────────────────────────────────────────────
  const seenTutorials = useOnboardingStore((s) => s.seenTutorials);
  const activeTutorialId = useOnboardingStore((s) => s.activeTutorialId);
  const activeTutorialStep = useOnboardingStore((s) => s.activeTutorialStep);
  const nextStep = useOnboardingStore((s) => s.nextStep);
  const prevStep = useOnboardingStore((s) => s.prevStep);
  const skipTutorial = useOnboardingStore((s) => s.skipTutorial);

  const [pathChooserOpen, setPathChooserOpen] = useState(false);

  // Auto-ouvrir au premier accès à l'onglet Squelette (tutoriel jamais vu)
  useEffect(() => {
    if (
      activeView === 'bone-editor' &&
      !seenTutorials.includes('dist-squelette') &&
      !activeTutorialId
    ) {
      setPathChooserOpen(true);
    }
  }, [activeView, seenTutorials, activeTutorialId]);

  const tutorialDef = activeTutorialId ? getTutorial(activeTutorialId) : null;
  const currentStep = tutorialDef?.steps[activeTutorialStep] ?? null;

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
            data-tutorial-id={tab.id === 'animation-preview' ? 'animation-tab' : undefined}
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

      {/* Toggle Débutant / Expert + bouton ? */}
      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <TutorialHelpButton onClick={() => setPathChooserOpen(true)} />
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
          {isBeginnerMode ? '🎒 Débutant' : '👨‍💻 Expert'}
        </span>
        <IosToggle
          enabled={!isBeginnerMode}
          onToggle={() => setIsBeginnerMode((b) => !b)}
          label="mode Expert"
        />
      </div>
    </div>
  );

  // ── Empty state — aucun personnage sélectionné ──────────────────────────
  const EmptyState = (
    <div
      data-tutorial-id="character-picker"
      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>← Sélectionne un personnage</p>
    </div>
  );

  // ── Bone-editor / Animation — layout stable 3 colonnes ──────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {TabBar}

      <PanelGroup orientation="horizontal" style={{ flex: 1, overflow: 'hidden' }}>
        {/* Roster toujours visible */}
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

        {/* Vue centrale */}
        <Panel defaultSize="60%" style={{ display: 'flex', overflow: 'hidden' }}>
          {activeView === 'bone-editor' && !selectedCharId && EmptyState}

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
              referenceImageUrl={refImageUrl}
              showRefImage={showRefSprite}
              refScale={refScale}
              refOpacity={refOpacity}
            />
          )}

          {activeView === 'animation-preview' && !selectedCharId && EmptyState}

          {activeView === 'animation-preview' && selectedCharId && (
            <AnimationPreviewView
              characterId={selectedCharId}
              selectedClipId={selectedClipId}
              isPlaying={isPlaying}
              onPlayToggle={() => setIsPlaying((p) => !p)}
            />
          )}
        </Panel>

        <Separator style={SEP_STYLE} />

        {/* Panneau droit */}
        <Panel defaultSize="22%" minSize="18%" maxSize="32%" style={RIGHT_PANEL_STYLE}>
          {activeView === 'bone-editor' && (
            <BoneEditorRightPanel
              characterId={selectedCharId ?? ''}
              activeTool={boneEditor.activeTool}
              selectedBoneId={boneEditor.selectedBoneId}
              onSelectBone={boneEditor.setSelectedBoneId}
              onToolChange={boneEditor.setActiveTool}
              isBeginnerMode={isBeginnerMode}
              showRefImage={showRefSprite}
              onToggleRefImage={() => setShowRefSprite((v) => !v)}
              refScale={refScale}
              refOpacity={refOpacity}
              onRefScaleChange={setRefScale}
              onRefOpacityChange={setRefOpacity}
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
              isBeginnerMode={isBeginnerMode}
            />
          )}
        </Panel>
      </PanelGroup>

      {/* ── Tutoriel : overlay spotlight ── */}
      {currentStep && tutorialDef && (
        <SpotlightTutorial
          step={currentStep}
          stepIndex={activeTutorialStep}
          totalSteps={tutorialDef.steps.length}
          onNext={() => nextStep(tutorialDef.steps.length)}
          onPrev={prevStep}
          onSkip={skipTutorial}
        />
      )}

      {/* ── Tutoriel : choix de parcours ── */}
      <TutorialPathChooser open={pathChooserOpen} onClose={() => setPathChooserOpen(false)} />
    </div>
  );
}

export default DistributionModule;
