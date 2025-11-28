import React, { useState } from 'react';
import DialogueArea from './components/DialogueArea.jsx';
import { useDialogueEngine } from './hooks/useDialogueEngine.js';

function App() {
  const [count, setCount] = useState(0);

  // Définition scène initiale pour moteur réel
  const initialScene = {
    id: 'react_demo_scene',
    title: 'Démo moteur DialogueEngine',
    dialogues: [
      { speaker: 'Narrateur', text: 'Bienvenue dans la version moteur réelle intégrée à React.' },
      { speaker: 'Conseiller', text: 'Cette phrase est rendue par DialogueEngine via EventBus.' },
      { speaker: 'Joueur', text: 'Choisissez une option pour modifier les variables.', choices: [
        { text: 'Boost Mentale (+5)', effects: [{ variable: 'Mentale', operation: 'add', value: 5 }] },
        { text: 'Fatigue Physique (-10)', effects: [{ variable: 'Physique', operation: 'add', value: -10 }] },
        { text: 'Activer Alerte', effects: [{ variable: 'Alerte', operation: 'set', value: true }] }
      ]},
      { speaker: 'Narrateur', text: 'Variables modifiées. Relance ou inspecte HUD React.' },
    ]
  };

  const { dialogue, choices, variables, sceneEnded, next, selectChoice } = useDialogueEngine(initialScene);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
          AccessCity - Vite Demo
        </h1>
        
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
          <p className="text-lg text-gray-700 mb-4">
            🎉 <strong>HMR actif !</strong> Modifie ce texte et sauvegarde pour voir le changement instantané.
          </p>
          <p className="text-gray-600">
            Ce composant minimal démontre le Hot Module Replacement de Vite. 
            Essaie de changer la couleur, le texte, ou ajoute du contenu ci-dessous.
          </p>
        </div>

        <div className="text-center mb-8">
          <button
            onClick={() => setCount(count + 1)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg shadow-lg transition-all transform hover:scale-105"
          >
            Compteur: {count}
          </button>
          <p className="text-sm text-gray-500 mt-3">
            Clique le bouton, puis modifie le code → l'état reste préservé !
          </p>
        </div>

        <div className="border-t-2 border-gray-200 pt-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            ✨ Prochaines étapes
          </h2>
          <ul className="space-y-2 text-gray-600">
            <li>✅ Vite configuré et fonctionnel</li>
            <li>✅ HMR actif (Hot Module Replacement)</li>
            <li>✅ Tailwind CSS opérationnel</li>
            <li>✅ Migration partielle: composant DialogueArea réactif</li>
            <li>⏳ Instrumentation couverture navigateur</li>
          </ul>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <p className="text-sm text-yellow-800">
            <strong>Note :</strong> L'app originale (<code>index-react.html</code>) reste accessible.
            Cette version Vite est un environnement parallèle pour tester le workflow.
          </p>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🧠 Moteur de dialogue intégré</h2>
          <p className="text-gray-600 mb-4">Le contenu ci-dessous est alimenté par <code>DialogueEngine</code>. Modifie la scène initiale dans <code>App.jsx</code> puis sauvegarde pour feedback immédiat.</p>
          <DialogueArea
            speaker={dialogue.speaker}
            text={dialogue.text}
            choices={choices}
            onSelect={selectChoice}
          />
          <div className="flex flex-col gap-4 mt-6">
            <div className="flex gap-4">
              <button
                onClick={next}
                disabled={sceneEnded}
                className="px-6 py-3 rounded-lg bg-indigo-600 disabled:opacity-40 hover:bg-indigo-700 text-white font-medium shadow">
                {sceneEnded ? 'Scène terminée' : 'Suivant'}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-lg bg-slate-600 hover:bg-slate-700 text-white font-medium shadow">
                Recharger (reset)
              </button>
            </div>
            <div className="bg-slate-800/70 border border-slate-700 rounded-lg p-4 text-sm text-slate-200">
              <h3 className="font-semibold mb-2">HUD Variables</h3>
              <ul className="grid grid-cols-2 gap-2">
                {Object.entries(variables).map(([name, value]) => (
                  <li key={name} className="flex items-center justify-between bg-slate-700/60 px-3 py-2 rounded">
                    <span>{name}</span>
                    <span className="font-mono">{String(value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
