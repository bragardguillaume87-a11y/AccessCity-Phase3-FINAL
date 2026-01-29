import { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Users, Plus, Settings } from 'lucide-react';

// Stores
import { useCharactersStore } from '@/stores/charactersStore';
import { useScenesStore } from '@/stores/scenesStore';

// Hooks
import { useValidation } from '@/hooks/useValidation';
import { useCharacterStatsV2 } from './CharactersModalV2/hooks/useCharacterStatsV2';
import { useCharacterFilteringV2, type CompletenessFilter, type UsageFilter, type CharacterSortBy } from './CharactersModalV2/hooks/useCharacterFilteringV2';
import { useCharacterUsage } from './CharactersModalV2/hooks/useCharacterUsage';
import { useCharacterSelection } from './CharactersModalV2/hooks/useCharacterSelection';
import { useCharacterFavoritesV2 } from './CharactersModalV2/hooks/useCharacterFavoritesV2';

// Components
import { CharacterPreviewPanel } from './CharactersModalV2/components/CharacterPreviewPanel';
import { LibraryTab } from './CharactersModalV2/components/LibraryTab';
import { ManagementTab } from './CharactersModalV2/components/ManagementTab';
import type { ViewMode } from './CharactersModalV2/components/CharacterGallery';

// Nested modals
import CharacterEditorModal from '../character-editor/CharacterEditorModal';
import ConfirmModal from '../ConfirmModal';

// Types
import type { Character } from '@/types';

/**
 * Props for CharactersModalV2
 */
export interface CharactersModalV2Props {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Optional character ID to open editor for immediately */
  initialCharacterId?: string;
}

/**
 * CharactersModalV2 - Modern Character Management Modal
 *
 * **Pattern:** EXACT copy structure AssetsLibraryModal
 *
 * Complete character management interface with tab-based navigation,
 * advanced filtering, bulk operations, and preview panel.
 *
 * ## Critical Flexbox Layout
 * ```
 * DialogContent (h-[85vh], flex flex-col)
 *   ├── DialogHeader (flex-shrink-0)
 *   └── div (flex-1 flex min-h-0)  ← CRITICAL
 *       └── Tabs (flex-1 flex flex-col)
 *           ├── TabsList wrapper (flex-shrink-0)
 *           └── TabsContent (flex-1 mt-0 flex min-h-0)  ← CRITICAL
 *               ├── LibraryTab/ManagementTab (flex-1)
 *               └── PreviewPanel (w-[320px] shrink-0)
 * ```
 *
 * ## Features
 * - **Two tabs:** Library (browse/search) and Management (bulk ops)
 * - **Preview panel:** 320px side panel for character details
 * - **Advanced filters:** Search, completeness, usage, mood, sort
 * - **Bulk operations:** Select all, duplicate, delete with warnings
 * - **Nested modals:** CharacterEditorModal, ConfirmModal
 * - **Auto-open editor:** Via initialCharacterId prop
 *
 * @example
 * ```tsx
 * <CharactersModalV2
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   initialCharacterId={characterId}
 * />
 * ```
 */
