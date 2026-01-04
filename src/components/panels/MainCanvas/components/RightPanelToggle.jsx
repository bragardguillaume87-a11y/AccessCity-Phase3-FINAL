import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button.jsx';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Z_INDEX } from '@/utils/zIndexLayers.js';

/**
 * RightPanelToggle - Floating button to toggle right panel visibility
 */
export function RightPanelToggle({ isOpen, onToggle }) {
  return (
    <motion.div
      className="fixed right-0 top-1/2 -translate-y-1/2"
      style={{ zIndex: Z_INDEX.CANVAS_FLOATING_BUTTONS }}
      initial={{ x: 0 }}
      whileHover={{ x: -4, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="h-12 w-8 rounded-l-lg rounded-r-none bg-[var(--color-bg-elevated)] border-2 border-r-0 border-[var(--color-border-base)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-primary)] hover:shadow-[0_0_12px_rgba(59,130,246,0.5)] shadow-lg transition-all duration-300"
        aria-label={isOpen ? 'Masquer le panneau éléments' : 'Afficher le panneau éléments'}
        title={isOpen ? 'Masquer le panneau éléments' : 'Afficher le panneau éléments'}
      >
        <motion.div
          initial={false}
          animate={{ rotate: isOpen ? 0 : 180 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {isOpen ? (
            <ChevronRight className="w-5 h-5 text-[var(--color-text-secondary)]" aria-hidden="true" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-[var(--color-text-secondary)]" aria-hidden="true" />
          )}
        </motion.div>
      </Button>
    </motion.div>
  );
}

RightPanelToggle.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired
};
