import { useState, useMemo, useEffect } from 'react';
import { useStore } from 'zustand';
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
import { useRigStore } from '@/stores/rigStore';
import { resolveCharacterSprite } from '@/utils/characterSprite';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { getTutorial } from '@/config/tutorials';
import type { PoseTemplate } from '@/config/poseTemplates';

const TAB_ITEMS: { id: DistributionView; emoji: string; label: string }[] = [
  { id: 'bone-editor', emoji: '🦴', label: 'Squelette' },
  { id: 'animation-preview', emoji: '🎬', label: 'Animation' },
];

/** targetIds appartenant à l'onglet Animation — déclenchent un basculement auto (tutorial) */
const ANIMATION_TUTORIAL_TARGETS = new Set([
  'animation-tab',
  'add-clip-button',
  'keyframe-section',
  'play-button',
  'pose-capture-button',
]);
/** targetIds appartenant à l'onglet Squelette — déclenchent un basculement auto (tutorial) */
const BONE_TUTORIAL_TARGETS = new Set(['bone-list', 'tool-rotate', 'template-picker-button']);

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
  const [showRefSprite, setShowRefSprite] = useState(true);
  const [refScale, setRefScale] = useState(0.6);
  const [refOpacity, setRefOpacity] = useState(0.45);

  const boneEditor = useBoneEditor();
  const characters = useCharactersStore((s) => s.characters);

  // ── Pose edition state ───────────────────────────────────────────────────
  const [editingPoseId, setEditingPoseId] = useState<string | null>(null);
  const rig = useRigStore((s) => s.rigs.find((r) => r.characterId === selectedCharId));

  /** Charge les rotations d'une pose dans les os du squelette + bascule sur Squelette */
  const handleLoadPose = (poseId: string) => {
    if (!rig) return;
    const pose = rig.poses.find((p) => p.id === poseId);
    if (!pose) return;
    const state = useRigStore.getState();
    Object.entries(pose.boneStates).forEach(([boneId, bs]) => {
      state.updateBone(rig.id, boneId, { rotation: bs.rotation });
    });
    setEditingPoseId(poseId);
    setActiveView('bone-editor');
  };

  /** Met à jour la pose éditée avec l'état courant du squelette */
  const handleUpdatePose = () => {
    if (!rig || !editingPoseId) return;
    const boneStates = Object.fromEntries(rig.bones.map((b) => [b.id, { rotation: b.rotation }]));
    useRigStore.getState().updatePose(rig.id, editingPoseId, { boneStates });
    setEditingPoseId(null);
  };

  const handleCancelEdit = () => setEditingPoseId(null);

  // ── Pose hover preview (UX-3) ────────────────────────────────────────────
  const [previewPoseId, setPreviewPoseId] = useState<string | null>(null);
  const previewOverridesMap = useMemo(() => {
    if (!previewPoseId || !rig) return undefined;
    const pose = rig.poses.find((p) => p.id === previewPoseId);
    if (!pose) return undefined;
    const result: Record<string, { rotation: number; spriteUrl?: string }> = {};
    for (const [boneId, bs] of Object.entries(pose.boneStates)) {
      result[boneId] = { rotation: bs.rotation, spriteUrl: pose.spriteVariants?.[boneId] };
    }
    // Bones avec un variant mais sans rotation dans boneStates (ex: os bouche rotation fixe)
    for (const [boneId, url] of Object.entries(pose.spriteVariants ?? {})) {
      if (!result[boneId]) result[boneId] = { rotation: 0, spriteUrl: url };
    }
    return result;
  }, [previewPoseId, rig]);

  /** Guard UX-4 : si une pose est en cours d'édition, forcer le retour sur animation-preview */
  const handleSetActiveView = (view: DistributionView) => {
    if (editingPoseId !== null && view !== 'animation-preview') {
      setActiveView('animation-preview');
      return;
    }
    setActiveView(view);
  };

  /** Applique un template de pose : charge les rotations dans le squelette, capture la pose, bascule sur Squelette */
  const handleApplyPoseTemplate = (template: PoseTemplate) => {
    if (!rig) return;
    const state = useRigStore.getState();
    // Construire boneStates : rotation template si le nom correspond, sinon rotation actuelle
    const boneStates: Record<string, { rotation: number }> = {};
    for (const bone of rig.bones) {
      const templateRot = template.boneRotations[bone.name];
      const rotation = templateRot !== undefined ? templateRot : bone.rotation;
      boneStates[bone.id] = { rotation };
    }
    // Appliquer au squelette
    for (const [boneId, { rotation }] of Object.entries(boneStates)) {
      state.updateBone(rig.id, boneId, { rotation });
    }
    // Capturer comme pose nommée
    state.addPose(rig.id, { name: template.name, boneStates });
    // Basculer sur l'onglet Squelette pour voir le résultat
    setActiveView('bone-editor');
  };

  // Undo/Redo rigStore — même pattern que useUndoRedo.ts mais ciblé sur rigStore.temporal
  const rigPastStates = useStore(useRigStore.temporal, (s) => s?.pastStates ?? []);
  const rigFutureStates = useStore(useRigStore.temporal, (s) => s?.futureStates ?? []);
  const canRigUndo = rigPastStates.length > 0;
  const canRigRedo = rigFutureStates.length > 0;
  const handleRigUndo = () => {
    const state = useRigStore.temporal.getState?.();
    if ((state?.pastStates?.length ?? 0) > 0) state?.undo?.();
  };
  const handleRigRedo = () => {
    const state = useRigStore.temporal.getState?.();
    if ((state?.futureStates?.length ?? 0) > 0) state?.redo?.();
  };

  // Raccourcis clavier outils — standards Spine/DragonBones (Fix D, WebSearch 2026-04-10)
  // Q=select · E=rotate · B=add-bone · P=add-part · I=IK · Space=play/pause
  useEffect(() => {
    const handleToolKey = (e: KeyboardEvent) => {
      // Ignorer si focus dans un input/textarea (renommage inline)
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      switch (e.key) {
        case 'q':
        case 'Q':
          boneEditor.setActiveTool('select');
          break;
        case 'e':
        case 'E':
          boneEditor.setActiveTool('rotate');
          break;
        case 'b':
        case 'B':
          boneEditor.setActiveTool('add-bone');
          break;
        case 'p':
        case 'P':
          boneEditor.setActiveTool('add-part');
          break;
        case 'i':
        case 'I':
          boneEditor.setActiveTool('ik');
          break;
        case ' ':
          if (activeView === 'animation-preview') {
            e.preventDefault();
            setIsPlaying((v) => !v);
          }
          break;
      }
    };
    window.addEventListener('keydown', handleToolKey);
    return () => window.removeEventListener('keydown', handleToolKey);
  }, [boneEditor, activeView, setIsPlaying]);

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

  // Auto-basculement d'onglet selon l'étape du tutoriel (Bret Victor §7.2)
  useEffect(() => {
    if (!currentStep) return;
    if (
      ANIMATION_TUTORIAL_TARGETS.has(currentStep.targetId) &&
      activeView !== 'animation-preview'
    ) {
      setActiveView('animation-preview');
    } else if (BONE_TUTORIAL_TARGETS.has(currentStep.targetId) && activeView !== 'bone-editor') {
      setActiveView('bone-editor');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep?.targetId]);

  // ── Barre d'onglets ─────────────────────────────────────────────────────
  // Couleur de mode : violet (Setup squelette) ↔ orange (Animation) — DragonBones pattern
  const modeAccent =
    activeView === 'bone-editor'
      ? 'rgba(139,92,246,0.18)' // violet — mode Setup
      : 'rgba(249,115,22,0.15)'; // orange — mode Animate
  const modeAccentBorder =
    activeView === 'bone-editor' ? 'rgba(139,92,246,0.5)' : 'rgba(249,115,22,0.5)';

  const TabBar = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '6px 12px',
        borderBottom: `2px solid ${modeAccentBorder}`,
        background: modeAccent,
        flexShrink: 0,
        transition: 'background 0.25s ease, border-color 0.25s ease',
      }}
    >
      {TAB_ITEMS.map((tab) => {
        const isActive = activeView === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleSetActiveView(tab.id)}
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
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>← Sélectionne un personnage</p>
    </div>
  );

  // ── Bone-editor / Animation — layout stable 3 colonnes ──────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {TabBar}

      <PanelGroup orientation="horizontal" style={{ flex: 1, overflow: 'hidden' }}>
        {/* Roster toujours visible */}
        <Panel
          defaultSize="18%"
          minSize="15%"
          maxSize="28%"
          style={ROSTER_PANEL_STYLE}
          data-tutorial-id="character-picker"
        >
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
              overridesMap={previewOverridesMap}
              poses={rig?.poses}
              characterName={selectedChar?.name}
              characterAvatarUrl={refImageUrl}
              onUndo={handleRigUndo}
              onRedo={handleRigRedo}
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
              canUndo={canRigUndo}
              onUndo={handleRigUndo}
              canRedo={canRigRedo}
              onRedo={handleRigRedo}
              editingPoseId={editingPoseId}
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
              editingPoseId={editingPoseId}
              onLoadPose={handleLoadPose}
              onUpdatePose={handleUpdatePose}
              onCancelEdit={handleCancelEdit}
              onApplyPoseTemplate={handleApplyPoseTemplate}
              onPoseHover={setPreviewPoseId}
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
