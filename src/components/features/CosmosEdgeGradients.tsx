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

export function CosmosEdgeGradients(): React.JSX.Element {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
      <defs>
        {/* Linear edge gradient: Slate → Cyan */}
        <linearGradient id="cosmos-linear-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#64748b" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#94a3b8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#06FFF0" stopOpacity="0.7" />
        </linearGradient>

        {/* Choice edge gradient: Purple → Pink */}
        <linearGradient id="cosmos-choice-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9D4EDD" stopOpacity="1" />
          <stop offset="50%" stopColor="#c084fc" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FF006E" stopOpacity="0.8" />
        </linearGradient>

        {/* Convergence edge gradient: Green → Cyan */}
        <linearGradient id="cosmos-convergence-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#34d399" stopOpacity="1" />
          <stop offset="100%" stopColor="#06FFF0" stopOpacity="0.8" />
        </linearGradient>

        {/* Scene jump gradient: Yellow → Cyan */}
        <linearGradient id="cosmos-scene-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFD60A" stopOpacity="1" />
          <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#06FFF0" stopOpacity="0.7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default CosmosEdgeGradients;
