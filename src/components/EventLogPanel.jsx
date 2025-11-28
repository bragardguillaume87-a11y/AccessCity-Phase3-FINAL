import React, { useEffect, useRef, useState } from 'react';
import { EventBus } from '../../core/eventBus.js';

// EventLogPanel écoute un EventBus fourni en prop et liste les événements clés du moteur.
export function EventLogPanel({ eventBus }) {
  const [entries, setEntries] = useState([]);
  const maxEntries = 50;
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!eventBus) return;

    const push = (type, payload) => {
      setEntries(prev => {
        const next = [{ ts: new Date().toISOString(), type, payload }, ...prev];
        return next.slice(0, maxEntries);
      });
    };

    eventBus.on('engine:dialogue_show', (d) => push('dialogue_show', d));
    eventBus.on('engine:choices_show', (d) => push('choices_show', d));
    eventBus.on('engine:scene_end', () => push('scene_end', null));
    eventBus.on('variable:changed', (d) => push('variable_changed', d));

    return () => { mountedRef.current = false; };
  }, [eventBus]);

  return (
    <div className="bg-slate-900/70 border border-slate-700 rounded-lg p-4 text-xs text-slate-200">
      <h3 className="font-semibold mb-2">Event Log</h3>
      <ul className="space-y-1 max-h-64 overflow-auto pr-1">
        {entries.map((e, idx) => (
          <li key={idx} className="border-b border-slate-700/40 pb-1">
            <span className="text-slate-400">[{e.ts}]</span> <span className="text-blue-300">{e.type}</span>
            {e.payload && (
              <pre className="mt-1 whitespace-pre-wrap break-words text-slate-300">
{JSON.stringify(e.payload, null, 2)}
              </pre>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
