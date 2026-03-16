import { motion } from 'framer-motion';
import { convertFileSrcIfNeeded } from '@/utils/tauri';

export interface MoodCardProps {
  mood: string;
  emoji: string;
  label: string;
  sprite?: string;
  isActive: boolean;
  onClick: () => void;
  /** Largeur en px — défaut 40. Toutes les dimensions internes s'adaptent. */
  size?: number;
  /** Délai d'entrée stagger (spring) — défaut 0. */
  entryDelay?: number;
}

/**
 * MoodCard — Carte humeur style Pokémon/Hearthstone.
 *
 * Utilisé partout où l'éditeur propose de choisir une humeur :
 * - DialogueBoxSection (UnifiedPanel, tab Dialogue)
 * - DialoguePropertiesForm (PropertiesPanel, onglet Propriétés)
 * - ComposerFormPanel (DialogueComposer, section speaker)
 *
 * CharacterMoodPicker reste indépendant (grille 3-col + drag-and-drop).
 *
 * Design : sprite pleine carte + badge emoji coin haut-droit + gradient label bas.
 * Animations spring (stagger entrée, hover lift, tap scale) — principes Nintendo UX.
 */
export function MoodCard({
  mood,
  emoji,
  label,
  sprite,
  isActive,
  onClick,
  size = 40,
  entryDelay = 0,
}: MoodCardProps) {
  const badgeFontSize = Math.max(6, Math.round(size * 0.19));
  const labelFontSize = Math.max(6, Math.round(size * 0.175));
  const emojiFontSize = Math.round(size * 0.38);
  const gradientPadTop = Math.round(size * 0.2);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: isActive ? -3 : 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 24, delay: entryDelay }}
      whileHover={{ y: isActive ? -5 : -3, transition: { duration: 0.1 } }}
      whileTap={{ scale: 0.91 }}
      aria-pressed={isActive}
      aria-label={label}
      title={label}
      style={{
        position: 'relative',
        flexShrink: 0,
        width: size,
        aspectRatio: '3 / 4',
        borderRadius: Math.round(size * 0.2),
        border: `2px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border-base)'}`,
        background: isActive ? 'var(--color-primary-subtle)' : 'var(--color-bg-base)',
        overflow: 'hidden',
        cursor: 'pointer',
        padding: 0,
        boxShadow: isActive
          ? '0 6px 20px var(--color-primary-45), 0 0 0 1px var(--color-primary-20)'
          : '0 2px 6px rgba(0,0,0,0.3)',
      }}
    >
      {/* Sprite ou emoji centré */}
      {sprite ? (
        <img
          src={convertFileSrcIfNeeded(sprite)}
          alt={mood}
          draggable="false"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      ) : (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: emojiFontSize,
            background: isActive
              ? 'linear-gradient(135deg, var(--color-primary-20), var(--color-primary-05))'
              : 'linear-gradient(135deg, rgba(255,255,255,0.04), transparent)',
          }}
        >
          {emoji}
        </span>
      )}

      {/* Badge emoji coin haut-droit */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 1,
          right: 2,
          fontSize: badgeFontSize,
          lineHeight: 1,
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
        }}
      >
        {emoji}
      </span>

      {/* Label gradient bas */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: `${gradientPadTop}px 2px 2px`,
          background: isActive
            ? 'linear-gradient(to top, rgba(88,28,235,0.92), var(--color-primary-45) 60%, transparent)'
            : 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.4) 60%, transparent)',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            display: 'block',
            fontSize: labelFontSize,
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.2,
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            textTransform: 'capitalize',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      </div>
    </motion.button>
  );
}
