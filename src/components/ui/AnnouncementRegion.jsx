import React from 'react';
import { useUIStore } from '../../stores/index.js';

/**
 * AnnouncementRegion - Live region for screen reader announcements
 *
 * Provides accessible notifications for important state changes that should be
 * announced to screen reader users without visual display.
 *
 * Usage in stores/components:
 *   const setAnnouncement = useUIStore(state => state.setAnnouncement);
 *   setAnnouncement('Personnage "Alice" créé avec succès');
 *   setTimeout(() => setAnnouncement(''), 3000); // Clear after 3s
 *
 * ARIA Live Regions:
 * - role="status": For non-critical updates
 * - aria-live="polite": Waits for user to finish current task
 * - aria-atomic="true": Reads entire region content when changed
 *
 * @returns {JSX.Element} Visually hidden live region
 */
export function AnnouncementRegion() {
  const announcement = useUIStore(state => state.announcement);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}

/**
 * AssertiveAnnouncementRegion - For critical/urgent announcements
 *
 * Use this for error messages or urgent notifications that should interrupt
 * screen reader output immediately.
 *
 * Usage:
 *   const setUrgentAnnouncement = useUIStore(state => state.setUrgentAnnouncement);
 *   setUrgentAnnouncement('Erreur: La sauvegarde a échoué');
 *
 * @returns {JSX.Element} Visually hidden assertive live region
 */
export function AssertiveAnnouncementRegion() {
  const urgentAnnouncement = useUIStore(state => state.urgentAnnouncement);

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className="sr-only"
    >
      {urgentAnnouncement}
    </div>
  );
}
