import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRigStore } from '@/stores/rigStore';
import type { Bone, CharacterRig, SpritePart } from '@/types/bone';
import {
  getBoneEmoji,
  findMirrorBone,
  getBoneChain,
  getBoneDepth,
  sortBonesByHierarchy,
} from '../../../utils/boneUtils';
import { TemplatePicker } from '../../TemplatePicker';
import { uiSounds } from '@/utils/uiSounds';

export interface BoneHierarchyListProps {
  rig: CharacterRig | undefined;
  bones: Bone[];
  parts: SpritePart[];
  selectedBoneId: string | null;
  isBeginnerMode: boolean;
  characterId: string;
  onSelectBone: (id: string | null) => void;
  onAddRootBone: () => void;
  onBoneDelete: (boneId: string) => void;
}

export function BoneHierarchyList({
  rig,
  bones,
  parts,
  selectedBoneId,
  isBeginnerMode,
  characterId,
  onSelectBone,
  onAddRootBone,
  onBoneDelete,
}: BoneHierarchyListProps) {
  // ── State local ──────────────────────────────────────────────────────────
  const [pendingDelete, setPendingDelete] = useState(false);
  const [dragBoneId, setDragBoneId] = useState<string | null>(null);
  const [dragOverBoneId, setDragOverBoneId] = useState<string | null>(null);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [mirrorPrompt, setMirrorPrompt] = useState<{
    mirrorBone: Bone;
    assetUrl: string;
    width: number;
    height: number;
  } | null>(null);

  // ── Store actions ────────────────────────────────────────────────────────
  const addPart = useRigStore((s) => s.addPart);
  const updatePart = useRigStore((s) => s.updatePart);
  const deletePart = useRigStore((s) => s.deletePart);
  const addRigFromTemplate = useRigStore((s) => s.addRigFromTemplate);
  const addRig = useRigStore((s) => s.addRig);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleDeleteBoneClick = () => {
    if (!selectedBoneId) return;
    if (isBeginnerMode && !pendingDelete) {
      setPendingDelete(true);
      return;
    }
    onBoneDelete(selectedBoneId);
    setPendingDelete(false);
  };

  return (
    <>
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
          <p style={sectionLabel}>🦴 Os ({bones.length})</p>
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
                title={
                  isBeginnerMode
                    ? 'Remettre le squelette à zéro — tes poses et clips sont conservés !'
                    : 'Réinitialiser les os depuis le modèle Personnage simple (poses et clips conservés)'
                }
                style={{
                  ...smallBtnStyle,
                  ...(isBeginnerMode && {
                    border: '1.5px solid var(--color-warning)',
                    color: 'var(--color-warning)',
                  }),
                }}
              >
                {isBeginnerMode ? '↺ Refaire' : '🔄'}
              </button>
            )}
            {/* Pulse quand aucun os — guide le débutant vers la première action (Nijman §8.1) */}
            <motion.button
              type="button"
              data-tutorial-id="add-bone-button"
              onClick={onAddRootBone}
              title="Ajouter os racine"
              animate={bones.length === 0 ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={
                bones.length === 0 ? { repeat: Infinity, duration: 2.2, ease: 'easeInOut' } : {}
              }
              style={smallBtnStyle}
            >
              🦴 +
            </motion.button>
            {selectedBoneId && !pendingDelete && (
              <button
                type="button"
                onClick={handleDeleteBoneClick}
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
                onClick={handleDeleteBoneClick}
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
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              maxHeight: 220,
              overflowY: 'auto',
            }}
          >
            {sortBonesByHierarchy(bones).map((b) => {
              const boneFirstPart = parts.find((p) => p.boneId === b.id);
              const depth = getBoneDepth(b, bones);
              return (
                <div
                  key={b.id}
                  draggable={!isBeginnerMode}
                  onDragStart={() => {
                    setDragBoneId(b.id);
                    setDragOverBoneId(b.id);
                  }}
                  onDragEnter={() => setDragOverBoneId(b.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnd={() => {
                    if (rig && dragBoneId && dragOverBoneId && dragBoneId !== dragOverBoneId) {
                      // Guard anti-cycle : interdire si dragOverBoneId est un descendant de dragBoneId
                      const wouldCycle = getBoneChain(dragBoneId, dragOverBoneId, bones) !== null;
                      if (!wouldCycle) {
                        useRigStore
                          .getState()
                          .updateBone(rig.id, dragBoneId, { parentId: dragOverBoneId });
                        uiSounds.choiceSelect();
                      }
                    }
                    setDragBoneId(null);
                    setDragOverBoneId(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    paddingLeft: depth * 12,
                    borderRadius: 5,
                    boxShadow:
                      dragOverBoneId === b.id && dragBoneId !== b.id
                        ? '0 0 0 1.5px var(--color-primary)'
                        : 'none',
                    opacity: dragBoneId === b.id ? 0.4 : 1,
                    transition: 'box-shadow 0.1s, opacity 0.1s',
                    cursor: !isBeginnerMode ? 'grab' : 'default',
                  }}
                >
                  {/* Indicateur de parenté — trait vertical gauche pour os enfants */}
                  {depth > 0 && (
                    <span
                      style={{
                        fontSize: 9,
                        color: 'var(--color-text-muted)',
                        flexShrink: 0,
                        lineHeight: 1,
                        marginRight: 1,
                      }}
                    >
                      └
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectBone(b.id);
                      setPendingDelete(false);
                      uiSounds.choiceSelect();
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
                            // Capture IDs stables avant la chaîne async (rig peut changer avant img.onload)
                            const rigId = rig.id;
                            const boneId = b.id;
                            const boneName = b.name;
                            // FileReader → Data URL persistable (blob URLs expirent au refresh)
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const dataUrl = ev.target?.result as string;
                              if (!dataUrl) return;
                              // Lire les dimensions naturelles avant d'ajouter la part
                              const img = new window.Image();
                              img.onload = () => {
                                // Guard : vérifier que le rig existe toujours (stale closure)
                                const currentRig = useRigStore
                                  .getState()
                                  .rigs.find((r) => r.id === rigId);
                                if (!currentRig) return;
                                const w = img.naturalWidth || 64;
                                const h = img.naturalHeight || 88;
                                addPart(rigId, {
                                  boneId,
                                  assetUrl: dataUrl,
                                  offsetX: 0,
                                  offsetY: -Math.round(h / 2),
                                  width: w,
                                  height: h,
                                  zOrder: currentRig.parts.filter((p) => p.boneId === boneId)
                                    .length,
                                  flipX: false,
                                });
                                // Auto-détection de l'os symétrique
                                const mirror = findMirrorBone(boneName, currentRig.bones);
                                if (mirror) {
                                  setMirrorPrompt({
                                    mirrorBone: mirror,
                                    assetUrl: dataUrl,
                                    width: w,
                                    height: h,
                                  });
                                }
                              };
                              img.src = dataUrl;
                            };
                            reader.readAsDataURL(file);
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
            onClick={() => addRig(characterId)}
            style={{ ...smallBtnStyle, marginTop: 8, width: '100%', justifyContent: 'center' }}
          >
            🆕 Créer un rig
          </button>
        )}
      </div>

      {/* ── TemplatePicker dialog ── */}
      {templatePickerOpen && (
        <TemplatePicker
          characterId={characterId}
          open={templatePickerOpen}
          onClose={() => setTemplatePickerOpen(false)}
        />
      )}
    </>
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
