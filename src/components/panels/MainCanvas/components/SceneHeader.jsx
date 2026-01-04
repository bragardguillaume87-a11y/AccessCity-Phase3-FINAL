import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button.jsx';
import { Network, Maximize2, Eye, Minimize2 } from 'lucide-react';

/**
 * SceneHeader - Scene title, description and fullscreen controls
 */
export function SceneHeader({ scene, dialoguesCount, fullscreenMode, onFullscreenChange }) {
  return (
    <div className="flex-shrink-0 bg-slate-800 border-b border-slate-700 px-6 py-4">
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
                <p className="text-sm text-slate-400 mt-1">
                  {scene.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 bg-slate-700 px-3 py-1 rounded-full">
            {dialoguesCount} dialogue{dialoguesCount !== 1 ? 's' : ''}
          </span>

          {/* Fullscreen Mode Buttons */}
          <div className="flex items-center gap-1 ml-2 border-l border-slate-600 pl-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFullscreenChange?.(fullscreenMode === 'graph' ? null : 'graph')}
                className={`h-8 px-2 transition-all duration-200 ${fullscreenMode === 'graph' ? 'bg-[var(--color-primary)] text-white shadow-[0_0_12px_var(--color-primary)]' : ''}`}
                aria-label="Mode Graph fullscreen"
                title="Graph fullscreen (Escape pour quitter)"
              >
                <Network className="w-4 h-4" aria-hidden="true" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFullscreenChange?.(fullscreenMode === 'canvas' ? null : 'canvas')}
                className={`h-8 px-2 transition-all duration-200 ${fullscreenMode === 'canvas' ? 'bg-[var(--color-primary)] text-white shadow-[0_0_12px_var(--color-primary)]' : ''}`}
                aria-label="Mode Canvas fullscreen"
                title="Canvas fullscreen (Escape pour quitter)"
              >
                <Maximize2 className="w-4 h-4" aria-hidden="true" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFullscreenChange?.(fullscreenMode === 'preview' ? null : 'preview')}
                className={`h-8 px-2 transition-all duration-200 ${fullscreenMode === 'preview' ? 'bg-[var(--color-primary)] text-white shadow-[0_0_12px_var(--color-primary)]' : ''}`}
                aria-label="Mode Preview fullscreen"
                title="Preview fullscreen (Escape pour quitter)"
              >
                <Eye className="w-4 h-4" aria-hidden="true" />
              </Button>
            </motion.div>

            {/* Exit fullscreen button (visible only when in fullscreen) */}
            <AnimatePresence>
              {fullscreenMode && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: -10 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFullscreenChange?.(null)}
                    className="h-8 px-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-all duration-200"
                    aria-label="Quitter le mode fullscreen"
                    title="Quitter fullscreen (Escape)"
                  >
                    <Minimize2 className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

SceneHeader.propTypes = {
  scene: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string
  }).isRequired,
  dialoguesCount: PropTypes.number.isRequired,
  fullscreenMode: PropTypes.oneOf([null, 'graph', 'canvas', 'preview']),
  onFullscreenChange: PropTypes.func
};
