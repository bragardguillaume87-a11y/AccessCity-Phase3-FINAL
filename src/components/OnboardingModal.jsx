// src/components/OnboardingModal.jsx
import React, { useEffect, useRef, useState } from 'react';

function trapFocus(container) {
  if (!container) return () => {};
  const selectors = ['a[href]', 'button', 'input', 'select', 'textarea', '[tabindex]:not([tabindex="-1"])'];
  const getFocusables = () => Array.from(container.querySelectorAll(selectors.join(',')))
    .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
  
  const handler = (e) => {
    if (e.key !== 'Tab') return;
    const focusables = getFocusables();
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first || !container.contains(document.activeElement)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };
  container.addEventListener('keydown', handler);
  return () => container.removeEventListener('keydown', handler);
}

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
      title: 'Bienvenue dans AccessCity Studio !',
      text: 'Cree des scenarios immersifs pour sensibiliser a l accessibilite.'
    },
    {
      title: 'Comment utiliser l editeur ?',
      text: 'Navigue entre les panneaux Scenes, Dialogues et Personnages. Chaque modification est instantanee.'
    },
    {
      title: 'Previsualiser et exporter',
      text: 'Clique sur Previsualiser pour tester ton scenario. Exporte en JSON quand tu es pret.'
    }
  ];

  const isLast = step === steps.length - 1;

  function handleNext() {
    if (isLast) {
      window.localStorage.setItem('ac_onboarded', 'true');
      onClose();
    } else {
      setStep(step + 1);
    }
  }

  function handlePrev() {
    if (step > 0) setStep(step - 1);
  }

  function handleSkip() {
    window.localStorage.setItem('ac_onboarded', 'true');
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboard-title"
        aria-describedby="onboard-desc"
        tabIndex="-1"
        ref={dialogRef}
      >
        <h3 id="onboard-title" className="text-2xl font-bold text-primary mb-2">
          {steps[step].title}
        </h3>
        <p id="onboard-desc" className="text-gray-700 mb-6">
          {steps[step].text}
        </p>
        
        <div className="flex justify-between items-center">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-100"
          >
            Passer
          </button>
          
          <div className="flex gap-2 items-center">
            {step > 0 && (
              <button
                onClick={handlePrev}
                className="px-4 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200"
              >
                Precedent
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-2 text-sm rounded bg-primary text-white hover:bg-primary-hover"
            >
              {isLast ? 'Commencer' : 'Continuer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
