import { useCallback, useState } from 'react';
import { useRigStore } from '@/stores/rigStore';
import type { Bone, BoneTool, IKChain } from '@/types/bone';
import { BONE_DEFAULT_COLORS, DEFAULT_BONE_LENGTH } from '@/types/bone';
import { SliderRow } from '@/components/ui/SliderRow';
import { TemplatePicker } from './TemplatePicker';
import { findMirrorBone } from '../utils/boneUtils';

interface BoneEditorRightPanelProps {
  characterId: string;
  activeTool: BoneTool;
  selectedBoneId: string | null;
  onSelectBone: (id: string | null) => void;
  onToolChange: (tool: BoneTool) => void;
  isBeginnerMode?: boolean;
  showRefImage?: boolean;
  onToggleRefImage?: () => void;
  refScale?: number;
  refOpacity?: number;
  onRefScaleChange?: (v: number) => void;
  onRefOpacityChange?: (v: number) => void;
}

// ⑤ Emoji par type d'os — détection depuis le nom (Miyamoto §1.2 : symboles universels)
function getBoneEmoji(name: string): string {
  const n = name.toLowerCase();
  if (/torse|corps|thorax|buste/.test(n)) return '🫁';
  if (/cou/.test(n)) return '🔗';
  if (/tête|head/.test(n)) return '🪖';
  if (/av[.\s]*bras|avant.bras|forearm|pince|griffe/.test(n)) return '🤚';
  if (/épaule|shoulder/.test(n)) return '💪';
  if (/bras|arm/.test(n)) return '💪';
  if (/cuisse|thigh/.test(n)) return '🦵';
  if (/jambe|leg|pied|foot/.test(n)) return '👟';
  if (/patte|paw/.test(n)) return '🐾';
  return '🦴';
}

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
  { id: 'ik', emoji: '🎯', label: 'IK', title: 'Inverse Kinematics — déplacer end effector' },
];

/**
 * BoneEditorRightPanel — Outils, hiérarchie des os, propriétés et chaînes IK.
 * Mode Débutant : outils réduits, sliders, confirmation de suppression, sections masquées.
 * Mode Expert : tout visible + IK chains.
 */
