import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Music, Volume2, Mic, Play, Pause, Trash2 } from 'lucide-react';
import { logger } from '@/utils/logger';
import type { Asset } from '@/types';

export interface AudioAssetCardProps {
  asset: Asset;
  onClick: () => void;
  onDelete?: () => void;
  isSelectionMode?: boolean;
  onSelectAudio?: () => void;
}

/**
 * AudioAssetCard - Carte d'asset audio avec contrôles de lecture
 *
 * Features:
 * - Bouton play/pause intégré
 * - Barre de progression
 * - Icône selon la catégorie (music, sfx, voices)
 * - Actions visibles (preview, delete)
 */
export function AudioAssetCard({
  asset,
  onClick,
  onDelete,
  isSelectionMode = false,
  onSelectAudio
}: AudioAssetCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getCategoryIcon = () => {
    switch (asset.category) {
      case 'music': return <Music className="h-3 w-3" />;
      case 'sfx': return <Volume2 className="h-3 w-3" />;
      case 'voices': return <Mic className="h-3 w-3" />;
      default: return <Music className="h-3 w-3" />;
    }
  };

  const getCategoryLabel = () => {
    switch (asset.category) {
      case 'music': return 'Musique';
      case 'sfx': return 'SFX';
      case 'voices': return 'Voix';
      default: return asset.category;
    }
  };

  useEffect(() => {
    // Create audio element on mount
    audioRef.current = new Audio(asset.path);

    const audio = audioRef.current;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(0);
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [asset.path]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((e) => logger.error('[AudioAssetCard] Playback failed:', e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleSelect = () => {
    if (onSelectAudio) {
      onSelectAudio();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Stop audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    if (onDelete) {
      onDelete();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card
      className="group overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 cursor-pointer"
      onClick={isSelectionMode ? handleSelect : onClick}
    >
      {/* Audio Visualization Area */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-purple-900/50 to-cyan-900/50 flex items-center justify-center">
        {/* Waveform placeholder */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="flex gap-0.5 items-end h-16">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-white rounded-full transition-all"
                style={{
                  height: `${20 + Math.sin(i * 0.5 + (isPlaying ? Date.now() / 200 : 0)) * 30}%`,
                  opacity: isPlaying ? 1 : 0.5
                }}
              />
            ))}
          </div>
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="z-10 w-14 h-14 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="h-6 w-6 text-white" />
          ) : (
            <Play className="h-6 w-6 text-white ml-1" />
          )}
        </button>

        {/* Category Badge */}
        <Badge
          variant="secondary"
          className="absolute top-2 left-2 bg-black/80 backdrop-blur-md text-white border-0 text-xs font-medium shadow-sm"
        >
          {getCategoryIcon()}
          <span className="ml-1">{getCategoryLabel()}</span>
        </Badge>

        {/* Duration Badge */}
        {duration > 0 && (
          <Badge
            variant="secondary"
            className="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-white border-0 text-xs font-medium shadow-sm"
          >
            {formatDuration(duration)}
          </Badge>
        )}

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
          <div
            className="h-full bg-primary transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

      </div>

      {/* Footer - Name + Actions */}
      <div className="p-2.5 space-y-2">
        <p className="text-xs font-semibold truncate text-foreground" title={asset.name}>
          {asset.name}
        </p>

        {/* Selection mode : bouton Utiliser dans le footer (pas d'overlay) */}
        {isSelectionMode ? (
          <Button
            size="sm"
            className="w-full h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
            onClick={handleSelect}
          >
            <Volume2 className="h-3.5 w-3.5 mr-1.5" />
            Utiliser cette musique
          </Button>
        ) : (
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 h-7 text-xs"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 mr-1" />
                  Écouter
                </>
              )}
            </Button>
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
