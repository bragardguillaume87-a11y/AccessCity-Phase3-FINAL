import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSettingsStore } from '../../stores/index.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  FileText,
  Palette,
  Gamepad2,
  Keyboard,
  Accessibility,
  Search,
  RotateCcw,
  Download,
  Upload as UploadIcon,
  ChevronRight
} from 'lucide-react';

/**
 * SettingsModal - AAA Project configuration modal (Phase 5)
 * VS Code-style sidebar navigation with sections:
 * - Project: Project metadata (title, author, description, version)
 * - Editor: Editor preferences (theme, autosave, grid settings)
 * - Game: Game variables configuration (Empathie, Autonomie, Confiance)
 * - Shortcuts: Keyboard shortcuts (Phase 5)
 * - A11Y: Accessibility settings (Phase 5)
 */
export default function SettingsModal({ isOpen, onClose }) {
  // Zustand stores (granular selectors)
  const projectSettings = useSettingsStore(state => state.projectSettings);
  const updateProjectSettings = useSettingsStore(state => state.updateProjectSettings);

  const [activeSection, setActiveSection] = useState('project');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState(projectSettings || {});

  // Sync form data when modal opens or projectSettings change
  useEffect(() => {
    if (isOpen && projectSettings) {
      setFormData(projectSettings);
    }
  }, [isOpen, projectSettings]);

  // Sidebar sections (Phase 5)
  const sections = [
    { id: 'project', label: 'Projet', icon: FileText, keywords: ['titre', 'auteur', 'description', 'version', 'métadonnées'] },
    { id: 'editor', label: 'Éditeur', icon: Palette, keywords: ['thème', 'sauvegarde auto', 'grille', 'aimantation', 'préférences'] },
    { id: 'game', label: 'Jeu', icon: Gamepad2, keywords: ['variables', 'empathie', 'autonomie', 'confiance', 'moral'] },
    { id: 'shortcuts', label: 'Raccourcis', icon: Keyboard, keywords: ['clavier', 'raccourcis', 'touches rapides'] },
    { id: 'accessibility', label: 'Accessibilité', icon: Accessibility, keywords: ['a11y', 'contraste', 'lecteur écran', 'aria'] }
  ];

  // Filter sections by search query (Phase 5)
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const query = searchQuery.toLowerCase();
    return sections.filter(section =>
      section.label.toLowerCase().includes(query) ||
      section.keywords.some(keyword => keyword.includes(query))
    );
  }, [searchQuery]);

  const handleFieldChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleVariableChange = (varName, field, value) => {
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

  const handleSave = () => {
    updateProjectSettings(formData);
    onClose();
  };

  const handleCancel = () => {
    setFormData(projectSettings || {});
    setSearchQuery('');
    onClose();
  };

  const handleResetDefaults = () => {
    if (window.confirm('Réinitialiser tous les paramètres aux valeurs par défaut\u00A0?')) {
      const defaults = {
        project: { title: 'Projet sans titre', author: '', description: '', version: '1.0.0' },
        editor: { theme: 'dark', autosave: true, autosaveInterval: 30000, gridSize: 20, snapToGrid: false, showGrid: true },
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

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'accesscity-parametres.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        setFormData(imported);
        alert('Paramètres importés avec succès\u00A0!');
      } catch (error) {
        alert('Échec de l\'importation\u00A0: fichier JSON invalide');
      }
    };
    reader.readAsText(file);
  };

  if (!formData.project || !formData.editor || !formData.game) {
    return null; // Prevent render if data not loaded
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-[90vw] h-[90vh] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-8 pt-8 pb-6 border-b bg-gradient-to-b from-background to-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-3 text-3xl font-bold mb-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Settings className="h-7 w-7" />
                </div>
                Paramètres du Projet
              </DialogTitle>
              <DialogDescription className="text-base">
                Configure ton projet AccessCity, tes préférences d'éditeur et tes variables de jeu
              </DialogDescription>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleResetDefaults}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportSettings}>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button variant="outline" size="sm" onClick={() => document.getElementById('import-settings').click()}>
                <UploadIcon className="h-4 w-4 mr-2" />
                Importer
              </Button>
              <input
                id="import-settings"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportSettings}
              />
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation (Phase 5) */}
          <div className="w-64 border-r bg-muted/30 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b">
              <label htmlFor="settings-search" className="sr-only">
                Rechercher des paramètres
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="settings-search"
                  type="text"
                  placeholder="Rechercher des paramètres..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  aria-label="Rechercher dans les paramètres"
                />
              </div>
            </div>

            {/* Navigation Items */}
            <ScrollArea className="flex-1">
              <div className="p-2">
                {filteredSections.map(section => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        activeSection === section.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{section.label}</span>
                      {activeSection === section.id && (
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 p-8">
              {/* Project Section */}
              {activeSection === 'project' && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Infos du Projet
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Titre du projet
                      </label>
                      <Input
                        type="text"
                        value={formData.project.title}
                        onChange={(e) => handleFieldChange('project', 'title', e.target.value)}
                        placeholder="Mon histoire AccessCity"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Auteur
                      </label>
                      <Input
                        type="text"
                        value={formData.project.author}
                        onChange={(e) => handleFieldChange('project', 'author', e.target.value)}
                        placeholder="Nom de l'auteur"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.project.description}
                        onChange={(e) => handleFieldChange('project', 'description', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-input bg-background rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Décris ton histoire interactive..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Version
                      </label>
                      <Input
                        type="text"
                        value={formData.project.version}
                        onChange={(e) => handleFieldChange('project', 'version', e.target.value)}
                        placeholder="1.0.0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Editor Section */}
              {activeSection === 'editor' && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Palette className="h-5 w-5 text-primary" />
                      Préférences de l'Éditeur
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Thème
                      </label>
                      <select
                        value={formData.editor.theme}
                        onChange={(e) => handleFieldChange('editor', 'theme', e.target.value)}
                        className="w-full px-4 py-2 border border-input bg-background rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="dark">Sombre</option>
                        <option value="light">Clair</option>
                      </select>
                    </div>

                    <Separator />

                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="autosave"
                        checked={formData.editor.autosave}
                        onCheckedChange={(checked) => handleFieldChange('editor', 'autosave', checked)}
                      />
                      <label htmlFor="autosave" className="text-sm font-semibold cursor-pointer">
                        Activer la sauvegarde automatique
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Intervalle de sauvegarde (secondes)
                      </label>
                      <Input
                        type="number"
                        value={formData.editor.autosaveInterval / 1000}
                        onChange={(e) => handleFieldChange('editor', 'autosaveInterval', parseInt(e.target.value) * 1000)}
                        min={10}
                        max={300}
                      />
                    </div>

                    <Separator />

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Taille de la grille (pixels)
                      </label>
                      <select
                        value={formData.editor.gridSize}
                        onChange={(e) => handleFieldChange('editor', 'gridSize', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border border-input bg-background rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value={10}>10px (Fine)</option>
                        <option value={20}>20px (Moyenne)</option>
                        <option value={50}>50px (Grossière)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="snapToGrid"
                        checked={formData.editor.snapToGrid}
                        onCheckedChange={(checked) => handleFieldChange('editor', 'snapToGrid', checked)}
                      />
                      <label htmlFor="snapToGrid" className="text-sm font-semibold cursor-pointer">
                        Aimanter à la grille
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="showGrid"
                        checked={formData.editor.showGrid}
                        onCheckedChange={(checked) => handleFieldChange('editor', 'showGrid', checked)}
                      />
                      <label htmlFor="showGrid" className="text-sm font-semibold cursor-pointer">
                        Afficher la grille
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Game Section */}
              {activeSection === 'game' && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Gamepad2 className="h-5 w-5 text-primary" />
                      Variables de Jeu
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(formData.game.variables).map(([varName, varConfig]) => (
                      <Card key={varName}>
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-3">{varName}</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                                Valeur initiale
                              </label>
                              <Input
                                type="number"
                                value={varConfig.initial}
                                onChange={(e) => handleVariableChange(varName, 'initial', parseInt(e.target.value))}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                                Minimum
                              </label>
                              <Input
                                type="number"
                                value={varConfig.min}
                                onChange={(e) => handleVariableChange(varName, 'min', parseInt(e.target.value))}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                                Maximum
                              </label>
                              <Input
                                type="number"
                                value={varConfig.max}
                                onChange={(e) => handleVariableChange(varName, 'max', parseInt(e.target.value))}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Shortcuts Section (Phase 5 - New) */}
              {activeSection === 'shortcuts' && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Keyboard className="h-5 w-5 text-primary" />
                      Raccourcis Clavier
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">Sauvegarder le projet</p>
                            <p className="text-sm text-muted-foreground">Enregistrer tous les changements</p>
                          </div>
                          <code className="px-3 py-1 bg-muted rounded text-sm">Ctrl+S</code>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">Nouvelle scène</p>
                            <p className="text-sm text-muted-foreground">Créer une nouvelle scène</p>
                          </div>
                          <code className="px-3 py-1 bg-muted rounded text-sm">Ctrl+N</code>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">Supprimer la sélection</p>
                            <p className="text-sm text-muted-foreground">Supprimer l'élément sélectionné</p>
                          </div>
                          <code className="px-3 py-1 bg-muted rounded text-sm">Delete</code>
                        </div>
                      </CardContent>
                    </Card>

                    <p className="text-sm text-muted-foreground mt-4">
                      Les raccourcis clavier sont actuellement en lecture seule. Personnalisation bientôt disponible.
                    </p>
                  </div>
                </div>
              )}

              {/* Accessibility Section (Phase 5 - New) */}
              {activeSection === 'accessibility' && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Accessibility className="h-5 w-5 text-primary" />
                      Paramètres d'Accessibilité
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Configure les fonctionnalités d'accessibilité pour améliorer ton expérience de l'éditeur.
                    </p>

                    <Separator />

                    <div className="flex items-center gap-3">
                      <Checkbox id="high-contrast" />
                      <label htmlFor="high-contrast" className="text-sm font-semibold cursor-pointer">
                        Mode Contraste Élevé
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <Checkbox id="reduce-motion" />
                      <label htmlFor="reduce-motion" className="text-sm font-semibold cursor-pointer">
                        Réduire les animations
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <Checkbox id="screen-reader" />
                      <label htmlFor="screen-reader" className="text-sm font-semibold cursor-pointer">
                        Optimisations Lecteur d'Écran
                      </label>
                    </div>

                    <Separator />

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Taille de police
                      </label>
                      <select className="w-full px-4 py-2 border border-input bg-background rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                        <option value="small">Petite</option>
                        <option value="medium">Moyenne (Par défaut)</option>
                        <option value="large">Grande</option>
                      </select>
                    </div>

                    <p className="text-sm text-muted-foreground mt-4">
                      Les fonctionnalités d'accessibilité sont en développement. Certaines options peuvent ne pas être totalement fonctionnelles.
                    </p>
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            <div className="border-t px-8 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={handleCancel}>
                Annuler
              </Button>
              <Button onClick={handleSave}>
                Enregistrer les paramètres
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

SettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};
