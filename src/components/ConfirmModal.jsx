import React, { useEffect, useRef } from 'react';
import modalStack from '../utils/modalStack.js';

export default function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirm action',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'red'
}) {
  const dialogRef = useRef(null);
  const confirmBtnRef = useRef(null);
  const modalIdRef = useRef(`confirm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (!isOpen) return;

    const modalId = modalIdRef.current;

    // Register modal in stack
    modalStack.push(modalId);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const prevActive = document.activeElement;

    const t = setTimeout(() => {
      if (confirmBtnRef.current) confirmBtnRef.current.focus();
    }, 0);

    function onKey(e) {
      if (e.key === 'Escape') {
        // ONLY close if this modal is at the top of the stack
        if (modalStack.isTop(modalId)) {
          e.preventDefault();
          e.stopPropagation();
          if (onCancel) onCancel();
        }
      }
    }
    document.addEventListener('keydown', onKey);

    return () => {
      // Unregister modal from stack
      modalStack.pop(modalId);

      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      clearTimeout(t);
      if (prevActive && typeof prevActive.focus === 'function') {
        try { prevActive.focus(); } catch {}
      }
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const confirmClasses =
    'px-4 py-2 rounded text-white ' +
    (confirmColor === 'red'
      ? 'bg-red-600 hover:bg-red-700'
      : confirmColor === 'green'
      ? 'bg-green-600 hover:bg-green-700'
      : 'bg-blue-600 hover:bg-blue-700');

  return (
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-desc">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div
        ref={dialogRef}
        className="relative mx-auto mt-24 w-full max-w-md rounded-xl bg-white shadow-2xl p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <h3 id="confirm-title" className="text-lg font-bold text-gray-900">{title}</h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-xl leading-none"
          >
            &times;
          </button>
        </div>
        <p id="confirm-desc" className="text-sm text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded border-2 border-gray-300 hover:bg-gray-100"
          >
            {cancelText}
          </button>
          <button
            type="button"
            ref={confirmBtnRef}
            onClick={onConfirm}
            className={confirmClasses}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
