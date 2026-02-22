/**
 * edgeFactory.ts — Factory Pattern for creating ReactFlow edges
 *
 * Eliminates the 5 near-identical `edges.push({...})` blocks in buildGraphEdges.ts
 * by providing a single `createEdge()` function parameterized by edge category.
 */

import type { Edge } from '@xyflow/react';
import type { EdgeStyle } from '@/config/graphThemes/types';

// ============================================================================
// TYPES
// ============================================================================

export type EdgeCategory = 'linear' | 'choice' | 'convergence' | 'sceneJump';

export interface EdgeConfig {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
  category: EdgeCategory;
  label?: string;
  data?: Record<string, unknown>;
}

export interface ResolvedEdgeStyles {
  linear: EdgeStyle;
  choice: EdgeStyle;
  convergence: EdgeStyle;
  sceneJump: EdgeStyle;
}

// ============================================================================
// LABEL STYLES (shared across all edge types)
// ============================================================================

const LABEL_STYLE = { fill: '#e2e8f0', fontSize: 12, fontWeight: 500 };
const LABEL_BG_STYLE = { fill: '#1e293b', fillOpacity: 0.8 };
const CONVERGENCE_LABEL_STYLE = { fill: '#86efac', fontSize: 11, fontWeight: 500 };

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create a typed ReactFlow Edge from a config + resolved theme styles.
 *
 * @param config - Edge identity and category
 * @param styles - Resolved edge styles (theme or defaults)
 * @param edgeType - ReactFlow edge type string (e.g. 'step', 'smoothstep')
 * @param categoryTypeOverrides - Override edge type for specific categories (e.g. cosmosConvergence for convergence)
 */
export function createEdge(
  config: EdgeConfig,
  styles: ResolvedEdgeStyles,
  edgeType: string,
  categoryTypeOverrides?: Partial<Record<EdgeCategory, string>>
): Edge {
  const style = styles[config.category];
  const resolvedType = categoryTypeOverrides?.[config.category] ?? edgeType;
  const isConvergence = config.category === 'convergence';

  return {
    id: config.id,
    source: config.source,
    sourceHandle: config.sourceHandle,
    target: config.target,
    targetHandle: config.targetHandle,
    type: resolvedType,
    animated: style.animated,
    label: config.label,
    data: config.data ?? (config.label ? { label: config.label } : undefined),
    style: {
      stroke: style.stroke,
      strokeWidth: style.strokeWidth,
      strokeDasharray: style.strokeDasharray,
      filter: style.filter,
    },
    labelStyle: isConvergence ? CONVERGENCE_LABEL_STYLE : LABEL_STYLE,
    labelBgStyle: LABEL_BG_STYLE,
  };
}
