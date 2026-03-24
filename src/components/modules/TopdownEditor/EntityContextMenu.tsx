/**
 * EntityContextMenu — Menu contextuel pour les entités sur la carte (style GDevelop)
 *
 * Réutilise le pattern exact de CharacterContextMenu :
 * - framer-motion spring animation
 * - outside-click + Escape key close
 * - auto-positioning (stay on screen)
 * - portal via createPortal(document.body)
 *
 * @module components/modules/TopdownEditor/EntityContextMenu
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Trash2, Copy, Crown, MapPin, X } from 'lucide-react';
import type { EntityInstance } from '@/types/sprite';
import type { SpriteSheetConfig } from '@/types/sprite';
import { Z_INDEX } from '@/utils/zIndexLayers';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface EntityContextMenuProps {
  x: number;
  y: number;
  entity: EntityInstance;
  spriteConfig?: SpriteSheetConfig;
  isPlayerSprite: boolean;
  instanceCount: number;
  onClose: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onSetAsPlayer: () => void;
  onConfigureSprite: () => void;
  /** Ouvre ObjectDefinitionDialog pour la définition liée (ObjectInstance only) */
  onEditDefinition?: () => void;
  /** ID de définition lié à cette entité (si ObjectInstance) */
  definitionId?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

function EntityContextMenuInner({
  x,
  y,
  entity,
  spriteConfig,
  isPlayerSprite,
  instanceCount,
  onClose,
  onDelete,
  onDuplicate,
  onSetAsPlayer,
  onConfigureSprite,
  onEditDefinition,
  definitionId,
}: EntityContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const displayName =
    entity.displayName ??
    spriteConfig?.displayName ??
    entity.spriteAssetUrl
      .split('/')
      .pop()
      ?.replace(/\.[^.]+$/, '') ??
    'Entité';

  // Auto-position to stay on screen
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const padding = 12;
    let ax = x;
    let ay = y;
    if (x + rect.width > window.innerWidth - padding) ax = window.innerWidth - rect.width - padding;
    if (y + rect.height > window.innerHeight - padding)
      ay = window.innerHeight - rect.height - padding;
    setPosition({ x: Math.max(padding, ax), y: Math.max(padding, ay) });
  }, [x, y]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [onClose]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const behaviorLabel =
    entity.behavior === 'dialogue'
      ? '💬 Dialogue'
      : entity.behavior === 'patrol'
        ? '🔄 Patrouille'
        : '· Statique';

  const menuItems = [
    {
      id: 'duplicate',
      icon: Copy,
      label: 'Dupliquer',
      desc: 'Ctrl+D',
      onClick: () => {
        onDuplicate();
        onClose();
      },
      danger: false,
    },
    // Si l'entité a une définition ObjectDefinition → "Configurer l'objet" (nouveau système)
    // Sinon → "Modifier le sprite" (legacy SpriteImportDialog)
    ...(onEditDefinition && definitionId
      ? [
          {
            id: 'edit-definition',
            icon: Settings,
            label: "Configurer l'objet",
            desc: 'Composants & propriétés',
            onClick: () => {
              onEditDefinition();
              onClose();
            },
            danger: false,
          },
        ]
      : [
          {
            id: 'configure',
            icon: Settings,
            label: 'Modifier le sprite',
            desc: 'Ouvrir SpriteImportDialog',
            onClick: () => {
              onConfigureSprite();
              onClose();
            },
            danger: false,
          },
        ]),
    ...(!isPlayerSprite
      ? [
          {
            id: 'set-player',
            icon: Crown,
            label: 'Définir comme sprite joueur',
            desc: 'Mettre à jour MapMetadata',
            onClick: () => {
              onSetAsPlayer();
              onClose();
            },
            danger: false,
          },
        ]
      : []),
    {
      id: 'instances',
      icon: MapPin,
      label: `Instances sur la scène (${instanceCount})`,
      desc: "Nombre d'instances de ce type",
      onClick: () => onClose(),
      danger: false,
    },
    {
      id: 'delete',
      icon: Trash2,
      label: 'Supprimer',
      desc: 'Suppr',
      onClick: () => {
        onDelete();
        onClose();
      },
      danger: true,
    },
  ];

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.92, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -2 }}
      transition={{ type: 'spring', damping: 20, stiffness: 320 }}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: 240,
        zIndex: Z_INDEX.TOPDOWN_DIALOG,
        background: 'var(--color-bg-elevated, #1e1e35)',
        border: '1px solid var(--color-border-base, rgba(255,255,255,0.1))',
        borderRadius: 12,
        boxShadow: '0 12px 32px rgba(0,0,0,0.65)',
        overflow: 'hidden',
      }}
      role="menu"
      aria-label="Menu entité"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          borderBottom: '1px solid var(--color-border-base, rgba(255,255,255,0.08))',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: 'rgba(139,92,246,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          🧍
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.92)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayName}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
            {behaviorLabel} · ({entity.cx}, {entity.cy})
            {isPlayerSprite && <span style={{ color: '#fbbf24', marginLeft: 4 }}>👑 Joueur</span>}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
          aria-label="Fermer"
        >
          <X size={13} />
        </button>
      </div>

      {/* Menu items */}
      <div style={{ padding: 6 }}>
        <AnimatePresence>
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const isHovered = hoveredIdx === idx;
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.1 }}
                onClick={item.onClick}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 8px',
                  borderRadius: 7,
                  border: 'none',
                  cursor: 'pointer',
                  background: isHovered
                    ? item.danger
                      ? 'rgba(239,68,68,0.12)'
                      : 'rgba(255,255,255,0.06)'
                    : 'transparent',
                  color: item.danger
                    ? isHovered
                      ? '#f87171'
                      : 'rgba(239,68,68,0.8)'
                    : 'rgba(255,255,255,0.82)',
                  transition: 'background 0.1s, color 0.1s',
                  textAlign: 'left',
                }}
                role="menuitem"
              >
                <Icon size={13} style={{ flexShrink: 0, opacity: 0.8 }} />
                <span style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>{item.label}</span>
                {item.desc && <span style={{ fontSize: 10, opacity: 0.4 }}>{item.desc}</span>}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Portal wrapper ────────────────────────────────────────────────────────────

export default function EntityContextMenu(props: EntityContextMenuProps) {
  return createPortal(
    <AnimatePresence>
      <EntityContextMenuInner {...props} />
    </AnimatePresence>,
    document.body
  );
}
