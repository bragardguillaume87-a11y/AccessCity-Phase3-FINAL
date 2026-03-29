import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { TUTORIALS, CHALLENGES } from '@/config/tutorials';
import type { ChallengeDefinition } from '@/config/tutorials';

interface TutorialPathChooserProps {
  open: boolean;
  onClose: () => void;
}

type ActiveTab = 'apprendre' | 'defis';

// Badge couleur par difficulté — Norman §9.2 : contrainte visible avant l'action
const DIFFICULTY_STYLES: Record<ChallengeDefinition['difficulty'], React.CSSProperties> = {
  facile: {
    background: 'rgba(16,185,129,0.18)',
    color: '#10b981',
    border: '1px solid rgba(16,185,129,0.4)',
  },
  moyen: {
    background: 'rgba(245,158,11,0.18)',
    color: '#f59e0b',
    border: '1px solid rgba(245,158,11,0.4)',
  },
};

const DIFFICULTY_LABEL: Record<ChallengeDefinition['difficulty'], string> = {
  facile: '🟢 facile',
  moyen: '🟡 moyen',
};

/**
 * TutorialPathChooser — Modale d'accueil du module Distribution.
 * Auto-ouverte au premier accès à l'onglet Squelette.
 * Bouton "?" dans la TabBar permet de la rouvrir à tout moment.
 *
 * Onglets :
 *  - 📚 Apprendre : parcours guidés pas à pas (tutoriels existants)
 *  - ✨ Défis     : défis créatifs avec hint visible — Meier §10.2
 *
 * Cliquer un défi démarre le tutoriel dist-squelette (guide TemplatePicker + pose).
 */
export function TutorialPathChooser({ open, onClose }: TutorialPathChooserProps) {
  const startTutorial = useOnboardingStore((s) => s.startTutorial);
  const markSeen = useOnboardingStore((s) => s.markSeen);

  const [activeTab, setActiveTab] = useState<ActiveTab>('apprendre');

  const handleStartTutorial = (tutorialId: string) => {
    startTutorial(tutorialId);
    onClose();
  };

  const handleChallenge = () => {
    // Démarre le tutoriel squelette — ses 5 étapes guident vers TemplatePicker + pose
    // Le hint sur la card indique quel template choisir à l'étape 2
    startTutorial('dist-squelette');
    onClose();
  };

  const handleSolo = () => {
    TUTORIALS.forEach((t) => markSeen(t.id));
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleSolo();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle style={{ fontSize: 17, fontWeight: 700, textAlign: 'center' }}>
            🎉 Bienvenue dans l'atelier !
          </DialogTitle>
        </DialogHeader>

        {/* ── Tab bar ── */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: '2px',
            borderRadius: 8,
            background: 'var(--color-bg-base)',
            border: '1px solid var(--color-border-base)',
            marginBottom: 12,
          }}
        >
          {(['apprendre', 'defis'] as ActiveTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  border: 'none',
                  background: isActive ? 'var(--color-primary-subtle)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  transition: 'background 0.12s, color 0.12s',
                }}
              >
                {tab === 'apprendre' ? '📚 Apprendre' : '✨ Défis'}
              </button>
            );
          })}
        </div>

        {/* ── Onglet Apprendre ── */}
        {activeTab === 'apprendre' && (
          <>
            <p
              style={{
                fontSize: 13,
                color: 'var(--color-text-muted)',
                textAlign: 'center',
                marginTop: -4,
                marginBottom: 14,
              }}
            >
              Que veux-tu faire aujourd'hui ?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {TUTORIALS.map((tut, idx) => (
                <motion.button
                  key={tut.id}
                  type="button"
                  onClick={() => handleStartTutorial(tut.id)}
                  initial={{ opacity: 0, y: 14, rotateZ: -1.5 }}
                  animate={{ opacity: 1, y: 0, rotateZ: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 22, delay: idx * 0.08 }}
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scaleY: 0.96, scaleX: 1.02 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    border: '2px solid var(--color-primary)',
                    background: 'var(--color-primary-subtle)',
                    color: 'var(--color-text-primary)',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 32, flexShrink: 0 }}>{tut.emoji}</span>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, margin: 0, marginBottom: 2 }}>
                      {tut.title}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>
                      {tut.description}
                    </p>
                  </div>
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: 16,
                      color: 'var(--color-primary)',
                      flexShrink: 0,
                    }}
                  >
                    →
                  </span>
                </motion.button>
              ))}
            </div>

            <motion.button
              type="button"
              onClick={handleSolo}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: TUTORIALS.length * 0.08 + 0.1 }}
              style={{
                marginTop: 6,
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                cursor: 'pointer',
                border: '1px solid var(--color-border-base)',
                background: 'transparent',
                color: 'var(--color-text-muted)',
                fontSize: 12,
              }}
            >
              Commencer seul(e)
            </motion.button>
          </>
        )}

        {/* ── Onglet Défis ── */}
        {activeTab === 'defis' && (
          <>
            <p
              style={{
                fontSize: 13,
                color: 'var(--color-text-muted)',
                textAlign: 'center',
                marginTop: -4,
                marginBottom: 14,
              }}
            >
              Choisis un défi créatif !
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {CHALLENGES.map((challenge, idx) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 22, delay: idx * 0.07 }}
                  style={{
                    borderRadius: 10,
                    border: '1.5px solid var(--color-border-hover)',
                    background: 'var(--color-bg-elevated)',
                    overflow: 'hidden',
                  }}
                >
                  {/* En-tête card */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px 6px',
                    }}
                  >
                    <span style={{ fontSize: 26, flexShrink: 0 }}>{challenge.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          margin: 0,
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {challenge.title}
                      </p>
                      {/* Badge difficulté — Norman §9.2 */}
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: 3,
                          padding: '1px 7px',
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 600,
                          ...DIFFICULTY_STYLES[challenge.difficulty],
                        }}
                      >
                        {DIFFICULTY_LABEL[challenge.difficulty]}
                      </span>
                    </div>
                  </div>

                  {/* Hint — toujours visible, Meier §10.2 */}
                  <p
                    style={{
                      margin: 0,
                      padding: '0 12px 8px',
                      fontSize: 11,
                      color: 'var(--color-text-muted)',
                      lineHeight: 1.5,
                    }}
                  >
                    {challenge.hint}
                  </p>

                  {/* Bouton Relever */}
                  <div style={{ padding: '0 12px 10px' }}>
                    <motion.button
                      type="button"
                      onClick={handleChallenge}
                      whileHover={{ y: -2, scale: 1.02 }}
                      whileTap={{ scaleY: 0.96, scaleX: 1.02 }}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: 7,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 700,
                        border: '1.5px solid var(--color-primary)',
                        background: 'var(--color-primary-subtle)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                      }}
                    >
                      Relever ce défi <span>→</span>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
