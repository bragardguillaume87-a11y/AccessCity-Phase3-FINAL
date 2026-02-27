
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Maximize2, Eye, Minimize2 } from 'lucide-react';
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
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <div>
              <h2 className="text-xl font-bold text-white">
                {scene.title || 'Untitled scene'}
              </h2>
              {scene.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {scene.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">

          {/* Fullscreen Mode Buttons */}
          <div className="flex items-center gap-1">
            {([
              { mode: 'graph'  , Icon: Network,   label: 'Graphe'  , title: 'Vue graphe des dialogues'    },
              { mode: 'canvas' , Icon: Maximize2,  label: 'Focus'   , title: 'Canvas plein écran'          },
              { mode: 'preview', Icon: Eye,        label: 'Aperçu'  , title: 'Aperçu de la scène'          },
            ] as const).map(({ mode, Icon, label, title }) => (
              <motion.button
                key={mode}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onFullscreenChange?.(fullscreenMode === mode ? null : mode)}
                type="button"
                title={title}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-colors',
                  fullscreenMode === mode
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{label}</span>
              </motion.button>
            ))}

            {/* Exit fullscreen button (visible only when in fullscreen) */}
            <AnimatePresence>
              {fullscreenMode && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: -10 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onFullscreenChange?.(null)}
                  type="button"
                  title="Quitter Plein Écran"
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-colors text-red-400 hover:text-red-300 hover:bg-red-500/20"
                >
                  <Minimize2 className="w-4 h-4" aria-hidden="true" />
                  <span>Quitter</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
