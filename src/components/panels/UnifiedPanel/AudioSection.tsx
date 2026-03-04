import { useCallback, useRef, useState } from 'react';
import { Music, Library, Play, Square, Trash2, RefreshCw, AlertCircle, Wind } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useSceneById, useSceneActions } from '@/stores/selectors';
import { AUDIO_DEFAULTS } from '@/config/constants';
import { logger } from '@/utils/logger';
import { SfxGeneratorPanel } from './SfxGeneratorPanel';
import type { SceneAudio, AmbientAudio } from '@/types/audio';

// ============================================================================
// TYPES
// ============================================================================

interface AudioSectionProps {
  onOpenModal: (modal: string, context?: unknown) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

function getFilename(url: string): string {
  return url.split('/').pop()?.replace(/\.[^.]+$/, '') ?? url;
}

function getExtension(url: string): string {
  return url.split('.').pop()?.toUpperCase() ?? '?';
}

// ============================================================================
// IOS TOGGLE
// ============================================================================

function IosToggle({ enabled, onToggle, label }: { enabled: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      onClick={onToggle}
      className={[
        'relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)]',
        enabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-bg-hover)]',
      ].join(' ')}
      role="switch"
      aria-checked={enabled}
      aria-label={`${enabled ? 'Désactiver' : 'Activer'} ${label}`}
    >
      <span className={[
        'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
        enabled ? 'translate-x-4' : 'translate-x-0.5',
      ].join(' ')} />
    </button>
  );
}

// ============================================================================
// BGM CONTROLS
// ============================================================================

interface MusicControlsProps {
  audio: SceneAudio;
  onUpdate: (patch: Partial<SceneAudio>) => void;
  onRemove: () => void;
  onOpenLibrary: () => void;
}

