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

interface CharacterPosition {
  x: number;
  y: number;
}

export interface AddCharacterToSceneModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  onAddCharacter: (characterId: string, mood: string, position: Position | null) => void;
}
export default function AddCharacterToSceneModal({
  isOpen,
  onClose,
  characters,
  onAddCharacter
}: AddCharacterToSceneModalProps) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [mood, setMood] = useState<string>('neutral');
  const [position, setPosition] = useState<CharacterPosition | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const filteredCharacters = useMemo(() => {
    let filtered = characters;
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (activeTab === 'favorites') {
      // Note: favorite field planned for future phase
      filtered = filtered.filter(c => ('favorite' in c && c.favorite));
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
    setSelectedCharacterId(null);
    setMood('neutral');
    setPosition(null);
    setSearchTerm('');
    setActiveTab('all');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && selectedCharacterId) {
      handleAdd();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={false}>
      <DialogContent className="max-w-5xl max-h-[90vh]" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>Ajouter un personnage à la scène</DialogTitle>

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

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'favorites')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">Tous ({characters.length})</TabsTrigger>
            <TabsTrigger value="favorites">
              Favoris ({characters.filter(c => ('favorite' in c && c.favorite)).length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-6 min-h-[500px]">
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
                <div className="bg-gradient-to-br from-card to-background rounded-xl p-8 flex items-center justify-center min-h-[256px]">
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
                        const dragEvent = e as unknown as React.DragEvent<HTMLImageElement>;
                        setIsDragging(true);
                        dragEvent.dataTransfer.effectAllowed = 'copy';
                        dragEvent.dataTransfer.setData('text/x-drag-type', 'character');
                        dragEvent.dataTransfer.setData('application/json', JSON.stringify({
                          characterId: selectedCharacterId,
                          mood: mood,
                          type: 'character'
                        }));
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

                <h2 className="text-2xl font-bold text-center">
                  {selectedCharacter.name.toUpperCase()}
                </h2>

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
                          <TooltipContent portal={false}>
                            <p>Cliquer pour sélectionner &quot;{moodOption}&quot;</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Position personnalisée</label>
                    <button
                      type="button"
                      onClick={() => setPosition(position ? null : { x: 50, y: 50 })}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        position
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
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
                    <div className="text-sm text-muted-foreground bg-card/50 rounded-lg p-3 border border-border">
                      🎯 Position automatique intelligente activée<br/>
                      <span className="text-xs text-muted-foreground/70">
                        Le personnage sera placé automatiquement selon son type (player à gauche, autres au centre/droite)
                      </span>
                    </div>
                  )}
                </div>

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

function calculateCompleteness(character: Character): number {
  if (!character.moods || character.moods.length === 0) return 0;
  const totalMoods = character.moods.length;
  const moodsWithSprites = character.moods.filter(
    mood => character.sprites?.[mood]
  ).length;
  return Math.round((moodsWithSprites / totalMoods) * 100);
}
