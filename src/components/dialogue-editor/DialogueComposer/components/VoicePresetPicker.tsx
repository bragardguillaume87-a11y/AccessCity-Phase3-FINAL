/**
 * VoicePresetPicker — Sélecteur compact de profil vocal procédural.
 *
 * Affiche les profils définis dans voiceProfiles.ts en grille de chips.
 * Hover → prévisualisation sonore immédiate (2 blips).
 * Clic  → sélectionne le profil.
 *
 * Design Nintendo : feedback immédiat, symboles universels, discret mais expressif.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { VOICE_PROFILES, playVoicePreview, getVoiceProfile } from '@/utils/voiceProfiles';

interface VoicePresetPickerProps {
  /** Ref sur le bouton déclencheur — sert à positionner le picker en fixed */
  anchorRef: React.RefObject<HTMLElement | null>;
  value?: string;
  onChange: (presetId: string | undefined) => void;
  onClose: () => void;
}

// Groupes affichés dans l'ordre souhaité
const CATEGORY_ORDER = ['humain', 'animal', 'special'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  humain: '👤 Humain',
  animal: '🐾 Animal',
  special: '✨ Spécial',
};

export function VoicePresetPicker({ anchorRef, value, onChange, onClose }: VoicePresetPickerProps) {
  const handleSelect = useCallback(
    (id: string) => {
      onChange(value === id ? undefined : id);
      onClose();
    },
    [value, onChange, onClose]
  );

  const handleHover = useCallback((id: string) => {
    playVoicePreview(id);
  }, []);

  const handleClear = useCallback(() => {
    onChange(undefined);
    onClose();
  }, [onChange, onClose]);

  // ── Calcul de la position fixed depuis le bouton ancre ───────────────────
  const [pos, setPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    });
  }, [anchorRef]);

  // ── Fermer sur clic extérieur ─────────────────────────────────────────────
  const pickerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [anchorRef, onClose]);

  const picker = (
    <motion.div
      ref={pickerRef}
      initial={{ opacity: 0, scale: 0.96, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -4 }}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: 'fixed',
        top: pos.top,
        right: pos.right,
        zIndex: 9999,
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-base)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.65)',
        padding: '12px',
        minWidth: 260,
        maxWidth: 320,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--color-text-muted)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Voix du personnage
        </span>
        <button
          type="button"
          onClick={onClose}
          style={{
            color: 'var(--color-text-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 2,
          }}
          aria-label="Fermer"
        >
          <X size={13} />
        </button>
      </div>

      {/* Hint */}
      <p
        style={{
          fontSize: '10px',
          color: 'var(--color-text-muted)',
          marginBottom: 10,
          lineHeight: 1.4,
        }}
      >
        Survole pour prévisualiser · Clic pour sélectionner
      </p>

      {/* Groups */}
      {CATEGORY_ORDER.map((cat) => {
        const profiles = VOICE_PROFILES.filter((p) => p.category === cat);
        if (profiles.length === 0) return null;
        return (
          <div key={cat} style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: '10px',
                color: 'var(--color-text-muted)',
                fontWeight: 600,
                marginBottom: 5,
              }}
            >
              {CATEGORY_LABELS[cat]}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {profiles.map((profile) => {
                const isActive = value === profile.id;
                return (
                  <motion.button
                    key={profile.id}
                    type="button"
                    onClick={() => handleSelect(profile.id)}
                    onMouseEnter={() => handleHover(profile.id)}
                    whileHover={{ y: -2, scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    title={profile.label}
                    aria-pressed={isActive}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1.5px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border-base)'}`,
                      background: isActive ? 'var(--color-primary-muted)' : 'var(--color-bg-base)',
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text-primary)',
                      fontSize: '11px',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'border-color 0.1s, background 0.1s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span aria-hidden="true">{profile.emoji}</span>
                    <span>{profile.label}</span>
                    {isActive && (
                      <span
                        style={{ fontSize: '9px', color: 'var(--color-primary)', marginLeft: 1 }}
                      >
                        ✓
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Clear button — visible seulement si une voix est sélectionnée */}
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            type="button"
            onClick={handleClear}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              marginTop: 8,
              width: '100%',
              padding: '5px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-base)',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              fontSize: '11px',
              cursor: 'pointer',
              justifyContent: 'center',
            }}
          >
            <X size={11} /> Retirer la voix
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return createPortal(picker, document.body);
}

/** Badge compact affiché à côté de l'icône quand une voix est sélectionnée */
export function VoicePresetBadge({ presetId }: { presetId: string }) {
  const profile = getVoiceProfile(presetId);
  if (!profile) return null;
  return (
    <span
      title={profile.label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '2px 6px',
        borderRadius: 999,
        background: 'var(--color-primary-15)',
        border: '1px solid var(--color-primary-35)',
        fontSize: '10px',
        fontWeight: 600,
        color: 'var(--color-primary)',
        maxWidth: 80,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
      }}
    >
      {profile.emoji}{' '}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.label}</span>
    </span>
  );
}

export default VoicePresetPicker;
