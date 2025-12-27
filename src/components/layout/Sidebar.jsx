import React from 'react';

/**
 * Sidebar - Navigation panel for project explorer
 *
 * Features:
 * - role="navigation" for ARIA landmark
 * - Wraps ExplorerPanel with proper semantics
 * - Accessible navigation for scenes, characters, dialogues
 */
export default function Sidebar({
  children,
  className = ''
}) {
  return (
    <nav
      role="navigation"
      aria-label="Project navigation"
      className={className}
    >
      {children}
    </nav>
  );
}
