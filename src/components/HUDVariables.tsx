import { useEffect, useMemo, useRef, useState } from 'react';
import { TIMING } from '@/config/timing';
import { HUD_THRESHOLDS } from '@/config/constants';

/**
 * Props for HUDVariables component
 */
export interface HUDVariablesProps {
  /** Game variables as key-value pairs (e.g., { "Physique": 80, "Mentale": 60 }) */
  variables: Record<string, number>;
}

/**
 * HUDVariables - Player Variables HUD Display
 *
 * Displays player game variables (health, stats, etc.) in a professional HUD overlay
 * with accessibility features and visual feedback.
 *
 * Features:
 * - Toggle visibility with checkbox
 * - Progress bars with color-coded gradients (green >66, yellow 33-66, red <33)
 * - ARIA live region for announcing changes to screen readers (polite mode)
 * - Icon indicators for common stats (💪 Physique, 🧠 Mentale, 📊 other)
 * - Automatic change detection with accessible announcements
 * - Smooth animations with 500ms transitions
 *
 * Accessibility:
 * - aria-live="polite" for non-critical updates
 * - aria-atomic="true" for complete announcements
 * - progressbar role with aria-valuemin/max/now
 * - aria-label for checkbox and progress bars
 *
 * @example
 * ```tsx
 * <HUDVariables
 *   variables={{
 *     "Physique": 80,
 *     "Mentale": 60,
 *     "Charisme": 45
 *   }}
 * />
 * ```
 */
export default function HUDVariables({ variables }: HUDVariablesProps) {
  const [shown, setShown] = useState(true);
  const liveRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef<Record<string, number>>(variables);

  // Announce accessible changes (aria-live polite for non-critical updates)
  useEffect(() => {
    const prev = prevRef.current || {};
    const diffs: string[] = [];

    Object.keys(variables || {}).forEach((k) => {
      const before = typeof prev[k] === 'number' ? prev[k] : undefined;
      const after = typeof variables[k] === 'number' ? variables[k] : undefined;

      if (before !== undefined && after !== undefined && before !== after) {
        const sign = after > before ? '+' : '';
        diffs.push(`${k} ${sign}${after - before}`);
      }
    });

    if (diffs.length && liveRef.current) {
      liveRef.current.textContent = `Mise à jour: ${diffs.join(', ')}`;
      // Clear text after short delay to avoid pollution
      const timeoutId = window.setTimeout(() => {
        if (liveRef.current) liveRef.current.textContent = '';
      }, TIMING.ARIA_ANNOUNCEMENT_CLEAR);

      return () => window.clearTimeout(timeoutId);
    }

    prevRef.current = variables;
  }, [variables]);

  const entries = useMemo(() => Object.entries(variables || {}), [variables]);

  return (
    <div>
      {/* Live region for non-critical announcements */}
      <div
        ref={liveRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* HUD Toggle */}
      <div className="mb-2 bg-white rounded-lg shadow p-2 inline-flex items-center gap-2">
        <label className="text-xs text-gray-700">Afficher le HUD</label>
        <input
          type="checkbox"
          checked={shown}
          onChange={(e) => setShown(e.target.checked)}
          aria-label="Afficher le HUD des variables"
        />
      </div>

      {/* HUD Display */}
      {shown && (
        <div className="bg-white rounded-lg shadow-lg p-3 w-64">
          <h3 className="font-bold text-sm mb-3 text-primary flex items-center gap-2">
            <span>État du joueur</span>
          </h3>
          <div className="space-y-3">
            {entries.map(([key, value]) => {
              const icon = key === 'Physique' ? '💪' : key === 'Mentale' ? '🧠' : '📊';
              const color =
                value > HUD_THRESHOLDS.HIGH ? 'from-green-500 to-green-600' :
                value > HUD_THRESHOLDS.MEDIUM ? 'from-yellow-500 to-yellow-600' :
                'from-red-500 to-red-600';

              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden="true">{icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700">{key}</span>
                      <span className="text-xs font-bold text-gray-900">{value}/100</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-3 shadow-inner">
                      <div
                        className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500 shadow-sm`}
                        style={{ width: `${value}%` }}
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={value}
                        aria-label={key}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Screen reader only class */}
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
      `}</style>
    </div>
  );
}