function MusicControls({ audio, onUpdate, onRemove, onOpenLibrary }: MusicControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playError, setPlayError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePreview = useCallback(() => {
    setPlayError(false);
    if (isPlaying) {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }
    const player = new Audio(audio.url);
    player.volume = audio.volume ?? AUDIO_DEFAULTS.MUSIC_VOLUME;
    player.play().then(() => {
      setIsPlaying(true);
      player.onended = () => setIsPlaying(false);
    }).catch((err) => {
      logger.warn('[AudioSection] Preview playback failed:', audio.url, err);
      setPlayError(true);
      setIsPlaying(false);
    });
    audioRef.current = player;
  }, [audio.url, audio.volume, isPlaying]);

  const volume = audio.volume ?? AUDIO_DEFAULTS.MUSIC_VOLUME;
  const durationMode = audio.durationMode ?? 'scene';
  const isLooping = audio.loop ?? true;
  const isContinuing = audio.continueToNextScene ?? false;

  return (
    <>
      {/* Fichier + extension */}
      <div className="flex items-center gap-2 mb-2">
        <Music className="w-3.5 h-3.5 text-[var(--color-primary)] flex-shrink-0" aria-hidden="true" />
        <span className="flex-1 text-[12px] text-[var(--color-text-primary)] truncate" title={audio.url}>
          {getFilename(audio.url)}
        </span>
        <span className="text-[10px] font-mono text-[var(--color-text-muted)] bg-[var(--color-bg-base)] px-1.5 py-0.5 rounded border border-[var(--color-border-base)] flex-shrink-0">
          {getExtension(audio.url)}
        </span>
      </div>

      {/* Volume */}
      <div className="sp-row">
        <span>Volume</span>
        <span>{Math.round(volume * 100)}%</span>
      </div>
      <input
        type="range" min="0" max="1" step="0.05" value={volume}
        onChange={e => {
          const vol = parseFloat(e.target.value);
          onUpdate({ volume: vol });
          if (audioRef.current) audioRef.current.volume = vol;
        }}
        className="sp-slider mb-3"
        aria-label={`Volume de la musique : ${Math.round(volume * 100)} %`}
      />

      {/* Actions : Écouter | Changer | Supprimer */}
      <div className="flex gap-2 mb-0">
        <button
          onClick={handlePreview}
          className={[
            'flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 px-2 rounded-lg border transition-all',
            isPlaying
              ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]/60 text-[var(--color-primary)]'
              : playError
                ? 'bg-red-500/10 border-red-500/40 text-red-400'
                : 'bg-[var(--color-bg-base)] border-[var(--color-border-base)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]',
          ].join(' ')}
          aria-label={isPlaying ? 'Arrêter la lecture' : 'Écouter un extrait'}
        >
          {playError
            ? <><AlertCircle className="w-3 h-3" aria-hidden="true" /> Erreur</>
            : isPlaying
              ? <><Square className="w-3 h-3" aria-hidden="true" /> Arrêter</>
              : <><Play className="w-3 h-3" aria-hidden="true" /> Écouter</>
          }
        </button>
        <button
          onClick={onOpenLibrary}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 px-2 rounded-lg border border-[var(--color-border-base)] bg-[var(--color-bg-base)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)] transition-all"
          aria-label="Changer de musique"
        >
          <RefreshCw className="w-3 h-3" aria-hidden="true" /> Changer
        </button>
        <button
          onClick={onRemove}
          className="p-1.5 rounded-lg border border-[var(--color-border-base)] bg-[var(--color-bg-base)] text-[var(--color-text-muted)] hover:bg-red-500/10 hover:text-red-400 hover:border-red-400/40 transition-colors"
          aria-label="Supprimer la musique"
        >
          <Trash2 className="w-3 h-3" aria-hidden="true" />
        </button>
      </div>

      {/* Durée — segmented control */}
      <div className="mt-3">
        <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
          Quand s'arrête la musique ?
        </p>
        <div className="sp-seg">
          <button
            onClick={() => onUpdate({ durationMode: 'scene' })}
            className={`sp-seg-btn${durationMode === 'scene' ? ' active' : ''}`}
            aria-pressed={durationMode === 'scene'}
          >
            Toute la scène
          </button>
          <button
            onClick={() => onUpdate({ durationMode: 'dialogues' })}
            className={`sp-seg-btn${durationMode === 'dialogues' ? ' active' : ''}`}
            aria-pressed={durationMode === 'dialogues'}
          >
            X dialogues
          </button>
        </div>
        {durationMode === 'dialogues' && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-[var(--color-text-muted)]">Nombre :</span>
            <input
              type="number" min="1" max="99"
              value={audio.durationDialogues ?? 1}
              onChange={e => onUpdate({ durationDialogues: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              className="w-14 text-xs text-center border border-[var(--color-border-base)] rounded-lg px-1 py-1 bg-[var(--color-bg-base)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
            />
            <span className="text-xs text-[var(--color-text-muted)]">dialogue(s)</span>
          </div>
        )}
      </div>

      {/* Options — toggles iOS */}
      <div className="mt-3 space-y-2">
        <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
          Options
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--color-text-secondary)]">Musique en boucle</span>
          <IosToggle
            enabled={isLooping}
            onToggle={() => onUpdate({ loop: !isLooping })}
            label="Musique en boucle"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--color-text-secondary)]">Continue après la scène</span>
          <IosToggle
            enabled={isContinuing}
            onToggle={() => onUpdate({ continueToNextScene: !isContinuing })}
            label="Continue après la scène"
          />
        </div>
      </div>
    </>
  );
}

// ============================================================================
// AMBIENT TRACK SLOT
// ============================================================================

interface AmbientTrackSlotProps {
  slot: 0 | 1;
  track: AmbientAudio | undefined;
  onUpdate: (patch: Partial<AmbientAudio>) => void;
  onRemove: () => void;
  onOpenLibrary: () => void;
}

