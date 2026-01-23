import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Network, Maximize2, Eye, Minimize2 } from 'lucide-react';
import type { Scene, FullscreenMode } from '@/types';
import { cn } from '@/lib/utils';

export interface SceneHeaderProps {
  scene: Scene;
  dialoguesCount: number;
  fullscreenMode: FullscreenMode;
  onFullscreenChange?: (mode: FullscreenMode) => void;
}

/**
 * SceneHeader - Scene title, description and fullscreen controls
 */
export function SceneHeader({ scene, dialoguesCount, fullscreenMode, onFullscreenChange }: SceneHeaderProps) {
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
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
            {dialoguesCount} dialogue{dialoguesCount !== 1 ? 's' : ''}
          </span>

          {/* Fullscreen Mode Buttons */}
          <div className="flex items-center gap-1 ml-2 border-l border-border pl-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-2 rounded-lg transition-colors',
                fullscreenMode === 'graph' ? 'bg-cyan-500/20 text-cyan-400' : 'text-muted-foreground hover:text-cyan-400'
              )}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onFullscreenChange?.(fullscreenMode === 'graph' ? null : 'graph')}
                type="button"
                title="Vue Arbre (Graph)"
              >
                <Network className="w-4 h-4" aria-hidden="true" />
                <span className="sr-only">Vue Arbre</span>
              </motion.button>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-2 rounded-lg transition-colors',
                fullscreenMode === 'canvas' ? 'bg-cyan-500/20 text-cyan-400' : 'text-muted-foreground hover:text-cyan-400'
              )}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onFullscreenChange?.(fullscreenMode === 'canvas' ? null : 'canvas')}
                type="button"
                title="Éditeur Plein Écran"
              >
                <Maximize2 className="w-4 h-4" aria-hidden="true" />
                <span className="sr-only">Plein Écran Canvas</span>
              </motion.button>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-2 rounded-lg transition-colors',
                fullscreenMode === 'preview' ? 'bg-cyan-500/20 text-cyan-400' : 'text-muted-foreground hover:text-cyan-400'
              )}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onFullscreenChange?.(fullscreenMode === 'preview' ? null : 'preview')}
                type="button"
                title="Aperçu Plein Écran"
              >
                <Eye className="w-4 h-4" aria-hidden="true" />
                <span className="sr-only">Aperçu</span>
              </motion.button>
            </Button>

            {/* Exit fullscreen button (visible only when in fullscreen) */}
            <AnimatePresence>
              {fullscreenMode && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
                >
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
                  >
                    <Minimize2 className="w-4 h-4" aria-hidden="true" />
                    <span className="sr-only">Quitter Plein Écran</span>
                  </motion.button>
                </Button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
