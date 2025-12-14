// src/components/OnboardingModal.jsx
import React, { useEffect, useRef, useState } from 'react';
import trapFocus from '../utils/trapFocus.js';

export default function OnboardingModal({ onClose }) {
  const [step, setStep] = useState(0);
  const dialogRef = useRef(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const prevActive = document.activeElement;

    if (dialogRef.current) dialogRef.current.focus();
    const cleanup = trapFocus(dialogRef.current);

    return () => {
      document.body.style.overflow = prevOverflow;
      cleanup();
      if (prevActive && typeof prevActive.focus === 'function') {
        try { prevActive.focus(); } catch {}
      }
    };
  }, []);

  const steps = [
    {
      title: 'Bienvenue dans ton editeur d\'histoires !',
      text: 'Ici, tu peux creer des aventures incroyables pour sensibiliser a l\'accessibilite. C\'est toi le createur !',
      icon: '\uD83C\uDF89'
    },
    {
      title: 'Decouvre comment creer ta premiere aventure',
      text: 'Tu vas pouvoir ajouter des scenes, des dialogues et des personnages. C\'est super facile, suis le guide !',
      icon: '\uD83D\uDCA1'
    },
    {
      title: 'C\'est parti ! Cree ta premiere histoire',
      text: 'Clique sur "Scenes" pour commencer. Tu pourras previsualiser ton histoire quand tu veux. Amuse-toi bien !',
      icon: '\uD83D\uDE80'
    }
  ];

  const isLast = step === steps.length - 1;

  function handleNext() {
    if (isLast) {
      window.localStorage.setItem('ac_onboarding_completed', 'true');
      onClose();
    } else {
      setStep(step + 1);
    }
  }

  function handlePrev() {
    if (step > 0) setStep(step - 1);
  }

  function handleSkip() {
    window.localStorage.setItem('ac_onboarding_completed', 'true');
    onClose();
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      handleSkip();
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-gradient-to-br from-black/70 via-game-purple/25 to-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn"
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-gradient-to-br from-white via-game-purple/5 to-white rounded-2xl shadow-game-card-hover border-2 border-game-purple/20 max-w-lg w-full p-8 animate-scale-in focus-visible:outline-2 focus-visible:outline-game-purple focus-visible:outline-offset-2"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboard-title"
        aria-describedby="onboard-desc"
        tabIndex="-1"
        ref={dialogRef}
      >
        {/* Icon */}
        <div className="text-6xl text-center mb-4 drop-shadow-lg animate-bounce-subtle" aria-hidden="true">
          {steps[step].icon}
        </div>

        {/* Title */}
        <h3 id="onboard-title" className="text-2xl font-bold text-slate-900 mb-3 text-center">
          {steps[step].title}
        </h3>

        {/* Description */}
        <p id="onboard-desc" className="text-slate-700 mb-6 text-center text-lg leading-relaxed">
          {steps[step].text}
        </p>
        
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6" role="progressbar" aria-valuenow={step + 1} aria-valuemin="1" aria-valuemax={steps.length} aria-label={`Etape ${step + 1} sur ${steps.length}`}>
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-game-purple' : 'bg-slate-300'
              }`}
              aria-hidden="true"
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex justify-between items-center gap-3">
          <button
            onClick={handleSkip}
            className="px-5 py-2.5 text-sm rounded-lg border-2 border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 transition-all font-semibold text-slate-700 focus-visible:outline-2 focus-visible:outline-game-purple focus-visible:outline-offset-2"
            aria-label="Passer l'introduction"
          >
            Passer
          </button>
          
          <div className="flex gap-2 items-center">
            {step > 0 && (
              <button
                onClick={handlePrev}
                className="px-5 py-2.5 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 transition-all font-semibold text-slate-800 focus-visible:outline-2 focus-visible:outline-game-purple focus-visible:outline-offset-2"
                aria-label="Etape precedente"
              >
                Precedent
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-6 py-2.5 text-sm rounded-lg bg-gradient-to-r from-game-purple to-game-pink text-white hover:from-game-purple-hover hover:to-game-pink-hover transition-all font-bold shadow-game-card hover:shadow-game-card-hover focus-visible:outline-2 focus-visible:outline-game-purple focus-visible:outline-offset-2"
              aria-label={isLast ? 'Commencer a creer' : 'Continuer'}
            >
              {isLast ? 'Commencer' : 'Suivant'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}