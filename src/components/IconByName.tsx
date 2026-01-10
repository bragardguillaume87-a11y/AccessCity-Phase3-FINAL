import React from 'react';
import {
  X,
  ArrowLeft,
  ArrowRight,
  Home,
  Play,
  Pause,
  Settings,
  Search,
  Plus,
  Trash2,
  Edit,
  Save,
  Upload,
  Download,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Info,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Menu,
  MoreVertical,
  Copy,
  type LucideProps
} from 'lucide-react';
import { logger } from '@/utils/logger';

/**
 * Icon name type - all available icon names
 */
export type IconName =
  | 'x'
  | 'arrow-left'
  | 'arrow-right'
  | 'home'
  | 'play'
  | 'pause'
  | 'settings'
  | 'search'
  | 'plus'
  | 'trash'
  | 'edit'
  | 'save'
  | 'upload'
  | 'download'
  | 'eye'
  | 'eye-off'
  | 'check'
  | 'alert-circle'
  | 'info'
  | 'help-circle'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'chevron-down'
  | 'menu'
  | 'more-vertical'
  | 'copy';

/**
 * Icon component map - maps icon names to lucide-react components
 */
const iconMap: Record<IconName, React.ComponentType<LucideProps>> = {
  'x': X,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'home': Home,
  'play': Play,
  'pause': Pause,
  'settings': Settings,
  'search': Search,
  'plus': Plus,
  'trash': Trash2,
  'edit': Edit,
  'save': Save,
  'upload': Upload,
  'download': Download,
  'eye': Eye,
  'eye-off': EyeOff,
  'check': Check,
  'alert-circle': AlertCircle,
  'info': Info,
  'help-circle': HelpCircle,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  'menu': Menu,
  'more-vertical': MoreVertical,
  'copy': Copy,
};

/**
 * Props for IconByName component
 */
export interface IconByNameProps extends Omit<LucideProps, 'size'> {
  /** Icon name from the available icon set */
  name: IconName;
  /** Additional CSS classes */
  className?: string;
  /** Icon size in pixels (default: 20) */
  size?: number;
}

/**
 * IconByName - Dynamic Icon Renderer
 *
 * Renders lucide-react icons dynamically by name with type-safe icon selection.
 * Falls back to AlertCircle if the icon name is not found.
 *
 * Features:
 * - Type-safe icon names (IconName union type)
 * - Automatic fallback for unknown icons
 * - Logging for debugging unknown icon requests
 * - Full lucide-react props support (color, strokeWidth, etc.)
 *
 * @example
 * ```tsx
 * <IconByName name="check" size={24} className="text-green-500" />
 * <IconByName name="alert-circle" size={16} strokeWidth={2} />
 * ```
 */
export function IconByName({ name, className = '', size = 20, ...props }: IconByNameProps) {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    logger.warn(`[IconByName] Unknown icon: "${name}"`);
    return <AlertCircle className={className} size={size} {...props} />;
  }

  return <IconComponent className={className} size={size} {...props} />;
}
