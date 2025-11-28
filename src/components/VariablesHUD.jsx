import React from 'react';

export function VariablesHUD({ variables }) {
  if (!variables) return null;
  return (
    <div className="bg-slate-800/70 border border-slate-700 rounded-lg p-4 text-sm text-slate-200">
      <h3 className="font-semibold mb-2">HUD Variables</h3>
      <ul className="grid grid-cols-2 gap-2">
        {Object.entries(variables).map(([name, value]) => (
          <li key={name} className="flex items-center justify-between bg-slate-700/60 px-3 py-2 rounded">
            <span>{name}</span>
            <span className="font-mono">{String(value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
