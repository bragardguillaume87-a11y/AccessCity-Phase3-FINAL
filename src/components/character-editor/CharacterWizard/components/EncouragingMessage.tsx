
import { cn } from '@/lib/utils';
import { CheckCircle2, Lightbulb, Sparkles } from 'lucide-react';

type MessageType = 'success' | 'info' | 'encouragement';

interface EncouragingMessageProps {
  type: MessageType;
  message: string;
  className?: string;
}

const ICONS = {
  success: CheckCircle2,
  info: Lightbulb,
  encouragement: Sparkles
};

const STYLES = {
  success: 'bg-green-500/10 border-green-500/30 text-green-400',
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  encouragement: 'bg-primary/10 border-primary/30 text-primary'
};

/**
 * EncouragingMessage - Kid-friendly feedback messages
 *
 * Shows positive reinforcement with icons and colors.
 * Animated entrance for engagement.
 */
export function EncouragingMessage({
  type,
  message,
  className
}: EncouragingMessageProps) {
  const Icon = ICONS[type];

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg border animate-bounce-in",
        STYLES[type],
        className
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

export default EncouragingMessage;
