import { AlertTriangle, X, Check } from 'lucide-react';
import { t } from '@/lib/translations';

interface ConfirmDeletePanelProps {
  characterName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * ConfirmDeletePanel — Confirmation de suppression compacte.
 */
export function ConfirmDeletePanel({
  characterName,
  onConfirm,
  onCancel,
}: ConfirmDeletePanelProps) {
  return (
    <div className="space-y-3">
      {/* Icône + titre */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <p className="text-xs font-semibold leading-tight" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {t('confirmDelete.title', { name: characterName })}
          </p>
          <p className="text-[10px] leading-tight mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {t('confirmDelete.message')}
          </p>
        </div>
      </div>

      {/* Rassurance */}
      <div
        className="rounded-lg px-2.5 py-2"
        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
      >
        <p className="text-[10px] text-blue-400 leading-relaxed">
          Le personnage reste dans ta bibliothèque — tu pourras le remettre en scène plus tard.
        </p>
      </div>

      {/* Boutons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg border transition-colors"
          style={{
            borderColor: 'var(--color-border-base)',
            color: 'rgba(255,255,255,0.7)',
            background: 'var(--color-bg-base)',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border-base)')}
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
          {t('confirmDelete.cancel')}
        </button>

        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg transition-colors bg-red-600 hover:bg-red-500 text-white"
        >
          <Check className="w-3.5 h-3.5" aria-hidden="true" />
          {t('confirmDelete.confirm')}
        </button>
      </div>
    </div>
  );
}

export default ConfirmDeletePanel;
