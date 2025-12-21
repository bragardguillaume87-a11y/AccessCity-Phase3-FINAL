import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn.js';

/**
 * AutoSaveIndicator - Visual feedback for auto-save status
 *
 * Inspiration: Google Docs, Notion, Figma
 *
 * States:
 * - idle: No recent changes
 * - saving: Currently saving
 * - saved: Successfully saved (shows time since)
 * - error: Save failed
 *
 * Features:
 * - Smooth transitions between states
 * - Relative time display (2s ago, 1min ago)
 * - Error state with retry button
 * - Accessible (ARIA live region)
 *
 * Usage:
 * const { lastSaved, isSaving } = useUIStore();
 * <AutoSaveIndicator lastSaved={lastSaved} isSaving={isSaving} />
 */
export function AutoSaveIndicator({
  lastSaved, // Date | null
  isSaving = false,
  error = null,
  onRetry,
  className,
}) {
  const [, forceUpdate] = useState(0);

  // Update every second for relative time
  useEffect(() => {
    if (!lastSaved) return;

    const interval = setInterval(() => {
      forceUpdate(n => n + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastSaved]);

  const getTimeSince = () => {
    if (!lastSaved) return null;

    const now = Date.now();
    const saved = new Date(lastSaved).getTime();
    const diffSeconds = Math.floor((now - saved) / 1000);

    if (diffSeconds < 5) return 'just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}min ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return 'more than a day ago';
  };

  const timeSince = getTimeSince();

  // Determine current state
  let state = 'idle';
  if (error) state = 'error';
  else if (isSaving) state = 'saving';
  else if (lastSaved) state = 'saved';

  // State configurations
  const states = {
    idle: {
      icon: '⚪',
      text: 'No changes',
      color: 'text-slate-600',
      bgColor: 'bg-slate-800/50',
    },
    saving: {
      icon: '💾',
      text: 'Saving...',
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
      animate: true,
    },
    saved: {
      icon: '✓',
      text: `Saved ${timeSince}`,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
    },
    error: {
      icon: '⚠️',
      text: error || 'Save failed',
      color: 'text-red-400',
      bgColor: 'bg-red-900/20',
    },
  };

  const config = states[state];

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
        config.bgColor,
        className
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Icon */}
      <span
        className={cn(
          "flex-shrink-0 text-sm transition-transform",
          config.animate && "animate-pulse"
        )}
        aria-hidden="true"
      >
        {config.icon}
      </span>

      {/* Text */}
      <span className={cn("flex-1 text-xs font-medium", config.color)}>
        {config.text}
      </span>

      {/* Retry button (error state only) */}
      {state === 'error' && onRetry && (
        <button
          onClick={onRetry}
          className="flex-shrink-0 px-2 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
          aria-label="Retry save"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * SaveStatusBadge - Compact version for toolbars/headers
 */
export function SaveStatusBadge({ lastSaved, isSaving, className }) {
  if (isSaving) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 bg-blue-900/30 text-blue-400 text-xs font-medium rounded-full animate-pulse",
          className
        )}
        role="status"
        aria-label="Saving"
      >
        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" />
        Saving
      </span>
    );
  }

  if (lastSaved) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 bg-green-900/30 text-green-400 text-xs font-medium rounded-full",
          className
        )}
        role="status"
        aria-label="All changes saved"
      >
        ✓ Saved
      </span>
    );
  }

  return null;
}
