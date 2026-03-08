import * as React from 'react';
import { ChevronDown } from 'lucide-react';

export function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/70 overflow-hidden bg-background/30">
      {children}
    </div>
  );
}

interface SectionHeaderProps {
  icon?: React.ReactNode;
  emoji?: string;
  label: string;
  colorClass?: string;
  isCollapsible?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  badge?: string;
}

export function SectionHeader({
  icon, emoji, label,
  colorClass = 'text-muted-foreground',
  isCollapsible = false, isOpen = true, onToggle, badge,
}: SectionHeaderProps) {
  const inner = (
    <div className="px-3 py-2.5 bg-background/60 border-b border-border/50 flex items-center gap-2">
      {emoji && <span className="text-sm leading-none">{emoji}</span>}
      {icon && <span className={colorClass}>{icon}</span>}
      <span className={`text-xs font-semibold uppercase tracking-wider flex-1 ${colorClass}`}>
        {label}
      </span>
      {badge && <span className="text-xs text-muted-foreground">{badge}</span>}
      {isCollapsible && (
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      )}
    </div>
  );
  if (isCollapsible) {
    return <button type="button" onClick={onToggle} className="w-full text-left">{inner}</button>;
  }
  return inner;
}
