import React from 'react';
import {
  X,
  ArrowLeft,
  ArrowRight,
  Home,
  Play,
  Pause,
  Heart,
  Zap,
  Shield,
  BarChart3,
  Settings,
  Download,
  Upload,
  Trash2,
  Edit,
  Plus,
  Minus,
  Check,
  AlertCircle,
  Info,
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';

const iconMap = {
  'x': X,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'home': Home,
  'play': Play,
  'pause': Pause,
  'heart': Heart,
  'zap': Zap,
  'shield': Shield,
  'bar-chart': BarChart3,
  'settings': Settings,
  'download': Download,
  'upload': Upload,
  'trash': Trash2,
  'edit': Edit,
  'plus': Plus,
  'minus': Minus,
  'check': Check,
  'alert': AlertCircle,
  'info': Info,
  'sparkles': Sparkles,
  'volume': Volume2,
  'volume-x': VolumeX
};

export function IconByName({ name, className = '', size = 20, ...props }) {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    console.warn(`[IconByName] Unknown icon: "${name}"`);
    return <AlertCircle className={className} size={size} {...props} />;
  }

  return <IconComponent className={className} size={size} {...props} />;
}

export default IconByName;
