import { useState } from 'react';
import type { BoneTool } from '@/types/bone';

/**
 * État local de l'éditeur osseux — non persisté (UI uniquement).
 */
export function useBoneEditor() {
  const [activeTool, setActiveTool] = useState<BoneTool>('select');
  const [selectedBoneId, setSelectedBoneId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  return {
    activeTool,
    setActiveTool,
    selectedBoneId,
    setSelectedBoneId,
    zoom,
    setZoom,
    stagePos,
    setStagePos,
  };
}
