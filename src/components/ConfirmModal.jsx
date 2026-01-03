import React from 'react';
import PropTypes from 'prop-types';
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
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';

/**
 * ConfirmModal - Modal de confirmation utilisant AlertDialog shadcn/ui
 *
 * Remplace l'ancien système custom modalStack par le focus trap natif de Radix UI
 * Utilise le système z-index centralisé pour éviter les conflits
 *
 * @example
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
 */
export default function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirmer l\'action',
  message = 'Êtes-vous sûr ?',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'danger', // 'danger', 'warning', 'info'
  confirmColor = 'red' // Backward compatibility
}) {
  // Map old confirmColor prop to new variant (backward compatibility)
  const actualVariant = confirmColor === 'red' ? 'danger'
    : confirmColor === 'green' ? 'info'
    : confirmColor === 'blue' ? 'warning'
    : variant;

  // Icon and color based on variant
  const variantConfig = {
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

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  variant: PropTypes.oneOf(['danger', 'warning', 'info']),
  confirmColor: PropTypes.oneOf(['red', 'green', 'blue']) // Deprecated, use variant instead
};
