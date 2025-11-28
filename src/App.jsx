import React, { useState } from 'react';
import DialogueArea from './components/DialogueArea.jsx';

function App() {
  const [count, setCount] = useState(0);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [currentChoices, setCurrentChoices] = useState([]);

  const demoScene = [
    { speaker: 'Narrateur', text: 'Bienvenue dans la démo dialogue réactif Vite.' },
    { speaker: 'Conseiller', text: 'Vous voyez le rendu changer sans recharger la page.' },
    { speaker: 'Joueur', text: 'Que souhaitez-vous tester ?', choices: [
      { text: 'Avancer', next: 3 },
      { text: 'Revenir début', next: 0 }
    ]},
    { speaker: 'Narrateur', text: 'Fin de la démo. Modifie ce texte dans App.jsx pour voir HMR.' }
  ];

  const current = demoScene[dialogueIndex] || {};
  React.useEffect(() => {
    setCurrentChoices(current.choices || []);
  }, [dialogueIndex]);

  function handleChoice(choice) {
    if (typeof choice.next === 'number') {
      setDialogueIndex(choice.next);
    }
  }

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
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🗨️ Démo DialogueArea (HMR)</h2>
          <p className="text-gray-600 mb-4">Modifie n'importe quel texte dans <code>demoScene</code> (fichier <code>src/App.jsx</code>) et sauvegarde : le changement apparaît instantanément sans perdre la position actuelle dans le dialogue.</p>
          <DialogueArea
            speaker={current.speaker}
            text={current.text}
            choices={currentChoices}
            onSelect={handleChoice}
          />
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setDialogueIndex(i => Math.min(demoScene.length - 1, i + 1))}
              className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow">
              Suivant
            </button>
            <button
              onClick={() => setDialogueIndex(0)}
              className="px-6 py-3 rounded-lg bg-slate-600 hover:bg-slate-700 text-white font-medium shadow">
              Recommencer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
