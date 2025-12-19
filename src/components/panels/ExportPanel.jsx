import React, { useContext, useState } from 'react';
import { AppContext } from '../../AppContext';
import { validateScenario, downloadExport } from '../../utils/exporters';

export default function ExportPanel({ onPrev, onNext }) {
  const { scenes, characters, context } = useContext(AppContext);
  const [validationResult, setValidationResult] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const data = {
    context,
    scenes,
    characters,
    version: '1.0.0',
    exportedAt: new Date().toISOString()
  };

  const handleValidate = () => {
    const result = validateScenario(data);
    setValidationResult(result);
  };

  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      downloadExport(data, format);
    } catch (error) {
      alert(`Erreur lors de l'export: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const stats = {
    totalScenes: scenes?.length || 0,
    totalCharacters: characters?.length || 0,
    totalDialogues: scenes?.reduce((sum, scene) => sum + (scene.dialogues?.length || 0), 0) || 0,
    totalChoices: scenes?.reduce((sum, scene) => {
      return sum + (scene.dialogues?.reduce((dSum, d) => dSum + (d.choices?.length || 0), 0) || 0);
    }, 0) || 0
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Export du Projet</h2>
        <p className="text-slate-600 mb-8">
          Exportez votre scénario dans différents formats pour le déployer ou le partager.
        </p>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-3xl font-bold text-blue-600 mb-1">{stats.totalScenes}</div>
            <div className="text-sm text-slate-600">Scènes</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-3xl font-bold text-purple-600 mb-1">{stats.totalCharacters}</div>
            <div className="text-sm text-slate-600">Personnages</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-3xl font-bold text-green-600 mb-1">{stats.totalDialogues}</div>
            <div className="text-sm text-slate-600">Dialogues</div>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="text-3xl font-bold text-amber-600 mb-1">{stats.totalChoices}</div>
            <div className="text-sm text-slate-600">Choix</div>
          </div>
        </div>

        {/* Validation */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">Validation du Scénario</h3>
          <p className="text-sm text-slate-600 mb-4">
            Vérifiez que votre scénario est complet et valide avant de l'exporter.
          </p>
          <button
            onClick={handleValidate}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Valider le Scénario
          </button>

          {validationResult && (
            <div
              className={`mt-4 p-4 rounded-lg border ${
                validationResult.valid
                  ? 'bg-green-50 border-green-300 text-green-800'
                  : 'bg-red-50 border-red-300 text-red-800'
              }`}
            >
              {validationResult.valid ? (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-semibold">Scénario valide ! Prêt pour l'export.</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-semibold">Erreurs détectées :</span>
                  </div>
                  <ul className="list-disc list-inside ml-4 text-sm space-y-1">
                    {validationResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Export Formats */}
        <div>
          <h3 className="text-xl font-semibold text-slate-800 mb-4">Formats d'Export</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {/* JSON Export */}
            <div className="border border-slate-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                  📄
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">JSON</h4>
                  <p className="text-xs text-slate-500">Format de données</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Exportez votre scénario au format JSON pour l'utiliser dans d'autres applications ou le sauvegarder.
              </p>
              <button
                onClick={() => handleExport('json')}
                disabled={isExporting}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? 'Export...' : 'Exporter JSON'}
              </button>
            </div>

            {/* HTML Standalone Export */}
            <div className="border border-slate-200 rounded-lg p-6 hover:border-purple-300 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
                  🌐
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">HTML</h4>
                  <p className="text-xs text-slate-500">Page web autonome</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Créez une page HTML autonome qui peut être ouverte directement dans un navigateur.
              </p>
              <button
                onClick={() => handleExport('html')}
                disabled={isExporting}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? 'Export...' : 'Exporter HTML'}
              </button>
            </div>

            {/* Phaser Export */}
            <div className="border border-slate-200 rounded-lg p-6 hover:border-green-300 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                  🎮
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Phaser</h4>
                  <p className="text-xs text-slate-500">Moteur de jeu</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Exportez vers Phaser 3 pour créer une version interactive avec graphismes avancés.
              </p>
              <button
                onClick={() => handleExport('phaser')}
                disabled={isExporting}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? 'Export...' : 'Exporter Phaser'}
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-3">
            <div className="text-blue-600 text-xl">ℹ️</div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">À propos des exports</h4>
              <p className="text-sm text-blue-800">
                Les fichiers exportés sont téléchargés directement sur votre ordinateur. Vous pouvez les modifier,
                les partager ou les déployer selon vos besoins. Pour les exports HTML et Phaser, assurez-vous que
                tous les assets (images, sons) sont accessibles.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        {(onPrev || onNext) && (
          <div className="flex justify-between pt-6">
            {onPrev && (
              <button
                onClick={onPrev}
                className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-all"
              >
                ← Precedent
              </button>
            )}
            {onNext && (
              <button
                onClick={onNext}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all ml-auto"
              >
                Suivant →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
