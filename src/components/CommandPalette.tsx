import { useState, useEffect, useRef } from 'react';
import { useScenesStore, useCharactersStore, useUIStore } from '../stores/index.ts';

/**
 * Command item in the palette
 */
interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: string;
  action: () => void;
}

/**
 * Props for CommandPalette component
 */
interface CommandPaletteProps {
  /** Whether the palette is currently open */
  isOpen: boolean;
  /** Callback when the palette should close */
  onClose: () => void;
  /** Mode: 'commands' for all commands, 'quick-open' for scenes/characters */
  mode?: 'commands' | 'quick-open';
  /** Function to change the active tab in the editor */
  setActiveTab: (tab: string) => void;
}

/**
 * Command Palette - Inspired by VS Code
 * Ctrl+P : Quick Open (scenes)
 * Ctrl+Shift+P : All commands
 */
export default function CommandPalette({
  isOpen,
  onClose,
  mode = 'commands',
  setActiveTab
}: CommandPaletteProps): React.JSX.Element | null {
  const scenes = useScenesStore(state => state.scenes);
  const addScene = useScenesStore(state => state.addScene);
  const characters = useCharactersStore(state => state.characters);
  const addCharacter = useCharactersStore(state => state.addCharacter);
  const setSelectedSceneForEdit = useUIStore(state => state.setSelectedSceneForEdit);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus automatique sur l'input à l'ouverture
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset à la fermeture
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Liste des commandes disponibles
  const allCommands: CommandItem[] = [
    {
      id: 'new-scene',
      label: 'Nouvelle scène',
      description: 'Créer une nouvelle scène',
      icon: '🎬',
      action: () => {
        addScene();
        setActiveTab('scenes');
        onClose();
      }
    },
    {
      id: 'new-character',
      label: 'Nouveau personnage',
      description: 'Créer un nouveau personnage',
      icon: '👤',
      action: () => {
        addCharacter();
        setActiveTab('characters');
        onClose();
      }
    },
    {
      id: 'go-context',
      label: 'Aller à: Contexte',
      description: 'Ouvrir l\'onglet Contexte',
      icon: '📝',
      action: () => {
        setActiveTab('context');
        onClose();
      }
    },
    {
      id: 'go-characters',
      label: 'Aller à: Personnages',
      description: 'Ouvrir l\'onglet Personnages',
      icon: '👥',
      action: () => {
        setActiveTab('characters');
        onClose();
      }
    },
    {
      id: 'go-assets',
      label: 'Aller à: Assets',
      description: 'Ouvrir l\'onglet Assets',
      icon: '🎨',
      action: () => {
        setActiveTab('assets');
        onClose();
      }
    },
    {
      id: 'go-scenes',
      label: 'Aller à: Scènes',
      description: 'Ouvrir l\'onglet Scènes',
      icon: '🎬',
      action: () => {
        setActiveTab('scenes');
        onClose();
      }
    },
    {
      id: 'go-dialogues',
      label: 'Aller à: Dialogues',
      description: 'Ouvrir l\'onglet Dialogues',
      icon: '💬',
      action: () => {
        setActiveTab('dialogues');
        onClose();
      }
    },
    {
      id: 'go-preview',
      label: 'Aller à: Preview',
      description: 'Tester le scénario',
      icon: '▶️',
      action: () => {
        setActiveTab('preview');
        onClose();
      }
    },
    {
      id: 'go-export',
      label: 'Aller à: Export',
      description: 'Exporter le projet',
      icon: '📦',
      action: () => {
        setActiveTab('export');
        onClose();
      }
    }
  ];

  // Liste des scènes pour Quick Open
  const sceneItems: CommandItem[] = scenes.map(scene => ({
    id: `scene-${scene.id}`,
    label: scene.title || 'Sans titre',
    description: `Scene ID: ${scene.id} | ${(scene.dialogues || []).length} dialogue(s)`,
    icon: '🎬',
    action: () => {
      setSelectedSceneForEdit(scene.id);
      setActiveTab('scenes');
      onClose();
    }
  }));

  // Liste des personnages
  const characterItems: CommandItem[] = characters.map(char => ({
    id: `char-${char.id}`,
    label: char.name || 'Sans nom',
    description: `Personnage | ID: ${char.id}`,
    icon: '👤',
    action: () => {
      setActiveTab('characters');
      // TODO: Sélectionner le personnage spécifique
      onClose();
    }
  }));

  // Items à afficher selon le mode
  const items: CommandItem[] = mode === 'quick-open'
    ? [...sceneItems, ...characterItems]
    : allCommands;

  // Filtrer selon la recherche
  const filteredItems = items.filter(item => {
    const searchLower = search.toLowerCase();
    return (
      item.label.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower)
    );
  });

  // Navigation clavier
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-modal-v2 flex items-start justify-center pt-20 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        {/* Header avec search input */}
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearch(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder={mode === 'quick-open' ? 'Rechercher une scène ou un personnage...' : 'Rechercher une commande...'}
              className="w-full pl-10 pr-4 py-3 text-lg border-0 focus:outline-none focus:ring-0 bg-transparent"
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
            <span>{filteredItems.length} résultat{filteredItems.length > 1 ? 's' : ''}</span>
            <div className="flex gap-4">
              <span className="bg-slate-200 px-2 py-0.5 rounded">↑↓ Naviguer</span>
              <span className="bg-slate-200 px-2 py-0.5 rounded">Enter Sélectionner</span>
              <span className="bg-slate-200 px-2 py-0.5 rounded">Esc Fermer</span>
            </div>
          </div>
        </div>

        {/* Liste des résultats */}
        <div className="max-h-96 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">Aucun résultat trouvé</p>
              <p className="text-xs mt-1">Essayez une autre recherche</p>
            </div>
          ) : (
            filteredItems.map((item, index) => (
              <button
                key={item.id}
                onClick={item.action}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  index === selectedIndex
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-slate-50'
                }`}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {/* Icône */}
                <span className="text-2xl flex-shrink-0">{item.icon}</span>

                {/* Texte */}
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm ${
                    index === selectedIndex ? 'text-white' : 'text-slate-900'
                  }`}>
                    {item.label}
                  </div>
                  <div className={`text-xs truncate ${
                    index === selectedIndex ? 'text-blue-100' : 'text-slate-500'
                  }`}>
                    {item.description}
                  </div>
                </div>

                {/* Badge de sélection */}
                {index === selectedIndex && (
                  <svg className="w-5 h-5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
