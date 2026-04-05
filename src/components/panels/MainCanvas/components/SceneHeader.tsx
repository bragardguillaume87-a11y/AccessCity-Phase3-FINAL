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
export function SceneHeader({ fullscreenMode, onFullscreenChange }: SceneHeaderProps) {
  return (
    <div className="flex-shrink-0 bg-card border-b border-border px-3 py-1.5 flex justify-end">
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
  );
}
