import React from 'react';

/**
 * Inspector - Properties panel for selected elements
 *
 * Features:
 * - role="complementary" for ARIA landmark
 * - Wraps PropertiesPanel with proper semantics
 * - Displays properties and actions for selected scene/character/dialogue
 */
export default function Inspector({
  children,
  className = ''
}) {
  return (
    <aside
      role="complementary"
      aria-label="Scene properties and actions"
      className={className}
    >
      {children}
    </aside>
  );
}
