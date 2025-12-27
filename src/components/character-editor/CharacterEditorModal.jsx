import React, { useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useCharacterForm } from '../../hooks/useCharacterForm.js';
import { useMoodPresets } from '../../hooks/useMoodPresets.js';
import { AvatarPicker } from '../tabs/characters/components/AvatarPicker.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  User,
  AlertCircle,
  Save,
  Plus,
  X,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Image as ImageIcon,
  Smile,
  Package
} from 'lucide-react';

/**
 * CharacterEditorModal - AAA Split-View Character Editor
 * Inspired by Unreal Engine Character Editor and Unity Animation Preview
 *
 * Features:
 * - Split-view layout (Form 45% | Preview 55%)
 * - Live character preview with mood carousel
 * - Inline sprite assignment with popover (no modal-in-modal)
 * - Completeness progress indicator
 * - Smooth animations and transitions
 * - Keyboard shortcuts (Ctrl+S to save)
 */
export default function CharacterEditorModal({ isOpen, onClose, character, characters, onSave }) {
  const {
    formData,
    errors,
    warnings,
    hasChanges,
    updateField,
    addMood,
    removeMood,
    updateSprite,
    renameMood,
    handleSave,
    resetForm
  } = useCharacterForm(character, characters, onSave);

  const moodPresets = useMoodPresets();

  // Local state for split-view features
  const [previewMood, setPreviewMood] = useState('neutral');
  const [showSpritePickerFor, setShowSpritePickerFor] = useState(null);
  const [newMoodInput, setNewMoodInput] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const [renamingMood, setRenamingMood] = useState(null);
  const [renameInput, setRenameInput] = useState('');

  // Set preview mood to first available mood when moods change
  useEffect(() => {
    if (formData.moods.length > 0 && !formData.moods.includes(previewMood)) {
      setPreviewMood(formData.moods[0]);
    }
  }, [formData.moods, previewMood]);

  // Calculate character completeness
  const completeness = useMemo(() => {
    const moodCount = formData.moods.length;
    const spriteCount = Object.values(formData.sprites || {}).filter(s => s).length;
    const percentage = moodCount > 0 ? Math.round((spriteCount / moodCount) * 100) : 0;
    return { moodCount, spriteCount, percentage };
  }, [formData.moods, formData.sprites]);

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        const success = handleSave();
        if (success) {
          onClose();
        }
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleSave, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = handleSave();
    if (success) {
      onClose();
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment annuler ?');
      if (!confirmed) return;
    }
    resetForm();
    onClose();
  };

  const handleAddCustomMood = () => {
    if (newMoodInput.trim()) {
      const success = addMood(newMoodInput.trim());
      if (success) {
        setNewMoodInput('');
      }
    }
  };

  const handleAddPresetMood = (presetId) => {
    addMood(presetId);
    setShowPresets(false);
  };

  const handleStartRename = (mood) => {
    setRenamingMood(mood);
    setRenameInput(mood);
  };

  const handleConfirmRename = () => {
    if (renameInput.trim() && renameInput !== renamingMood) {
      const success = renameMood(renamingMood, renameInput.trim());
      if (success) {
        setRenamingMood(null);
        setRenameInput('');
      }
    } else {
      setRenamingMood(null);
    }
  };

  const handleCancelRename = () => {
    setRenamingMood(null);
    setRenameInput('');
  };

  const handleSpriteSelect = (mood, spritePath) => {
    updateSprite(mood, spritePath);
    setShowSpritePickerFor(null);
  };

  const navigateMood = (direction) => {
    const currentIndex = formData.moods.indexOf(previewMood);
    if (direction === 'prev') {
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : formData.moods.length - 1;
      setPreviewMood(formData.moods[prevIndex]);
    } else {
      const nextIndex = currentIndex < formData.moods.length - 1 ? currentIndex + 1 : 0;
      setPreviewMood(formData.moods[nextIndex]);
    }
  };

  const hasFormErrors = Object.keys(errors).filter(k => k !== 'sprites').length > 0;
  const currentPreviewSprite = formData.sprites?.[previewMood];

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 gap-0 dark bg-slate-900 text-slate-100">
        {/* Header */}
        <DialogHeader className="px-8 pt-8 pb-6 border-b bg-gradient-to-b from-background to-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-3 text-3xl font-bold mb-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <User className="h-7 w-7" />
                </div>
                {character.id ? `Éditer: ${character.name}` : 'Nouveau personnage'}
              </DialogTitle>
              <DialogDescription className="text-base">
                Configurez votre personnage avec une interface professionnelle
              </DialogDescription>
            </div>

            {/* Completeness Badge */}
            <Badge
              variant={completeness.percentage === 100 ? "default" : "secondary"}
              className="px-4 py-2 text-sm"
            >
              {completeness.percentage === 100 ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Complet
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {completeness.percentage}% Complet
                </>
              )}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Progression</span>
              <span>{completeness.spriteCount} / {completeness.moodCount} sprites assignés</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                style={{ width: `${completeness.percentage}%` }}
              />
            </div>
          </div>
        </DialogHeader>

        {/* Split View Content */}
        <form onSubmit={handleSubmit} className="flex-1 flex overflow-hidden">
          {/* LEFT PANEL - Form (45%) */}
          <div className="w-[45%] border-r flex flex-col">
            <ScrollArea className="flex-1 px-8 py-6">
              <div className="space-y-8">
                {/* Identity Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    <h3 className="text-lg font-semibold">Identité</h3>
                  </div>

                  {/* Name field */}
                  <div className="space-y-2">
                    <Label htmlFor="character-name" className="text-sm font-medium">
                      Nom du personnage <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="character-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Ex: Alice, Bob, Charlie..."
                      className={errors.name ? 'border-destructive' : ''}
                      autoFocus
                    />
                    {errors.name && (
                      <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{errors.name[0]}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Description field */}
                  <div className="space-y-2">
                    <Label htmlFor="character-description" className="text-sm font-medium">
                      Description
                    </Label>
                    <Textarea
                      id="character-description"
                      value={formData.description || ''}
                      onChange={(e) => updateField('description', e.target.value)}
                      rows={4}
                      placeholder="Décrivez votre personnage..."
                      className={errors.description ? 'border-destructive' : ''}
                    />
                    <div className="flex justify-between items-center">
                      {errors.description && (
                        <Alert variant="destructive" className="py-2 flex-1 mr-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{errors.description[0]}</AlertDescription>
                        </Alert>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {(formData.description || '').length} / 500
                      </span>
                    </div>
                  </div>

                  {/* Character ID (read-only) */}
                  {character.id && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">ID Personnage</Label>
                      <div className="px-3 py-2 bg-muted/50 border rounded-lg text-sm font-mono text-muted-foreground">
                        {character.id}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Moods Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      <h3 className="text-lg font-semibold">Humeurs & Sprites</h3>
                    </div>
                    <Badge variant="outline">
                      {formData.moods.length} humeur{formData.moods.length > 1 ? 's' : ''}
                    </Badge>
                  </div>

                  {/* Info card */}
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 flex items-start gap-3">
                      <Smile className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Astuce:</strong> Définissez les expressions émotionnelles
                        de votre personnage, puis assignez un sprite à chaque humeur.
                      </div>
                    </CardContent>
                  </Card>

                  {/* Add mood section */}
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={newMoodInput}
                        onChange={(e) => setNewMoodInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustomMood()}
                        placeholder="Nom de l'humeur (ex: joyeux, triste...)"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleAddCustomMood}
                        disabled={!newMoodInput.trim()}
                        size="default"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                      <Popover open={showPresets} onOpenChange={setShowPresets}>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" size="default">
                            <Package className="h-4 w-4 mr-2" />
                            Presets
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="end">
                          <div className="p-4">
                            <h4 className="font-semibold mb-3">Humeurs prédéfinies</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {moodPresets.map(preset => (
                                <Button
                                  key={preset.id}
                                  type="button"
                                  variant={formData.moods.includes(preset.id) ? "secondary" : "outline"}
                                  onClick={() => handleAddPresetMood(preset.id)}
                                  disabled={formData.moods.includes(preset.id)}
                                  className="justify-start h-auto py-2"
                                  title={preset.description}
                                >
                                  <span className="text-lg mr-2">{preset.emoji}</span>
                                  <span className="text-sm">{preset.label}</span>
                                </Button>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {errors.moods && (
                      <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{errors.moods[0]}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Moods list */}
                  {formData.moods.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="p-8 text-center">
                        <Smile className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-muted-foreground font-medium">Aucune humeur définie</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Ajoutez votre première humeur ci-dessus
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {formData.moods.map((mood) => {
                        const hasSprite = formData.sprites && formData.sprites[mood];
                        const isRenaming = renamingMood === mood;

                        return (
                          <Card
                            key={mood}
                            className={`group transition-all ${
                              hasSprite ? 'border-green-500/50 bg-green-500/5' : 'border-amber-500/50 bg-amber-500/5'
                            }`}
                          >
                            <CardContent className="p-4">
                              {isRenaming ? (
                                // Rename mode
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="text"
                                    value={renameInput}
                                    onChange={(e) => setRenameInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleConfirmRename();
                                      if (e.key === 'Escape') handleCancelRename();
                                    }}
                                    autoFocus
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleConfirmRename}
                                    variant="default"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleCancelRename}
                                    variant="outline"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                // Normal display
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 flex-1">
                                    <div
                                      onClick={() => handleStartRename(mood)}
                                      className="font-semibold cursor-pointer hover:text-primary transition-colors flex items-center gap-2"
                                      title="Cliquer pour renommer"
                                    >
                                      {mood}
                                      <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                                    </div>
                                    <Badge variant={hasSprite ? "default" : "secondary"} className="text-xs">
                                      {hasSprite ? (
                                        <>
                                          <Check className="h-3 w-3 mr-1" />
                                          Sprite
                                        </>
                                      ) : (
                                        <>
                                          <AlertCircle className="h-3 w-3 mr-1" />
                                          Pas de sprite
                                        </>
                                      )}
                                    </Badge>
                                  </div>

                                  <div className="flex gap-2">
                                    {/* Sprite Picker Popover */}
                                    <Popover
                                      open={showSpritePickerFor === mood}
                                      onOpenChange={(open) => setShowSpritePickerFor(open ? mood : null)}
                                    >
                                      <PopoverTrigger asChild>
                                        <Button type="button" size="sm" variant="outline">
                                          <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                                          {hasSprite ? 'Changer' : 'Assigner'}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-[600px] p-0" align="end" side="left">
                                        <div className="max-h-[400px] overflow-y-auto p-4">
                                          <h4 className="font-semibold mb-3">
                                            Sélectionner un sprite pour: <span className="text-primary">{mood}</span>
                                          </h4>
                                          <AvatarPicker
                                            currentSprites={formData.sprites || {}}
                                            onSelect={(m, path) => handleSpriteSelect(m, path)}
                                            mood={mood}
                                            labels={{}}
                                          />
                                        </div>
                                      </PopoverContent>
                                    </Popover>

                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => removeMood(mood)}
                                      disabled={formData.moods.length === 1}
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                      title={formData.moods.length === 1 ? "Impossible de supprimer la dernière humeur" : "Supprimer"}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {/* Warning for missing sprites */}
                  {warnings?.sprites && (
                    <Alert variant="default" className="bg-amber-500/10 border-amber-500/50">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <AlertDescription className="text-amber-700">
                        {warnings.sprites[0]}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* RIGHT PANEL - Preview (55%) */}
          <div className="flex-1 flex flex-col bg-muted/20">
            <div className="flex-1 flex items-center justify-center p-8">
              <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Aperçu en direct
                  </CardTitle>
                  <CardDescription>
                    Visualisez votre personnage avec chaque humeur
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Character Preview */}
                  <div className="relative aspect-square bg-gradient-to-br from-muted/50 to-muted rounded-xl flex items-center justify-center overflow-hidden">
                    {currentPreviewSprite ? (
                      <img
                        src={currentPreviewSprite}
                        alt={`${formData.name} - ${previewMood}`}
                        className="max-w-full max-h-full object-contain p-8 transition-all duration-300"
                      />
                    ) : (
                      <div className="text-center p-8">
                        <User className="h-24 w-24 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground font-medium">Pas de sprite</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Assignez un sprite à cette humeur
                        </p>
                      </div>
                    )}

                    {/* Current mood indicator */}
                    <div className="absolute top-4 left-4 right-4">
                      <Badge variant="secondary" className="w-full justify-center py-2 text-sm backdrop-blur-sm">
                        Humeur: <strong className="ml-1">{previewMood}</strong>
                      </Badge>
                    </div>
                  </div>

                  {/* Mood Carousel Navigation */}
                  {formData.moods.length > 1 && (
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => navigateMood('prev')}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>

                      <div className="flex-1 flex gap-2 overflow-x-auto">
                        {formData.moods.map((mood) => (
                          <Button
                            key={mood}
                            type="button"
                            variant={previewMood === mood ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPreviewMood(mood)}
                            className="whitespace-nowrap flex-shrink-0"
                          >
                            {mood}
                            {formData.sprites?.[mood] && (
                              <Check className="h-3 w-3 ml-1.5" />
                            )}
                          </Button>
                        ))}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => navigateMood('next')}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <Card>
                      <CardContent className="pt-4 pb-3 text-center">
                        <div className="text-2xl font-bold text-primary">{formData.moods.length}</div>
                        <div className="text-xs text-muted-foreground mt-1">Humeurs</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-3 text-center">
                        <div className="text-2xl font-bold text-green-500">{completeness.spriteCount}</div>
                        <div className="text-xs text-muted-foreground mt-1">Sprites</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-3 text-center">
                        <div className="text-2xl font-bold text-amber-500">
                          {completeness.moodCount - completeness.spriteCount}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Manquants</div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>

        {/* Footer */}
        <DialogFooter className="px-8 py-4 border-t">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                  <AlertCircle className="h-3 w-3 mr-1.5" />
                  Modifications non sauvegardées
                </Badge>
              )}
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Annuler
              </Button>
              <Button type="submit" onClick={handleSubmit} disabled={hasFormErrors}>
                <Save className="mr-2 h-4 w-4" />
                {character.id ? 'Sauvegarder' : 'Créer personnage'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

CharacterEditorModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  character: PropTypes.object.isRequired,
  characters: PropTypes.array.isRequired,
  onSave: PropTypes.func.isRequired
};