export function CharactersModalV2({
  isOpen,
  onClose,
  initialCharacterId,
}: CharactersModalV2Props) {
  // ===== ZUSTAND STORES (granular selectors) =====
  const characters = useCharactersStore((state) => state.characters);
  const addCharacter = useCharactersStore((state) => state.addCharacter);
  const updateCharacter = useCharactersStore((state) => state.updateCharacter);
  const deleteCharacter = useCharactersStore((state) => state.deleteCharacter);
  const scenes = useScenesStore((state) => state.scenes);

  // ===== LOCAL STATE =====
  const [activeTab, setActiveTab] = useState<'library' | 'management'>('library');

  // Library tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState('all');
  const [filterCompleteness, setFilterCompleteness] = useState<CompletenessFilter>('all');
  const [filterUsage, setFilterUsage] = useState<UsageFilter>('all');
  const [sortBy, setSortBy] = useState<CharacterSortBy>('name');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Management tab state
  const [searchQueryManagement, setSearchQueryManagement] = useState('');

  // Preview and editing state
  const [previewCharacter, setPreviewCharacter] = useState<Character | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [charToDelete, setCharToDelete] = useState<Character | null>(null);

  // ===== CUSTOM HOOKS =====
  const validation = useValidation();
  const { getCharacterStats, totalStats } = useCharacterStatsV2(characters);
  const usageMap = useCharacterUsage(scenes, characters);
  const { isFavorite, toggleFavorite } = useCharacterFavoritesV2();
  const selection = useCharacterSelection();

  // Derived moods (dynamic from data)
  const availableMoods = useMemo(() => {
    const moodSet = new Set<string>();
    characters.forEach((c) => c.moods?.forEach((mood) => moodSet.add(mood)));
    return Array.from(moodSet).sort();
  }, [characters]);

  // Filtered characters (Library tab)
  const { filtered: filteredCharacters } = useCharacterFilteringV2(
    characters,
    searchQuery,
    filterMood,
    filterCompleteness,
    filterUsage,
    sortBy,
    getCharacterStats,
    usageMap
  );

  // Simple filter (Management tab)
  const filteredManagementCharacters = useMemo(() => {
    if (!searchQueryManagement.trim()) return characters;
    const query = searchQueryManagement.toLowerCase();
    return characters.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
    );
  }, [characters, searchQueryManagement]);

  // ===== EFFECTS =====

  // Auto-open editor if initialCharacterId provided
  useEffect(() => {
    console.log('[CharactersModalV2] useEffect triggered:', { isOpen, initialCharacterId });
    if (isOpen && initialCharacterId) {
      const char = characters.find((c) => c.id === initialCharacterId);
      console.log('[CharactersModalV2] Found character:', char);
      if (char) {
        console.log('[CharactersModalV2] Opening editor for:', char.name);
        setEditingCharacter(char);
      } else {
        console.warn('[CharactersModalV2] Character not found with id:', initialCharacterId);
      }
    }
  }, [isOpen, initialCharacterId, characters]);

  // Reset state on modal close
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchQueryManagement('');
      setFilterMood('all');
      setFilterCompleteness('all');
      setFilterUsage('all');
      setPreviewCharacter(null);
      setEditingCharacter(null);
      setCharToDelete(null);
      selection.clearSelection();
      setActiveTab('library');
    }
  }, [isOpen, selection]);

  // Clear preview when switching tabs
  useEffect(() => {
    setPreviewCharacter(null);
  }, [activeTab]);

  // ===== HANDLERS =====

  const handleCreateCharacter = useCallback(() => {
    // addCharacter() creates a new character with defaults and returns its ID
    const newId = addCharacter();
    // Find the newly created character and open editor
    // We use setTimeout to ensure the state has updated
    setTimeout(() => {
      const newChar = useCharactersStore.getState().characters.find((c) => c.id === newId);
      if (newChar) {
        setEditingCharacter(newChar);
      }
    }, 0);
  }, [addCharacter]);

  const handleDuplicateCharacter = useCallback(
    (id: string) => {
      const original = characters.find((c) => c.id === id);
      if (!original) return;

      // Create a new character first
      const newId = addCharacter();
      // Then update it with the original's data (except ID)
      const updateCharacter = useCharactersStore.getState().updateCharacter;
      updateCharacter({
        id: newId,
        name: `${original.name} (copie)`,
        description: original.description,
        sprites: { ...original.sprites },
        moods: [...(original.moods || [])],
      });
    },
    [characters, addCharacter]
  );

  const handleCharacterClick = useCallback(
    (char: Character) => {
      // Toggle preview: if same character, close; otherwise open new
      if (previewCharacter?.id === char.id) {
        setPreviewCharacter(null);
      } else {
        setPreviewCharacter(char);
      }
    },
    [previewCharacter]
  );

  const handleEditFromPreview = useCallback((char: Character) => {
    setPreviewCharacter(null);
    setEditingCharacter(char);
  }, []);

  const handleDeleteCharacter = useCallback((char: Character) => {
    setCharToDelete(char);
    setPreviewCharacter(null);
  }, []);

  const confirmDelete = useCallback(() => {
    if (charToDelete) {
      deleteCharacter(charToDelete.id);
      setCharToDelete(null);
    }
  }, [charToDelete, deleteCharacter]);

  const handleEditorClose = useCallback(() => {
    setEditingCharacter(null);
  }, []);

  const handleEditorSave = useCallback((character: Character) => {
    // Save to store
    updateCharacter(character);
    // Close editor
    setEditingCharacter(null);
  }, [updateCharacter]);

  // Get validation errors for display
  const validationErrors = useMemo(() => {
    const errors: Record<string, Array<{ field: string; message: string; severity: 'error' | 'warning' }>> = {};

    // Transform validation.errors.characters into the expected format
    const charErrors = validation.errors?.characters || {};
    Object.entries(charErrors).forEach(([charId, charErrorList]) => {
      if (Array.isArray(charErrorList)) {
        errors[charId] = charErrorList.map((err) => ({
          field: err.field || 'unknown',
          message: err.message || 'Erreur inconnue',
          severity: (err.severity as 'error' | 'warning') || 'error',
        }));
      }
    });

    return errors;
  }, [validation.errors]);

  // Get usage info for character in delete confirmation
  const charToDeleteUsage = charToDelete ? usageMap.get(charToDelete.id) : undefined;

  // ===== RENDER =====
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
        <DialogContent className="max-w-[1200px] h-[75vh] max-h-[800px] p-0 gap-0 flex flex-col !bg-slate-900 border-slate-700/50 shadow-2xl">
          {/* HEADER - Compact style matching AssetsLibraryModal */}
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b border-slate-700/50 bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-base">
                    Gestion des personnages
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    {characters.length} personnage{characters.length > 1 ? 's' : ''} • {totalStats.complete} complet{totalStats.complete > 1 ? 's' : ''}
                  </DialogDescription>
                </div>
              </div>
              <Button onClick={handleCreateCharacter} size="sm" className="gap-1.5 h-8 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Nouveau personnage
              </Button>
            </div>
          </DialogHeader>

          {/* TAB-BASED CONTENT */}
          {/* CRITICAL: flex-1 flex min-h-0 */}
          <div className="flex-1 flex min-h-0">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as 'library' | 'management')}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Tabs Navigation - Compact style */}
              <TabsList className="mx-4 mt-2 self-start shrink-0">
                <TabsTrigger value="library" className="text-xs gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Bibliothèque
                </TabsTrigger>
                <TabsTrigger value="management" className="text-xs gap-1.5">
                  <Settings className="h-3.5 w-3.5" />
                  Sélection multiple
                </TabsTrigger>
              </TabsList>

              {/* Library Tab Content */}
              {/* CRITICAL: flex-1 mt-0 flex min-h-0 */}
              <TabsContent value="library" className="flex-1 mt-0 flex min-h-0">
                <div className="flex-1 flex flex-col min-h-0">
                  <LibraryTab
                    characters={characters}
                    filteredCharacters={filteredCharacters}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    filterCompleteness={filterCompleteness}
                    onFilterCompletenessChange={setFilterCompleteness}
                    filterUsage={filterUsage}
                    onFilterUsageChange={setFilterUsage}
                    filterMood={filterMood}
                    onFilterMoodChange={setFilterMood}
                    availableMoods={availableMoods}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    getCharacterStats={getCharacterStats}
                    usageMap={usageMap}
                    isFavorite={isFavorite}
                    onToggleFavorite={toggleFavorite}
                    onCharacterClick={handleCharacterClick}
                    onDuplicate={handleDuplicateCharacter}
                    onDelete={handleDeleteCharacter}
                    onCreateCharacter={handleCreateCharacter}
                    validationErrors={validationErrors}
                  />
                </div>

                {/* Preview Panel (Library Tab only) */}
                {previewCharacter && (
                  <div className="animate-slide-in-right">
                    <CharacterPreviewPanel
                      character={previewCharacter}
                      stats={getCharacterStats(previewCharacter)}
                      errors={validationErrors[previewCharacter.id]}
                      usageInfo={usageMap.get(previewCharacter.id)}
                      onEdit={handleEditFromPreview}
                      onDuplicate={handleDuplicateCharacter}
                      onDelete={handleDeleteCharacter}
                      onClose={() => setPreviewCharacter(null)}
                    />
                  </div>
                )}
              </TabsContent>

              {/* Management Tab Content */}
              {/* CRITICAL: flex-1 mt-0 flex min-h-0 */}
              <TabsContent value="management" className="flex-1 mt-0 flex min-h-0">
                <ManagementTab
                  characters={characters}
                  filteredCharacters={filteredManagementCharacters}
                  searchQuery={searchQueryManagement}
                  onSearchChange={setSearchQueryManagement}
                  getCharacterStats={getCharacterStats}
                  usageMap={usageMap}
                  selection={selection}
                  onDuplicate={handleDuplicateCharacter}
                  onDelete={(id) => deleteCharacter(id)}
                />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* NESTED MODALS */}

      {/* Character Editor Modal */}
      {editingCharacter && (
        <CharacterEditorModal
          isOpen={!!editingCharacter}
          onClose={handleEditorClose}
          character={editingCharacter}
          characters={characters}
          onSave={handleEditorSave}
        />
      )}

      {/* Delete Confirmation Modal */}
      {charToDelete && (
        <ConfirmModal
          isOpen={!!charToDelete}
          onCancel={() => setCharToDelete(null)}
          onConfirm={confirmDelete}
          title="Supprimer le personnage"
          message={
            charToDeleteUsage && charToDeleteUsage.sceneCount > 0
              ? `"${charToDelete.name}" est utilisé dans ${charToDeleteUsage.sceneCount} scène(s). Êtes-vous sûr de vouloir le supprimer ?`
              : `Êtes-vous sûr de vouloir supprimer "${charToDelete.name}" ?`
          }
          confirmText="Supprimer"
          variant="danger"
        />
      )}
    </>
  );
}

export default CharactersModalV2;
