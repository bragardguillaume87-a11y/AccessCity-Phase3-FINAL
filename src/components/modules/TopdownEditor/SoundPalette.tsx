/**
 * SoundPalette — Palette sonore complète (Sprint 10)
 *
 * 3 sections accessibles depuis l'onglet Sons :
 *   🎵  BGM — musique de fond de la carte (lecture en boucle en Preview)
 *   🔊  Briques sonores — 7 presets procéduraux + Sound Playground
 *   📍  Zones sonores — liste des AudioZone sur la carte + bouton "Ajouter"
 *
 * @module components/modules/TopdownEditor/SoundPalette
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import jsfxrLib, { sfxr } from 'jsfxr';
const Params = jsfxrLib.Params;
import { SOUND_BRICKS, SOUND_BRICK_CATEGORIES, childParamsToJsfxr } from '@/config/soundBricks';
import type { SoundBrick, SoundBrickParams } from '@/config/soundBricks';
import { useMapsStore } from '@/stores/mapsStore';
import { useAssets } from '@/hooks/useAssets';
import { useAssetUpload } from '@/components/modals/AssetsLibraryModal/hooks/useAssetUpload';
import { convertFileSrcIfNeeded } from '@/utils/tauri';

// ── Constantes ────────────────────────────────────────────────────────────────

/** Délai minimum entre deux aperçus sonores (ms) — évite la saturation */
const PREVIEW_THROTTLE_MS = 120;

// ── Props ─────────────────────────────────────────────────────────────────────

interface SoundPaletteProps {
  /** ID de la carte sélectionnée — nécessaire pour BGM + zones sonores */
  selectedMapId?: string | null;
  /**
   * Appelé quand l'utilisateur clique "Placer sur la carte".
   * Le parent bascule sur l'onglet Triggers et pré-sélectionne la brique.
   */
  onSwitchToTriggers?: (brickId?: string) => void;
}

// ── Utilitaire de lecture ─────────────────────────────────────────────────────

function playBrick(brick: SoundBrick, params: SoundBrickParams): void {
  try {
    const p = new Params();
    (p as unknown as Record<string, () => void>)[brick.algorithm]?.();
    const overrides = childParamsToJsfxr(params);
    p.p_base_freq = overrides.p_base_freq;
    p.p_env_decay = overrides.p_env_decay;
    p.p_freq_ramp = overrides.p_freq_ramp;
    sfxr.play(p);
  } catch {
    // Silencieux — AudioContext non déverrouillé ou environnement sans audio
  }
}

// ── Slider enfant ─────────────────────────────────────────────────────────────

interface ChildSliderProps {
  emoji: string;
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}

function ChildSlider({ emoji, label, hint, value, onChange }: ChildSliderProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-base)' }}>
          {emoji} {label}
        </span>
        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{hint}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
          {label === 'Glissement' ? '⬇ descend' : '◀ moins'}
        </span>
        <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
          {label === 'Glissement' ? 'monte ⬆' : 'plus ▶'}
        </span>
      </div>
    </div>
  );
}

// ── Brique sonore (carte) ─────────────────────────────────────────────────────

interface BrickCardProps {
  brick: SoundBrick;
  isSelected: boolean;
  onSelect: (brick: SoundBrick) => void;
  onPreview: (brick: SoundBrick) => void;
}

