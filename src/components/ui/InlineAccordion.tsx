import React from 'react';

/**
 * InlineAccordion — Accordéon CSS pur (grid-template-rows 0fr ↔ 1fr).
 *
 * Animation via CSS transition, zéro JavaScript → pas de re-render pendant l'animation.
 * Préférable à AnimatePresence/height pour les panneaux de propriétés (UX fluide sans overhead).
 *
 * @example
 * <InlineAccordion isOpen={open}>
 *   <div className="px-3 py-2">contenu</div>
 * </InlineAccordion>
 */
export function InlineAccordion({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  return (
    <div
      className="grid transition-[grid-template-rows] duration-200 ease-in-out"
      style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}
