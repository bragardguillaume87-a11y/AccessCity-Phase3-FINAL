import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Scissors, X } from 'lucide-react';
import { MiniVNCard } from './MiniVNCard';

interface SplitConfirmModalProps {
  text1: string;
  text2: string;
  speakerName: string;
  speakerColor: string;
  dialogueIndex: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SplitConfirmModal({
  text1,
  text2,
  speakerName,
  speakerColor,
  dialogueIndex,
  onConfirm,
  onCancel,
}: SplitConfirmModalProps) {
  const n1 = String(dialogueIndex + 1).padStart(2, '0');
  const n2 = String(dialogueIndex + 2).padStart(2, '0');
  // constraintsRef sur le backdrop → drag limité à l'écran entier
  const constraintsRef = useRef<HTMLDivElement>(null);
  // Empêche le clic backdrop de fermer la modale après un drag
  const isDragging = useRef(false);

  return createPortal(
    <motion.div
      ref={constraintsRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 1400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingRight: 8,
      }}
      onMouseDown={() => {
        isDragging.current = false;
      }}
      onClick={() => {
        if (!isDragging.current) onCancel();
      }}
    >
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragMomentum={false}
        onDragStart={() => {
          isDragging.current = true;
        }}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 8 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        style={{
          background: 'var(--color-bg-elevated)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.12)',
          width: 400,
          boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
          overflow: 'hidden',
          // cursor géré par zone (header = grab, body/footer = default)
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header — zone de drag (cursor: grab) ── */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'grab',
            userSelect: 'none',
          }}
        >
          {/* Ciseaux violet animés — snip snip idle */}
          <motion.div
            animate={{ rotate: [-18, 18, -12, 12, 0] }}
            transition={{
              duration: 0.7,
              delay: 0.4,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatDelay: 3.5,
            }}
            style={{ flexShrink: 0, display: 'flex', pointerEvents: 'none' }}
          >
            <Scissors size={14} style={{ color: 'var(--color-primary)' }} />
          </motion.div>

          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              flex: 1,
              pointerEvents: 'none',
            }}
          >
            Découpage de dialogue
          </span>

          {/* Transformation colorée D-N1 → D-N1 + D-N2 */}
          <span
            style={{
              fontSize: 10,
              fontVariantNumeric: 'tabular-nums',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              pointerEvents: 'none',
            }}
          >
            <span style={{ color: 'rgba(238,240,248,0.55)' }}>D-{n1}</span>
            <span style={{ color: 'rgba(238,240,248,0.22)' }}>→</span>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>D-{n1}</span>
            <span style={{ color: 'rgba(238,240,248,0.22)' }}>+</span>
            <span style={{ color: 'var(--color-warning)', fontWeight: 700 }}>D-{n2}</span>
          </span>

          {/* ── Bouton fermer — dynamique et visible ── */}
          <motion.button
            type="button"
            // Stopper pointerDown pour ne pas déclencher le drag depuis le bouton
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            whileHover={{
              scale: 1.12,
              backgroundColor: 'rgba(239,68,68,0.22)',
              borderColor: 'rgba(239,68,68,0.55)',
              color: '#fca5a5',
            }}
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            style={{
              width: 28,
              height: 28,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: 'rgba(238,240,248,0.6)',
            }}
          >
            <X size={14} />
          </motion.button>
        </div>

        {/* ── Corps — draggable aussi, cursor default sur le texte ── */}
        <div
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            cursor: 'default',
          }}
        >
          <MiniVNCard
            number={1}
            label={`Dialogue ${n1} — conservé`}
            color="#22d3ee"
            speakerName={speakerName}
            speakerColor={speakerColor}
            text={text1}
          />

          {/* ── Séparateur animé : ciseaux ping-pong sur ligne pointillée ── */}
          <div style={{ position: 'relative', height: 20 }}>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                borderTop: '1.5px dashed rgba(255,255,255,0.09)',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            />
            <motion.div
              style={{
                position: 'absolute',
                top: '50%',
                marginTop: -6,
                left: 0,
                pointerEvents: 'none',
              }}
              animate={{ left: ['3%', '88%', '3%'] }}
              transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity }}
            >
              <motion.div
                animate={{ scaleX: [1, 1, -1, -1, 1] }}
                transition={{
                  duration: 2.8,
                  ease: 'linear',
                  repeat: Infinity,
                  times: [0, 0.47, 0.5, 0.97, 1],
                }}
              >
                <Scissors size={12} style={{ color: 'rgba(139,92,246,0.65)', display: 'block' }} />
              </motion.div>
            </motion.div>
          </div>

          <MiniVNCard
            number={2}
            label={`Dialogue ${n2} — inséré après`}
            color="#fbbf24"
            speakerName={speakerName}
            speakerColor={speakerColor}
            text={text2}
          />
        </div>

        {/* ── Footer : boutons — onPointerDown stoppé pour éviter drag accidentel ── */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            padding: '12px 20px 18px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            gap: 10,
            cursor: 'default',
          }}
        >
          <motion.button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onConfirm();
            }}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(34,211,238,0.22)' }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            style={{
              flex: 1,
              padding: '11px 14px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              border: '1.5px solid var(--accent-cyan)',
              background: 'rgba(34,211,238,0.14)',
              color: 'var(--accent-cyan)',
              cursor: 'pointer',
            }}
          >
            ✓ Confirmer le découpage
          </motion.button>
          <motion.button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.06)' }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            style={{
              flex: 1,
              padding: '11px 14px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent',
              color: 'rgba(238,240,248,0.55)',
              cursor: 'pointer',
            }}
          >
            ✗ Annuler
          </motion.button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
