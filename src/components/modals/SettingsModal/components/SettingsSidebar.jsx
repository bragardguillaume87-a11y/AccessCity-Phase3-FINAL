import React from 'react';
import PropTypes from 'prop-types';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ChevronRight } from 'lucide-react';

/**
 * SettingsSidebar - Sidebar navigation for settings sections
 * Includes search input and section navigation items
 *
 * @param {Object} props
 * @param {Array} props.sections - Array of section objects (id, label, icon, keywords)
 * @param {string} props.activeSection - Currently active section ID
 * @param {Function} props.onSectionChange - Callback when section is selected
 * @param {string} props.searchQuery - Current search query
 * @param {Function} props.onSearchChange - Callback when search query changes
 * @param {Array} props.filteredSections - Filtered sections based on search
 */
export function SettingsSidebar({
  sections,
  activeSection,
  onSectionChange,
  searchQuery,
  onSearchChange,
  filteredSections
}) {
  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col">
      {/* Search Input */}
      <div className="p-4 border-b">
        <label htmlFor="settings-search" className="sr-only">
          Rechercher des paramètres
        </label>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="settings-search"
            type="text"
            placeholder="Rechercher des paramètres..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 transition-all duration-200 hover:border-primary/50 focus:border-primary"
            aria-label="Rechercher dans les paramètres"
          />
        </div>
      </div>

      {/* Navigation Items */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredSections.length > 0 ? (
            filteredSections.map(section => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => onSectionChange(section.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg
                    transition-all duration-200
                    ${isActive
                      ? 'bg-primary text-primary-foreground shadow-md scale-105'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground hover:scale-102'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">{section.label}</span>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 ml-auto flex-shrink-0" />
                  )}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              Aucun paramètre trouvé
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

SettingsSidebar.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
      keywords: PropTypes.arrayOf(PropTypes.string).isRequired
    })
  ).isRequired,
  activeSection: PropTypes.string.isRequired,
  onSectionChange: PropTypes.func.isRequired,
  searchQuery: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  filteredSections: PropTypes.array.isRequired
};
