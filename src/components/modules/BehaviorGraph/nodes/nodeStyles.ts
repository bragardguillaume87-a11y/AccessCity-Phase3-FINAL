/**
 * Shared styles and colors for BehaviorGraph custom nodes.
 * Each node type has a distinct color to visually communicate its role.
 */

export const NODE_COLORS = {
  'trigger-zone':     { bg: '#451a03', border: '#f59e0b', header: '#d97706', text: '#fef3c7' },
  'condition':        { bg: '#1e1b4b', border: '#6366f1', header: '#4f46e5', text: '#e0e7ff' },
  'action':           { bg: '#052e16', border: '#22c55e', header: '#16a34a', text: '#dcfce7' },
  'dialogue-trigger': { bg: '#2e1065', border: '#a855f7', header: '#9333ea', text: '#f3e8ff' },
  'map-exit':         { bg: '#0f172a', border: '#64748b', header: '#475569', text: '#e2e8f0' },
} as const;

export const NODE_EMOJIS = {
  'trigger-zone':     '🎯',
  'condition':        '🔀',
  'action':           '⚡',
  'dialogue-trigger': '💬',
  'map-exit':         '🚪',
} as const;

export const NODE_LABELS = {
  'trigger-zone':     'Zone déclencheur',
  'condition':        'Condition',
  'action':           'Action',
  'dialogue-trigger': 'Scène VN',
  'map-exit':         'Sortie de carte',
} as const;

export type BehaviorNodeTypeKey = keyof typeof NODE_COLORS;

/** Shared wrapper style for all behavior nodes */
export function getNodeWrapperStyle(
  type: BehaviorNodeTypeKey,
  selected: boolean,
): React.CSSProperties {
  const colors = NODE_COLORS[type];
  return {
    background: colors.bg,
    border: `2px solid ${selected ? '#ffffff' : colors.border}`,
    borderRadius: 8,
    minWidth: 180,
    maxWidth: 220,
    overflow: 'hidden',
    boxShadow: selected
      ? `0 0 0 2px ${colors.border}, 0 4px 16px rgba(0,0,0,0.5)`
      : '0 2px 8px rgba(0,0,0,0.4)',
    fontFamily: 'system-ui, sans-serif',
    fontSize: 12,
  };
}

export function getHeaderStyle(type: BehaviorNodeTypeKey): React.CSSProperties {
  return {
    background: NODE_COLORS[type].header,
    padding: '6px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontWeight: 700,
    fontSize: 11,
    color: '#fff',
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
  };
}

export function getBodyStyle(type: BehaviorNodeTypeKey): React.CSSProperties {
  return {
    padding: '8px 10px',
    color: NODE_COLORS[type].text,
    fontSize: 12,
    lineHeight: 1.4,
  };
}
