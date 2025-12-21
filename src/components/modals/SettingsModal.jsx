import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSettingsStore } from '../../stores/index.js';
import BaseModal from './BaseModal.jsx';

/**
 * SettingsModal - Project configuration modal
 * Three tabs:
 * - Project: Project metadata (title, author, description, version)
 * - Editor: Editor preferences (theme, autosave, grid settings)
 * - Game: Game variables configuration (Empathie, Autonomie, Confiance)
 */
export default function SettingsModal({ isOpen, onClose }) {
  // Zustand stores (granular selectors)
  const projectSettings = useSettingsStore(state => state.projectSettings);
  const updateProjectSettings = useSettingsStore(state => state.updateProjectSettings);

  const [activeTab, setActiveTab] = useState('project');
  const [formData, setFormData] = useState(projectSettings || {});

  // Sync form data when modal opens or projectSettings change
  useEffect(() => {
    if (isOpen && projectSettings) {
      setFormData(projectSettings);
    }
  }, [isOpen, projectSettings]);

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
    // Reset form data
    setFormData(projectSettings || {});
    onClose();
  };

  if (!formData.project || !formData.editor || !formData.game) {
    return null; // Prevent render if data not loaded
  }

  return (
    <BaseModal isOpen={isOpen} onClose={handleCancel} title="⚙️ Project Settings" size="xl">
      <div className="flex flex-col h-full">
        {/* Tab Navigation */}
        <div className="flex-shrink-0 border-b border-slate-700 px-6 pt-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('project')}
              className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
                activeTab === 'project'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-slate-400 border-transparent hover:text-slate-300'
              }`}
            >
              📝 Project
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
                activeTab === 'editor'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-slate-400 border-transparent hover:text-slate-300'
              }`}
            >
              🎨 Editor
            </button>
            <button
              onClick={() => setActiveTab('game')}
              className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
                activeTab === 'game'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-slate-400 border-transparent hover:text-slate-300'
              }`}
            >
              🎮 Game
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Project Tab */}
          {activeTab === 'project' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Project Title
                </label>
                <input
                  type="text"
                  value={formData.project.title}
                  onChange={(e) => handleFieldChange('project', 'title', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="My AccessCity Story"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Author
                </label>
                <input
                  type="text"
                  value={formData.project.author}
                  onChange={(e) => handleFieldChange('project', 'author', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Author Name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.project.description}
                  onChange={(e) => handleFieldChange('project', 'description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your interactive story..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Version
                </label>
                <input
                  type="text"
                  value={formData.project.version}
                  onChange={(e) => handleFieldChange('project', 'version', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1.0.0"
                />
              </div>
            </div>
          )}

          {/* Editor Tab */}
          {activeTab === 'editor' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Theme
                </label>
                <select
                  value={formData.editor.theme}
                  onChange={(e) => handleFieldChange('editor', 'theme', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autosave"
                  checked={formData.editor.autosave}
                  onChange={(e) => handleFieldChange('editor', 'autosave', e.target.checked)}
                  className="w-5 h-5 bg-slate-800 border border-slate-700 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="autosave" className="text-sm font-semibold text-slate-300">
                  Enable Auto-save
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Auto-save Interval (seconds)
                </label>
                <input
                  type="number"
                  value={formData.editor.autosaveInterval / 1000}
                  onChange={(e) => handleFieldChange('editor', 'autosaveInterval', parseInt(e.target.value) * 1000)}
                  min={10}
                  max={300}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Grid Size (pixels)
                </label>
                <select
                  value={formData.editor.gridSize}
                  onChange={(e) => handleFieldChange('editor', 'gridSize', parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10px (Fine)</option>
                  <option value={20}>20px (Medium)</option>
                  <option value={50}>50px (Coarse)</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="snapToGrid"
                  checked={formData.editor.snapToGrid}
                  onChange={(e) => handleFieldChange('editor', 'snapToGrid', e.target.checked)}
                  className="w-5 h-5 bg-slate-800 border border-slate-700 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="snapToGrid" className="text-sm font-semibold text-slate-300">
                  Snap to Grid
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="showGrid"
                  checked={formData.editor.showGrid}
                  onChange={(e) => handleFieldChange('editor', 'showGrid', e.target.checked)}
                  className="w-5 h-5 bg-slate-800 border border-slate-700 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="showGrid" className="text-sm font-semibold text-slate-300">
                  Show Grid Overlay
                </label>
              </div>
            </div>
          )}

          {/* Game Tab */}
          {activeTab === 'game' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white mb-4">Game Variables</h3>

              {Object.entries(formData.game.variables).map(([varName, varConfig]) => (
                <div key={varName} className="border border-slate-700 rounded-lg p-4 bg-slate-800/50">
                  <h4 className="font-semibold text-white mb-3">{varName}</h4>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Initial Value
                      </label>
                      <input
                        type="number"
                        value={varConfig.initial}
                        onChange={(e) => handleVariableChange(varName, 'initial', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Minimum
                      </label>
                      <input
                        type="number"
                        value={varConfig.min}
                        onChange={(e) => handleVariableChange(varName, 'min', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Maximum
                      </label>
                      <input
                        type="number"
                        value={varConfig.max}
                        onChange={(e) => handleVariableChange(varName, 'max', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-slate-700 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

SettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};
