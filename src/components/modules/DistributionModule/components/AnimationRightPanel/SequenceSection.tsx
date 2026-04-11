import { useState, useRef, useCallback } from 'react';
import type { AnimationClip, BonePose, KeyframeEntry } from '@/types/bone';
import { EASING_LABELS, BEZIER_PRESETS } from '@/utils/animationEasing';
import type { EasingType, BezierPoints } from '@/utils/animationEasing';
import { sectionLabel, rowBetween, emptyText, smallBtn } from './styles';

// Presets easing affichés (hors bezier)
const EASING_PRESET_IDS: EasingType[] = ['linear', 'ease-in', 'ease-out', 'ease-in-out'];

// Couleur déterministe depuis poseId — même pose = même couleur (Quilez §14.1)
function poseColor(poseId: string): string {
  const hash = poseId.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0);
  const hue = Math.abs(hash) % 360;
  return `hsla(${hue}, 60%, 55%, 0.8)`;
}

// ── Mini timeline proportionnelle ──────────────────────────────────────────
interface TimelineMiniBarProps {
  keyframes: KeyframeEntry[];
  poses: BonePose[];
  hoveredIdx: number | null;
  onHoverIdx: (idx: number | null) => void;
  onClickIdx: (idx: number) => void;
}

function TimelineMiniBar({
  keyframes,
  poses,
  hoveredIdx,
  onHoverIdx,
  onClickIdx,
}: TimelineMiniBarProps) {
  const total = keyframes.reduce((s, kf) => s + kf.duration, 0);
  if (total === 0 || keyframes.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        height: 26,
        borderRadius: 5,
        overflow: 'hidden',
        border: '1px solid var(--color-border-base)',
        margin: '6px 0 4px',
        cursor: 'default',
      }}
    >
      {keyframes.map((kf, idx) => {
        const widthPct = Math.max((kf.duration / total) * 100, 3);
        const pose = poses.find((p) => p.id === kf.poseId);
        const isHovered = hoveredIdx === idx;
        return (
          <div
            key={`tl-${kf.poseId}-${idx}`}
            onMouseEnter={() => onHoverIdx(idx)}
            onMouseLeave={() => onHoverIdx(null)}
            onClick={() => onClickIdx(idx)}
            title={`${pose?.name ?? '?'} · ${kf.duration}s · ${kf.easing}`}
            style={{
              flex: widthPct,
              background: poseColor(kf.poseId),
              opacity: isHovered ? 1 : 0.75,
              borderRight: idx < keyframes.length - 1 ? '1px solid rgba(0,0,0,0.2)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              transition: 'opacity 0.1s',
              position: 'relative',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.9)',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                overflow: 'hidden',
                maxWidth: '90%',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
            >
              {pose?.name ?? '?'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface SequenceSectionProps {
  selectedClip: AnimationClip;
  poses: BonePose[];
  selectedPoseId: string | null;
  isPlaying: boolean;
  isBeginnerMode: boolean;
  onAddPoseToClip: () => void;
  onRemoveKeyframe: (index: number) => void;
  onKeyframeDuration: (index: number, duration: number) => void;
  onKeyframeEasing: (index: number, easing: EasingType, bezierPoints?: BezierPoints) => void;
  onPlayToggle: () => void;
  onReorderKeyframes?: (fromIdx: number, toIdx: number) => void;
  /** Supprime tous les keyframes dont le poseId ne correspond à aucune pose existante */
  onCleanOrphans?: () => void;
}

export function SequenceSection({
  selectedClip,
  poses,
  selectedPoseId,
  isPlaying,
  isBeginnerMode,
  onAddPoseToClip,
  onRemoveKeyframe,
  onKeyframeDuration,
  onKeyframeEasing,
  onPlayToggle,
  onReorderKeyframes,
  onCleanOrphans,
}: SequenceSectionProps) {
  const [bezierPopoverIdx, setBezierPopoverIdx] = useState<number | null>(null);
  const [hoveredKfIdx, setHoveredKfIdx] = useState<number | null>(null);
  const [dragFromIdx, setDragFromIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const keyframes = selectedClip.keyframes ?? [];
  const totalDuration = keyframes.reduce((s, kf) => s + kf.duration, 0).toFixed(1);
  const canPlay = keyframes.length >= 2;
  const orphanCount = keyframes.filter((kf) => !poses.find((p) => p.id === kf.poseId)).length;

  // Refs sur chaque ligne pour permettre le scroll depuis la mini-bar
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const handleTimelineClick = useCallback((idx: number) => {
    setHoveredKfIdx(idx);
    const el = rowRefs.current[idx];
    if (el && listContainerRef.current) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, []);

  return (
    <>
      {/* ── Séquence keyframes ── */}
      <div
        data-tutorial-id="keyframe-section"
        style={{
          flexShrink: 0,
          padding: '10px',
          borderBottom: '1px solid var(--color-border-base)',
          maxHeight: 240,
          overflowY: 'auto',
        }}
      >
        <div style={rowBetween}>
          <p style={sectionLabel}>
            ⏱ Séquence — {keyframes.length}kf · {totalDuration}s
            {orphanCount > 0 && (
              <span
                title={`${orphanCount} étape(s) pointent vers des poses supprimées`}
                style={{
                  marginLeft: 6,
                  fontSize: 9,
                  fontWeight: 700,
                  color: 'var(--color-danger)',
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  borderRadius: 3,
                  padding: '0 4px',
                  verticalAlign: 'middle',
                }}
              >
                ⚠️ {orphanCount}
              </span>
            )}
          </p>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {orphanCount > 0 && onCleanOrphans && (
              <button
                type="button"
                onClick={onCleanOrphans}
                title={`Supprimer les ${orphanCount} étape(s) dont la pose est introuvable`}
                style={{
                  ...smallBtn,
                  color: 'var(--color-danger)',
                  borderColor: 'rgba(239,68,68,0.4)',
                }}
              >
                🧹 Nettoyer
              </button>
            )}
            {selectedPoseId && (
              <button
                type="button"
                onClick={onAddPoseToClip}
                title="Ajouter la pose sélectionnée à la séquence"
                style={{
                  ...smallBtn,
                  color: 'var(--color-primary)',
                  borderColor: 'var(--color-primary-40)',
                }}
              >
                📸 + Séq.
              </button>
            )}
          </div>
        </div>

        {keyframes.length === 0 ? (
          <p style={{ ...emptyText, marginTop: 6 }}>
            Sélectionne une pose puis clique « 📸 + Séq. ».
          </p>
        ) : (
          <>
            <TimelineMiniBar
              keyframes={keyframes}
              poses={poses}
              hoveredIdx={hoveredKfIdx}
              onHoverIdx={setHoveredKfIdx}
              onClickIdx={handleTimelineClick}
            />
            <div
              ref={listContainerRef}
              style={{ display: 'flex', flexDirection: 'column', gap: 3 }}
            >
              {keyframes.map((kf, idx) => {
                const pose = poses.find((p) => p.id === kf.poseId);
                const isBezierOpen = bezierPopoverIdx === idx;
                const isRowHovered = hoveredKfIdx === idx;
                return (
                  <div
                    key={`${kf.poseId}-${idx}`}
                    ref={(el) => {
                      rowRefs.current[idx] = el;
                    }}
                    draggable={!!onReorderKeyframes}
                    onDragStart={() => {
                      setDragFromIdx(idx);
                      setDragOverIdx(idx);
                    }}
                    onDragEnter={() => setDragOverIdx(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnd={() => {
                      if (
                        onReorderKeyframes &&
                        dragFromIdx !== null &&
                        dragOverIdx !== null &&
                        dragFromIdx !== dragOverIdx
                      ) {
                        onReorderKeyframes(dragFromIdx, dragOverIdx);
                      }
                      setDragFromIdx(null);
                      setDragOverIdx(null);
                    }}
                    onMouseEnter={() => setHoveredKfIdx(idx)}
                    onMouseLeave={() => setHoveredKfIdx(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 6px',
                      borderRadius: 5,
                      background: isRowHovered ? 'var(--color-bg-active)' : 'var(--color-bg-hover)',
                      border:
                        dragOverIdx === idx && dragFromIdx !== idx
                          ? '1.5px dashed var(--color-primary)'
                          : isRowHovered
                            ? `1px solid ${poseColor(kf.poseId)}`
                            : '1px solid var(--color-border-base)',
                      flexWrap: 'wrap',
                      transition: 'background 0.1s, border-color 0.1s',
                      opacity: dragFromIdx === idx ? 0.45 : 1,
                      cursor: onReorderKeyframes ? 'grab' : 'default',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        color: 'var(--color-text-muted)',
                        minWidth: 14,
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                    {pose ? (
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--color-text-secondary)',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          minWidth: 40,
                        }}
                      >
                        {pose.name}
                      </span>
                    ) : (
                      <span
                        title="Cette pose a été supprimée. Cliquez sur 🧹 Nettoyer pour retirer ces étapes."
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: 'var(--color-danger)',
                          background: 'rgba(239,68,68,0.12)',
                          border: '1px solid rgba(239,68,68,0.35)',
                          borderRadius: 3,
                          padding: '1px 5px',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        ⚠️ Pose supprimée
                      </span>
                    )}

                    {!isBeginnerMode && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                        <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>⏱</span>
                        <input
                          type="number"
                          value={kf.duration}
                          min={0.1}
                          max={10}
                          step={0.1}
                          onChange={(e) => onKeyframeDuration(idx, parseFloat(e.target.value))}
                          style={{
                            width: 38,
                            fontSize: 10,
                            padding: '1px 3px',
                            borderRadius: 3,
                            border: '1px solid var(--color-border-base)',
                            background: 'var(--color-bg-base)',
                            color: 'var(--color-text-primary)',
                          }}
                          title="Durée en secondes"
                        />
                        <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>s</span>
                      </div>
                    )}

                    {!isBeginnerMode && (
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {EASING_PRESET_IDS.map((e) => (
                            <button
                              key={e}
                              type="button"
                              title={EASING_LABELS[e]}
                              onClick={() => onKeyframeEasing(idx, e)}
                              style={{
                                padding: '1px 4px',
                                borderRadius: 3,
                                fontSize: 9,
                                cursor: 'pointer',
                                border:
                                  kf.easing === e
                                    ? '1.5px solid var(--color-primary)'
                                    : '1px solid var(--color-border-base)',
                                background:
                                  kf.easing === e ? 'var(--color-primary-subtle)' : 'transparent',
                                color:
                                  kf.easing === e
                                    ? 'var(--color-primary)'
                                    : 'var(--color-text-muted)',
                              }}
                            >
                              {EASING_LABELS[e].split(' ')[0]}
                            </button>
                          ))}
                          <button
                            type="button"
                            title="Bézier custom"
                            onClick={() => setBezierPopoverIdx(isBezierOpen ? null : idx)}
                            style={{
                              padding: '1px 4px',
                              borderRadius: 3,
                              fontSize: 9,
                              cursor: 'pointer',
                              border:
                                kf.easing === 'bezier'
                                  ? '1.5px solid var(--color-primary)'
                                  : '1px solid var(--color-border-base)',
                              background:
                                kf.easing === 'bezier'
                                  ? 'var(--color-primary-subtle)'
                                  : 'transparent',
                              color:
                                kf.easing === 'bezier'
                                  ? 'var(--color-primary)'
                                  : 'var(--color-text-muted)',
                            }}
                          >
                            ◠
                          </button>
                        </div>

                        {isBezierOpen && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '110%',
                              right: 0,
                              zIndex: 100,
                              background: 'var(--color-bg-elevated)',
                              border: '1px solid var(--color-border-base)',
                              borderRadius: 6,
                              padding: 8,
                              minWidth: 150,
                              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                            }}
                          >
                            <p
                              style={{
                                fontSize: 9,
                                color: 'var(--color-text-muted)',
                                marginBottom: 6,
                                fontWeight: 700,
                              }}
                            >
                              ◠ BÉZIER PRESETS
                            </p>
                            {Object.entries(BEZIER_PRESETS).map(([name, pts]) => (
                              <button
                                key={name}
                                type="button"
                                onClick={() => {
                                  onKeyframeEasing(idx, 'bezier', pts as BezierPoints);
                                  setBezierPopoverIdx(null);
                                }}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  textAlign: 'left',
                                  padding: '3px 6px',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                  fontSize: 10,
                                  border: 'none',
                                  background: 'transparent',
                                  color: 'var(--color-text-secondary)',
                                }}
                              >
                                {name}
                                <span
                                  style={{
                                    fontSize: 8,
                                    color: 'var(--color-text-muted)',
                                    marginLeft: 4,
                                  }}
                                >
                                  ({pts.join(', ')})
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => onRemoveKeyframe(idx)}
                      title="Retirer de la séquence"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 10,
                        color: 'var(--color-text-muted)',
                        padding: '0 2px',
                        flexShrink: 0,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Contrôles lecture ── */}
      <div style={{ padding: '10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={onPlayToggle}
            disabled={!canPlay}
            data-tutorial-id="play-button"
            title={
              !canPlay ? 'Ajoute au moins 2 poses à la séquence pour lancer la lecture' : undefined
            }
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              cursor: canPlay ? 'pointer' : 'not-allowed',
              fontSize: 13,
              fontWeight: 700,
              border: '1.5px solid var(--color-primary)',
              background: isPlaying ? 'var(--color-primary)' : 'var(--color-primary-subtle)',
              color: isPlaying ? '#fff' : 'var(--color-primary)',
              opacity: canPlay ? 1 : 0.45,
              transition: 'background 0.1s',
            }}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            {selectedClip.fps}&thinsp;fps · {selectedClip.loop ? '🔁 boucle' : '1×'}
          </span>
          {!canPlay && (
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              (2 poses min.)
            </span>
          )}
        </div>
      </div>
    </>
  );
}
