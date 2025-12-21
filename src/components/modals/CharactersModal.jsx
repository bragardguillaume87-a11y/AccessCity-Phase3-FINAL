import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useCharactersStore } from '../../stores/index.js';
import { useValidation } from '../../hooks/useValidation.js';
import ConfirmModal from '../ConfirmModal.jsx';
import CharacterEditorModal from '../character-editor/CharacterEditorModal.jsx';
import { duplicateCharacter } from '../../utils/duplication.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  Plus,
  Edit,
  Copy,
  Trash2,
  Search,
  AlertCircle,
  Sparkles,
  Eye,
  Film
} from 'lucide-react';

/**
 * CharactersModal - AAA Gallery View for Character Management
 * Inspired by Unity Hierarchy, GDevelop Objects, Unreal Asset Browser
 *
 * Features:
 * - Large preview cards with avatar thumbnails
 * - Visual mood indicators
 * - Usage statistics per character
 * - Search and filter capabilities
 * - Smooth animations and micro-interactions
 * - Professional spacing and layout
 */
function CharactersModal({ isOpen, onClose, initialCharacterId }) {
  // Zustand stores (granular selectors)
  const characters = useCharactersStore(state => state.characters);
  const addCharacter = useCharactersStore(state => state.addCharacter);
  const updateCharacter = useCharactersStore(state => state.updateCharacter);
  const deleteCharacter = useCharactersStore(state => state.deleteCharacter);

  const validation = useValidation();
  const [searchQuery, setSearchQuery] = useState('');
  const [charToDelete, setCharToDelete] = useState(null);
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [showCreateAnimation, setShowCreateAnimation] = useState(false);

  // Auto-open character editor if initialCharacterId provided
  useEffect(() => {
    if (isOpen && initialCharacterId) {
      const character = characters.find(c => c.id === initialCharacterId);
      if (character) {
        setEditingCharacter(character);
      }
    }
  }, [isOpen, initialCharacterId, characters]);

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filter and sort characters
  const filteredCharacters = useMemo(() => {
    let filtered = [...characters];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        (c.description || '').toLowerCase().includes(query)
      );
    }

    // Sort alphabetically
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    return filtered;
  }, [characters, searchQuery]);

  // Calculate character stats
  const getCharacterStats = (character) => {
    const moodCount = character.moods?.length || 0;
    const spriteCount = Object.values(character.sprites || {}).filter(s => s).length;
    const completeness = spriteCount > 0 && moodCount > 0 ? 100 : spriteCount > 0 ? 50 : moodCount > 0 ? 25 : 0;

    return { moodCount, spriteCount, completeness };
  };

  const handleCreateCharacter = () => {
    const newChar = {
      name: 'Nouveau Personnage',
      description: '',
      sprites: {},
      moods: ['neutral']
    };

    const newId = addCharacter(newChar);

    // Show creation animation
    setShowCreateAnimation(true);
    setTimeout(() => setShowCreateAnimation(false), 2000);

    // Open editor for new character
    const createdChar = characters.find(c => c.id === newId) || { ...newChar, id: newId };
    setEditingCharacter(createdChar);
  };

  const confirmDelete = () => {
    if (charToDelete) {
      deleteCharacter(charToDelete.id);
      setCharToDelete(null);
    }
  };

  const handleDuplicateCharacter = (characterId) => {
    const charToDuplicate = characters.find(c => c.id === characterId);
    if (!charToDuplicate) return;

    const existingCharacterIds = characters.map(c => c.id);
    const existingCharacterNames = characters.map(c => c.name);

    const duplicatedChar = duplicateCharacter(charToDuplicate, existingCharacterIds, existingCharacterNames);

    addCharacter(duplicatedChar);

    // Show duplication feedback
    setShowCreateAnimation(true);
    setTimeout(() => setShowCreateAnimation(false), 1500);
  };

  // Get total stats
  const totalStats = useMemo(() => {
    return {
      total: characters.length,
      complete: characters.filter(c => getCharacterStats(c).completeness === 100).length,
      withSprites: characters.filter(c => Object.values(c.sprites || {}).some(s => s)).length
    };
  }, [characters]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0 gap-0">
        {/* Header Section */}
        <DialogHeader className="px-8 pt-8 pb-6 border-b bg-gradient-to-b from-background to-muted/20">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <DialogTitle className="flex items-center gap-3 text-3xl font-bold">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Users className="h-7 w-7" />
                </div>
                Personnages
              </DialogTitle>
              <DialogDescription className="text-base">
                Créez et gérez vos personnages avec leurs humeurs et avatars
              </DialogDescription>
            </div>

            <Button
              onClick={handleCreateCharacter}
              size="lg"
              className="gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <Plus className="h-5 w-5" />
              Créer un personnage
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalStats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-500/20 bg-green-50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/10">
                  <Sparkles className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-700">{totalStats.complete}</div>
                  <div className="text-xs text-muted-foreground">Complets</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-500/20 bg-blue-50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500/10">
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-700">{totalStats.withSprites}</div>
                  <div className="text-xs text-muted-foreground">Avec sprites</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogHeader>

        {/* Search Section */}
        <div className="px-8 py-4 border-b bg-muted/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un personnage par nom ou description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>

          {searchQuery && (
            <div className="mt-2 text-sm text-muted-foreground">
              {filteredCharacters.length} résultat{filteredCharacters.length !== 1 ? 's' : ''} trouvé{filteredCharacters.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Characters Grid */}
        <ScrollArea className="flex-1 px-8 py-6">
          {filteredCharacters.length === 0 && !searchQuery && (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Users className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucun personnage</h3>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                  Commencez par créer votre premier personnage pour donner vie à votre scénario
                </p>
                <Button onClick={handleCreateCharacter} size="lg" className="gap-2">
                  <Plus className="h-5 w-5" />
                  Créer mon premier personnage
                </Button>
              </CardContent>
            </Card>
          )}

          {filteredCharacters.length === 0 && searchQuery && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Aucun personnage ne correspond à "{searchQuery}"
                </p>
              </CardContent>
            </Card>
          )}

          {filteredCharacters.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCharacters.map((character) => {
                const stats = getCharacterStats(character);
                const charErrors = validation.errors.characters[character.id];
                const hasErrors = charErrors && charErrors.some(e => e.severity === 'error');

                return (
                  <Card
                    key={character.id}
                    className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
                    onClick={() => setEditingCharacter(character)}
                  >
                    {/* Preview Section */}
                    <div className="relative h-48 bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center overflow-hidden">
                      {/* Avatar Preview */}
                      {character.sprites?.neutral ? (
                        <img
                          src={character.sprites.neutral}
                          alt={character.name}
                          className="h-40 w-40 object-contain transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <div className="p-6 rounded-full bg-primary/10 text-primary">
                          <Users className="h-16 w-16" />
                        </div>
                      )}

                      {/* Completeness Badge */}
                      <div className="absolute top-3 right-3">
                        <Badge
                          variant={stats.completeness === 100 ? "default" : "secondary"}
                          className="shadow-lg"
                        >
                          {stats.completeness === 100 ? (
                            <>
                              <Sparkles className="h-3 w-3 mr-1" />
                              Complet
                            </>
                          ) : (
                            `${stats.completeness}%`
                          )}
                        </Badge>
                      </div>

                      {/* Error Badge */}
                      {charErrors && (
                        <div className="absolute top-3 left-3">
                          <Badge variant={hasErrors ? "destructive" : "outline"} className="shadow-lg">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {hasErrors ? 'Erreur' : 'Attention'}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl truncate" title={character.name}>
                        {character.name}
                      </CardTitle>
                      {character.description && (
                        <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                          {character.description}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Stats Row */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Film className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{stats.moodCount}</span>
                          <span className="text-muted-foreground">mood{stats.moodCount > 1 ? 's' : ''}</span>
                        </div>
                        <Separator orientation="vertical" className="h-4" />
                        <div className="flex items-center gap-1.5">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{stats.spriteCount}</span>
                          <span className="text-muted-foreground">sprite{stats.spriteCount > 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      <Separator />

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCharacter(character);
                          }}
                          variant="default"
                          size="sm"
                          className="flex-1"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1.5" />
                          Éditer
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateCharacter(character.id);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCharToDelete(character);
                          }}
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Creation Animation */}
        {showCreateAnimation && (
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
            <div className="animate-in zoom-in duration-500">
              <div className="p-6 rounded-full bg-primary/20 backdrop-blur-sm">
                <Sparkles className="h-12 w-12 text-primary animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {charToDelete && (
          <ConfirmModal
            isOpen={true}
            title="Supprimer le personnage"
            message={`Êtes-vous sûr de vouloir supprimer "${charToDelete.name}" ? Cette action est irréversible.`}
            confirmText="Supprimer"
            cancelText="Annuler"
            confirmColor="red"
            onConfirm={confirmDelete}
            onCancel={() => setCharToDelete(null)}
          />
        )}

        {/* Character Editor Modal (nested) */}
        {editingCharacter && (
          <CharacterEditorModal
            isOpen={!!editingCharacter}
            onClose={() => setEditingCharacter(null)}
            character={editingCharacter}
            characters={characters}
            onSave={(updated) => {
              updateCharacter(updated);
              setEditingCharacter(null);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

CharactersModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialCharacterId: PropTypes.string
};

export default CharactersModal;
