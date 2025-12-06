import React from 'react';

export default function DeltaBadges({ deltas }) {
  // deltas: [{ id, variable, delta }]
  return (
    <div className="pointer-events-none absolute z-50" style={{ top: '64px', left: '280px' }}>
      {deltas.map(d => (
        <div
          key={d.id}
          className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-semibold transition-opacity duration-700 ${
            d.delta > 0
              ? 'bg-emerald-600/90 text-white border border-emerald-400/60'
              : d.delta < 0
              ? 'bg-rose-600/90 text-white border border-rose-400/60'
              : 'bg-slate-600/90 text-white border border-slate-400/60'
          }`}
          style={{ animation: 'riseFade 1.5s ease forwards' }}
        >
          {d.variable} {d.delta > 0 ? '+' : ''}{d.delta}
        </div>
      ))}
      <style>{`
        @keyframes riseFade {
          0% { opacity: 0; transform: translateY(8px) scale(0.98); }
          15% { opacity: 1; transform: translateY(0) scale(1); }
          85% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-8px) scale(0.98); }
        }
      `}</style>
    </div>
  );
}
