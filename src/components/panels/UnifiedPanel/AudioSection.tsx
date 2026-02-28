import { useCallback, useRef, useState } from 'react';
import { Music, Library, Play, Square, Trash2, RefreshCw, Volume2, Repeat, AlertCircle, Wind } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useSceneById, useSceneActions } from '@/stores/selectors';
import { AUDIO_DEFAULTS } from '@/config/constants';
import { logger } from '@/utils/logger';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
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

// ============================================================================
// SOUS-COMPOSANTS RÉUTILISABLES
// ============================================================================

/** Carte de groupe de contrôles — fond subtil + bordure douce */
function ControlCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[var(--color-bg-base)]/60 border border-[var(--color-border-base)]/50 p-3 space-y-3">
      {children}
    </div>
  );
}

/** Label de contrôle avec icône optionnelle */
function ControlLabel({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="text-[13px] font-medium text-[var(--color-text-primary)] flex items-center gap-1.5">
      {icon}
      {children}
    </p>
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

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    onUpdate({ volume: vol });
    if (audioRef.current) audioRef.current.volume = vol;
  }, [onUpdate]);

  const handleDurationMode = useCallback((mode: 'scene' | 'dialogues') => {
    onUpdate({ durationMode: mode });
  }, [onUpdate]);

  const handleDurationCount = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(1, parseInt(e.target.value, 10) || 1);
    onUpdate({ durationDialogues: val });
  }, [onUpdate]);

  const durationMode = audio.durationMode ?? 'scene';
  const volume = audio.volume ?? AUDIO_DEFAULTS.MUSIC_VOLUME;
  const isLooping = audio.loop ?? true;
  const isContinuing = audio.continueToNextScene ?? false;

  return (
    <div className="space-y-3">

      {/* En-tête fichier */}
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border-base)]">
        <Music className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" aria-hidden="true" />
        <span className="flex-1 text-[13px] text-[var(--color-text-primary)] truncate" title={audio.url}>
          {getFilename(audio.url)}
        </span>
        <button
          onClick={onRemove}
          className="p-1 rounded-lg hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-400 transition-colors flex-shrink-0"
          aria-label="Supprimer la musique"
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Bouton écouter */}
      <button
        onClick={handlePreview}
        className={`w-full flex items-center justify-center gap-2 text-[13px] font-medium py-2.5 px-3 rounded-xl border transition-all min-h-[40px] ${
          isPlaying
            ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]/60 text-[var(--color-primary)]'
            : playError
              ? 'bg-red-500/10 border-red-500/40 text-red-400'
              : 'bg-[var(--color-bg-base)] border-[var(--color-border-base)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]'
        }`}
        aria-label={isPlaying ? 'Arrêter la lecture' : 'Écouter un extrait'}
      >
        {playError
          ? <><AlertCircle className="w-4 h-4" aria-hidden="true" /> Fichier introuvable</>
          : isPlaying
            ? <><Square className="w-4 h-4" aria-hidden="true" /> Arrêter</>
            : <><Play className="w-4 h-4" aria-hidden="true" /> Écouter</>
        }
      </button>

      {/* Carte : Volume + Durée */}
      <ControlCard>
        {/* Volume */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <ControlLabel icon={<Volume2 className="w-3.5 h-3.5" aria-hidden="true" />}>
              Volume
            </ControlLabel>
            <span className="text-[13px] font-semibold text-[var(--color-text-muted)] tabular-nums">
              {Math.round(volume * 100)} %
            </span>
          </div>
          <input
            type="range" min="0" max="1" step="0.05" value={volume}
            onChange={handleVolumeChange}
            className="w-full h-2.5 cursor-pointer rounded-full"
            style={{ accentColor: 'var(--color-primary)' }}
            aria-label={`Volume de la musique : ${Math.round(volume * 100)} %`}
          />
        </div>

        {/* Durée — boutons en colonne */}
        <div className="space-y-2">
          <ControlLabel>⏱️ Quand s'arrête la musique ?</ControlLabel>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleDurationMode('scene')}
              className={`w-full text-[13px] py-2.5 px-3 rounded-xl border transition-all min-h-[40px] text-left flex items-center gap-2 ${
                durationMode === 'scene'
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] font-semibold shadow-md'
                  : 'bg-[var(--color-bg-base)]/80 text-[var(--color-text-secondary)] border-[var(--color-border-base)] hover:border-[var(--color-primary)]/40'
              }`}
              aria-pressed={durationMode === 'scene'}
            >
              🎬 Toute la scène
            </button>
            <button
              onClick={() => handleDurationMode('dialogues')}
              className={`w-full text-[13px] py-2.5 px-3 rounded-xl border transition-all min-h-[40px] text-left flex items-center gap-2 ${
                durationMode === 'dialogues'
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] font-semibold shadow-md'
                  : 'bg-[var(--color-bg-base)]/80 text-[var(--color-text-secondary)] border-[var(--color-border-base)] hover:border-[var(--color-primary)]/40'
              }`}
              aria-pressed={durationMode === 'dialogues'}
            >
              💬 Seulement X dialogues
            </button>
          </div>

          {durationMode === 'dialogues' && (
            <div className="flex items-center gap-2 pt-1">
              <label htmlFor="audio-duration-count" className="text-[13px] text-[var(--color-text-muted)] flex-shrink-0">
                Nombre :
              </label>
              <input
                id="audio-duration-count"
                type="number" min="1" max="99"
                value={audio.durationDialogues ?? 1}
                onChange={handleDurationCount}
                className="w-16 text-[13px] text-center border border-[var(--color-border-base)] rounded-lg px-1 py-1 bg-[var(--color-bg-base)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              />
              <span className="text-xs text-[var(--color-text-muted)]">dialogue(s)</span>
            </div>
          )}
        </div>
      </ControlCard>

      {/* Carte : Options (boucle + continue) */}
      <ControlCard>
        {/* Boucle */}
        <div className="space-y-2">
          <ControlLabel icon={<Repeat className="w-3.5 h-3.5" aria-hidden="true" />}>
            Musique en boucle ?
          </ControlLabel>
          <div className="flex gap-2">
            <button
              onClick={() => onUpdate({ loop: true })}
              className={`flex-1 text-[13px] py-2.5 rounded-xl border transition-all min-h-[40px] font-semibold ${
                isLooping
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                  : 'bg-[var(--color-bg-base)] text-[var(--color-text-secondary)] border-[var(--color-border-base)] hover:border-[var(--color-primary)]'
              }`}
              aria-pressed={isLooping}
            >
              OUI
            </button>
            <button
              onClick={() => onUpdate({ loop: false })}
              className={`flex-1 text-[13px] py-2.5 rounded-xl border transition-all min-h-[40px] font-semibold ${
                !isLooping
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                  : 'bg-[var(--color-bg-base)] text-[var(--color-text-secondary)] border-[var(--color-border-base)] hover:border-[var(--color-primary)]'
              }`}
              aria-pressed={!isLooping}
            >
              NON
            </button>
          </div>
        </div>

        {/* Continue */}
        <div className="space-y-2">
          <ControlLabel icon={<RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />}>
            Continue après la scène ?
          </ControlLabel>
          <div className="flex gap-2">
            <button
              onClick={() => onUpdate({ continueToNextScene: true })}
              className={`flex-1 text-[13px] py-2.5 rounded-xl border transition-all min-h-[40px] font-semibold ${
                isContinuing
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                  : 'bg-[var(--color-bg-base)] text-[var(--color-text-secondary)] border-[var(--color-border-base)] hover:border-[var(--color-primary)]'
              }`}
              aria-pressed={isContinuing}
            >
              OUI
            </button>
            <button
              onClick={() => onUpdate({ continueToNextScene: false })}
              className={`flex-1 text-[13px] py-2.5 rounded-xl border transition-all min-h-[40px] font-semibold ${
                !isContinuing
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                  : 'bg-[var(--color-bg-base)] text-[var(--color-text-secondary)] border-[var(--color-border-base)] hover:border-[var(--color-primary)]'
              }`}
              aria-pressed={!isContinuing}
            >
              NON
            </button>
          </div>
        </div>
      </ControlCard>

      {/* Changer de musique */}
      <button
        onClick={onOpenLibrary}
        className="w-full flex items-center justify-center gap-2 text-[13px] py-2 px-3 rounded-xl border border-dashed border-[var(--color-border-base)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)] transition-colors min-h-[36px]"
      >
        <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
        Changer de musique
      </button>
    </div>
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

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    onUpdate({ volume: vol });
    if (audioRef.current) audioRef.current.volume = vol;
  }, [onUpdate]);

  const slotLabel = `Son d'ambiance ${slot + 1}`;
  const volume = track?.volume ?? AUDIO_DEFAULTS.AMBIENT_VOLUME;

  // Slot vide
  if (!track) {
    return (
      <div className="space-y-1.5">
        <p className="text-xs text-[var(--color-text-muted)]">{slotLabel} — non choisi</p>
        <button
          onClick={onOpenLibrary}
          className="w-full flex items-center justify-center gap-2 text-[13px] py-2.5 px-3 rounded-xl border border-dashed border-[var(--color-border-base)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)] transition-colors min-h-[40px]"
        >
          <Wind className="w-3.5 h-3.5" aria-hidden="true" />
          + Choisir un son d'ambiance
        </button>
      </div>
    );
  }

  // Slot rempli
  return (
    <ControlCard>
      {/* En-tête fichier */}
      <div className="flex items-center gap-2">
        <Wind className="w-3.5 h-3.5 text-[var(--color-primary)] flex-shrink-0" aria-hidden="true" />
        <span className="flex-1 text-[13px] text-[var(--color-text-primary)] truncate" title={track.url}>
          {getFilename(track.url)}
        </span>
        <span className="text-xs text-[var(--color-text-muted)] flex-shrink-0 bg-[var(--color-bg-base)] px-1.5 py-0.5 rounded-md border border-[var(--color-border-base)]">
          {slot + 1}
        </span>
        <button
          onClick={onRemove}
          className="p-1 rounded-lg hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-400 transition-colors flex-shrink-0"
          aria-label={`Supprimer ${slotLabel.toLowerCase()}`}
        >
          <Trash2 className="w-3 h-3" aria-hidden="true" />
        </button>
      </div>

      {/* Volume */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <ControlLabel icon={<Volume2 className="w-3.5 h-3.5" aria-hidden="true" />}>
            Volume
          </ControlLabel>
          <span className="text-[13px] font-semibold text-[var(--color-text-muted)] tabular-nums">
            {Math.round(volume * 100)} %
          </span>
        </div>
        <input
          type="range" min="0" max="1" step="0.05" value={volume}
          onChange={handleVolumeChange}
          className="w-full h-2.5 cursor-pointer rounded-full"
          style={{ accentColor: 'var(--color-primary)' }}
          aria-label={`Volume ${slotLabel} : ${Math.round(volume * 100)} %`}
        />
      </div>

      {/* Preview */}
      <button
        onClick={handlePreview}
        className={`w-full flex items-center justify-center gap-2 text-[13px] py-2.5 px-3 rounded-xl border transition-all min-h-[40px] ${
          isPlaying
            ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]/60 text-[var(--color-primary)]'
            : playError
              ? 'bg-red-500/10 border-red-500/40 text-red-400'
              : 'bg-[var(--color-bg-base)]/80 border-[var(--color-border-base)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]'
        }`}
      >
        {playError
          ? <><AlertCircle className="w-4 h-4" aria-hidden="true" /> Fichier introuvable</>
          : isPlaying
            ? <><Square className="w-4 h-4" aria-hidden="true" /> Arrêter</>
            : <><Play className="w-4 h-4" aria-hidden="true" /> Écouter</>
        }
      </button>
    </ControlCard>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * AudioSection — Panneau de configuration audio pour la scène sélectionnée.
 *
 * Design pour public mixte (adultes + 8 ans+) — Panel 3 à 320px :
 * - 🎵 Musique de fond : fichier, écouter, volume, durée, boucle, continue
 * - 🌿 Ambiance sonore : 2 pistes indépendantes en boucle
 * - 📚 Bibliothèque audio : accès aux fichiers
 *
 * Principes UX :
 * - Cartes de groupe (ControlCard) pour séparer les contrôles visuellement
 * - Boutons durée en colonne (pas de wrap)
 * - Toggles OUI/NON avec shadow-md sur l'état actif
 * - text-[13px] pour les labels, text-xs pour les textes secondaires
 */
export function AudioSection({ onOpenModal }: AudioSectionProps) {
  const sceneId = useUIStore(s => s.selectedSceneForEdit);
  const scene = useSceneById(sceneId);
  const { updateScene } = useSceneActions();

  const audio = scene?.audio;
  const ambientTracks = scene?.ambientTracks;
  const ambientCount = [ambientTracks?.[0], ambientTracks?.[1]].filter(Boolean).length;

  // ── BGM handlers ──
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

  // ── Ambient handlers ──
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

  // Aucune scène sélectionnée
  if (!sceneId || !scene) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-2 p-4 text-center">
        <Music className="w-6 h-6 text-[var(--color-text-muted)]" aria-hidden="true" />
        <p className="text-[13px] text-[var(--color-text-muted)]">
          Sélectionne une scène pour configurer l'audio
        </p>
      </div>
    );
  }

  return (
    <div className="px-3 py-2 space-y-1.5">

      {/* === Musique de fond === */}
      <div className="pl-2 border-l-2 border-[var(--color-primary)]/50 py-0.5">
        <CollapsibleSection
          title="🎵 Musique de fond"
          variant="flat"
          defaultOpen={true}
        >
          <div className="pb-3">
            {audio?.url ? (
              <MusicControls
                audio={audio}
                onUpdate={handleBgmUpdate}
                onRemove={handleBgmRemove}
                onOpenLibrary={handleOpenMusicLibrary}
              />
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleOpenMusicLibrary}
                  className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold py-3 px-3 rounded-xl bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity min-h-[44px] shadow-md"
                >
                  <Library className="w-4 h-4" aria-hidden="true" />
                  Choisir dans la bibliothèque
                </button>
                <p className="text-xs text-[var(--color-text-muted)] text-center">
                  Aucune musique pour cette scène
                </p>
              </div>
            )}
          </div>
        </CollapsibleSection>
      </div>

      <div className="border-t border-[var(--color-border-base)]" aria-hidden="true" />

      {/* === Ambiance sonore === */}
      <div className="pl-2 border-l-2 border-[var(--color-primary)]/50 py-0.5">
        <CollapsibleSection
          title="🌿 Ambiance sonore"
          variant="flat"
          defaultOpen={false}
          badge={ambientCount > 0 ? `${ambientCount} piste${ambientCount > 1 ? 's' : ''}` : undefined}
        >
          <div className="pb-3 space-y-3">
            <p className="text-xs text-[var(--color-text-muted)]">
              Ajoute jusqu'à 2 sons de fond (vent, foule, pluie…) qui tournent en boucle.
            </p>
            <AmbientTrackSlot
              slot={0}
              track={ambientTracks?.[0]}
              onUpdate={(patch) => handleAmbientUpdate(0, patch)}
              onRemove={() => handleAmbientRemove(0)}
              onOpenLibrary={() => handleOpenAmbientLibrary(0)}
            />
            <div className="border-t border-[var(--color-border-base)]/40" aria-hidden="true" />
            <AmbientTrackSlot
              slot={1}
              track={ambientTracks?.[1]}
              onUpdate={(patch) => handleAmbientUpdate(1, patch)}
              onRemove={() => handleAmbientRemove(1)}
              onOpenLibrary={() => handleOpenAmbientLibrary(1)}
            />
          </div>
        </CollapsibleSection>
      </div>

      <div className="border-t border-[var(--color-border-base)]" aria-hidden="true" />

      {/* === Bibliothèque audio === */}
      <div className="pl-2 border-l-2 border-[var(--color-border-base)] py-0.5">
        <CollapsibleSection
          title="📚 Bibliothèque audio"
          variant="flat"
          defaultOpen={false}
        >
          <div className="pb-3 space-y-2">
            <button
              onClick={() => onOpenModal('assets', { category: 'music' })}
              className="w-full flex items-center justify-start gap-2 text-[13px] py-2.5 px-3 rounded-xl border border-[var(--color-border-base)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-text-primary)] bg-[var(--color-bg-base)] transition-colors min-h-[40px]"
            >
              <Library className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              Gérer les fichiers audio
            </button>
            <p className="text-xs text-[var(--color-text-muted)]">
              Importe et organise tes musiques et sons d'ambiance
            </p>
          </div>
        </CollapsibleSection>
      </div>

      <div className="border-t border-[var(--color-border-base)]" aria-hidden="true" />

      {/* === Générateur SFX 8-bit === */}
      <div className="pl-2 border-l-2 border-[var(--color-primary)]/30 py-0.5">
        <CollapsibleSection
          title="🎲 Générateur SFX 8-bit"
          variant="flat"
          defaultOpen={false}
        >
          <div className="pb-3">
            <SfxGeneratorPanel />
          </div>
        </CollapsibleSection>
      </div>

    </div>
  );
}
