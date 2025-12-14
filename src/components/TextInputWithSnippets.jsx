import { useState, useRef, useEffect } from 'react';
import { searchSnippets } from '../data/textSnippets.js';

/**
 * Text Input with Autocomplete Snippets
 * Inspiré de Yarn Spinner et VS Code IntelliSense
 *
 * Utilisation:
 * <TextInputWithSnippets
 *   value={text}
 *   onChange={(newValue) => setText(newValue)}
 *   context="narrator"
 *   placeholder="Texte du narrateur..."
 * />
 */
export default function TextInputWithSnippets({
  value,
  onChange,
  context = null,
  placeholder = '',
  className = '',
  multiline = false,
  rows = 3,
  ...props
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [triggerQuery, setTriggerQuery] = useState('');
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Détecter le trigger "/" pour afficher les suggestions
  useEffect(() => {
    const text = value || '';
    const cursorPos = inputRef.current?.selectionStart || text.length;
    const textBeforeCursor = text.substring(0, cursorPos);

    // Chercher le dernier "/" dans le texte avant le curseur
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');

    if (lastSlashIndex !== -1) {
      const query = textBeforeCursor.substring(lastSlashIndex + 1);

      // Afficher les suggestions seulement si pas d'espace après le "/"
      if (!query.includes(' ')) {
        setTriggerQuery(query);
        const results = searchSnippets(query, context);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setSelectedIndex(0);
        return;
      }
    }

    setShowSuggestions(false);
  }, [value, context]);

  // Navigation clavier dans les suggestions
  const handleKeyDown = (e) => {
    if (!showSuggestions) {
      // Ctrl+Space pour afficher manuellement les suggestions
      if ((e.ctrlKey || e.metaKey) && e.key === ' ') {
        e.preventDefault();
        const allSnippets = searchSnippets('', context);
        setSuggestions(allSnippets);
        setShowSuggestions(true);
        setSelectedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
      case 'Tab':
        if (suggestions[selectedIndex]) {
          e.preventDefault();
          applySnippet(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        break;
      default:
        break;
    }
  };

  // Appliquer un snippet
  const applySnippet = (snippet) => {
    const text = value || '';
    const cursorPos = inputRef.current?.selectionStart || text.length;
    const textBeforeCursor = text.substring(0, cursorPos);
    const textAfterCursor = text.substring(cursorPos);

    // Trouver le début du trigger "/"
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');

    if (lastSlashIndex !== -1) {
      const beforeSlash = textBeforeCursor.substring(0, lastSlashIndex);
      const newText = beforeSlash + snippet.text + textAfterCursor;
      onChange(newText);

      // Repositionner le curseur après le texte inséré
      setTimeout(() => {
        const newCursorPos = beforeSlash.length + snippet.text.length;
        inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
        inputRef.current?.focus();
      }, 0);
    }

    setShowSuggestions(false);
  };

  const baseInputClasses = `w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all ${className}`;

  return (
    <div className="relative">
      {multiline ? (
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          className={baseInputClasses}
          {...props}
        />
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={baseInputClasses}
          {...props}
        />
      )}

      {/* Hint pour les snippets */}
      {!showSuggestions && (
        <div className="absolute right-2 top-2 text-xs text-slate-400 pointer-events-none">
          💡 Tapez "/" pour les suggestions
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full bg-white border-2 border-blue-500 rounded-lg shadow-xl max-h-60 overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-blue-50 border-b border-blue-200 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-800">
                📝 Snippets ({suggestions.length})
              </span>
              <div className="flex gap-2 text-xs text-blue-600">
                <span>↑↓ Naviguer</span>
                <span>⏎ Sélectionner</span>
                <span>Esc Fermer</span>
              </div>
            </div>
          </div>

          {/* Suggestions list */}
          {suggestions.map((snippet, index) => (
            <button
              key={snippet.id}
              onClick={() => applySnippet(snippet)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full text-left px-3 py-2 transition-colors ${
                index === selectedIndex
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-blue-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      index === selectedIndex
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      /{snippet.trigger}
                    </span>
                    <span className={`text-sm font-semibold ${
                      index === selectedIndex ? 'text-white' : 'text-slate-900'
                    }`}>
                      {snippet.label}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 truncate ${
                    index === selectedIndex ? 'text-blue-100' : 'text-slate-600'
                  }`}>
                    {snippet.text}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${
                  index === selectedIndex
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {snippet.category}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
