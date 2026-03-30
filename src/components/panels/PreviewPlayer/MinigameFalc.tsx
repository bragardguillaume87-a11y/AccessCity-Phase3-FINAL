/**
 * MinigameFalc — Réordonner des cartes FALC dans le bon ordre.
 * v2 : feedback live (positions correctes), validation animée staggerée, drag physique.
 */
import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { GripVertical, CheckCircle } from 'lucide-react';
import type { MinigameConfig } from '@/types';
import { uiSounds } from '@/utils/uiSounds';

// ── Constantes module-level pour éviter les nouvelles références à chaque render ──
const SHAKE_KEYFRAMES = { x: [-7, 7, -5, 5, -3, 3, 0] as number[] };
const POP_KEYFRAMES = { scale: [1, 1.05, 1] as number[] };
const IDLE_TARGET = { x: 0, scale: 1 };
const SHAKE_TRANSITION = { duration: 0.36, ease: 'linear' as const };
const POP_TRANSITION = { duration: 0.28, ease: 'easeOut' as const };
const BADGE_SPRING = { type: 'spring' as const, stiffness: 500, damping: 22 };

type CardReveal = 'idle' | 'correct' | 'wrong';

interface SortableItemProps {
  id: string;
  label: string;
  index: number;
  isCorrect: boolean;
  reveal: CardReveal;
  isValidating: boolean;
}

function SortableItem({ id, label, index, isCorrect, reveal, isValidating }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  // Outer div : dnd-kit contrôle le transform + drag scale/rotation
  const dndTransformStr = CSS.Transform.toString(transform);
  const outerTransform = isDragging
    ? `${dndTransformStr ?? ''} scale(1.05) rotate(-1.5deg)`.trim()
    : (dndTransformStr ?? undefined);

  const showCorrect = isCorrect && !isValidating && reveal === 'idle';

  // Couleurs selon état
  const bgColor =
    reveal === 'correct'
      ? 'rgba(34,197,94,0.18)'
      : reveal === 'wrong'
        ? 'rgba(239,68,68,0.15)'
        : isDragging
          ? 'rgba(139,92,246,0.22)'
          : showCorrect
            ? 'rgba(34,197,94,0.08)'
            : 'rgba(255,255,255,0.06)';

  const borderColor =
    reveal === 'correct'
      ? '2px solid rgba(34,197,94,0.65)'
      : reveal === 'wrong'
        ? '2px solid rgba(239,68,68,0.55)'
        : isDragging
          ? '2px solid rgba(139,92,246,0.65)'
          : showCorrect
            ? '2px solid rgba(34,197,94,0.38)'
            : '2px solid rgba(255,255,255,0.12)';

  const shadowColor = isDragging
    ? '0 14px 36px rgba(0,0,0,0.45)'
    : reveal === 'correct'
      ? '0 0 14px rgba(34,197,94,0.28)'
      : reveal === 'wrong'
        ? '0 0 10px rgba(239,68,68,0.18)'
        : 'none';

  const numBg =
    reveal === 'correct' || showCorrect
      ? 'rgba(34,197,94,0.22)'
      : reveal === 'wrong'
        ? 'rgba(239,68,68,0.22)'
        : 'rgba(139,92,246,0.25)';

  const numColor =
    reveal === 'correct' || showCorrect ? '#4ade80' : reveal === 'wrong' ? '#f87171' : '#a78bfa';

  const revealAnimate =
    reveal === 'wrong' ? SHAKE_KEYFRAMES : reveal === 'correct' ? POP_KEYFRAMES : IDLE_TARGET;
  const revealTransition = reveal === 'wrong' ? SHAKE_TRANSITION : POP_TRANSITION;

  return (
    // Outer div — uniquement dnd-kit (transform, zIndex)
    <div
      ref={setNodeRef}
      {...attributes}
      style={{
        transform: outerTransform,
        transition: isDragging ? undefined : (transition ?? undefined),
        zIndex: isDragging ? 100 : 1,
        position: 'relative',
        marginBottom: 8,
      }}
    >
      {/* Inner motion.div — uniquement Framer Motion (animations visuelles) */}
      <motion.div
        animate={revealAnimate}
        transition={revealTransition}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          background: bgColor,
          borderRadius: 12,
          border: borderColor,
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
          boxShadow: shadowColor,
          transition: 'background 0.22s, border 0.22s, box-shadow 0.22s',
        }}
      >
        {/* Badge numéro — pop spring quand la position devient correcte */}
        <motion.span
          key={`badge-${id}-${reveal !== 'idle' ? reveal : String(isCorrect)}`}
          initial={reveal !== 'idle' ? { scale: 1.25 } : isCorrect ? { scale: 1.3 } : false}
          animate={{ scale: 1 }}
          transition={BADGE_SPRING}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: numBg,
            color: numColor,
            fontWeight: 800,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.22s, color 0.22s',
          }}
        >
          {reveal === 'correct' ? '✓' : reveal === 'wrong' ? '✗' : index + 1}
        </motion.span>

        <span
          style={{
            flex: 1,
            color: 'rgba(255,255,255,0.9)',
            fontSize: 15,
            fontWeight: 600,
            lineHeight: 1.35,
          }}
        >
          {label}
        </span>

        {!isValidating && (
          <div
            {...listeners}
            style={{ cursor: 'grab', color: 'rgba(255,255,255,0.28)', flexShrink: 0 }}
          >
            <GripVertical size={20} />
          </div>
        )}
      </motion.div>
    </div>
  );
}

