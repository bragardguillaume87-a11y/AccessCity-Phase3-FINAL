import { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Users, Plus, Settings } from 'lucide-react';

import { useCharactersStore } from '@/stores/charactersStore';
import { useScenesStore } from '@/stores/scenesStore';

import { useValidation } from '@/hooks/useValidation';
import { logger } from '@/utils/logger';
import { useCharacterStats } from './CharactersModal/hooks/useCharacterStats';
import { useCharacterFiltering, type CompletenessFilter, type UsageFilter, type CharacterSortBy } from './CharactersModal/hooks/useCharacterFiltering';
import { useCharacterUsage } from './CharactersModal/hooks/useCharacterUsage';
import { useCharacterSelection } from './CharactersModal/hooks/useCharacterSelection';
import { useCharacterFavorites } from './CharactersModal/hooks/useCharacterFavorites';

import { CharacterPreviewPanel } from './CharactersModal/components/CharacterPreviewPanel';
import { LibraryTab } from './CharactersModal/components/LibraryTab';
import { ManagementTab } from './CharactersModal/components/ManagementTab';
import type { ViewMode } from './CharactersModal/components/CharacterGallery';

import CharacterEditorModal from '../character-editor/CharacterEditorModal';
import ConfirmModal from '../ConfirmModal';

import type { Character } from '@/types';

export interface CharactersModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCharacterId?: string;
}

export function CharactersModal({
  isOpen,
  onClose,
  initialCharacterId,
}: CharactersModalProps) {
  const characters = useCharactersStore((state) => state.characters);
  const addCharacter = useCharactersStore((state) => state.addCharacter);
  const updateCharacter = useCharactersStore((state) => state.updateCharacter);
  const deleteCharacter = useCharactersStore((state) => state.deleteCharacter);
  const scenes = useScenesStore((state) => state.scenes);

  const [activeTab, setActiveTab] = useState<'library' | 'management'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState('all');
  const [filterCompleteness, setFilterCompleteness] = useState<CompletenessFilter>('all');
  const [filterUsage, setFilterUsage] = useState<UsageFilter>('all');
  const [sortBy, setSortBy] = useState<CharacterSortBy>('name');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const [searchQueryManagement, setSearchQueryManagement] = useState('');
  const [previewCharacter, setPreviewCharacter] = useState<Character | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [charToDelete, setCharToDelete] = useState<Character | null>(null);

  const validation = useValidation();
  const { getCharacterStats, totalStats } = useCharacterStats(characters);
  const usageMap = useCharacterUsage(scenes, characters);
  const { isFavorite, toggleFavorite } = useCharacterFavorites();
  const selection = useCharacterSelection();

  const availableMoods = useMemo(() => {
    const moodSet = new Set<string>();
    characters.forEach((c) => c.moods?.forEach((mood) => moodSet.add(mood)));
    return Array.from(moodSet).sort();
  }, [characters]);

  const { filtered: filteredCharacters } = useCharacterFiltering(
    characters,
    searchQuery,
    filterMood,
    filterCompleteness,
    filterUsage,
    sortBy,
    getCharacterStats,
    usageMap
  );

  const filteredManagementCharacters = useMemo(() => {
    if (!searchQueryManagement.trim()) return characters;
    const query = searchQueryManagement.toLowerCase();
    return characters.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
    );
  }, [characters, searchQueryManagement]);

  useEffect(() => {
    logger.debug('[CharactersModal] useEffect triggered:', { isOpen, initialCharacterId });
    if (isOpen && initialCharacterId) {
      const char = characters.find((c) => c.id === initialCharacterId);
      logger.debug('[CharactersModal] Found character:', char);
      if (char) {
        logger.debug('[CharactersModal] Opening editor for:', char.name);
        setEditingCharacter(char);
      } else {
        logger.warn('[CharactersModal] Character not found with id:', initialCharacterId);
      }
    }
  }, [isOpen, initialCharacterId, characters]);

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

  useEffect(() => {
    setPreviewCharacter(null);
  }, [activeTab]);

  const handleCreateCharacter = useCallback(() => {
    const newId = addCharacter();
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

      const newId = addCharacter();
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
    updateCharacter(character);
    setEditingCharacter(null);
  }, [updateCharacter]);

  const validationErrors = useMemo(() => {
    const errors: Record<string, Array<{ field: string; message: string; severity: 'error' | 'warning' }>> = {};
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

  const charToDeleteUsage = charToDelete ? usageMap.get(charToDelete.id) : undefined;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
        <DialogContent className="max-w-[1200px] h-[75vh] max-h-[800px] p-0 gap-0 flex flex-col !bg-slate-900 border-slate-700/50 shadow-2xl">
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

          <div className="flex-1 flex min-h-0">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as 'library' | 'management')}
              className="flex-1 flex flex-col min-h-0"
            >
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

      {editingCharacter && (
        <CharacterEditorModal
          isOpen={!!editingCharacter}
          onClose={handleEditorClose}
          character={editingCharacter}
          characters={characters}
          onSave={handleEditorSave}
        />
      )}

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

export default CharactersModal;
