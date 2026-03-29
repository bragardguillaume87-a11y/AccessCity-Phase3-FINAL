import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRigStore } from '@/stores/rigStore';
import { RIG_TEMPLATES } from '@/config/rigTemplates';

interface TemplatePickerProps {
  characterId: string;
  open: boolean;
  onClose: () => void;
}

/**
 * TemplatePicker — Dialog de choix d'un template de rig pré-câblé.
 * Le bouton déclencheur extérieur porte data-tutorial-id="template-picker-button".
 * §1.4 nintendo-ux : cards ratio 3/4, spring animation, emoji grand.
 */
export function TemplatePicker({ characterId, open, onClose }: TemplatePickerProps) {
  const addRigFromTemplate = useRigStore((s) => s.addRigFromTemplate);
  const [applying, setApplying] = useState(false);

  const handlePick = (templateId: string) => {
    if (applying) return;
    setApplying(true);
    addRigFromTemplate(characterId, templateId);
    // Fermer après un bref délai (feedback de création)
    setTimeout(() => {
      setApplying(false);
      onClose();
    }, 180);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle style={{ fontSize: 16, fontWeight: 700 }}>
            🧍 Choisir un modèle de squelette
          </DialogTitle>
        </DialogHeader>

        <p
          style={{
            fontSize: 12,
            color: 'var(--color-text-muted)',
            marginBottom: 12,
            marginTop: -4,
          }}
        >
          Un modèle crée un squelette complet déjà assemblé — parfait pour commencer !
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {RIG_TEMPLATES.map((tpl, idx) => (
            <motion.button
              key={tpl.id}
              type="button"
              onClick={() => handlePick(tpl.id)}
              disabled={applying}
              initial={{ opacity: 0, y: 12, rotateZ: -2 }}
              animate={{ opacity: 1, y: 0, rotateZ: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 22, delay: idx * 0.06 }}
              whileHover={{ y: -4, scale: 1.03 }}
              whileTap={{ scaleY: 0.95, scaleX: 1.02 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                width: 120,
                aspectRatio: '3 / 4',
                borderRadius: 10,
                cursor: applying ? 'wait' : 'pointer',
                border: '2px solid var(--color-primary)',
                background: 'var(--color-primary-subtle)',
                padding: '8px 6px',
                gap: 6,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Emoji grand centré */}
              <span
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -60%)',
                  fontSize: 48,
                  lineHeight: 1,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                {tpl.emoji}
              </span>

              {/* Label gradient bas */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '18px 6px 7px',
                  background: 'linear-gradient(to top, rgba(88,28,235,0.88), transparent)',
                  borderRadius: '0 0 8px 8px',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', margin: 0 }}>
                  {tpl.name}
                </p>
                <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                  {tpl.description}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