interface MinigameFalcProps {
  config: MinigameConfig;
  onResult: (success: boolean) => void;
}

export function MinigameFalc({ config, onResult }: MinigameFalcProps) {
  const original = useMemo(() => config.items ?? [], [config.items]);

  const [items, setItems] = useState<string[]>(() => [...original].sort(() => Math.random() - 0.5));
  const [isValidating, setIsValidating] = useState(false);
  const [cardReveal, setCardReveal] = useState<CardReveal[]>(() =>
    original.map(() => 'idle' as CardReveal)
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Feedback live : positions correctes
  const correctPositions = useMemo(
    () => items.map((item, i) => item === original[i]),
    [items, original]
  );
  const correctCount = correctPositions.filter(Boolean).length;
  const allCorrect = correctCount === original.length;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.indexOf(String(active.id));
    const newIdx = items.indexOf(String(over.id));
    const next = arrayMove(items, oldIdx, newIdx);
    // Feedback sonore : ding si la carte atterrit à la bonne position
    if (next[newIdx] === original[newIdx]) uiSounds.minigameDing();
    setItems(next);
  };

  const handleValidate = () => {
    if (isValidating) return;
    setIsValidating(true);

    const results: CardReveal[] = items.map((item, i) =>
      item === original[i] ? 'correct' : 'wrong'
    );
    const success = results.every((r) => r === 'correct');
    if (success) uiSounds.minigameSuccess();
    else uiSounds.minigameFail();
    // Révélation staggerée : chaque carte révèle 175ms après la précédente
    results.forEach((result, i) => {
      setTimeout(() => {
        setCardReveal((prev) => prev.map((s, j) => (j === i ? result : s)));
      }, i * 175);
    });
    setTimeout(() => onResult(success), results.length * 175 + 650);
  };

  return (
    <div style={{ width: '100%', maxWidth: 440 }}>
      <p
        style={{
          color: 'rgba(255,255,255,0.55)',
          fontSize: 13,
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        Remets les étapes dans le bon ordre
      </p>

      {/* Compteur live */}
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <motion.span
          key={correctCount}
          initial={correctCount > 0 ? { scale: 1.35 } : false}
          animate={{ scale: 1 }}
          transition={BADGE_SPRING}
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: allCorrect ? '#4ade80' : 'rgba(255,255,255,0.4)',
          }}
        >
          {correctCount} / {original.length} bien placé{correctCount > 1 ? 's' : ''}
        </motion.span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {items.map((item, idx) => (
            <SortableItem
              key={item}
              id={item}
              label={item}
              index={idx}
              isCorrect={correctPositions[idx]}
              reveal={cardReveal[idx]}
              isValidating={isValidating}
            />
          ))}
        </SortableContext>
      </DndContext>

      <motion.button
        onClick={handleValidate}
        disabled={isValidating}
        whileHover={!isValidating ? { scale: 1.02 } : {}}
        whileTap={!isValidating ? { scale: 0.97 } : {}}
        animate={
          allCorrect && !isValidating
            ? {
                boxShadow: [
                  '0 4px 20px rgba(34,197,94,0.35)',
                  '0 4px 32px rgba(34,197,94,0.72)',
                  '0 4px 20px rgba(34,197,94,0.35)',
                ],
              }
            : { boxShadow: '0 4px 20px rgba(139,92,246,0.45)' }
        }
        transition={
          allCorrect && !isValidating ? { duration: 1.4, repeat: Infinity } : { duration: 0.3 }
        }
        style={{
          marginTop: 20,
          width: '100%',
          padding: '14px',
          borderRadius: 12,
          border: 'none',
          background: isValidating
            ? 'rgba(255,255,255,0.08)'
            : allCorrect
              ? 'linear-gradient(135deg, #16a34a, #15803d)'
              : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
          color: 'white',
          fontWeight: 800,
          fontSize: 16,
          cursor: isValidating ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          letterSpacing: '0.02em',
          transition: 'background 0.35s',
        }}
      >
        <CheckCircle size={18} />
        {isValidating ? 'Vérification…' : allCorrect ? '✓ Parfait !' : 'Valider'}
      </motion.button>
    </div>
  );
}

export default MinigameFalc;
