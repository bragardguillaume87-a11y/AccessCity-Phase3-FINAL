import React from 'react';
import { Button } from '@/components/ui/button';

const TEXT_CONFIGS = {
  h1: { defaultText: 'Heading', fontSize: 32, fontWeight: 'bold' },
  h2: { defaultText: 'Subheading', fontSize: 24, fontWeight: '600' },
  body: { defaultText: 'Paragraph text', fontSize: 16, fontWeight: 'normal' },
} as const;

type TextType = keyof typeof TEXT_CONFIGS;

const TEXT_ITEMS: { type: TextType; label: string; sublabel: string; className: string }[] = [
  { type: 'h1', label: 'H1', sublabel: 'Heading', className: 'text-lg font-bold' },
  { type: 'h2', label: 'H2', sublabel: 'Subheading', className: 'text-base font-semibold' },
  { type: 'body', label: 'Body', sublabel: 'Paragraph', className: 'text-sm' },
];

export function TextSection() {
  const handleDragStart = (e: React.DragEvent, textType: TextType) => {
    const config = TEXT_CONFIGS[textType];
    const dragData = { type: 'textbox', ...config };
    e.dataTransfer.setData('text/x-drag-type', 'textbox');
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="p-3 space-y-2">
      {TEXT_ITEMS.map(({ type, label, sublabel, className }) => (
        <div
          key={type}
          draggable
          onDragStart={(e) => handleDragStart(e, type)}
          className="hover:scale-102 active:scale-98 transition-transform"
        >
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start hover:bg-[var(--color-bg-hover)] cursor-grab active:cursor-grabbing pointer-events-none"
            aria-label={`Drag ${sublabel.toLowerCase()} text to canvas`}
          >
            <span className={className}>{label}</span>
            <span className="ml-2 text-xs">{sublabel}</span>
          </Button>
        </div>
      ))}
      <p className="text-xs text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border-base)]">
        Drag text boxes to canvas
      </p>
    </div>
  );
}
