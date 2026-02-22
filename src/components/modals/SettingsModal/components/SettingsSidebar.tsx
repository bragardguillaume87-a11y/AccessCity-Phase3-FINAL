import React from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ChevronRight } from 'lucide-react';
import type { SettingsSection } from '../hooks/useSettingsSearch';

/**
 * Props for SettingsSidebar component
 */
export interface SettingsSidebarProps {
  /** Array of section objects (id, label, icon, keywords) */
  sections: SettingsSection[];
  /** Currently active section ID */
  activeSection: string;
  /** Callback when section is selected */
  onSectionChange: (sectionId: string) => void;
  /** Current search query */
  searchQuery: string;
  /** Callback when search query changes */
  onSearchChange: (query: string) => void;
  /** Filtered sections based on search */
  filteredSections: SettingsSection[];
}

/**
 * SettingsSidebar - Sidebar navigation for settings sections
 *
 * Includes search input and section navigation items.
 * Filters sections based on search query using label and keywords matching.
 * Highlights active section and shows "no results" state when applicable.
 *
 * @param props - Component props
 * @param props.sections - Array of section objects (id, label, icon, keywords)
 * @param props.activeSection - Currently active section ID
 * @param props.onSectionChange - Callback when section is selected
 * @param props.searchQuery - Current search query
 * @param props.onSearchChange - Callback when search query changes
 * @param props.filteredSections - Filtered sections based on search
 *
 * @example
 * ```tsx
 * <SettingsSidebar
 *   sections={sections}
 *   activeSection="project"
 *   onSectionChange={setActiveSection}
 *   searchQuery={query}
 *   onSearchChange={setQuery}
 *   filteredSections={filtered}
 * />
 * ```
 */
export function SettingsSidebar({
  sections: _sections,
  activeSection,
  onSectionChange,
  searchQuery,
  onSearchChange,
  filteredSections
}: SettingsSidebarProps): React.ReactElement {
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
