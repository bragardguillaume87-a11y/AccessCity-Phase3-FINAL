import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { InlineAccordion } from '@/components/ui/InlineAccordion';
import { MoodCard } from '@/components/ui/MoodCard';
import { getMoodEmoji, getMoodLabel } from '@/hooks/useMoodPresets';
import type { Dialogue } from '@/types';
import type { Character } from '@/types';

interface SceneChar {
  id: string;
  characterId: string;
}

interface MoodsSectionProps {
  dialogue: Dialogue;
  handleUpdate: (updates: Partial<Dialogue>) => void;
  characters: Character[];
  sceneChars: SceneChar[];
}

export function MoodsSection({
  dialogue,
  handleUpdate,
  characters,
  sceneChars,
}: MoodsSectionProps) {
  const [moodsOpen, setMoodsOpen] = useState(false);

  if (sceneChars.length === 0) return null;

  return (
    <div
      style={{
        marginBottom: 8,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setMoodsOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors"
      >
        <span
          aria-hidden="true"
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: 'rgba(16,185,129,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            flexShrink: 0,
          }}
        >
          😊
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            color: 'var(--color-text-primary)',
            flex: 1,
          }}
        >
          Humeurs ({sceneChars.length})
        </span>
        <ChevronDown
          className={`h-3 w-3 text-[var(--color-text-muted)] transition-transform duration-200 ${moodsOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <InlineAccordion isOpen={moodsOpen}>
        <div className="px-3 pb-3 pt-2 space-y-3">
          {sceneChars.map((sc) => {
            const char = characters.find((c) => c.id === sc.characterId);
            if (!char) return null;
            const activeMood = dialogue.characterMoods?.[sc.id] ?? '';
            const moods = char.moods?.length ? char.moods : ['neutral'];
            const setMood = (val: string) => {
              const next = { ...(dialogue.characterMoods || {}) };
              if (val) {
                next[sc.id] = val;
              } else {
                delete next[sc.id];
              }
              handleUpdate({ characterMoods: Object.keys(next).length > 0 ? next : undefined });
            };
            return (
              <div key={sc.id}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    display: 'block',
                    marginBottom: 5,
                  }}
                >
                  {char.name}
                </span>
                <div
                  style={{
                    display: 'flex',
                    gap: 4,
                    overflowX: 'auto',
                    paddingBottom: 2,
                    scrollbarWidth: 'none',
                  }}
                >
                  {/* Chip Défaut */}
                  <motion.button
                    type="button"
                    onClick={() => setMood('')}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.93 }}
                    aria-pressed={!activeMood}
                    style={{
                      flexShrink: 0,
                      padding: '5px 10px',
                      borderRadius: 8,
                      border: `2px solid ${!activeMood ? 'var(--color-primary)' : 'var(--color-border-base)'}`,
                      background: !activeMood ? 'var(--color-primary-15)' : 'transparent',
                      color: !activeMood ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: !activeMood ? '0 3px 10px var(--color-primary-30)' : 'none',
                      alignSelf: 'center',
                    }}
                  >
                    ✦ Défaut
                  </motion.button>
                  {/* Cartes humeur */}
                  {moods.map((mood, idx) => (
                    <MoodCard
                      key={mood}
                      mood={mood}
                      emoji={getMoodEmoji(mood)}
                      label={getMoodLabel(mood)}
                      sprite={char.sprites?.[mood]}
                      isActive={activeMood === mood}
                      onClick={() => setMood(activeMood === mood ? '' : mood)}
                      size={60}
                      entryDelay={idx * 0.04}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </InlineAccordion>
    </div>
  );
}
