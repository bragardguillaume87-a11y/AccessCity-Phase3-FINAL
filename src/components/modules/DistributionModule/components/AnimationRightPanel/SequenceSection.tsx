import { useState } from 'react';
import type { AnimationClip, BonePose } from '@/types/bone';
import { EASING_LABELS, BEZIER_PRESETS } from '@/utils/animationEasing';
import type { EasingType, BezierPoints } from '@/utils/animationEasing';
import { sectionLabel, rowBetween, emptyText, smallBtn } from './styles';

// Presets easing affichés (hors bezier)
const EASING_PRESET_IDS: EasingType[] = ['linear', 'ease-in', 'ease-out', 'ease-in-out'];

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
}: SequenceSectionProps) {
  const [bezierPopoverIdx, setBezierPopoverIdx] = useState<number | null>(null);

  const keyframes = selectedClip.keyframes ?? [];
  const totalDuration = keyframes.reduce((s, kf) => s + kf.duration, 0).toFixed(1);
  const canPlay = keyframes.length >= 2;

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
          </p>
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

        {keyframes.length === 0 ? (
          <p style={{ ...emptyText, marginTop: 6 }}>
            Sélectionne une pose puis clique « 📸 + Séq. ».
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 }}>
            {keyframes.map((kf, idx) => {
              const pose = poses.find((p) => p.id === kf.poseId);
              const isBezierOpen = bezierPopoverIdx === idx;
              return (
                <div
                  key={`${kf.poseId}-${idx}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 6px',
                    borderRadius: 5,
                    background: 'var(--color-bg-hover)',
                    border: '1px solid var(--color-border-base)',
                    flexWrap: 'wrap',
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
                    {pose?.name ?? 'Pose inconnue'}
                  </span>

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
