import { useState, useEffect } from 'react';
import { useScenesStore, useCharactersStore } from '../stores/index.js';
import { IconByName } from './IconByName.jsx';
import { logger } from '../utils/logger';
// FIX: Utiliser StageDirector simplifie
import StageDirector from '../core/StageDirector.simple.js';
// FIX: Utiliser systeme son simplifie
import { playSound, toggleMute as toggleSoundMute, isSoundMuted } from '../utils/simpleSound.js';
import { PartyPopper, BarChart3, Heart, Zap, Shield, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { TIMING } from '@/config/timing';


export default function PlayMode({ onExit, selectedSceneIndex = 0 }) {
  const scenes = useScenesStore(state => state.scenes);
  const characters = useCharactersStore(state => state.characters);
  const [director, setDirector] = useState(null);
  const [currentScene, setCurrentScene] = useState(null);
  const [currentDialogue, setCurrentDialogue] = useState(null);
  const [isEnded, setIsEnded] = useState(false);
  const [variables, setVariables] = useState({ Empathie: 50, Autonomie: 50, Confiance: 50 });
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(isSoundMuted());


  // Creer le director et initialiser le jeu en UN SEUL useEffect
  useEffect(() => {
    if (scenes.length > 0) {
      // Extraire tous les dialogues de toutes les scènes
      const allDialogues = scenes.flatMap(scene => scene.dialogues || []);

      // Vérifier qu'il y a au moins un dialogue
      if (allDialogues.length === 0) {
        logger.warn('[PlayMode] Aucun dialogue dans le scenario');
        alert('Ce scenario n\'a pas de dialogues. Ajoutez-en dans l\'editeur avant de jouer !');
        setIsLoading(false);
        setTimeout(onExit, 100);
        return;
      }

      // FIX: Passer selectedSceneIndex au constructeur
      const gameState = { Empathie: 50, Autonomie: 50, Confiance: 50 };
      const newDirector = new StageDirector(scenes, allDialogues, gameState, selectedSceneIndex);
      setDirector(newDirector);

      // Initialiser l'etat immediatement apres creation
      const scene = newDirector.getCurrentScene();
      const dialogue = newDirector.getCurrentDialogue();

      // FIX: Verifier qu'il y a des dialogues
      if (!dialogue) {
        logger.warn('[PlayMode] Aucun dialogue pour cette scene');
        alert('Cette scene n\'a pas de dialogues. Ajoutez-en dans l\'editeur avant de jouer !');
        setIsLoading(false);
        setTimeout(onExit, 100);
        return;
      }

      setCurrentScene(scene);
      setCurrentDialogue(dialogue);
      setVariables({ ...newDirector.gameState });
      setIsEnded(newDirector.isGameOver());
      setIsLoading(false);

      // Jouer le son de changement de scene
      playSound('/sounds/scene-change.mp3', 0.3);
    }
  }, [scenes, characters, selectedSceneIndex, onExit]);


  function updateState() {
    if (!director) return;
    
    const scene = director.getCurrentScene();
    const dialogue = director.getCurrentDialogue();
    
    setCurrentScene(scene);
    setCurrentDialogue(dialogue);
    setVariables({ ...director.gameState });
    setIsEnded(director.isGameOver());
  }


  function handleChoice(choice) {
    if (!director) return;
    
    // FIX: Son simplifie
    playSound('/sounds/choice.mp3', 0.5);
    director.makeChoice(choice);
    
    // Verifier effets (optionnel: jouer sons differents)
    if (choice.effects) {
      Object.entries(choice.effects).forEach(([, value]) => {
        if (value > 0) playSound('/sounds/stat-up.mp3', 0.4);
        if (value < 0) playSound('/sounds/stat-down.mp3', 0.4);
      });
    }


    const ended = director.isGameOver();
    if (ended) {
      const avgScore = (director.gameState.Empathie + director.gameState.Autonomie + director.gameState.Confiance) / 3;
      if (avgScore >= 60) {
        playSound('/sounds/victory.mp3', 0.6);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), TIMING.CONFETTI_DURATION);
      } else {
        playSound('/sounds/game-over.mp3', 0.5);
      }
    } else {
      playSound('/sounds/scene-change.mp3', 0.3);
    }


    updateState();
  }


  // FIX: Bouton Mute simplifie
  function handleMuteToggle() {
    const newMuted = toggleSoundMute();
    setIsMuted(newMuted);
  }


  // Ecran de chargement ameliore
  if (isLoading) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600/20 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
          <p className="text-slate-400">Chargement de la scene...</p>
        </div>
      </div>
    );
  }


  // Ecran de fin avec confettis et animations
  if (isEnded) {
    const avgScore = (variables.Empathie + variables.Autonomie + variables.Confiance) / 3;
    const isSuccess = avgScore >= 60;


    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Confettis animes */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-50">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${3 + Math.random() * 2}s`,
                  backgroundColor: [
                    '#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'
                  ][Math.floor(Math.random() * 6)]
                }}
              />
            ))}
          </div>
        )}


        {/* Fond anime */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20 animate-gradient" />


        {/* Contenu principal */}
        <div className="relative z-10 max-w-2xl w-full mx-auto p-8 text-center">
          {/* Icone principale avec animation */}
          <div className="mb-8 animate-scale-in">
            <div className={`
              inline-flex items-center justify-center w-32 h-32 rounded-full
              ${isSuccess 
                ? 'bg-gradient-to-br from-yellow-400 to-orange-500 animate-bounce-slow' 
                : 'bg-gradient-to-br from-slate-600 to-slate-700'
              }
              shadow-2xl
            `}>
              <PartyPopper className="w-16 h-16 text-white" />
            </div>
          </div>


          {/* Titre anime */}
          <h1 className={`
            text-5xl font-bold mb-4 animate-fade-in-up
            ${isSuccess 
              ? 'bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent' 
              : 'text-slate-300'
            }
          `}>
            Fin du jeu !
          </h1>


          <p className="text-slate-400 mb-12 text-lg animate-fade-in-up animation-delay-200">
            Merci d'avoir joue a cette aventure
          </p>


          {/* Carte statistiques avec animations */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 mb-8 animate-fade-in-up animation-delay-400 shadow-xl">
            <div className="flex items-center gap-3 mb-6 justify-center">
              <BarChart3 className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Statistiques finales</h2>
            </div>


            <div className="space-y-6">
              {/* Empathie */}
              <div className="animate-slide-in-right animation-delay-600">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-400" />
                    <span className="text-slate-300 font-medium">Empathie</span>
                  </div>
                  <span className={`text-2xl font-bold ${variables.Empathie >= 60 ? 'text-red-400' : 'text-slate-500'}`}>
                    {variables.Empathie}/100
                  </span>
                </div>
                <div className="relative h-4 bg-slate-700/50 rounded-full overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full transition-all duration-1000 ease-out animate-progress-bar"
                    style={{ width: `${variables.Empathie}%` }}
                  />
                </div>
              </div>


              {/* Autonomie */}
              <div className="animate-slide-in-right animation-delay-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-400" />
                    <span className="text-slate-300 font-medium">Autonomie</span>
                  </div>
                  <span className={`text-2xl font-bold ${variables.Autonomie >= 60 ? 'text-blue-400' : 'text-slate-500'}`}>
                    {variables.Autonomie}/100
                  </span>
                </div>
                <div className="relative h-4 bg-slate-700/50 rounded-full overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000 ease-out animate-progress-bar"
                    style={{ width: `${variables.Autonomie}%`, animationDelay: '0.2s' }}
                  />
                </div>
              </div>


              {/* Confiance */}
              <div className="animate-slide-in-right animation-delay-1000">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-400" />
                    <span className="text-slate-300 font-medium">Confiance</span>
                  </div>
                  <span className={`text-2xl font-bold ${variables.Confiance >= 60 ? 'text-green-400' : 'text-slate-500'}`}>
                    {variables.Confiance}/100
                  </span>
                </div>
                <div className="relative h-4 bg-slate-700/50 rounded-full overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out animate-progress-bar"
                    style={{ width: `${variables.Confiance}%`, animationDelay: '0.4s' }}
                  />
                </div>
              </div>
            </div>


            {/* Message de succes */}
            {isSuccess && (
              <div className="mt-8 flex items-center justify-center gap-2 text-yellow-400 animate-pulse-slow">
                <Sparkles className="w-5 h-5" />
                <p className="font-semibold text-lg">Felicitations ! Excellent parcours !</p>
                <Sparkles className="w-5 h-5" />
              </div>
            )}
          </div>


          {/* Bouton retour */}
          <button
            onClick={onExit}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 mx-auto animate-fade-in-up animation-delay-1200"
          >
            <IconByName name="arrow-left" className="w-5 h-5" />
            Retour a l'editeur
          </button>
        </div>
        {/* Styles CSS pour les animations */}
        <style>{`
          @keyframes confetti-fall {
            0% {
              transform: translateY(-100vh) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0;
            }
          }


          .confetti {
            position: absolute;
            width: 10px;
            height: 10px;
            animation: confetti-fall linear infinite;
            top: -10px;
          }


          @keyframes gradient {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }
          .animate-gradient {
            animation: gradient 3s ease-in-out infinite;
          }


          @keyframes scale-in {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-scale-in {
            animation: scale-in 0.5s ease-out;
          }


          @keyframes fade-in-up {
            from { 
              transform: translateY(20px); 
              opacity: 0; 
            }
            to { 
              transform: translateY(0); 
              opacity: 1; 
            }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out forwards;
            opacity: 0;
          }


          @keyframes slide-in-right {
            from { 
              transform: translateX(-30px); 
              opacity: 0; 
            }
            to { 
              transform: translateX(0); 
              opacity: 1; 
            }
          }
          .animate-slide-in-right {
            animation: slide-in-right 0.6s ease-out forwards;
            opacity: 0;
          }


          @keyframes progress-bar {
            from { width: 0; }
          }
          .animate-progress-bar {
            animation: progress-bar 1.5s ease-out;
          }


          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-10px) scale(1.05); }
          }
          .animate-bounce-slow {
            animation: bounce-slow 2s ease-in-out infinite;
          }


          @keyframes pulse-slow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .animate-pulse-slow {
            animation: pulse-slow 2s ease-in-out infinite;
          }


          .animation-delay-200 { animation-delay: 0.2s; }
          .animation-delay-400 { animation-delay: 0.4s; }
          .animation-delay-600 { animation-delay: 0.6s; }
          .animation-delay-800 { animation-delay: 0.8s; }
          .animation-delay-1000 { animation-delay: 1s; }
          .animation-delay-1200 { animation-delay: 1.2s; }
        `}</style>
      </div>
    );
  }


  // Interface de jeu
  const character = currentDialogue?.characterId !== undefined 
    ? characters[currentDialogue.characterId] 
    : null;


  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col overflow-auto pt-20">
      {/* Header avec variables - FIXED */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-sm border-b border-slate-700 p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-2"
            >
              <IconByName name="x" className="w-4 h-4" />
              Quitter
            </button>

            {/* FIX: BOUTON MUTE SIMPLIFIE */}
            <button
              onClick={handleMuteToggle}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                isMuted 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title={isMuted ? 'Activer le son' : 'Couper le son'}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-5 h-5" />
                  <span className="text-sm font-medium">Muet</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Son</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-400" />
              <span className="text-slate-300 font-medium">Empathie:</span>
              <span className="text-white font-bold">{variables.Empathie}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              <span className="text-slate-300 font-medium">Autonomie:</span>
              <span className="text-white font-bold">{variables.Autonomie}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-slate-300 font-medium">Confiance:</span>
              <span className="text-white font-bold">{variables.Confiance}</span>
            </div>
          </div>
        </div>
      </div>


      {/* Zone de jeu */}
      <div className="flex-1 flex items-center justify-center p-8 pt-24">
        <div className="max-w-4xl w-full">
          {/* Carte de dialogue */}
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 shadow-2xl">
            {/* Personnage */}
            {character && (
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700">
                <div className="text-5xl">{character.avatarUrl || '👤'}</div>
                <div>
                  <h3 className="text-xl font-bold text-white">{character.name}</h3>
                  <p className="text-slate-400 text-sm">{character.role}</p>
                </div>
              </div>
            )}


            {/* Texte du dialogue */}
            <div className="mb-8">
              <p className="text-slate-200 text-lg leading-relaxed">
                {currentDialogue?.text || 'Aucun dialogue disponible'}
              </p>
            </div>


            {/* Choix */}
            {currentDialogue?.choices && currentDialogue.choices.length > 0 && (
              <div className="space-y-3">
                {currentDialogue.choices.map((choice, index) => (
                  <button
                    key={index}
                    onClick={() => handleChoice(choice)}
                    className="w-full text-left p-4 bg-slate-700/50 hover:bg-purple-600/30 border-2 border-slate-600 hover:border-purple-500 rounded-xl transition-all duration-200 group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-600 group-hover:bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </span>
                      <span className="text-slate-200 group-hover:text-white transition-colors">
                        {choice.text}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}