import React from 'react';

const PROP_EMOJIS = ['📦', '🚗', '🏠', '🌳', '⭐', '💡'];

export function ObjectsSection() {
  const handleDragStart = (e: React.DragEvent, emoji: string) => {
    const dragData = { type: 'prop', emoji };
    e.dataTransfer.setData('text/x-drag-type', 'prop');
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <section className="sp-sec" aria-labelledby="objects-section-heading">
      <h3 id="objects-section-heading" className="sp-lbl">OBJETS</h3>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {PROP_EMOJIS.map((emoji, idx) => (
          <button
            key={idx}
            draggable
            onDragStart={(e) => handleDragStart(e, emoji)}
            className="aspect-square flex items-center justify-center text-2xl bg-[var(--color-bg-base)] border-2 border-[var(--color-border-base)] hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-hover)] rounded-lg cursor-grab active:cursor-grabbing transition-all hover:scale-110 active:scale-95"
            aria-label={`Glisser l'objet ${emoji} vers le canvas`}
          >
            {emoji}
          </button>
        ))}
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">Glisse un objet vers le canvas</p>
    </section>
  );
}
