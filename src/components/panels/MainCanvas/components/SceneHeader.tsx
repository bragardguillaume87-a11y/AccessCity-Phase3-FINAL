import { motion } from 'framer-motion';
import { Maximize2, Minimize2 } from 'lucide-react';
import type { Scene, FullscreenMode } from '@/types';
import { cn } from '@/lib/utils';

export interface SceneHeaderProps {
  scene: Scene;
  fullscreenMode: FullscreenMode;
  onFullscreenChange?: (mode: FullscreenMode) => void;
}

/**
 * SceneHeader - Scene title, description and fullscreen controls
 */
export function SceneHeader({ scene, fullscreenMode, onFullscreenChange }: SceneHeaderProps) {
  return (
    <div className="flex-shrink-0 bg-card border-b border-border px-6 py-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
              />
            </svg>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {scene.title || 'Untitled scene'}
              </h2>
              {scene.description && (
                <p className="text-sm text-muted-foreground mt-1">{scene.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Bouton Focus — toggle plein écran canvas */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onFullscreenChange?.(fullscreenMode ? null : 'canvas')}
            type="button"
            title={fullscreenMode ? 'Quitter le plein écran' : 'Canvas plein écran'}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-colors',
              fullscreenMode
                ? 'text-red-400 hover:text-red-300 hover:bg-red-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            {fullscreenMode ? (
              <Minimize2 className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Maximize2 className="w-4 h-4" aria-hidden="true" />
            )}
            <span>{fullscreenMode ? 'Quitter' : 'Focus'}</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
