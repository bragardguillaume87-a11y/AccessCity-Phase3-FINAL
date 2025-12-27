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
 *   confirmColor="red"
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
  confirmColor = 'red'
}) {
  // Classes pour le bouton de confirmation selon la couleur
  const confirmButtonClasses =
    confirmColor === 'red'
      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-600'
      : confirmColor === 'green'
      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-600'
      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-600';

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className={getZIndexClass('ALERT_DIALOG')}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={confirmButtonClasses}
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
  confirmColor: PropTypes.oneOf(['red', 'green', 'blue'])
};
