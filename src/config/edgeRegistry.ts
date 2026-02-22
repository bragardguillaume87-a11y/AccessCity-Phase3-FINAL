import type { EdgeTypes } from '@xyflow/react';
import { CosmosChoiceEdge } from '@/components/features/CosmosChoiceEdge';
import { CosmosConvergenceEdge } from '@/components/features/CosmosConvergenceEdge';

// ─── Types ───────────────────────────────────────────────────

export type EdgeCategoryKey = 'choice' | 'convergence';

interface EdgeTypeEntry {
  component: EdgeTypes[string];
  categories: EdgeCategoryKey[];
}

// ─── Registry ────────────────────────────────────────────────

/**
 * Edge type registry — maps theme ID → named edge types.
 * Adding a new theme's custom edges only requires a new entry here.
 */
const EDGE_REGISTRY: Record<string, Record<string, EdgeTypeEntry>> = {
  cosmos: {
    cosmosChoice: {
      component: CosmosChoiceEdge as EdgeTypes[string],
      categories: ['choice'],
    },
    cosmosConvergence: {
      component: CosmosConvergenceEdge as EdgeTypes[string],
      categories: ['convergence'],
    },
  },
};

// ─── Public API ──────────────────────────────────────────────

/**
 * Get the `edgeTypes` map for ReactFlow from a theme ID.
 * Returns `{}` for themes with no custom edge components.
 */
export function getEdgeTypes(themeId: string): EdgeTypes {
  const entries = EDGE_REGISTRY[themeId];
  if (!entries) return {};
  const result: EdgeTypes = {};
  for (const [name, entry] of Object.entries(entries)) {
    result[name] = entry.component;
  }
  return result;
}

/**
 * Get the custom edge type name for a given category within a theme.
 * Falls back to `fallback` if the theme has no custom type for that category.
 *
 * @example getEdgeTypeForCategory('cosmos', 'convergence', 'step') → 'cosmosConvergence'
 */
export function getEdgeTypeForCategory(
  themeId: string,
  category: EdgeCategoryKey,
  fallback: string
): string {
  const entries = EDGE_REGISTRY[themeId];
  if (!entries) return fallback;
  for (const [name, entry] of Object.entries(entries)) {
    if (entry.categories.includes(category)) return name;
  }
  return fallback;
}
