import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getZIndexClass } from '../utils/zIndexLayers.js';
import { AlertTriangle, Info, CheckCircle, type LucideIcon } from 'lucide-react';

/**
 * Variant types for ConfirmModal
 */
export type ConfirmModalVariant = 'danger' | 'warning' | 'info';

/**
 * Deprecated color prop type (for backward compatibility)
 */
export type ConfirmModalColor = 'red' | 'green' | 'blue';

/**
 * Props for ConfirmModal component
 */
export interface ConfirmModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when user confirms the action */
  onConfirm: () => void;
  /** Callback when user cancels the action */
  onCancel: () => void;
  /** Modal title */
  title?: string;
  /** Confirmation message */
  message?: string;
  /** Text for confirm button */
  confirmText?: string;
  /** Text for cancel button */
  cancelText?: string;
  /** Visual variant of the modal */
  variant?: ConfirmModalVariant;
  /** @deprecated Use variant instead. Legacy color prop for backward compatibility */
  confirmColor?: ConfirmModalColor;
}

/**
 * Configuration for modal variants
 */
interface VariantConfig {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  buttonClass: string;
}

/**
 * ConfirmModal - Modal de confirmation utilisant AlertDialog shadcn/ui
 *
 * Remplace l'ancien système custom modalStack par le focus trap natif de Radix UI
 * Utilise le système z-index centralisé pour éviter les conflits
 *
 * @example
 * ```tsx
 * <ConfirmModal
 *   isOpen={showConfirm}
 *   title="Supprimer le personnage"
 *   message="Êtes-vous sûr de vouloir supprimer ce personnage ?"
 *   confirmText="Supprimer"
 *   cancelText="Annuler"
 *   variant="danger"
 *   onConfirm={() => deleteCharacter()}
 *   onCancel={() => setShowConfirm(false)}
 * />
 * ```
 */
export default function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirmer l\'action',
  message = 'Êtes-vous sûr ?',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'danger',
  confirmColor
}: ConfirmModalProps) {
  // Map old confirmColor prop to new variant (backward compatibility)
  const actualVariant: ConfirmModalVariant = confirmColor === 'red' ? 'danger'
    : confirmColor === 'green' ? 'info'
    : confirmColor === 'blue' ? 'warning'
    : variant;

  // Icon and color based on variant
  const variantConfig: Record<ConfirmModalVariant, VariantConfig> = {
    danger: {
      icon: AlertTriangle,
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-500',
      buttonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-600'
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-500',
      buttonClass: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-600'
    },
    info: {
      icon: Info,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      buttonClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-600'
    }
  };

  const config = variantConfig[actualVariant];
  const Icon = config.icon;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className={`dark bg-slate-900 text-slate-100 border-slate-700 ${getZIndexClass('ALERT_DIALOG')}`}>
        <AlertDialogHeader className="border-b border-slate-700 bg-gradient-to-b from-background to-muted/20 px-8 pt-8 pb-6">
          <AlertDialogTitle className="flex items-center gap-3 text-2xl font-bold">
            <div className={`p-2 rounded-lg ${config.iconBg} ${config.iconColor}`}>
              <Icon className="h-6 w-6" />
            </div>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400 text-base mt-2 ml-12">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="px-8 py-6">
          <AlertDialogCancel onClick={onCancel} className="bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-600">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={config.buttonClass}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
