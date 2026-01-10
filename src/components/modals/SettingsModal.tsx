import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../../stores/index.js';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Palette,
  Gamepad2,
  Keyboard,
  Accessibility
} from 'lucide-react';

// Hooks
import { useSettingsImportExport, type SettingsFormData } from './SettingsModal/hooks/useSettingsImportExport';
import { useSettingsSearch, type SettingsSection } from './SettingsModal/hooks/useSettingsSearch';

// Components
import {
  SettingsSidebar,
  SettingsHeader,
  SettingsFooter,
  ProjectSettingsSection,
  EditorSettingsSection,
  GameSettingsSection,
  ShortcutsSection,
  AccessibilitySection
} from './SettingsModal/components';

/**
 * Props for SettingsModal component
 */
export interface SettingsModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
}

/**
 * SettingsModal - AAA Project configuration modal (Phase 5)
 *
 * VS Code-style sidebar navigation with sections:
 * - Project: Project metadata (title, author, description, version)
 * - Editor: Editor preferences (theme, autosave, grid settings)
 * - Game: Game variables configuration (Empathie, Autonomie, Confiance)
 * - Shortcuts: Keyboard shortcuts (Phase 5)
 * - A11Y: Accessibility settings (Phase 5)
 *
 * Features:
 * - Search functionality across all settings
 * - Import/Export settings as JSON
 * - Reset to defaults
 * - Auto-sync with Zustand store
 *
 * @param props - Component props
 * @param props.isOpen - Controls modal visibility
 * @param props.onClose - Callback when modal is closed
 *
 * @example
 * ```tsx
 * <SettingsModal
 *   isOpen={showSettings}
 *   onClose={() => setShowSettings(false)}
 * />
 * ```
 */
export default function SettingsModal({ isOpen, onClose }: SettingsModalProps): React.ReactElement | null {
  // Zustand stores (granular selectors)
  const projectSettings = useSettingsStore(state => state.projectSettings);
  const updateProjectSettings = useSettingsStore(state => state.updateProjectSettings);

  // Local state
  const [activeSection, setActiveSection] = useState<string>('project');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [formData, setFormData] = useState<SettingsFormData>(projectSettings || {} as SettingsFormData);

  // Sidebar sections configuration
  const sections: SettingsSection[] = [
    {
      id: 'project',
      label: 'Projet',
      icon: FileText,
      keywords: ['titre', 'auteur', 'description', 'version', 'métadonnées']
    },
    {
      id: 'editor',
      label: 'Éditeur',
      icon: Palette,
      keywords: ['thème', 'sauvegarde auto', 'grille', 'aimantation', 'préférences']
    },
    {
      id: 'game',
      label: 'Jeu',
      icon: Gamepad2,
      keywords: ['variables', 'empathie', 'autonomie', 'confiance', 'moral']
    },
    {
      id: 'shortcuts',
      label: 'Raccourcis',
      icon: Keyboard,
      keywords: ['clavier', 'raccourcis', 'touches rapides']
    },
    {
      id: 'accessibility',
      label: 'Accessibilité',
      icon: Accessibility,
      keywords: ['a11y', 'contraste', 'lecteur écran', 'aria']
    }
  ];

  // Custom hooks
  const filteredSections = useSettingsSearch(sections, searchQuery);
  const { handleExport, handleImport } = useSettingsImportExport(formData, setFormData);

  // Sync form data when modal opens or projectSettings change
  useEffect(() => {
    if (isOpen && projectSettings) {
      setFormData(projectSettings);
    }
  }, [isOpen, projectSettings]);

  // Field change handlers
  const handleFieldChange = (section: string, field: string, value: string | boolean | number): void => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof SettingsFormData],
        [field]: value
      }
    }));
  };

  const handleVariableChange = (varName: string, field: string, value: number): void => {
    setFormData(prev => ({
      ...prev,
      game: {
        ...prev.game,
        variables: {
          ...prev.game.variables,
          [varName]: {
            ...prev.game.variables[varName],
            [field]: value
          }
        }
      }
    }));
  };

  // Modal actions
  const handleSave = (): void => {
    updateProjectSettings(formData);
    onClose();
  };

  const handleCancel = (): void => {
    setFormData(projectSettings || {} as SettingsFormData);
    setSearchQuery('');
    onClose();
  };

  const handleResetDefaults = (): void => {
    if (window.confirm('Réinitialiser tous les paramètres aux valeurs par défaut ?')) {
      const defaults: SettingsFormData = {
        project: {
          title: 'Projet sans titre',
          author: '',
          description: '',
          version: '1.0.0'
        },
        editor: {
          theme: 'dark',
          autosave: true,
          autosaveInterval: 30000,
          gridSize: 20,
          snapToGrid: false,
          showGrid: true
        },
        game: {
          variables: {
            Empathie: { initial: 50, min: 0, max: 100 },
            Autonomie: { initial: 50, min: 0, max: 100 },
            Confiance: { initial: 50, min: 0, max: 100 }
          }
        }
      };
      setFormData(defaults);
    }
  };

  // Prevent render if data not loaded
  if (!formData.project || !formData.editor || !formData.game) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-[90vw] h-[90vh] p-0 gap-0">
        {/* Header */}
        <SettingsHeader
          onResetDefaults={handleResetDefaults}
          onExport={handleExport}
          onImport={handleImport}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <SettingsSidebar
            sections={sections}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filteredSections={filteredSections}
          />

          {/* Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 p-8">
              {/* Project Section */}
              {activeSection === 'project' && (
                <ProjectSettingsSection
                  formData={formData}
                  onFieldChange={handleFieldChange}
                />
              )}

              {/* Editor Section */}
              {activeSection === 'editor' && (
                <EditorSettingsSection
                  formData={formData}
                  onFieldChange={handleFieldChange}
                />
              )}

              {/* Game Section */}
              {activeSection === 'game' && (
                <GameSettingsSection
                  formData={formData}
                  onVariableChange={handleVariableChange}
                />
              )}

              {/* Shortcuts Section */}
              {activeSection === 'shortcuts' && <ShortcutsSection />}

              {/* Accessibility Section */}
              {activeSection === 'accessibility' && <AccessibilitySection />}
            </ScrollArea>

            {/* Footer */}
            <SettingsFooter onCancel={handleCancel} onSave={handleSave} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
