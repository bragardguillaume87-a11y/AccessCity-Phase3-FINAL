import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Scene, GameStats } from '@/types';
import { useScenesStore, useSettingsStore } from '../../stores/index';
import { useGameState } from '../../hooks/useGameState';
import { Button } from '../ui/button';
import { ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { audioManager } from '../../utils/audioManager';

export interface PreviewPlayerProps {
  initialSceneId?: string | null;
  onClose: () => void;
}

export default function PreviewPlayer({ initialSceneId, onClose }: PreviewPlayerProps) {
  // Zustand stores (granular selectors)
  const scenes = useScenesStore(state => state.scenes);
  const variables = useSettingsStore(state => state.variables);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const previousSceneIdRef = useRef<string | null>(null);

  const { currentScene, currentDialogue, stats, history, isPaused, chooseOption, goToNextDialogue, goToScene, setIsPaused } = useGameState({
    scenes,
    initialSceneId: initialSceneId || (scenes && scenes[0]?.id),
    initialStats: (variables as GameStats) || {}
  });

  // Initialize audio on first user interaction
  const initializeAudio = useCallback(async () => {
    if (!audioInitialized) {
      try {
        await audioManager.initialize();
        setAudioInitialized(true);
      } catch (error) {
        console.warn('[PreviewPlayer] Audio initialization failed:', error);
      }
    }
  }, [audioInitialized]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const newMuted = audioManager.toggleMute();
    setIsMuted(newMuted);
  }, []);

  // Handle scene change - play BGM
  useEffect(() => {
    if (!audioInitialized || !currentScene) return;

    const previousSceneId = previousSceneIdRef.current;
    previousSceneIdRef.current = currentScene.id;

    // Check if scene changed
    if (previousSceneId && previousSceneId !== currentScene.id) {
      // Get previous scene to check continueToNextScene
      const previousScene = scenes.find(s => s.id === previousSceneId);

      // If previous scene had audio with continueToNextScene, don't stop
      if (previousScene?.audio?.continueToNextScene && currentScene.audio?.url === previousScene.audio.url) {
        // Same audio, keep playing
        return;
      }

      // Stop previous BGM if not continuing
      if (!previousScene?.audio?.continueToNextScene) {
        audioManager.stopBGM(500);
      }
    }

    // Play new scene's BGM if it has one
    if (currentScene.audio?.url) {
      audioManager.playBGM(currentScene.audio);
    }
  }, [audioInitialized, currentScene, scenes]);

  // Handle dialogue change - play SFX
  useEffect(() => {
    if (!audioInitialized || !currentDialogue) return;

    // Play dialogue SFX if present
    if (currentDialogue.sfx?.url) {
      audioManager.playSFX(currentDialogue.sfx);
    }
  }, [audioInitialized, currentDialogue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioManager.stopBGM(0);
    };
  }, []);

  // Annonce accessibilité
  useEffect(() => {
    if (currentDialogue && liveRegionRef.current) {
      liveRegionRef.current.textContent = currentDialogue.text || '';
    }
  }, [currentDialogue]);

  if (!currentScene) {
    return (
      <div className="p-10 text-center text-white">
        Aucune scène jouable.{' '}
        <button onClick={onClose} className="underline">
          Fermer
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'bg-background text-white'}`}
      onClick={initializeAudio}
    >
      <div ref={liveRegionRef} className="sr-only" aria-live="polite" />

      {/* Header */}
      <header className="flex justify-between items-center p-4 border-b border-border bg-card">
        <h2 className="font-bold">Preview: {currentScene.title}</h2>
        <div className="flex gap-2 items-center">
          {/* Audio controls */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              initializeAudio();
              toggleMute();
            }}
            className={`px-3 py-1 rounded text-sm flex items-center gap-1.5 ${
              isMuted ? 'bg-red-600/20 text-red-400' : 'bg-muted'
            }`}
            title={isMuted ? 'Activer le son' : 'Couper le son'}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {isMuted ? 'Son OFF' : 'Son ON'}
          </button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="px-3 py-1 bg-muted rounded text-sm">
            {isFullscreen ? 'Quitter Plein écran' : 'Plein écran'}
          </button>
          <button onClick={onClose} className="px-3 py-1 bg-red-600 rounded text-sm">
            Fermer
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Scène & Dialogue */}
        <section className="col-span-8 bg-card rounded-lg p-6 flex flex-col justify-between">
          <div className="text-lg leading-relaxed mb-6">
            {currentDialogue?.speaker && (
              <div className="text-cyan-400 text-sm font-bold uppercase mb-2">{currentDialogue.speaker}</div>
            )}
            {currentDialogue?.text || '...'}
          </div>

          <div className="space-y-2">
            {currentDialogue?.choices?.map((choice, idx) => (
              <button
                key={choice.id || idx}
                onClick={() => chooseOption(choice)}
                className="w-full text-left p-3 rounded bg-muted hover:bg-muted border border-border transition-colors"
              >
                {choice.text || 'Continue'}
              </button>
            ))}
            {(!currentDialogue?.choices || currentDialogue.choices.length === 0) && (
              <div className="flex flex-col items-center gap-3">
                <Button
                  onClick={goToNextDialogue}
                  variant="gaming-primary"
                  size="lg"
                  className="group animate-pulse hover:animate-none min-w-[200px]"
                >
                  Suivant
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Button>
                <p className="text-muted-foreground text-xs animate-bounce">
                  Cliquez pour continuer ▼
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Sidebar Stats */}
        <aside className="col-span-4 space-y-4">
          <div className="bg-card p-4 rounded-lg">
            <h3 className="font-bold text-muted-foreground mb-2 uppercase text-xs">Statistiques</h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {Object.entries(stats).map(([key, value], idx) => {
                const colors = ['text-cyan-300', 'text-purple-300', 'text-yellow-300', 'text-green-300', 'text-pink-300'];
                const color = colors[idx % colors.length];
                return (
                  <div key={key}>
                    {key}: <span className={`font-mono ${color}`}>{value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card p-4 rounded-lg flex-1 overflow-y-auto max-h-60">
            <h3 className="font-bold text-muted-foreground mb-2 uppercase text-xs">Historique</h3>
            <ol className="text-xs space-y-1 text-foreground">
              {history.map((h, i) => (
                <li key={i}>
                  {i + 1}. Choix {h.choiceId}
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
