import React from 'react';

/**
 * Skip link configuration
 */
export interface SkipLink {
  /** Target element ID */
  id: string;
  /** Accessible label for screen readers */
  label: string;
}

/**
 * Props for SkipToContent component
 */
export interface SkipToContentProps {
  /** Target element ID for main content (default: 'main-content') */
  targetId?: string;
}

/**
 * SkipToContent - WCAG 2.2 AA Accessibility Skip Links
 *
 * Provides keyboard navigation skip links for users who rely on keyboard navigation
 * or screen readers. Skip links allow users to bypass repetitive navigation and
 * jump directly to main content areas.
 *
 * Compliance: WCAG 2.2 Level AA - Criterion 2.4.1 (Bypass Blocks)
 *
 * Features:
 * - Hidden by default, visible on keyboard focus
 * - Smooth scroll to target elements
 * - Multiple skip targets (main content, editor canvas, scene list)
 * - High contrast styling for visibility
 *
 * @example
 * ```tsx
 * <SkipToContent targetId="main-content" />
 * ```
 */
export default function SkipToContent({ targetId = 'main-content' }: SkipToContentProps) {
  const skipLinks: SkipLink[] = [
    { id: 'main-content', label: 'Aller au contenu principal' },
    { id: 'editor-canvas', label: 'Aller au canvas d\'édition' },
    { id: 'scene-list', label: 'Aller à la liste des scènes' },
  ];

  const handleSkipClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.focus({ preventScroll: false });
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="skip-to-content">
      {skipLinks.map(link => (
        <a
          key={link.id}
          href={`#${link.id}`}
          onClick={(e) => handleSkipClick(e, link.id)}
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-tooltip-v2 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200"
        >
          {link.label}
        </a>
      ))}
      <style>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
        .focus\:not-sr-only:focus {
          position: static;
          width: auto;
          height: auto;
          padding: revert;
          margin: revert;
          overflow: visible;
          clip: auto;
          white-space: normal;
        }
      `}</style>
    </div>
  );
}
