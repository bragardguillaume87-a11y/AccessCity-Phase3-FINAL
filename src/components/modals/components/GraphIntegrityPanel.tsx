import { X, CheckCircle2, AlertCircle, Link2Off, MessageSquare } from 'lucide-react';
import type { IntegrityIssue } from '@/hooks/useGraphIntegrityCheck';

interface GraphIntegrityPanelProps {
  issues: IntegrityIssue[];
  onClose: () => void;
  onSelectDialogue: (index: number) => void;
}

const ICON_BY_TYPE: Record<IntegrityIssue['type'], React.ReactNode> = {
  empty_text: <MessageSquare size={13} className="text-yellow-400 shrink-0" />,
  missing_choice_link: <Link2Off size={13} className="text-red-400 shrink-0" />,
  empty_choice_text: <MessageSquare size={13} className="text-yellow-400 shrink-0" />,
};

export function GraphIntegrityPanel({ issues, onClose, onSelectDialogue }: GraphIntegrityPanelProps) {
  return (
    <div
      className="absolute bottom-16 left-4 z-20 w-72 rounded-xl border-2 border-border bg-card/95 backdrop-blur-sm shadow-2xl overflow-hidden"
      role="dialog"
      aria-label="Vérification du graphe"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <AlertCircle size={15} className="text-orange-400" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">
            {issues.length === 0 ? 'Aucun oubli' : `${issues.length} oubli${issues.length > 1 ? 's' : ''} détecté${issues.length > 1 ? 's' : ''}`}
          </span>
        </div>
        <button
          onClick={onClose}
          title="Fermer"
          aria-label="Fermer le panneau de vérification"
          className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="max-h-64 overflow-y-auto">
        {issues.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center px-4">
            <CheckCircle2 size={28} className="text-green-400" />
            <p className="text-sm text-muted-foreground">Tout est complet !</p>
          </div>
        ) : (
          <ul className="py-1" role="list">
            {issues.map((issue) => (
              <li key={issue.id}>
                <button
                  onClick={() => onSelectDialogue(issue.dialogueIndex)}
                  className="w-full flex items-start gap-2 px-3 py-2 text-left text-xs text-foreground/80 hover:bg-accent hover:text-foreground transition-colors"
                  title={`Aller au noeud ${issue.nodeLabel}`}
                >
                  {ICON_BY_TYPE[issue.type]}
                  <span className="leading-snug">{issue.message}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {issues.length > 0 && (
        <div className="px-3 py-2 border-t border-border bg-card">
          <p className="text-xs text-muted-foreground">
            Cliquez sur un oubli pour naviguer vers le noeud.
          </p>
        </div>
      )}
    </div>
  );
}