function AmbientTrackSlot({ slot, track, onUpdate, onRemove, onOpenLibrary }: AmbientTrackSlotProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playError, setPlayError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePreview = useCallback(() => {
    if (!track) return;
    setPlayError(false);
    if (isPlaying) {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }
    const player = new Audio(track.url);
    player.volume = track.volume ?? AUDIO_DEFAULTS.AMBIENT_VOLUME;
    player.play().then(() => {
      setIsPlaying(true);
      player.onended = () => setIsPlaying(false);
    }).catch(() => {
      setPlayError(true);
      setIsPlaying(false);
    });
    audioRef.current = player;
  }, [track, isPlaying]);

  const volume = track?.volume ?? AUDIO_DEFAULTS.AMBIENT_VOLUME;

  // Slot vide
  if (!track) {
    return (
      <button
        onClick={onOpenLibrary}
        className="w-full flex items-center justify-center gap-2 text-xs py-2 px-3 rounded-lg border border-dashed border-[var(--color-border-base)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)] transition-colors"
      >
        <Wind className="w-3.5 h-3.5" aria-hidden="true" />
        + Choisir un son d'ambiance {slot + 1}
      </button>
    );
  }

  // Slot rempli — compact
  return (
    <div className="sp-track">
      <div className="flex items-center gap-2 mb-2">
        <Wind className="w-3.5 h-3.5 text-[var(--color-primary)] flex-shrink-0" aria-hidden="true" />
        <span className="flex-1 text-[12px] text-[var(--color-text-primary)] truncate" title={track.url}>
          {getFilename(track.url)}
        </span>
        <span className="text-[10px] font-mono text-[var(--color-text-muted)] bg-[var(--color-bg-base)] px-1.5 py-0.5 rounded border border-[var(--color-border-base)] flex-shrink-0">
          {getExtension(track.url)} · loop
        </span>
        <button
          onClick={onRemove}
          className="p-1 rounded hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-400 transition-colors flex-shrink-0"
          aria-label={`Supprimer le son d'ambiance ${slot + 1}`}
        >
          <Trash2 className="w-3 h-3" aria-hidden="true" />
        </button>
      </div>
      <div className="sp-row">
        <span>Volume</span>
        <span>{Math.round(volume * 100)}%</span>
      </div>
      <input
        type="range" min="0" max="1" step="0.05" value={volume}
        onChange={e => {
          const vol = parseFloat(e.target.value);
          onUpdate({ volume: vol });
          if (audioRef.current) audioRef.current.volume = vol;
        }}
        className="sp-slider mb-2"
        aria-label={`Volume ambiance ${slot + 1} : ${Math.round(volume * 100)} %`}
      />
      <button
        onClick={handlePreview}
        className={[
          'w-full flex items-center justify-center gap-1.5 text-xs py-1.5 px-2 rounded-lg border transition-all',
          isPlaying
            ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]/60 text-[var(--color-primary)]'
            : playError
              ? 'bg-red-500/10 border-red-500/40 text-red-400'
              : 'bg-[var(--color-bg-base)] border-[var(--color-border-base)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40',
        ].join(' ')}
      >
        {playError
          ? <><AlertCircle className="w-3 h-3" aria-hidden="true" /> Fichier introuvable</>
          : isPlaying
            ? <><Square className="w-3 h-3" aria-hidden="true" /> Arrêter</>
            : <><Play className="w-3 h-3" aria-hidden="true" /> Écouter</>
        }
      </button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AudioSection({ onOpenModal }: AudioSectionProps) {
  const sceneId = useUIStore(s => s.selectedSceneForEdit);
  const scene = useSceneById(sceneId);
  const { updateScene } = useSceneActions();

  const audio = scene?.audio;
  const ambientTracks = scene?.ambientTracks;
  const ambientCount = [ambientTracks?.[0], ambientTracks?.[1]].filter(Boolean).length;

  const handleBgmUpdate = useCallback((patch: Partial<SceneAudio>) => {
    if (!sceneId) return;
    updateScene(sceneId, { audio: { url: '', ...audio, ...patch } as SceneAudio });
  }, [sceneId, audio, updateScene]);

  const handleBgmRemove = useCallback(() => {
    if (!sceneId) return;
    updateScene(sceneId, { audio: undefined });
  }, [sceneId, updateScene]);

  const handleOpenMusicLibrary = useCallback(() => {
    onOpenModal('assets', { category: 'music', targetSceneId: sceneId ?? undefined, purpose: 'sceneAudio' });
  }, [onOpenModal, sceneId]);

  const handleAmbientUpdate = useCallback((slot: 0 | 1, patch: Partial<AmbientAudio>) => {
    if (!sceneId) return;
    const current: [AmbientAudio?, AmbientAudio?] = [...(ambientTracks ?? [])];
    current[slot] = { url: '', ...current[slot], ...patch } as AmbientAudio;
    updateScene(sceneId, { ambientTracks: current });
  }, [sceneId, ambientTracks, updateScene]);

  const handleAmbientRemove = useCallback((slot: 0 | 1) => {
    if (!sceneId) return;
    const current: [AmbientAudio?, AmbientAudio?] = [...(ambientTracks ?? [])];
    current[slot] = undefined;
    updateScene(sceneId, { ambientTracks: current });
  }, [sceneId, ambientTracks, updateScene]);

  const handleOpenAmbientLibrary = useCallback((slot: 0 | 1) => {
    onOpenModal('assets', { category: 'atmosphere', targetSceneId: sceneId ?? undefined, purpose: 'ambientTrack', slot });
  }, [onOpenModal, sceneId]);

  if (!sceneId || !scene) {
    return (
      <section className="sp-sec">
        <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
          <Music className="w-6 h-6 text-[var(--color-text-muted)]" aria-hidden="true" />
          <p className="text-xs text-[var(--color-text-muted)]">
            Sélectionne une scène pour configurer l'audio
          </p>
        </div>
      </section>
    );
  }

  return (
    <div>

      {/* === Musique de fond === */}
      <section className="sp-sec" aria-labelledby="audio-bgm-heading">
        <h3 id="audio-bgm-heading" className="sp-lbl">MUSIQUE DE FOND</h3>
        {audio?.url ? (
          <MusicControls
            audio={audio}
            onUpdate={handleBgmUpdate}
            onRemove={handleBgmRemove}
            onOpenLibrary={handleOpenMusicLibrary}
          />
        ) : (
          <button
            onClick={handleOpenMusicLibrary}
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-3 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
            aria-label="Parcourir la bibliothèque musicale"
          >
            <Library className="w-4 h-4" aria-hidden="true" />
            Parcourir la bibliothèque
          </button>
        )}
      </section>

      {/* === Ambiance sonore === */}
      <section className="sp-sec" aria-labelledby="audio-ambient-heading">
        <h3 id="audio-ambient-heading" className="sp-lbl">
          AMBIANCE SONORE
          {ambientCount > 0 && (
            <span className="ml-auto text-[10px] font-semibold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-full normal-case tracking-normal">
              {ambientCount} piste{ambientCount > 1 ? 's' : ''}
            </span>
          )}
        </h3>
        <div className="space-y-2">
          <AmbientTrackSlot
            slot={0}
            track={ambientTracks?.[0]}
            onUpdate={(patch) => handleAmbientUpdate(0, patch)}
            onRemove={() => handleAmbientRemove(0)}
            onOpenLibrary={() => handleOpenAmbientLibrary(0)}
          />
          {ambientTracks?.[0] && (
            <AmbientTrackSlot
              slot={1}
              track={ambientTracks?.[1]}
              onUpdate={(patch) => handleAmbientUpdate(1, patch)}
              onRemove={() => handleAmbientRemove(1)}
              onOpenLibrary={() => handleOpenAmbientLibrary(1)}
            />
          )}
        </div>
      </section>

      {/* === Générateur SFX 8-bit === */}
      <section className="sp-sec" aria-labelledby="audio-sfx-heading">
        <h3 id="audio-sfx-heading" className="sp-lbl">GÉNÉRATEUR SFX 8-BIT</h3>
        <SfxGeneratorPanel />
      </section>

    </div>
  );
}
