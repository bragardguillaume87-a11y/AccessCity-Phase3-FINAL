/**
 * AnimationStatusBar — barre contextuelle permanente "quoi faire maintenant".
 *
 * 100% data-driven, sans state local. Couvre les 7 états du workflow d'animation.
 * Fonctionne en mode Débutant ET Expert.
 *
 * Conseillers : Victor §7.3 (valeur actuelle → cible), Meier §10.1 (une décision à la fois),
 *               Norman §9.4 (état système visible en permanence), Nijman §8.1 (< 100ms).
 */

import { AnimatePresence, motion } from 'framer-motion';

interface AnimationStatusBarProps {
  selectedClipId: string | null;
  posesCount: number;
  selectedPoseId: string | null;
  keyframesCount: number;
  isPlaying: boolean;
}

function getStatusMessage(props: AnimationStatusBarProps): string {
  const { selectedClipId, posesCount, selectedPoseId, keyframesCount, isPlaying } = props;

  if (isPlaying) return '▶ Lecture en cours — clique Pause pour arrêter';
  if (!selectedClipId) return '💡 Crée ou sélectionne une animation pour commencer';
  if (keyframesCount >= 2) return "▶ Prêt ! Lance le Play pour voir l'animation";
  if (keyframesCount === 1)
    return '⏳ 1 / 2 — Encore une position dans la séquence pour débloquer le ▶ Play';
  if (selectedPoseId) return '📌 Ajoute la position sélectionnée à la séquence (bouton 📌 Ajouter)';
  if (posesCount > 0) return '← Clique sur une position pour la sélectionner, puis 📌 Ajouter';
  return '📸 Capture des positions du squelette avec 📸 +';
}

export function AnimationStatusBar(props: AnimationStatusBarProps) {
  const message = getStatusMessage(props);

  return (
    <div
      style={{
        flexShrink: 0,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        borderTop: '1px solid var(--color-border-base)',
        background: 'var(--color-bg-hover)',
        overflow: 'hidden',
      }}
    >
      <AnimatePresence mode="wait">
        {/* motion.div avec opacity/y — pas de CSS variables animées → compatible WAAPI (§11) */}
        <motion.span
          key={message}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          style={{
            fontSize: 11,
            color: 'var(--color-text-muted)',
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {message}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
