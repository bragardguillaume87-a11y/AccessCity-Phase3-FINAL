import React from 'react';

/**
 * Skip Links Component - WCAG 2.2 AA Compliant
 *
 * Provides keyboard users with quick navigation to main content areas
 * - Visible only on keyboard focus (Tab key)
 * - High contrast and clear positioning
 * - Multiple skip targets for complex layouts
 */
export default function SkipToContent({ targetId = 'main-content' }) {
  const skipLinks = [
    { id: 'main-content', label: 'Aller au contenu principal' },
    { id: 'editor-canvas', label: 'Aller au canvas d\'édition' },
    { id: 'scene-list', label: 'Aller à la liste des scènes' },
  ];

  return (
    <nav
      aria-label="Liens de navigation rapide"
      className="sr-only-focusable"
    >
      {skipLinks.map((link, index) => {
        // Only render the link if the target exists or is the default
        if (targetId && link.id !== targetId && link.id !== 'main-content') {
          return null;
        }

        return (
          <a
            key={link.id}
            href={`#${link.id}`}
            className="sr-only focus:not-sr-only focus:fixed focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded-md focus:shadow-xl focus:z-[10000] focus:outline-none focus:ring-4 focus:ring-blue-500"
            style={{
              top: `${12 + index * 48}px`,
              left: '12px',
            }}
            onClick={(e) => {
              // Ensure the target element receives focus
              const target = document.getElementById(link.id);
              if (target) {
                e.preventDefault();
                target.setAttribute('tabindex', '-1');
                target.focus();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
          >
            {link.label}
          </a>
        );
      })}
    </nav>
  );
}
