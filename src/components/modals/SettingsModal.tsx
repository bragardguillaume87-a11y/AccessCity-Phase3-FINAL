import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../../stores/index';
import { useIsKidMode } from '@/hooks/useIsKidMode';
import { TIMING } from '@/config/timing';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Palette, Gamepad2, Keyboard, Accessibility, Volume2 } from 'lucide-react';

// Hooks
import {
  useSettingsImportExport,
  type SettingsFormData,
} from './SettingsModal/hooks/useSettingsImportExport';
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
  AccessibilitySection,
  AudioSettingsSection,
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
 * - Game: Game variables configuration (Physique, Mentale) + Stats HUD toggle
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
export default function SettingsModal({
  isOpen,
  onClose,
}: SettingsModalProps): React.ReactElement | null {
  // Zustand stores (granular selectors)
  const projectSettings = useSettingsStore((state) => state.projectSettings);
  const updateProjectSettings = useSettingsStore((state) => state.updateProjectSettings);
  const enableStatsHUD = useSettingsStore((state) => state.enableStatsHUD);
  const setEnableStatsHUD = useSettingsStore((state) => state.setEnableStatsHUD);

  const isKid = useIsKidMode();

  // Local state
  const [activeSection, setActiveSection] = useState<string>('project');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [formData, setFormData] = useState<SettingsFormData>(
    projectSettings || ({} as SettingsFormData)
  );

  // Sidebar sections configuration
  const sections: SettingsSection[] = [
    {
      id: 'project',
      label: 'Projet',
      icon: FileText,
      keywords: ['titre', 'auteur', 'description', 'version', 'métadonnées'],
    },
    {
      id: 'editor',
      label: 'Éditeur',
      icon: Palette,
      keywords: ['thème', 'sauvegarde auto', 'grille', 'aimantation', 'préférences'],
    },
    {
      id: 'game',
      label: 'Jeu',
      icon: Gamepad2,
      keywords: ['variables', 'physique', 'mentale', 'stats', 'hud', 'moral'],
    },
    {
      id: 'shortcuts',
      label: 'Raccourcis',
      icon: Keyboard,
      keywords: ['clavier', 'raccourcis', 'touches rapides'],
    },
    {
      id: 'accessibility',
      label: 'Accessibilité',
      icon: Accessibility,
      keywords: ['a11y', 'contraste', 'lecteur écran', 'aria'],
    },
    {
      id: 'audio',
      label: 'Audio',
      icon: Volume2,
      keywords: ['son', 'musique', 'bruitage', 'typewriter', 'volume', 'ui', 'ambiance', 'bgm'],
    },
  ];

  // En mode kid, masquer les sections de configuration avancée
  const KID_HIDDEN_SECTIONS = ['editor', 'shortcuts'];
  const visibleSections = isKid
    ? sections.filter((s) => !KID_HIDDEN_SECTIONS.includes(s.id))
    : sections;

  // Custom hooks
  const filteredSections = useSettingsSearch(visibleSections, searchQuery);
  const [isExporting, setIsExporting] = useState(false);
  const { handleExport: _handleExport, handleImport } = useSettingsImportExport(
    formData,
    setFormData
  );

  const handleExport = async (): Promise<void> => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await _handleExport();
    } finally {
      setIsExporting(false);
    }
  };

  // Sync form data when modal opens (capture current store values)
  useEffect(() => {
    if (isOpen && projectSettings) {
      setFormData({ ...projectSettings, game: { ...projectSettings.game, enableStatsHUD } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- enableStatsHUD intentionnellement omis : sync uniquement à l'ouverture
  }, [isOpen, projectSettings]);

  // Field change handlers
  const handleFieldChange = (
    section: string,
    field: string,
    value: string | boolean | number
  ): void => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section as keyof SettingsFormData],
        [field]: value,
      },
    }));
  };

  const handleVariableChange = (varName: string, field: string, value: number): void => {
    setFormData((prev) => ({
      ...prev,
      game: {
        ...prev.game,
        variables: {
          ...prev.game.variables,
          [varName]: {
            ...prev.game.variables[varName],
            [field]: value,
          },
        },
      },
    }));
  };

  // Modal actions
  const handleSave = (): void => {
    updateProjectSettings(formData);
    setEnableStatsHUD(formData.game.enableStatsHUD ?? false);
    onClose();
  };

  const handleCancel = (): void => {
    setFormData(projectSettings || ({} as SettingsFormData));
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
          version: '1.0.0',
        },
        editor: {
          theme: 'dark',
          autosave: true,
          autosaveInterval: TIMING.AUTOSAVE_INTERVAL_MS,
          gridSize: 20,
          snapToGrid: false,
          showGrid: true,
        },
        game: {
          variables: {
            physique: { initial: 100, min: 0, max: 100 },
            mentale: { initial: 100, min: 0, max: 100 },
          },
          enableStatsHUD: true,
        },
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
        <DialogTitle className="sr-only">Paramètres du projet</DialogTitle>
        {/* Header */}
        <SettingsHeader
          onResetDefaults={handleResetDefaults}
          onExport={handleExport}
          onImport={handleImport}
          isExporting={isExporting}
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
                <ProjectSettingsSection formData={formData} onFieldChange={handleFieldChange} />
              )}

              {/* Editor Section */}
              {activeSection === 'editor' && (
                <EditorSettingsSection formData={formData} onFieldChange={handleFieldChange} />
              )}

              {/* Game Section */}
              {activeSection === 'game' && (
                <GameSettingsSection
                  formData={formData}
                  onVariableChange={handleVariableChange}
                  onFieldChange={handleFieldChange}
                />
              )}

              {/* Shortcuts Section */}
              {activeSection === 'shortcuts' && <ShortcutsSection />}

              {/* Accessibility Section */}
              {activeSection === 'accessibility' && <AccessibilitySection />}

              {/* Audio Section */}
              {activeSection === 'audio' && <AudioSettingsSection />}
            </ScrollArea>

            {/* Footer */}
            <SettingsFooter onCancel={handleCancel} onSave={handleSave} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
