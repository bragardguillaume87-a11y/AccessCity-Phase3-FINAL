import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Volume2, X } from 'lucide-react';
import { InlineAccordion } from '@/components/ui/InlineAccordion';
import {
  VoicePresetPicker,
  VoicePresetBadge,
} from '@/components/dialogue-editor/DialogueComposer/components/VoicePresetPicker';
import { VOICE_PROFILES, playVoicePreview } from '@/utils/voiceProfiles';
import type { Dialogue } from '@/types';

interface SfxPanelProps {
  dialogue: Dialogue;
  handleUpdate: (updates: Partial<Dialogue>) => void;
}

export function SfxPanel({ dialogue, handleUpdate }: SfxPanelProps) {
  const [sfxOpen, setSfxOpen] = useState(false);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  const voiceBtnRef = useRef<HTMLButtonElement>(null);

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
        onClick={() => setSfxOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors"
      >
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: 'rgba(245,158,11,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Volume2 className="w-3 h-3 text-amber-400" aria-hidden="true" />
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
          Effet sonore {dialogue.voicePreset ? '· 🎙️' : dialogue.sfx?.url ? '· 1 son' : ''}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-[var(--color-text-muted)] transition-transform duration-200 ${sfxOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <InlineAccordion isOpen={sfxOpen}>
        <div className="px-3 pb-3 pt-2 space-y-3">
          {/* Voix procédurale */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Voix du personnage
              </span>
              <div className="flex items-center gap-1">
                {dialogue.voicePreset && <VoicePresetBadge presetId={dialogue.voicePreset} />}
                <button
                  ref={voiceBtnRef}
                  type="button"
                  onClick={() => setVoicePickerOpen((v) => !v)}
                  title={dialogue.voicePreset ? 'Changer la voix' : 'Toutes les voix'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 22,
                    height: 22,
                    borderRadius: 'var(--radius-sm)',
                    border: `1.5px solid ${dialogue.voicePreset ? 'var(--color-primary-glow)' : 'var(--color-border-base)'}`,
                    background: dialogue.voicePreset
                      ? 'var(--color-primary-subtle)'
                      : 'transparent',
                    color: dialogue.voicePreset
                      ? 'var(--color-primary)'
                      : 'var(--color-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <Volume2 size={10} />
                </button>
              </div>
            </div>
            {/* Chips rapides */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {VOICE_PROFILES.filter((p) => p.category !== 'animal')
                .slice(0, 6)
                .map((profile) => {
                  const isActive = dialogue.voicePreset === profile.id;
                  return (
                    <motion.button
                      key={profile.id}
                      type="button"
                      onClick={() =>
                        handleUpdate({ voicePreset: isActive ? undefined : profile.id })
                      }
                      onMouseEnter={() => playVoicePreview(profile.id)}
                      whileHover={{ y: -1, scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}
                      aria-pressed={isActive}
                      title={profile.label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        border: `1.5px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border-base)'}`,
                        background: isActive
                          ? 'var(--color-primary-muted)'
                          : 'var(--color-bg-base)',
                        color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontSize: '10px',
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span>{profile.emoji}</span>
                      <span>{profile.label}</span>
                    </motion.button>
                  );
                })}
              <motion.button
                type="button"
                onClick={() => setVoicePickerOpen((v) => !v)}
                whileHover={{ y: -1 }}
                title="Voir toutes les voix"
                style={{
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--color-border-base)',
                  background: 'transparent',
                  color: 'var(--color-text-muted)',
                  fontSize: '10px',
                  cursor: 'pointer',
                }}
              >
                +
              </motion.button>
            </div>
            <AnimatePresence>
              {voicePickerOpen && (
                <VoicePresetPicker
                  anchorRef={voiceBtnRef}
                  value={dialogue.voicePreset}
                  onChange={(presetId) => handleUpdate({ voicePreset: presetId })}
                  onClose={() => setVoicePickerOpen(false)}
                />
              )}
            </AnimatePresence>
          </div>

          {/* SFX fichier custom */}
          {dialogue.sfx?.url && (
            <div className="flex items-center gap-2 p-2 bg-[var(--color-bg-base)] rounded-lg border border-[var(--color-border-base)]">
              <Volume2 className="h-3 w-3 text-amber-400 flex-shrink-0" />
              <span className="text-xs text-[var(--color-text-primary)] truncate flex-1">
                {dialogue.sfx.url.split('/').pop()}
              </span>
              <button
                type="button"
                onClick={() => handleUpdate({ sfx: undefined })}
                className="h-5 w-5 flex items-center justify-center text-red-400 hover:text-red-300 rounded"
                aria-label="Supprimer le son"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </InlineAccordion>
    </div>
  );
}
