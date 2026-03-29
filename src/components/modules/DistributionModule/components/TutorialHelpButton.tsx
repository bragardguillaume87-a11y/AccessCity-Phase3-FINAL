import { motion } from 'framer-motion';

interface TutorialHelpButtonProps {
  onClick: () => void;
}

/**
 * TutorialHelpButton — Bouton "?" dans la TabBar du DistributionModule.
 * Ouvre TutorialPathChooser même si les tutoriels ont déjà été vus.
 * §1.1 nintendo-ux : feedback <100ms via whileHover/whileTap.
 */
export function TutorialHelpButton({ onClick }: TutorialHelpButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.1, y: -1 }}
      whileTap={{ scale: 0.9 }}
      title="Aide — relancer le guide"
      style={{
        width: 26,
        height: 26,
        borderRadius: '50%',
        border: '1.5px solid var(--color-primary)',
        background: 'var(--color-primary-subtle)',
        color: 'var(--color-primary)',
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      ?
    </motion.button>
  );
}
