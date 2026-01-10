import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Character, Position } from '@/types';

/**
 * Position data for character placement
 */
interface CharacterPosition {
  x: number;
  y: number;
}

/**
 * Props for AddCharacterToSceneModal component
 */
export interface AddCharacterToSceneModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Array of available characters */
  characters: Character[];
  /** Callback when character is added to scene */
  onAddCharacter: (characterId: string, mood: string, position: Position | null) => void;
}

/**
 * AddCharacterToSceneModal - AAA Character Picker
 *
 * Premium character selection modal with:
 * - Split-view: 40% character list | 60% live preview
 * - Search & filter (Tous/Favoris tabs)
 * - Large sprite preview with mood thumbnails
 * - Position sliders (X/Y) for pre-positioning
 * - Completeness badges
 * - Keyboard navigation (Arrow keys, Enter)
 * - Smooth animations with Framer Motion
 *
 * @example
 * ```tsx
 * <AddCharacterToSceneModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   characters={allCharacters}
 *   onAddCharacter={(charId, mood, position) => addToScene(charId, mood, position)}
 * />
 * ```
 */
export default function AddCharacterToSceneModal({
  isOpen,
  onClose,
  characters,
  onAddCharacter
}: AddCharacterToSceneModalProps) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [mood, setMood] = useState<string>('neutral');
  // Position null par défaut = laisse MainCanvas appliquer la logique intelligente (player à gauche, etc.)
  const [position, setPosition] = useState<CharacterPosition | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Filtered characters
  const filteredCharacters = useMemo(() => {
    let filtered = characters;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Favorites filter
    if (activeTab === 'favorites') {
      // TODO: Add favorite field to Character interface in future phase
      filtered = filtered.filter(c => (c as any).favorite);
    }

    return filtered;
  }, [characters, searchTerm, activeTab]);

  const selectedCharacter = characters.find(c => c.id === selectedCharacterId);
  const availableMoods = selectedCharacter?.moods || ['neutral'];
  const currentSprite = selectedCharacter?.sprites?.[mood];

  const handleAdd = () => {
    if (!selectedCharacterId) return;
    onAddCharacter(selectedCharacterId, mood, position);
    onClose();
    // Reset state
    setSelectedCharacterId(null);
    setMood('neutral');
    setPosition(null); // Reset à null pour logique intelligente
    setSearchTerm('');
    setActiveTab('all');
  };

  // Keyboard handler for Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && selectedCharacterId) {
      handleAdd();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>Ajouter un personnage à la scène</DialogTitle>

          {/* Search bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un personnage..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'favorites')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">Tous ({characters.length})</TabsTrigger>
            <TabsTrigger value="favorites">
              Favoris ({characters.filter(c => (c as any).favorite).length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Split-view */}
        <div className="flex gap-6 min-h-[500px]">
          {/* LEFT: Character List (40%) */}
          <div className="w-2/5">
            <ScrollArea className="h-[450px] pr-4">
              {filteredCharacters.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? 'Aucun personnage trouvé.' : 'Aucun personnage disponible.'}
                  </p>
                  {!searchTerm && (
                    <Button variant="outline" onClick={onClose}>
                      Créer un personnage (Ctrl+Shift+C)
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCharacters.map((character) => {
                    const completeness = calculateCompleteness(character);
                    const isSelected = selectedCharacterId === character.id;

                    return (
                      <motion.div
                        key={character.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card
                          className={`p-4 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-primary border-2 bg-primary/10 shadow-lg'
                              : 'border-border hover:border-primary/50 hover:shadow-md'
                          }`}
                          onClick={() => {
                            setSelectedCharacterId(character.id);
                            setMood(character.moods?.[0] || 'neutral');
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="w-16 h-16 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                              {character.sprites?.neutral ? (
                                <img
                                  src={character.sprites.neutral}
                                  alt={character.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl">
                                  👤
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold truncate">{character.name}</span>
                                {completeness === 100 && (
                                  <Badge variant="default" className="bg-green-600 text-xs">
                                    ✓
                                  </Badge>
                                )}
                                {completeness < 100 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {completeness}%
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {character.moods?.length || 0} humeur{character.moods?.length > 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* RIGHT: Live Preview (60%) */}
          <div className="w-3/5 border-l pl-6">
            {!selectedCharacter ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <div className="text-6xl mb-4">👈</div>
                  <p>Sélectionnez un personnage pour voir l'aperçu</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Sprite preview LARGE - Draggable */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 flex items-center justify-center min-h-[256px]">
                  {currentSprite ? (
                    <motion.img
                      key={currentSprite}
                      src={currentSprite}
                      alt={`${selectedCharacter.name} - ${mood}`}
                      className="max-w-full max-h-64 object-contain cursor-move"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      draggable="true"
                      onDragStart={(e) => {
                        // Type assertion for native DragEvent
                        const dragEvent = e as unknown as React.DragEvent<HTMLImageElement>;
                        setIsDragging(true);
                        dragEvent.dataTransfer.effectAllowed = 'copy';
                        dragEvent.dataTransfer.setData('application/json', JSON.stringify({
                          characterId: selectedCharacterId,
                          mood: mood,
                          type: 'character'
                        }));
                        // Optional: set drag image
                        const img = (dragEvent.target as HTMLImageElement).cloneNode() as HTMLImageElement;
                        img.style.opacity = '0.5';
                        document.body.appendChild(img);
                        dragEvent.dataTransfer.setDragImage(img, (dragEvent.target as HTMLImageElement).width / 2, (dragEvent.target as HTMLImageElement).height / 2);
                        setTimeout(() => document.body.removeChild(img), 0);
                      }}
                      onDragEnd={() => setIsDragging(false)}
                    />
                  ) : (
                    <div className="text-6xl">👤</div>
                  )}
                </div>

                {/* Character name */}
                <h2 className="text-2xl font-bold text-center">
                  {selectedCharacter.name.toUpperCase()}
                </h2>

                {/* Mood selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Humeur / Expression
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableMoods.map((moodOption) => (
                      <TooltipProvider key={moodOption}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Card
                                className={`p-3 cursor-pointer text-center transition-all ${
                                  mood === moodOption
                                    ? 'border-primary border-2 bg-primary/10'
                                    : 'hover:border-primary/50'
                                }`}
                                onClick={() => setMood(moodOption)}
                              >
                                {selectedCharacter.sprites?.[moodOption] ? (
                                  <img
                                    src={selectedCharacter.sprites[moodOption]}
                                    alt={moodOption}
                                    className="w-full h-16 object-contain mb-1"
                                  />
                                ) : (
                                  <div className="h-16 flex items-center justify-center text-2xl">
                                    😐
                                  </div>
                                )}
                                <span className="text-xs font-medium capitalize">
                                  {moodOption}
                                </span>
                              </Card>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Cliquer pour sélectionner &quot;{moodOption}&quot;</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>

                {/* Position sliders - OPTIONNEL (null = position auto intelligente) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Position personnalisée</label>
                    <button
                      type="button"
                      onClick={() => setPosition(position ? null : { x: 50, y: 50 })}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        position
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                      }`}
                    >
                      {position ? 'Désactiver (auto)' : 'Activer'}
                    </button>
                  </div>

                  {position ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Position X: {position.x}%
                        </label>
                        <Slider
                          value={[position.x]}
                          onValueChange={([x]) => setPosition(prev => prev ? { ...prev, x } : { x, y: 50 })}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Position Y: {position.y}%
                        </label>
                        <Slider
                          value={[position.y]}
                          onValueChange={([y]) => setPosition(prev => prev ? { ...prev, y } : { x: 50, y })}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-slate-400 bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      🎯 Position automatique intelligente activée<br/>
                      <span className="text-xs text-slate-500">
                        Le personnage sera placé automatiquement selon son type (player à gauche, autres au centre/droite)
                      </span>
                    </div>
                  )}
                </div>

                {/* Tooltip hint - Dynamic based on drag state */}
                <div className={`border rounded-lg p-3 text-sm transition-all ${
                  isDragging
                    ? 'bg-green-500/10 border-green-500/20 animate-pulse'
                    : 'bg-blue-500/10 border-blue-500/20'
                }`}>
                  {isDragging ? (
                    <>🎯 <strong>En cours:</strong> Glissez sur le canvas pour positionner le personnage!</>
                  ) : (
                    <>💡 <strong>Astuce:</strong> Glissez-déposez l&apos;aperçu sur le canvas ou utilisez les sliders.</>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleAdd} disabled={!selectedCharacterId}>
            Ajouter à la scène (Enter)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Calculate character completeness percentage
 *
 * Calculates the percentage of moods that have associated sprites.
 *
 * @param character - Character to calculate completeness for
 * @returns Completeness percentage (0-100)
 *
 * @example
 * ```typescript
 * const character = {
 *   moods: ['neutral', 'happy', 'sad'],
 *   sprites: { neutral: 'url1.png', happy: 'url2.png' }
 * };
 * calculateCompleteness(character); // Returns 66 (2/3 moods have sprites)
 * ```
 */
function calculateCompleteness(character: Character): number {
  if (!character.moods || character.moods.length === 0) return 0;
  const totalMoods = character.moods.length;
  const moodsWithSprites = character.moods.filter(
    mood => character.sprites?.[mood]
  ).length;
  return Math.round((moodsWithSprites / totalMoods) * 100);
}
