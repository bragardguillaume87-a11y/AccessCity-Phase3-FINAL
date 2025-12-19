import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * ContextMenu - Right-click context menu component
 * Features:
 * - Positioned at click coordinates with auto-adjustment if off-screen
 * - Keyboard navigation (Arrow Up/Down, Enter, Escape)
 * - Click outside to close
 * - Dark theme matching EditorShell
 */
export default function ContextMenu({ x, y, items, onClose }) {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ x, y });
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Auto-adjust position if menu would be off-screen
  useEffect(() => {
    if (!menuRef.current) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    // Adjust X if menu goes off right edge
    if (x + rect.width > viewportWidth) {
      adjustedX = viewportWidth - rect.width - 10;
    }

    // Adjust Y if menu goes off bottom edge
    if (y + rect.height > viewportHeight) {
      adjustedY = viewportHeight - rect.height - 10;
    }

    // Ensure menu doesn't go off left or top edge
    adjustedX = Math.max(10, adjustedX);
    adjustedY = Math.max(10, adjustedY);

    setPosition({ x: adjustedX, y: adjustedY });
  }, [x, y]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }

    // Small delay to prevent immediate closing from the right-click event
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e) {
      // Get enabled items only
      const enabledItems = items.filter(item => !item.disabled);
      const enabledIndices = items.map((item, idx) => !item.disabled ? idx : -1).filter(idx => idx !== -1);

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const currentEnabledIndex = enabledIndices.indexOf(selectedIndex);
        const nextEnabledIndex = enabledIndices[(currentEnabledIndex + 1) % enabledIndices.length];
        setSelectedIndex(nextEnabledIndex);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const currentEnabledIndex = enabledIndices.indexOf(selectedIndex);
        const prevEnabledIndex = enabledIndices[(currentEnabledIndex - 1 + enabledIndices.length) % enabledIndices.length];
        setSelectedIndex(prevEnabledIndex);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selectedItem = items[selectedIndex];
        if (selectedItem && !selectedItem.disabled) {
          selectedItem.onClick();
          onClose();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, onClose]);

  // Focus menu on mount
  useEffect(() => {
    if (menuRef.current) {
      menuRef.current.focus();
    }
  }, []);

  return (
    <div
      ref={menuRef}
      className="fixed z-[10000] bg-slate-800 border-2 border-slate-700 rounded-lg shadow-2xl py-1 min-w-[200px]"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      role="menu"
      tabIndex={-1}
      aria-label="Context menu"
    >
      {items.map((item, idx) => (
        <button
          key={idx}
          onClick={() => {
            if (!item.disabled) {
              item.onClick();
              onClose();
            }
          }}
          disabled={item.disabled}
          onMouseEnter={() => setSelectedIndex(idx)}
          className={`w-full px-4 py-2 text-left text-sm font-medium transition-colors flex items-center gap-3 ${
            item.danger
              ? 'text-red-400 hover:bg-red-900/30 disabled:text-red-900 disabled:bg-transparent'
              : 'text-slate-200 hover:bg-slate-700 disabled:text-slate-600 disabled:bg-transparent'
          } ${
            selectedIndex === idx && !item.disabled ? 'bg-slate-700' : ''
          } disabled:cursor-not-allowed`}
          role="menuitem"
          aria-disabled={item.disabled}
        >
          {/* Icon */}
          {item.icon && (
            <span className="text-base flex-shrink-0">{item.icon}</span>
          )}

          {/* Label */}
          <span className="flex-1">{item.label}</span>

          {/* Shortcut */}
          {item.shortcut && (
            <span className="text-xs text-slate-500 font-mono">{item.shortcut}</span>
          )}
        </button>
      ))}
    </div>
  );
}

ContextMenu.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.string,
      onClick: PropTypes.func.isRequired,
      disabled: PropTypes.bool,
      danger: PropTypes.bool,
      shortcut: PropTypes.string
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired
};
