import React, { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ChevronRight, GitBranch } from 'lucide-react';
import type { ClusterNodeData } from '@/types';
import { useGraphTheme } from '@/hooks/useGraphTheme';
import { useUIStore } from '@/stores/uiStore';
import { COSMOS_ANIMATIONS, NODE_FONT } from '@/config/cosmosConstants';

interface ClusterNodeProps {
  data: ClusterNodeData;
  selected?: boolean;
}

/**
 * ClusterNode - Compact collapsed node representing a choice + its responses.
 *
 * Displayed in Pro mode when collapse is enabled.
 * Shows: speaker, choice preview, response count.
 * Click to expand (reveal individual nodes).
 */
export const ClusterNode = React.memo(function ClusterNode({ data, selected }: ClusterNodeProps): React.JSX.Element {
  const { clusterId, speaker, responseCount, choicePreview, containedIndices } = data;
  const theme = useGraphTheme();
  const sizes = theme.sizes;
  const toggleClusterExpanded = useUIStore((state) => state.toggleClusterExpanded);

  const handleExpand = useCallback(() => {
    toggleClusterExpanded(clusterId);
  }, [clusterId, toggleClusterExpanded]);

  const themeColors = theme.nodes.choice;
  const borderColor = selected ? '#60a5fa' : themeColors.border;

  return (
    <div
      className="cluster-node"
      role="treeitem"
      aria-label={`Groupe replié: ${speaker} — ${responseCount} réponses. Cliquer pour déplier.`}
      aria-expanded={false}
      tabIndex={0}
      onClick={handleExpand}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleExpand(); } }}
      style={{
        background: `linear-gradient(135deg, ${themeColors.bg}, ${themeColors.border}15)`,
        borderColor,
        borderWidth: selected ? '3px' : '2px',
        borderStyle: 'solid',
        borderRadius: `${sizes.nodeBorderRadius}px`,
        padding: '10px 14px',
        width: `${sizes.nodeWidth}px`,
        minHeight: '60px',
        boxShadow: selected ? themeColors.shadowSelected : themeColors.shadow,
        transition: COSMOS_ANIMATIONS.transitionFast,
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      {/* Handles for edges */}
      <Handle type="target" position={Position.Top} style={{ background: borderColor, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: borderColor, width: 8, height: 8 }} />

      {/* Icon */}
      <div style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        backgroundColor: `${themeColors.border}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <GitBranch size={18} color={themeColors.text} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: `${sizes.fontSizeSpeaker}px`, fontWeight: 600, color: themeColors.text }}>
          {speaker}
        </div>
        <div style={{ fontSize: `${NODE_FONT.badge}px`, color: themeColors.text, opacity: 0.8, marginTop: 2 }}>
          {choicePreview}
        </div>
        <div style={{
          fontSize: `${NODE_FONT.badge}px`,
          color: themeColors.text,
          opacity: 0.6,
          marginTop: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <span style={{
            backgroundColor: `${themeColors.border}40`,
            padding: '1px 6px',
            borderRadius: 8,
            fontWeight: 600,
          }}>
            {containedIndices.length} dialogues
          </span>
          <span>({responseCount} réponse{responseCount !== 1 ? 's' : ''})</span>
        </div>
      </div>

      {/* Expand indicator */}
      <ChevronRight
        size={18}
        color={themeColors.text}
        style={{ opacity: 0.5, flexShrink: 0 }}
      />
    </div>
  );
});
