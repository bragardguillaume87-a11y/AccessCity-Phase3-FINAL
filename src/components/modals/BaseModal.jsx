import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { trapFocus } from '../../utils/trapFocus.js';
import modalStack from '../../utils/modalStack.js';

/**
 * BaseModal - Reusable modal component with dark theme
 * Provides consistent modal behavior across the application
 * - Overlay with click-to-close
 * - Escape key handling
 * - Focus trap for accessibility
 * - Body scroll lock
 * - Restore focus on close
 * - ARIA attributes
 */
export default function BaseModal({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  className = '',
  nested = false // For nested modals (higher z-index)
}) {
  const dialogRef = useRef(null);
  const previousActiveElement = useRef(null);
  const modalIdRef = useRef(`modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // Handle focus trap and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const modalId = modalIdRef.current;

    // Register modal in stack
    modalStack.push(modalId);

    // Store currently focused element
    previousActiveElement.current = document.activeElement;

    // Lock body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Setup focus trap
    let cleanup = () => {};
    const timer = setTimeout(() => {
      if (dialogRef.current) {
        cleanup = trapFocus(dialogRef.current);
      }
    }, 100);

    // Escape key handler - ONLY close if this modal is at the top of the stack
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        // ONLY close if this modal is at the top
        if (modalStack.isTop(modalId)) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      // Unregister modal from stack
      modalStack.pop(modalId);

      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
      cleanup();

      // Restore focus to previous element
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        try {
          previousActiveElement.current.focus();
        } catch (error) {
          // Silently fail if element is no longer focusable
        }
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Size class mapping
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw]'
  };

  const zIndex = nested ? 'z-[10000]' : 'z-[9999]';

  return (
    <div
      className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        ref={dialogRef}
        className={`relative w-full ${sizeClasses[size]} max-h-[90vh] bg-slate-900 border-2 border-slate-700 rounded-xl shadow-2xl flex flex-col ${className}`}
      >
        {/* Header */}
        {title && (
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-700">
            <h2
              id="modal-title"
              className="text-xl font-bold text-white"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

BaseModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
  children: PropTypes.node,
  className: PropTypes.string,
  nested: PropTypes.bool
};