export function BoneEditorRightPanel({
  characterId,
  activeTool,
  selectedBoneId,
  onSelectBone,
  onToolChange,
  isBeginnerMode = false,
  showRefImage = false,
  onToggleRefImage,
  refScale = 0.6,
  refOpacity = 0.45,
  onRefScaleChange,
  onRefOpacityChange,
}: BoneEditorRightPanelProps) {
  const rig = useRigStore((s) => s.rigs.find((r) => r.characterId === characterId));
  const deleteBone = useRigStore((s) => s.deleteBone);
  const addRig = useRigStore((s) => s.addRig);
  const addBone = useRigStore((s) => s.addBone);
  const addPart = useRigStore((s) => s.addPart);
  const updatePart = useRigStore((s) => s.updatePart);
  const deletePart = useRigStore((s) => s.deletePart);
  const addIKChain = useRigStore((s) => s.addIKChain);
  const removeIKChain = useRigStore((s) => s.removeIKChain);
  const addRigFromTemplate = useRigStore((s) => s.addRigFromTemplate);

  const bones = rig?.bones ?? [];
  const parts = rig?.parts ?? [];
  const ikChains = rig?.ikChains ?? [];

  // ── Confirmation suppression (mode débutant) ──────────────────────────────
  const [pendingDelete, setPendingDelete] = useState(false);

  // ── Template picker ───────────────────────────────────────────────────────
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  // ── Prompt miroir — proposition d'assigner l'asset retourné à l'os symétrique ──
  const [mirrorPrompt, setMirrorPrompt] = useState<{
    mirrorBone: Bone;
    assetUrl: string;
    width: number;
    height: number;
  } | null>(null);

  const handleDeleteBone = () => {
    if (!rig || !selectedBoneId) return;
    if (isBeginnerMode && !pendingDelete) {
      setPendingDelete(true);
      return;
    }
    deleteBone(rig.id, selectedBoneId);
    onSelectBone(null);
    setPendingDelete(false);
  };

  // ── Création rig/os ───────────────────────────────────────────────────────
  const handleCreateRig = () => {
    addRig(characterId);
  };

  const handleAddRootBone = () => {
    if (!rig) {
      addRig(characterId);
      return;
    }
    const colorIdx = bones.length % BONE_DEFAULT_COLORS.length;
    addBone(rig.id, {
      name: `Os ${bones.length + 1}`,
      parentId: null,
      localX: 300,
      localY: 200,
      length: DEFAULT_BONE_LENGTH,
      rotation: 0,
      color: BONE_DEFAULT_COLORS[colorIdx],
    });
  };

  // ── Édition propriétés os (getState() dans handler — CLAUDE.md §3) ────────
  const selectedBone = bones.find((b) => b.id === selectedBoneId);

  const handleBoneName = useCallback(
    (name: string) => {
      if (!rig || !selectedBoneId) return;
      useRigStore.getState().updateBone(rig.id, selectedBoneId, { name });
    },
    [rig, selectedBoneId]
  );

  const handleBoneRotation = useCallback(
    (value: number | string) => {
      if (!rig || !selectedBoneId) return;
      const rotation = typeof value === 'number' ? value : parseFloat(value as string);
      if (isNaN(rotation)) return;
      useRigStore.getState().updateBone(rig.id, selectedBoneId, { rotation });
    },
    [rig, selectedBoneId]
  );

  const handleBoneLength = useCallback(
    (value: number | string) => {
      if (!rig || !selectedBoneId) return;
      const length = typeof value === 'number' ? value : parseInt(value as string, 10);
      if (isNaN(length) || length < 4) return;
      useRigStore.getState().updateBone(rig.id, selectedBoneId, { length });
    },
    [rig, selectedBoneId]
  );

  // ── IK chain creator ──────────────────────────────────────────────────────
  const [ikForm, setIkForm] = useState<{ name: string; rootId: string; endId: string } | null>(
    null
  );

  const handleAddIkChain = () => {
    if (!rig || !ikForm || !ikForm.rootId || !ikForm.endId) return;
    if (ikForm.rootId === ikForm.endId) return;
    const chain: IKChain = {
      id: `ik-${Date.now()}`,
      name: ikForm.name || `Chaîne ${ikChains.length + 1}`,
      rootBoneId: ikForm.rootId,
      endBoneId: ikForm.endId,
    };
    addIKChain(rig.id, chain);
    setIkForm(null);
  };

  const toolButtons = isBeginnerMode ? BEGINNER_TOOLS : EXPERT_TOOLS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>
      {/* ── Outils ── */}
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
        </div>
      </div>

      {/* ── Hiérarchie des os ── */}
      <div
        data-tutorial-id="bone-list"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 10px 8px',
          borderBottom: '1px solid var(--color-border-base)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <p style={sectionLabel}>Os ({bones.length})</p>
          <div style={{ display: 'flex', gap: 4 }}>
            {/* Bouton template — toujours présent (cible tutoriel étape 2) */}
            <button
              type="button"
              data-tutorial-id="template-picker-button"
              onClick={() => setTemplatePickerOpen(true)}
              title="Utiliser un modèle de squelette"
              style={{
                ...smallBtnStyle,
                border: '1.5px solid var(--color-primary)',
                color: 'var(--color-primary)',
                background: 'var(--color-primary-subtle)',
              }}
            >
              🧍 Modèle
            </button>
            {bones.length > 0 && (
              <button
                type="button"
                onClick={() => addRigFromTemplate(characterId, 'personnage-simple')}
                title="Réinitialiser les os depuis le modèle Personnage simple (poses et clips conservés)"
                style={smallBtnStyle}
              >
                🔄
              </button>
            )}
            <button
              type="button"
              onClick={handleAddRootBone}
              title="Ajouter os racine"
              style={smallBtnStyle}
            >
              🦴 +
            </button>
            {selectedBoneId && !pendingDelete && (
              <button
                type="button"
                onClick={handleDeleteBone}
                title={isBeginnerMode ? 'Supprimer (confirmation requise)' : 'Supprimer cet os'}
                style={{ ...smallBtnStyle, color: 'var(--color-danger)' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Confirmation suppression (mode débutant §6b) */}
        {pendingDelete && isBeginnerMode && (
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 6,
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid var(--color-danger)',
              marginBottom: 8,
            }}
          >
            <p style={{ fontSize: 11, color: 'var(--color-danger)', marginBottom: 6 }}>
              ⚠️ Supprimer cet os et ses enfants ?
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={handleDeleteBone}
                style={{
                  ...smallBtnStyle,
                  color: 'var(--color-danger)',
                  borderColor: 'var(--color-danger)',
                }}
              >
                Oui, supprimer
              </button>
              <button type="button" onClick={() => setPendingDelete(false)} style={smallBtnStyle}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {bones.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            {rig ? 'Aucun os. Cliquez sur « 🦴 + » ou « 🧍 Modèle ».' : 'Aucun rig. Créez-en un.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {bones.map((b) => {
              const boneFirstPart = parts.find((p) => p.boneId === b.id);
              return (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectBone(b.id);
                      setPendingDelete(false);
                    }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 6px',
                      borderRadius: 5,
                      cursor: 'pointer',
                      fontSize: 11,
                      textAlign: 'left',
                      minWidth: 0,
                      border:
                        b.id === selectedBoneId
                          ? '1.5px solid var(--color-primary)'
                          : '1.5px solid transparent',
                      background:
                        b.id === selectedBoneId ? 'var(--color-primary-subtle)' : 'transparent',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: b.color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 10, flexShrink: 0 }}>{getBoneEmoji(b.name)}</span>
                    <span
                      style={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {b.name}
                    </span>
                    {b.parentId === null && (
                      <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>racine</span>
                    )}
                  </button>

                  {/* ④ Slot asset — mode débutant : clic → fichier → addPart */}
                  {isBeginnerMode && (
                    <>
                      {/* Boutons ⇄ flip et ✕ supprimer — visibles uniquement si une part est assignée */}
                      {boneFirstPart && (
                        <>
                          <button
                            type="button"
                            title={
                              boneFirstPart.flipX
                                ? 'Retirer le miroir horizontal'
                                : 'Activer le miroir horizontal'
                            }
                            onClick={() =>
                              rig &&
                              updatePart(rig.id, boneFirstPart.id, { flipX: !boneFirstPart.flipX })
                            }
                            style={{
                              width: 20,
                              height: 20,
                              flexShrink: 0,
                              cursor: 'pointer',
                              borderRadius: 3,
                              fontSize: 11,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: boneFirstPart.flipX
                                ? '1px solid var(--color-primary)'
                                : '1px solid var(--color-border-base)',
                              background: boneFirstPart.flipX
                                ? 'var(--color-primary-subtle)'
                                : 'transparent',
                              color: boneFirstPart.flipX
                                ? 'var(--color-primary)'
                                : 'var(--color-text-muted)',
                              transition: 'background 0.1s, border-color 0.1s',
                            }}
                          >
                            ⇄
                          </button>
                          <button
                            type="button"
                            title="Supprimer le sprite de cet os"
                            onClick={() => rig && deletePart(rig.id, boneFirstPart.id)}
                            style={{
                              width: 20,
                              height: 20,
                              flexShrink: 0,
                              cursor: 'pointer',
                              borderRadius: 3,
                              fontSize: 11,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid var(--color-border-base)',
                              background: 'transparent',
                              color: 'var(--color-danger)',
                              transition: 'background 0.1s',
                            }}
                          >
                            ✕
                          </button>
                        </>
                      )}
                      {/* Vignette + input fichier */}
                      <label
                        title={
                          boneFirstPart
                            ? 'Changer le sprite de cet os'
                            : 'Assigner un sprite à cet os'
                        }
                        style={{
                          width: 28,
                          height: 36,
                          flexShrink: 0,
                          cursor: 'pointer',
                          borderRadius: 4,
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: boneFirstPart
                            ? '1px solid var(--color-border-base)'
                            : '1px dashed var(--color-border-hover)',
                          fontSize: 11,
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        {boneFirstPart ? (
                          <img
                            src={boneFirstPart.assetUrl}
                            alt=""
                            style={{
                              width: 28,
                              height: 36,
                              objectFit: 'contain',
                              transform: boneFirstPart.flipX ? 'scaleX(-1)' : undefined,
                            }}
                          />
                        ) : (
                          <span>+</span>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file || !rig) return;
                            const url = URL.createObjectURL(file);
                            // Lire les dimensions naturelles avant d'ajouter la part
                            const img = new window.Image();
                            img.onload = () => {
                              const w = img.naturalWidth || 64;
                              const h = img.naturalHeight || 88;
                              addPart(rig.id, {
                                boneId: b.id,
                                assetUrl: url,
                                offsetX: 0,
                                offsetY: -Math.round(h / 2),
                                width: w,
                                height: h,
                                zOrder: parts.filter((p) => p.boneId === b.id).length,
                                flipX: false,
                              });
                              // Auto-détection de l'os symétrique
                              const mirror = findMirrorBone(b.name, bones);
                              if (mirror) {
                                setMirrorPrompt({
                                  mirrorBone: mirror,
                                  assetUrl: url,
                                  width: w,
                                  height: h,
                                });
                              }
                            };
                            img.src = url;
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Prompt miroir — Norman §9.2 : contrainte signalée proactivement ── */}
        {mirrorPrompt && (
          <div
            style={{
              marginTop: 8,
              padding: '8px 10px',
              borderRadius: 6,
              background: 'rgba(139,92,246,0.08)',
              border: '1px solid var(--color-primary)',
            }}
          >
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              ⇄ Assigner aussi sur <strong>{mirrorPrompt.mirrorBone.name}</strong> (miroir) ?
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => {
                  if (!rig) return;
                  addPart(rig.id, {
                    boneId: mirrorPrompt.mirrorBone.id,
                    assetUrl: mirrorPrompt.assetUrl,
                    offsetX: 0,
                    offsetY: -Math.round(mirrorPrompt.height / 2),
                    width: mirrorPrompt.width,
                    height: mirrorPrompt.height,
                    zOrder: parts.filter((p) => p.boneId === mirrorPrompt.mirrorBone.id).length,
                    flipX: true,
                  });
                  setMirrorPrompt(null);
                }}
                style={{
                  ...smallBtnStyle,
                  color: 'var(--color-primary)',
                  borderColor: 'var(--color-primary)',
                  background: 'var(--color-primary-subtle)',
                }}
              >
                ✓ Oui, ajouter ⇄
              </button>
              <button type="button" onClick={() => setMirrorPrompt(null)} style={smallBtnStyle}>
                Non merci
              </button>
            </div>
          </div>
        )}

        {!rig && (
          <button
            type="button"
            onClick={handleCreateRig}
            style={{ ...smallBtnStyle, marginTop: 8, width: '100%', justifyContent: 'center' }}
          >
            🆕 Créer un rig
          </button>
        )}
      </div>

      {/* ── Propriétés de l'os sélectionné ── */}
      {selectedBone && (
        <div style={{ padding: '10px', borderBottom: '1px solid var(--color-border-base)' }}>
          <p style={{ ...sectionLabel, marginBottom: 8 }}>Os sélectionné</p>

          {/* Nom — toujours visible */}
          <div style={{ ...propRowStyle, marginBottom: 6 }}>
            <label style={propLabelStyle} htmlFor="bone-name">
              Nom
            </label>
            <input
              id="bone-name"
              type="text"
              value={selectedBone.name}
              onChange={(e) => handleBoneName(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Mode Débutant : sliders (§6b) */}
          {isBeginnerMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <SliderRow
                label="Rotation"
                value={Math.round(selectedBone.rotation)}
                min={-180}
                max={180}
                step={1}
                unit="°"
                onChange={(v) => handleBoneRotation(v)}
              />
              <SliderRow
                label="Longueur"
                value={selectedBone.length}
                min={4}
                max={200}
                step={4}
                unit="px"
                onChange={(v) => handleBoneLength(v)}
              />
            </div>
          ) : (
            /* Mode Expert : inputs texte */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={propRowStyle}>
                <label style={propLabelStyle} htmlFor="bone-rotation">
                  Rotation °
                </label>
                <input
                  id="bone-rotation"
                  type="number"
                  value={selectedBone.rotation.toFixed(1)}
                  step={1}
                  onChange={(e) => handleBoneRotation(e.target.value)}
                  style={{ ...inputStyle, width: 70 }}
                />
              </div>
              <div style={propRowStyle}>
                <label style={propLabelStyle} htmlFor="bone-length">
                  Longueur px
                </label>
                <input
                  id="bone-length"
                  type="number"
                  value={selectedBone.length}
                  min={4}
                  step={4}
                  onChange={(e) => handleBoneLength(e.target.value)}
                  style={{ ...inputStyle, width: 70 }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Parts — Expert uniquement (§6b) ── */}
      {!isBeginnerMode && (
        <div
          style={{
            padding: '10px',
            borderBottom: '1px solid var(--color-border-base)',
            overflowY: 'auto',
          }}
        >
          <p style={sectionLabel}>Parts ({parts.length})</p>
          {parts.length === 0 ? (
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
              Aucune part. Utilisez l'outil 🖼 + Part.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
              {parts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 6px',
                    borderRadius: 5,
                    border: '1px solid var(--color-border-base)',
                    background: 'var(--color-bg-hover)',
                  }}
                >
                  <img
                    src={p.assetUrl}
                    alt=""
                    style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 3 }}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--color-text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.assetUrl.split('/').pop()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Chaînes IK — Expert uniquement (§6b) ── */}
      {!isBeginnerMode && (
        <div style={{ padding: '10px', overflowY: 'auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <p style={sectionLabel}>Chaînes IK ({ikChains.length})</p>
            {!ikForm && bones.length >= 2 && (
              <button
                type="button"
                onClick={() =>
                  setIkForm({ name: '', rootId: bones[0]?.id ?? '', endId: bones[1]?.id ?? '' })
                }
                style={smallBtnStyle}
                title="Ajouter une chaîne IK"
              >
                🎯 +
              </button>
            )}
          </div>

          {/* Formulaire création chaîne */}
          {ikForm && (
            <div
              style={{
                padding: '8px',
                borderRadius: 6,
                background: 'var(--color-bg-hover)',
                border: '1px solid var(--color-border-base)',
                marginBottom: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
              }}
            >
              <input
                type="text"
                placeholder="Nom de la chaîne"
                value={ikForm.name}
                onChange={(e) => setIkForm((f) => (f ? { ...f, name: e.target.value } : f))}
                style={{ ...inputStyle }}
              />
              <div style={{ display: 'flex', gap: 4 }}>
                <select
                  value={ikForm.rootId}
                  onChange={(e) => setIkForm((f) => (f ? { ...f, rootId: e.target.value } : f))}
                  style={{ ...inputStyle, flex: 1 }}
                  aria-label="Os racine"
                >
                  <option value="">Os racine…</option>
                  {bones.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <select
                  value={ikForm.endId}
                  onChange={(e) => setIkForm((f) => (f ? { ...f, endId: e.target.value } : f))}
                  style={{ ...inputStyle, flex: 1 }}
                  aria-label="Os extrémité"
                >
                  <option value="">Os fin…</option>
                  {bones.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  onClick={handleAddIkChain}
                  style={{
                    ...smallBtnStyle,
                    color: 'var(--color-primary)',
                    borderColor: 'var(--color-primary)',
                  }}
                >
                  ✓ Créer
                </button>
                <button type="button" onClick={() => setIkForm(null)} style={smallBtnStyle}>
                  Annuler
                </button>
              </div>
            </div>
          )}

          {ikChains.length === 0 && !ikForm && (
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              {bones.length < 2
                ? 'Ajoutez ≥2 os pour créer une chaîne IK.'
                : 'Aucune chaîne. Cliquez sur 🎯 +.'}
            </p>
          )}

          {ikChains.map((chain) => (
            <div
              key={chain.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 6px',
                borderRadius: 5,
                marginBottom: 2,
                border: '1px solid var(--color-border-base)',
                background: 'var(--color-bg-hover)',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  flex: 1,
                  color: 'var(--color-text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                🎯 {chain.name}
              </span>
              <button
                type="button"
                onClick={() => rig && removeIKChain(rig.id, chain.id)}
                style={{ ...smallBtnStyle, padding: '2px 5px', color: 'var(--color-danger)' }}
                title="Supprimer cette chaîne IK"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── TemplatePicker dialog ── */}
      {templatePickerOpen && (
        <TemplatePicker
          characterId={characterId}
          open={templatePickerOpen}
          onClose={() => setTemplatePickerOpen(false)}
        />
      )}
    </div>
  );
}

// ── Styles locaux partagés ──────────────────────────────────────────────────

const sectionLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  margin: 0,
};

const smallBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 3,
  padding: '3px 6px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 10,
  fontWeight: 600,
  border: '1px solid var(--color-border-base)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
};

const propRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 6,
};

const propLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--color-text-muted)',
  flexShrink: 0,
};

const inputStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  background: 'var(--color-bg-base)',
  border: '1px solid var(--color-border-base)',
  borderRadius: 4,
  padding: '2px 5px',
  width: '100%',
  minWidth: 0,
  outline: 'none',
};
