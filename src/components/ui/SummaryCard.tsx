import React from 'react';
import { Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SummaryCardProps {
  title: string;
  icon: React.ReactNode;
  value: string;
  isComplete: boolean;
  onEdit: () => void;
}

export function SummaryCard({ title, icon, value, isComplete, onEdit }: SummaryCardProps) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className={cn(
        "p-3 rounded-lg border text-left transition-all hover:scale-[1.02] group",
        isComplete
          ? "bg-green-500/10 border-green-500/30"
          : "bg-amber-500/10 border-amber-500/30"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{title}</span>
        <div className="flex items-center gap-1">
          {icon}
          <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      <div className="font-medium truncate">{value}</div>
    </button>
  );
}
