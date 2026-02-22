/**
 * CosmosEdgeGradients - SVG gradient definitions for Cosmos theme edges
 *
 * **PHASE 8: Cosmic gradients for animated edges**
 *
 * These gradients are referenced by ID in cosmos.ts edge styles.
 * The gradients transition from one Perplexity color to another for a cosmic effect.
 *
 * Usage:
 * - Mount this component before ReactFlow to ensure gradients are available
 * - Reference in cosmos.ts using `stroke: 'url(#cosmos-linear-gradient)'`
 */
import React from 'react';
import { COSMOS_COLORS } from '@/config/cosmosConstants';

const EDGE_GRADIENTS = Object.values(COSMOS_COLORS.gradients);

export function CosmosEdgeGradients(): React.JSX.Element {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
      <defs>
        {EDGE_GRADIENTS.map((gradient) => (
          <linearGradient key={gradient.id} id={gradient.id} x1="0%" y1="0%" x2="100%" y2="0%">
            {gradient.stops.map((stop) => (
              <stop
                key={stop.offset}
                offset={stop.offset}
                stopColor={stop.color}
                stopOpacity={stop.opacity}
              />
            ))}
          </linearGradient>
        ))}
      </defs>
    </svg>
  );
}

export default CosmosEdgeGradients;
