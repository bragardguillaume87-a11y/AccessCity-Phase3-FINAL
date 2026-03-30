import { useState, useMemo, useRef } from 'react';
import { User, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCharactersStore } from '@/stores';
import { DEFAULTS } from '@/config/constants';
import {
  VoicePresetPicker,
  VoicePresetBadge,
} from '../../DialogueComposer/components/VoicePresetPicker';
import { MoodPipSelector } from './MoodPipSelector';

interface SpeakerCardProps {
  speaker: string;
  speakerMood?: string;
  voicePreset?: string;
  dialogueSubtype?: 'normal' | 'phonecall';
  onSpeakerChange: (id: string) => void;
  onMoodChange: (mood: string | undefined) => void;
  onVoicePresetChange?: (preset: string | undefined) => void;
  onUpdateSubtype?: (subtype: 'normal' | 'phonecall') => void;
}

export function SpeakerCard({
  speaker,
  speakerMood,
  voicePreset,
  dialogueSubtype,
  onSpeakerChange,
  onMoodChange,
  onVoicePresetChange,
  onUpdateSubtype,
}: SpeakerCardProps) {
  const characters = useCharactersStore((state) => state.characters);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  const voiceBtnRef = useRef<HTMLButtonElement>(null);

  const speakerChar = useMemo(
    () => characters.find((c) => c.id === speaker),
    [characters, speaker]
  );

  // Teinte HSL déterministe depuis le nom (Quilez §14.1)
  const speakerHue = useMemo(() => {
    if (!speakerChar) return 200;
    let h = 0;
    for (let i = 0; i < speakerChar.name.length; i++)
      h = speakerChar.name.charCodeAt(i) + ((h << 5) - h);
    return Math.abs(h) % 360;
  }, [speakerChar]);

  // Sprite de prévisualisation (neutral ou default)
  const speakerSpriteUrl = useMemo(
    () => speakerChar?.sprites?.neutral || speakerChar?.sprites?.default,
    [speakerChar]
  );

  // Moods actifs du personnage
  const moods = useMemo(
    () => (speakerChar?.moods && speakerChar.moods.length > 0 ? speakerChar.moods : ['neutral']),
    [speakerChar]
  );

  // ── Contenu partagé du Select ────────────────────────────────────────────
  const selectItems = (
    <>
      {characters.map((char) => (
        <SelectItem key={char.id} value={char.id} className="text-sm py-2">
          <div className="flex items-center gap-2">
            {char.sprites?.neutral ? (
              <img
                src={char.sprites.neutral}
                alt={char.name}
                className="w-5 h-5 rounded object-contain bg-muted flex-shrink-0"
              />
            ) : (
              <div className="w-5 h-5 rounded bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px]">👤</span>
              </div>
            )}
            <span className="font-medium truncate">{char.name}</span>
          </div>
        </SelectItem>
      ))}
      {characters.length === 0 && (
        <div className="px-4 py-4 text-center text-muted-foreground text-xs">
          Aucun personnage disponible
        </div>
      )}
    </>
  );

  return (
    <AnimatePresence mode="wait">
      {speakerChar ? (
        <motion.div
          key={speakerChar.id}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          style={{
            borderRadius: 16,
            border: '1.5px solid rgba(255,255,255,0.18)',
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: 10,
            display: 'flex',
            gap: 9,
            alignItems: 'flex-start',
          }}
        >
          {/* Portrait — 72×90px */}
          <div
            style={{
              flexShrink: 0,
              width: 72,
              height: 90,
              borderRadius: 10,
              overflow: 'hidden',
              background: speakerSpriteUrl
                ? 'rgba(255,255,255,0.04)'
                : `hsl(${speakerHue}, 55%, 32%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {speakerSpriteUrl ? (
              <img
                src={speakerSpriteUrl}
                alt={speakerChar.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <span style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>
                {speakerChar.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Colonne droite */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Rangée nom + 🔊 + ☎ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 900,
                  color: `hsl(${speakerHue}, 72%, 80%)`,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                  lineHeight: 1.15,
                }}
              >
                {speakerChar.name}
              </p>

              {/* Badge voix active — Hennig §11.1 */}
              {voicePreset && <VoicePresetBadge presetId={voicePreset} />}

              {/* Voice button — 🔊 */}
              {onVoicePresetChange && (
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <motion.button
                    ref={voiceBtnRef}
                    type="button"
                    onClick={() => setVoicePickerOpen((v) => !v)}
                    title={voicePreset ? `Voix : ${voicePreset}` : 'Ajouter une voix'}
                    aria-expanded={voicePickerOpen}
                    aria-haspopup="true"
                    whileHover={{ scale: 1.12, y: -1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 26,
                      height: 26,
                      borderRadius: 7,
                      flexShrink: 0,
                      border: `1.5px solid ${voicePickerOpen || voicePreset ? 'rgba(100,170,255,0.5)' : 'rgba(255,255,255,0.18)'}`,
                      background:
                        voicePickerOpen || voicePreset
                          ? 'rgba(60,120,240,0.18)'
                          : 'rgba(255,255,255,0.08)',
                      color:
                        voicePickerOpen || voicePreset
                          ? 'rgba(150,200,255,0.9)'
                          : 'rgba(255,255,255,0.40)',
                      cursor: 'pointer',
                      fontSize: 11,
                    }}
                  >
                    🔊
                  </motion.button>
                  <AnimatePresence>
                    {voicePickerOpen && (
                      <VoicePresetPicker
                        anchorRef={voiceBtnRef}
                        value={voicePreset}
                        onChange={onVoicePresetChange}
                        onClose={() => setVoicePickerOpen(false)}
                      />
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Phone toggle — ☎ */}
              {onUpdateSubtype && (
                <motion.button
                  type="button"
                  onClick={() =>
                    onUpdateSubtype(dialogueSubtype === 'phonecall' ? 'normal' : 'phonecall')
                  }
                  title={
                    dialogueSubtype === 'phonecall'
                      ? 'Mode appel (désactiver)'
                      : 'Activer mode appel'
                  }
                  whileHover={{ scale: 1.12, y: -1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    flexShrink: 0,
                    border: `1.5px solid ${dialogueSubtype === 'phonecall' ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.18)'}`,
                    background:
                      dialogueSubtype === 'phonecall'
                        ? 'rgba(34,197,94,0.15)'
                        : 'rgba(255,255,255,0.08)',
                    color:
                      dialogueSubtype === 'phonecall'
                        ? 'var(--color-success)'
                        : 'rgba(255,255,255,0.40)',
                    cursor: 'pointer',
                  }}
                >
                  <Phone size={11} aria-hidden="true" />
                </motion.button>
              )}
            </div>

            {/* Changer de personnage */}
            <Select value={speaker || DEFAULTS.DIALOGUE_SPEAKER} onValueChange={onSpeakerChange}>
              <SelectTrigger
                className="h-auto text-xs"
                style={{
                  padding: '4px 10px',
                  background: 'rgba(255,255,255,0.10)',
                  border: '1.5px solid rgba(255,255,255,0.22)',
                  borderRadius: 7,
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.68)',
                  height: 'auto',
                  width: 'auto',
                  alignSelf: 'flex-start',
                }}
              >
                <span>changer</span>
              </SelectTrigger>
              <SelectContent>{selectItems}</SelectContent>
            </Select>

            {/* Mood pips */}
            <MoodPipSelector moods={moods} activeMood={speakerMood} onMoodChange={onMoodChange} />
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            borderRadius: 16,
            border: '1.5px solid var(--color-border-base)',
            background: 'rgba(255,255,255,0.015)',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              color: 'var(--color-text-muted)',
            }}
          >
            <User size={15} strokeWidth={1.5} />
            <span style={{ fontSize: 11 }}>Aucun personnage sélectionné</span>
          </div>
          <Select value={speaker || DEFAULTS.DIALOGUE_SPEAKER} onValueChange={onSpeakerChange}>
            <SelectTrigger className="h-[32px] text-[11px]">
              <SelectValue placeholder="Choisir un personnage…" />
            </SelectTrigger>
            <SelectContent>{selectItems}</SelectContent>
          </Select>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
