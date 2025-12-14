import { useState, useEffect, useRef } from 'react';
import { SCENARIO_TEMPLATES, TEMPLATE_CATEGORIES } from '../data/scenarioTemplates.js';


/**
 * Template Selector - Modal pour choisir un template de scenario
 * Inspire de Articy Draft MDK template browser
 * Avec focus trap + Escape + retour focus (accessibilite WCAG AA)
 */
export default function TemplateSelector({ isOpen, onClose, onSelectTemplate }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);


  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const triggerElementRef = useRef(null);


  // Focus trap + Escape + retour focus
  useEffect(() => {
    if (!isOpen) return;
    
    // Sauvegarder element qui a ouvert le modal
    triggerElementRef.current = document.activeElement;
    
    // Bloquer scroll arriere-plan
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    // Focus sur bouton fermer
    const timer = setTimeout(() => {
      if (closeButtonRef.current) {
        closeButtonRef.current.focus();
      }
    }, 0);
    
    // Gestion Escape
    function handleEscape(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    }
    
    // Focus trap simpliste (Tab reste dans le modal)
    function handleTab(e) {
      if (e.key !== 'Tab' || !modalRef.current) return;
      
      const focusables = modalRef.current.querySelectorAll(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusables.length === 0) return;
      
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);
    
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
      clearTimeout(timer);
      
      // Retour focus element declencheur
      if (triggerElementRef.current && typeof triggerElementRef.current.focus === 'function') {
        try {
          triggerElementRef.current.focus();
        } catch (err) {
          console.warn('[TemplateSelector] Could not return focus:', err);
        }
      }
    };
  }, [isOpen, onClose]);


  if (!isOpen) return null;


  // Filtrer les templates par categorie
  const filteredTemplates = selectedCategory === 'all'
    ? SCENARIO_TEMPLATES
    : SCENARIO_TEMPLATES.filter(t => t.category === selectedCategory);


  const selectedTemplate = SCENARIO_TEMPLATES.find(t => t.id === selectedTemplateId);


  const handleApply = () => {
    if (selectedTemplate && onSelectTemplate) {
      onSelectTemplate(selectedTemplate);
      onClose();
    }
  };


  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-modal-title"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="template-modal-title" className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                📦 Bibliotheque de Templates
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Choisissez un template pre-configure pour accelerer votre creation
              </p>
            </div>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="p-2 hover:bg-white rounded-lg transition-colors"
              aria-label="Fermer"
            >
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>


          {/* Filtres par categorie */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              📚 Tous ({SCENARIO_TEMPLATES.length})
            </button>
            {TEMPLATE_CATEGORIES.map(cat => {
              const count = SCENARIO_TEMPLATES.filter(t => t.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cat.icon} {cat.label} ({count})
                </button>
              );
            })}
          </div>
        </div>


        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Liste des templates */}
          <div className="w-1/2 border-r border-slate-200 overflow-y-auto p-4">
            <div className="space-y-2">
              {filteredTemplates.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <p className="text-sm">Aucun template dans cette categorie</p>
                </div>
              ) : (
                filteredTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedTemplateId === template.id
                        ? 'border-blue-600 bg-blue-50 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl flex-shrink-0">{template.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-sm ${
                          selectedTemplateId === template.id ? 'text-blue-900' : 'text-slate-900'
                        }`}>
                          {template.name}
                        </h3>
                        <p className={`text-xs mt-1 ${
                          selectedTemplateId === template.id ? 'text-blue-700' : 'text-slate-600'
                        }`}>
                          {template.description}
                        </p>
                        <div className="flex gap-1 mt-2">
                          {template.tags.map(tag => (
                            <span
                              key={tag}
                              className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                selectedTemplateId === template.id
                                  ? 'bg-blue-200 text-blue-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>


          {/* Previsualisation */}
          <div className="w-1/2 overflow-y-auto p-4 bg-slate-50">
            {selectedTemplate ? (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2 mb-2">
                    <span className="text-2xl">{selectedTemplate.icon}</span>
                    {selectedTemplate.name}
                  </h3>
                  <p className="text-sm text-slate-600">{selectedTemplate.description}</p>
                </div>


                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    Structure du template
                  </h4>
                  <div className="space-y-3">
                    {selectedTemplate.structure.dialogues.map((dialogue, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-slate-500">Dialogue {idx + 1}</span>
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                            {dialogue.speaker}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 italic mb-2">
                          "{dialogue.text}"
                        </p>
                        {dialogue.choices && dialogue.choices.length > 0 && (
                          <div className="space-y-1 mt-2">
                            <p className="text-xs font-semibold text-slate-600">Choix proposes :</p>
                            {dialogue.choices.map((choice, choiceIdx) => (
                              <div key={choiceIdx} className="flex items-start gap-2 text-xs">
                                <span className="text-slate-400">•</span>
                                <div className="flex-1">
                                  <p className="text-slate-700">{choice.text}</p>
                                  {choice.diceCheck?.enabled && (
                                    <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium mt-1">
                                      🎲 Test de {choice.diceCheck.stat} (difficulte {choice.diceCheck.difficulty})
                                    </span>
                                  )}
                                  {choice.diceCheck?.onSuccess?.variableChanges && (
                                    <div className="text-xs text-green-700 mt-1">
                                      Impacts : {Object.entries(choice.diceCheck.onSuccess.variableChanges).map(([k, v]) => `${k} ${v > 0 ? '+' : ''}${v}`).join(', ')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>


                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800">
                    <strong>💡 Conseil :</strong> Ce template sera ajoute a votre scene actuelle. Vous pourrez ensuite personnaliser tous les textes et parametres selon vos besoins.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-slate-400">
                  <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <p className="text-sm font-medium">Selectionnez un template</p>
                  <p className="text-xs mt-1">pour voir sa previsualisation</p>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-600">
            {selectedTemplate && (
              <span>
                <strong>{selectedTemplate.structure.dialogues.length}</strong> dialogue(s) seront ajoutes
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleApply}
              disabled={!selectedTemplate}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${
                selectedTemplate
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              ✨ Appliquer le template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