function BrickCard({ brick, isSelected, onSelect, onPreview }: BrickCardProps) {
  return (
    <button
      onClick={() => {
        onSelect(brick);
        onPreview(brick);
      }}
      title={`${brick.label} — cliquez pour entendre`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        padding: '6px 3px',
        borderRadius: 8,
        border: isSelected ? `2px solid ${brick.color}` : '2px solid transparent',
        background: isSelected ? `${brick.color}22` : 'var(--color-overlay-05)',
        cursor: 'pointer',
        transition: 'transform 0.1s, background 0.1s, box-shadow 0.1s',
        boxShadow: isSelected ? `0 0 8px ${brick.color}55` : 'none',
        transform: isSelected ? 'translateY(-2px)' : 'none',
      }}
      onMouseEnter={(e) => {
        const btn = e.currentTarget as HTMLButtonElement;
        if (!isSelected) btn.style.background = `${brick.color}15`;
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = `0 3px 8px ${brick.color}44`;
      }}
      onMouseLeave={(e) => {
        const btn = e.currentTarget as HTMLButtonElement;
        if (!isSelected) {
          btn.style.background = 'var(--color-overlay-05)';
          btn.style.boxShadow = 'none';
        } else btn.style.boxShadow = `0 0 8px ${brick.color}55`;
        btn.style.transform = isSelected ? 'translateY(-2px)' : 'none';
      }}
    >
      <span style={{ fontSize: 14, lineHeight: 1 }}>{brick.emoji}</span>
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: isSelected ? brick.color : 'var(--color-text-secondary)',
          textAlign: 'center',
          lineHeight: 1.2,
        }}
      >
        {brick.label}
      </span>
    </button>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ emoji, label, accent }: { emoji: string; label: string; accent: string }) {
  return (
    <div
      style={{
        flexShrink: 0,
        padding: '6px 10px',
        borderBottom: '1px solid var(--color-border-base)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'var(--color-overlay-03)',
      }}
    >
      <span style={{ fontSize: 14 }}>{emoji}</span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--color-text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span
          style={{
            width: 3,
            height: 10,
            borderRadius: 2,
            background: accent,
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        {label}
      </span>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function SoundPalette({ selectedMapId, onSwitchToTriggers }: SoundPaletteProps) {
  const [selectedBrick, setSelectedBrick] = useState<SoundBrick | null>(null);
  const [params, setParams] = useState<SoundBrickParams>({
    pitch: 0.5,
    length: 0.4,
    slide: 0.0,
  });

  // ── Store bindings ──────────────────────────────────────────────────────────
  const mapMetadata = useMapsStore((s) =>
    selectedMapId ? s.maps.find((m) => m.id === selectedMapId) : undefined
  );
  const mapData = useMapsStore((s) => (selectedMapId ? s.mapDataById[selectedMapId] : undefined));
  const updateMapMeta = useMapsStore((s) => s.updateMapMetadata);

  const audioZones = mapData?._ac_audio_zones ?? [];
  const bgmBrickId = mapMetadata?.bgmBrickId ?? '';
  const bgmAudioUrl = mapMetadata?.bgmAudioUrl ?? '';

  // ── Audio assets pour le sélecteur de fichier ───────────────────────────────
  const { assets: allAssets, reloadManifest } = useAssets({ category: 'audio' });
  const audioAssets = allAssets; // déjà filtrés par catégorie 'audio'

  // ── Upload d'un fichier audio depuis le disque ───────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFiles, isUploading } = useAssetUpload({
    category: 'audio',
    onUploadComplete: (uploaded) => {
      // Après upload réussi : recharger le manifest et auto-sélectionner le fichier
      reloadManifest();
      if (!uploaded || uploaded.length === 0) return;
      if (selectedMapId) {
        updateMapMeta(selectedMapId, {
          bgmAudioUrl: convertFileSrcIfNeeded(uploaded[0].path), // ← url Tauri-safe
          bgmBrickId: undefined,
        });
      }
    },
  });

  // Ref pour l'aperçu audio BGM — arrête l'instance précédente avant d'en lancer une nouvelle
  const bgmPreviewRef = useRef<HTMLAudioElement | null>(null);

  // ── Mode BGM : 'file' (fichier uploadé) | 'brick' (procédural) ─────────────
  const [bgmMode, setBgmMode] = useState<'file' | 'brick'>('brick');

  // Synchroniser le mode quand la carte change
  useEffect(() => {
    if (!selectedMapId) return;
    const meta = useMapsStore.getState().maps.find((m) => m.id === selectedMapId);
    setBgmMode(meta?.bgmAudioUrl ? 'file' : 'brick');
  }, [selectedMapId]);

  // Throttle pour éviter la saturation audio
  const lastPlayRef = useRef<number>(0);

  const handlePreview = useCallback(
    (brick: SoundBrick, overrideParams?: SoundBrickParams) => {
      const now = Date.now();
      if (now - lastPlayRef.current < PREVIEW_THROTTLE_MS) return;
      lastPlayRef.current = now;
      playBrick(brick, overrideParams ?? params);
    },
    [params]
  );

  const handleSelectBrick = useCallback((brick: SoundBrick) => {
    setSelectedBrick(brick);
    setParams(brick.defaults);
  }, []);

  const handleSliderChange = useCallback(
    <K extends keyof SoundBrickParams>(key: K, value: number) => {
      setParams((prev) => {
        const next = { ...prev, [key]: value };
        if (selectedBrick) {
          const now = Date.now();
          if (now - lastPlayRef.current >= PREVIEW_THROTTLE_MS) {
            lastPlayRef.current = now;
            playBrick(selectedBrick, next);
          }
        }
        return next;
      });
    },
    [selectedBrick]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* ── Contenu scrollable ── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* ══════════════════════════════════════════════════════
            SECTION 1 — MUSIQUE DE FOND (BGM)
        ══════════════════════════════════════════════════════ */}
        <SectionHeader emoji="🎵" label="Musique de fond" accent="#a78bfa" />

        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border-base)' }}>
          {!selectedMapId ? (
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: 'var(--color-text-secondary)',
                fontStyle: 'italic',
              }}
            >
              Sélectionnez une carte pour configurer la BGM.
            </p>
          ) : (
            <>
              {/* Toggle mode : Fichier audio / Brique sonore */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                {(['file', 'brick'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setBgmMode(mode)}
                    style={{
                      flex: 1,
                      fontSize: 10,
                      padding: '3px 0',
                      borderRadius: 3,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor:
                        bgmMode === mode ? 'var(--color-primary)' : 'var(--color-border-base)',
                      background: bgmMode === mode ? 'var(--color-primary-15)' : 'transparent',
                      color:
                        bgmMode === mode ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      fontWeight: bgmMode === mode ? 700 : 400,
                    }}
                  >
                    {mode === 'file' ? '🎵 Fichier audio' : '🎛 Brique sonore'}
                  </button>
                ))}
              </div>

              {/* Mode Fichier audio */}
              {bgmMode === 'file' && (
                <>
                  {/* Input fichier caché */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,.mp3,.ogg,.wav,.flac,.m4a,.aac"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      if (files.length > 0) uploadFiles(files);
                      // Reset pour permettre de re-sélectionner le même fichier
                      e.target.value = '';
                    }}
                  />

                  <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                    {/* Dropdown fichiers existants */}
                    <select
                      value={bgmAudioUrl}
                      onChange={(e) => {
                        updateMapMeta(selectedMapId, {
                          bgmAudioUrl: e.target.value || undefined,
                          bgmBrickId: undefined,
                        });
                      }}
                      style={{
                        flex: 1,
                        fontSize: 11,
                        padding: '3px 6px',
                        borderRadius: 4,
                        border: '1px solid var(--color-border-base)',
                        background: 'var(--color-bg-base)',
                        color: 'var(--color-text-base)',
                        outline: 'none',
                        minWidth: 0,
                      }}
                    >
                      <option value="">🔇 Aucune</option>
                      {audioAssets.map((a) => (
                        <option key={a.path} value={a.url ?? a.path}>
                          {a.name}
                        </option>
                      ))}
                    </select>

                    {/* Bouton Parcourir */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      title="Chercher un fichier MP3/OGG/WAV sur votre ordinateur"
                      style={{
                        flexShrink: 0,
                        fontSize: 11,
                        padding: '3px 8px',
                        borderRadius: 4,
                        cursor: isUploading ? 'wait' : 'pointer',
                        border: '1px solid var(--color-border-base)',
                        background: 'var(--color-overlay-05)',
                        color: 'var(--color-text-base)',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        opacity: isUploading ? 0.6 : 1,
                      }}
                    >
                      {isUploading ? '⏳…' : '📁 Parcourir'}
                    </button>
                  </div>

                  {/* Hint si aucun fichier */}
                  {audioAssets.length === 0 && !isUploading && (
                    <p
                      style={{
                        margin: '0 0 6px',
                        fontSize: 10,
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.4,
                      }}
                    >
                      Cliquez sur <strong>Parcourir</strong> pour ajouter un fichier MP3, OGG ou WAV
                      depuis votre ordinateur.
                    </p>
                  )}

                  {/* Bouton écouter */}
                  {bgmAudioUrl && (
                    <button
                      onClick={() => {
                        try {
                          // Arrêter l'aperçu précédent avant d'en lancer un nouveau
                          if (bgmPreviewRef.current) {
                            bgmPreviewRef.current.pause();
                            bgmPreviewRef.current = null;
                          }
                          const a = new Audio(bgmAudioUrl);
                          bgmPreviewRef.current = a;
                          a.volume = 0.5;
                          a.play().catch(() => {});
                          setTimeout(() => {
                            a.pause();
                            if (bgmPreviewRef.current === a) bgmPreviewRef.current = null;
                          }, 4000);
                        } catch {
                          /* silencieux */
                        }
                      }}
                      style={{
                        width: '100%',
                        fontSize: 11,
                        padding: '4px 0',
                        borderRadius: 4,
                        border: '1px solid var(--color-primary-40)',
                        background: 'var(--color-primary-muted)',
                        color: 'var(--color-primary)',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      ▶ Écouter (4s)
                    </button>
                  )}
                </>
              )}

              {/* Mode Brique sonore */}
              {bgmMode === 'brick' && (
                <>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 10,
                      color: 'var(--color-text-secondary)',
                      marginBottom: 3,
                    }}
                  >
                    Son procédural joué en boucle
                  </span>
                  <select
                    value={bgmBrickId}
                    onChange={(e) => {
                      updateMapMeta(selectedMapId, {
                        bgmBrickId: e.target.value || undefined,
                        bgmAudioUrl: undefined, // clear fichier quand brique sélectionnée
                      });
                    }}
                    style={{
                      width: '100%',
                      fontSize: 11,
                      padding: '3px 6px',
                      borderRadius: 4,
                      border: '1px solid var(--color-border-base)',
                      background: 'var(--color-bg-base)',
                      color: 'var(--color-text-base)',
                      outline: 'none',
                      marginBottom: 6,
                    }}
                  >
                    <option value="">🔇 Aucune musique</option>
                    {SOUND_BRICKS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.emoji} {b.label}
                      </option>
                    ))}
                  </select>
                  {bgmBrickId && (
                    <button
                      onClick={() => {
                        const brick = SOUND_BRICKS.find((b) => b.id === bgmBrickId);
                        if (brick) handlePreview(brick, brick.defaults);
                      }}
                      style={{
                        width: '100%',
                        fontSize: 11,
                        padding: '4px 0',
                        borderRadius: 4,
                        border: '1px solid var(--color-primary-40)',
                        background: 'var(--color-primary-muted)',
                        color: 'var(--color-primary)',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      ▶ Écouter la BGM
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════
            SECTION 2 — BRIQUES SONORES
        ══════════════════════════════════════════════════════ */}
        <SectionHeader emoji="🔊" label="Briques sonores" accent="#fb923c" />

        {/* Grille de briques par catégorie */}
        {SOUND_BRICK_CATEGORIES.map((cat) => {
          const bricksInCat = SOUND_BRICKS.filter((b) => b.category === cat.id);
          if (bricksInCat.length === 0) return null;
          return (
            <div key={cat.id}>
              <div
                style={{
                  padding: '5px 10px 3px',
                  background: 'var(--color-overlay-03)',
                  borderTop: '1px solid var(--color-border-base)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <span style={{ fontSize: 12 }}>{cat.emoji}</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {cat.label}
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 5,
                  padding: '5px 8px',
                }}
              >
                {bricksInCat.map((brick) => (
                  <BrickCard
                    key={brick.id}
                    brick={brick}
                    isSelected={selectedBrick?.id === brick.id}
                    onSelect={handleSelectBrick}
                    onPreview={handlePreview}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Sound Playground (visible si brique sélectionnée) */}
        {selectedBrick && (
          <div
            style={{
              margin: '8px',
              padding: '10px 12px',
              borderRadius: 10,
              border: `1px solid ${selectedBrick.color}44`,
              background: `${selectedBrick.color}11`,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16 }}>{selectedBrick.emoji}</span>
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: selectedBrick.color }}>
                  {selectedBrick.label}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  Bouge les curseurs pour changer le son
                </p>
              </div>
            </div>

            <ChildSlider
              emoji="🎵"
              label="Hauteur"
              hint={params.pitch < 0.35 ? 'grave' : params.pitch > 0.65 ? 'aigu' : 'normal'}
              value={params.pitch}
              onChange={(v) => handleSliderChange('pitch', v)}
            />
            <ChildSlider
              emoji="⏱"
              label="Longueur"
              hint={params.length < 0.35 ? 'court' : params.length > 0.65 ? 'long' : 'normal'}
              value={params.length}
              onChange={(v) => handleSliderChange('length', v)}
            />
            <ChildSlider
              emoji="🌊"
              label="Glissement"
              hint={params.slide < -0.2 ? 'descend' : params.slide > 0.2 ? 'monte' : 'stable'}
              value={(params.slide + 1) / 2}
              onChange={(v) => handleSliderChange('slide', v * 2 - 1)}
            />

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => handlePreview(selectedBrick)}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  borderRadius: 6,
                  border: `1.5px solid ${selectedBrick.color}`,
                  background: `${selectedBrick.color}22`,
                  color: selectedBrick.color,
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                🔊 Rejouer
              </button>
              <button
                onClick={() => setParams(selectedBrick.defaults)}
                title="Remettre les paramètres d'origine"
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--color-border-base)',
                  background: 'transparent',
                  color: 'var(--color-text-secondary)',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                ↺ Reset
              </button>
            </div>

            {/* Bouton "Placer sur la carte" (contexte carte sélectionnée) */}
            {selectedMapId && onSwitchToTriggers && (
              <button
                onClick={() => onSwitchToTriggers(selectedBrick.id)}
                style={{
                  width: '100%',
                  padding: '6px 0',
                  borderRadius: 6,
                  cursor: 'pointer',
                  border: '1.5px solid var(--zone-audio-badge)',
                  background: 'var(--zone-audio-subtle)',
                  color: 'var(--zone-audio-solid)',
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                📍 Placer sur la carte
              </button>
            )}
          </div>
        )}

        {/* Hint initial si rien de sélectionné */}
        {!selectedBrick && (
          <div
            style={{
              margin: '8px 10px',
              padding: '10px 12px',
              borderRadius: 8,
              background: 'var(--color-primary-07)',
              border: '1px dashed var(--color-primary-30)',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: 0, fontSize: 13 }}>👆</p>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 12,
                color: 'var(--color-text-secondary)',
                lineHeight: 1.4,
              }}
            >
              Clique sur une brique
              <br />
              pour entendre le son
            </p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            SECTION 3 — ZONES SONORES SUR LA CARTE
        ══════════════════════════════════════════════════════ */}
        <SectionHeader emoji="📍" label={`Zones sonores (${audioZones.length})`} accent="#4ade80" />

        <div style={{ padding: '6px 8px 10px' }}>
          {!selectedMapId ? (
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: 'var(--color-text-secondary)',
                fontStyle: 'italic',
              }}
            >
              Sélectionnez une carte pour voir les zones.
            </p>
          ) : audioZones.length === 0 ? (
            <p
              style={{
                margin: '0 0 6px',
                fontSize: 11,
                color: 'var(--color-text-secondary)',
                textAlign: 'center',
                paddingTop: 4,
              }}
            >
              Aucune zone sonore sur cette carte.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 6 }}>
              {audioZones.map((az) => {
                const brick = SOUND_BRICKS.find((b) => b.id === az.soundBrickId);
                return (
                  <div
                    key={az.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '4px 6px',
                      borderRadius: 4,
                      background: 'var(--zone-audio-subtle)',
                      border: '1px solid var(--zone-audio-badge)',
                      fontSize: 11,
                    }}
                  >
                    <span style={{ fontSize: 13, flexShrink: 0 }}>{brick?.emoji ?? '🔊'}</span>
                    <span
                      style={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'var(--color-text-base)',
                      }}
                    >
                      {az.label || brick?.label || '(sans nom)'}
                    </span>
                    {az.once && (
                      <span
                        style={{ fontSize: 9, color: 'var(--color-text-secondary)', flexShrink: 0 }}
                      >
                        1×
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Bouton Ajouter une zone */}
          {selectedMapId && onSwitchToTriggers && (
            <button
              onClick={() => onSwitchToTriggers(selectedBrick?.id)}
              style={{
                width: '100%',
                padding: '5px 0',
                borderRadius: 4,
                cursor: 'pointer',
                border: '1px solid var(--color-primary-40)',
                background: 'var(--color-primary-muted)',
                color: 'var(--color-primary)',
                fontSize: 11,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <span style={{ fontSize: 13 }}>+</span>
              {selectedBrick
                ? `Placer "${selectedBrick.label}" sur la carte`
                : 'Ajouter une zone sonore'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
