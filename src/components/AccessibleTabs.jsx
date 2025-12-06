// src/components/AccessibleTabs.jsx
import React, { useEffect, useRef } from 'react';

/**
 * AccessibleTabs - Composant onglets conforme WCAG 2.2 AA
 * 
 * @param {Object} props
 * @param {Array} props.tabs - Liste des onglets [{id, label}]
 * @param {string} props.activeTab - ID de l'onglet actif
 * @param {function} props.onChange - Callback lors du changement d'onglet
 * @param {string} props.ariaLabel - Label pour le tablist
 * 
 * Navigation clavier:
 * - Fleches gauche/droite: naviguer entre onglets
 * - Home: premier onglet
 * - End: dernier onglet
 * - Tab: sortir du tablist
 */
export default function AccessibleTabs({ tabs, activeTab, onChange, ariaLabel = 'Navigation' }) {
  const tablistRef = useRef(null);

  useEffect(() => {
    const tablist = tablistRef.current;
    if (!tablist) return;

    const handleKeyDown = (e) => {
      const currentTabButtons = Array.from(
        tablist.querySelectorAll('[role="tab"]')
      );
      const currentIndex = currentTabButtons.findIndex(
        btn => btn.getAttribute('aria-selected') === 'true'
      );

      let newIndex = currentIndex;

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : currentTabButtons.length - 1;
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          newIndex = currentIndex < currentTabButtons.length - 1 ? currentIndex + 1 : 0;
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = currentTabButtons.length - 1;
          break;
        default:
          return;
      }

      if (newIndex !== currentIndex && currentTabButtons[newIndex]) {
        const newTab = tabs[newIndex];
        onChange(newTab.id);
        // Focus will be updated by the re-render
        setTimeout(() => {
          currentTabButtons[newIndex]?.focus();
        }, 0);
      }
    };

    tablist.addEventListener('keydown', handleKeyDown);
    return () => tablist.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTab, onChange]);

  return (
    <div
      ref={tablistRef}
      role="tablist"
      aria-label={ariaLabel}
      className="flex gap-4 border-b border-slate-300"
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`px-6 py-3 font-semibold text-sm transition-colors ${
              isActive
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * TabPanel - Composant panneau d'onglet
 * 
 * @param {Object} props
 * @param {string} props.id - ID du panneau (correspond a tab.id)
 * @param {boolean} props.isActive - Si ce panneau est actif
 * @param {React.ReactNode} props.children - Contenu du panneau
 */
export function TabPanel({ id, isActive, children }) {
  return (
    <div
      id={`panel-${id}`}
      role="tabpanel"
      aria-labelledby={`tab-${id}`}
      hidden={!isActive}
      tabIndex={0}
      className={isActive ? '' : 'hidden'}
    >
      {children}
    </div>
  );
}
