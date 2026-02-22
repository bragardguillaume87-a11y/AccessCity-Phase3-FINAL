import { motion } from 'framer-motion';
import { ChevronLeft, Check } from 'lucide-react';
import { t } from '@/lib/translations';
import { useMoodPresets } from '@/hooks/useMoodPresets';

interface MoodPickerPanelProps {
  characterName: string;
  currentMood: string;
  characterSprites: Record<string, string>;
  availableMoods: string[];
  onSelect: (mood: string) => void;
  onBack: () => void;
}

/**
 * MoodPickerPanel — Sélecteur d'humeur compact (liste verticale).
 *
 * Chaque humeur : thumbnail 32×32px + nom + checkmark si active.
 * Stagger d'entrée des items via Framer Motion.
 */
export function MoodPickerPanel({
  characterName,
  currentMood,
  characterSprites,
  availableMoods,
  onSelect,
  onBack,
}: MoodPickerPanelProps) {
  const moodPresets = useMoodPresets();

  const moods = availableMoods.map(moodId => {
    const preset = moodPresets.find(p => p.id === moodId);
    return {
      id: moodId,
      emoji: preset?.emoji ?? moodId.charAt(0).toUpperCase(),
      label: preset?.label ?? moodId,
      hasSprite: !!characterSprites[moodId],
    };
  });

  return (
    <div>
      {/* Retour */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 mb-2 text-xs font-medium transition-colors"
        style={{ color: 'rgba(255,255,255,0.45)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        {t('moodPicker.title', { name: characterName })}
      </button>

      {/* Liste des humeurs */}
      <div
        className="space-y-0.5 overflow-y-auto"
        style={{ maxHeight: '260px' }}
      >
        {moods.map((mood, idx) => {
          const isActive = currentMood === mood.id;
          return (
            <motion.div
              key={mood.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.035, duration: 0.12 }}
            >
              <button
                type="button"
                onClick={() => onSelect(mood.id)}
                className="w-full flex items-center gap-2.5 rounded-lg text-left transition-colors"
                style={{
                  padding: '6px 8px',
                  background: isActive ? 'var(--color-primary-muted, rgba(124,58,237,0.12))' : 'transparent',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.background = 'var(--color-bg-hover)';
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                {/* Thumbnail 32×32 */}
                <div
                  className="w-8 h-8 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-bg-hover)' }}
                >
                  {mood.hasSprite && characterSprites[mood.id] ? (
                    <img
                      src={characterSprites[mood.id]}
                      alt={mood.label}
                      className="w-full h-full object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ) : (
                    <span className="text-base leading-none">{mood.emoji}</span>
                  )}
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <span
                    className="text-xs font-medium leading-tight capitalize truncate block"
                    style={{ color: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.9)' }}
                  >
                    {mood.label}
                  </span>
                  {!mood.hasSprite && (
                    <span className="text-[10px] leading-tight text-amber-500">Sans image</span>
                  )}
                </div>

                {/* Checkmark */}
                {isActive && (
                  <Check className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                )}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default MoodPickerPanel;
