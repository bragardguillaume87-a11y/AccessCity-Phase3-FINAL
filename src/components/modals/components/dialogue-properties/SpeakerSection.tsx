import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Character } from '@/types';
import { getSpeakerEmoji } from './useDialogueTheme';

interface SpeakerSectionProps {
  speaker: string;
  characters: Character[];
  isCosmosTheme: boolean;
  textColor: string;
  onChange: (speaker: string) => void;
}

export function SpeakerSection({ speaker, characters, isCosmosTheme, textColor, onChange }: SpeakerSectionProps) {
  const filteredCharacters = characters.filter((character) => {
    const idLower = character.id.toLowerCase();
    const nameLower = character.name.toLowerCase();
    return (
      idLower !== 'narrator' && idLower !== 'player' &&
      nameLower !== 'narrateur' && nameLower !== 'joueur' &&
      nameLower !== 'narrator' && nameLower !== 'player'
    );
  });

  return (
    <div className="space-y-3">
      <label
        htmlFor="speaker-select"
        className="flex items-center gap-2 text-sm font-bold"
        style={{ color: textColor }}
      >
        <span className="text-xl">{isCosmosTheme ? '👨‍🚀' : '🎭'}</span>
        {isCosmosTheme ? 'Qui parle ?' : 'Personnage'}
      </label>
      <div
        className="p-3 rounded-xl"
        style={{
          background: isCosmosTheme ? 'rgba(59, 130, 246, 0.2)' : 'var(--color-bg-base)',
          border: `2px solid ${isCosmosTheme ? '#3b82f6' : 'var(--color-border-base)'}`,
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{getSpeakerEmoji(speaker)}</span>
          <span className="font-bold" style={{ color: textColor }}>
            {speaker === 'player'
              ? 'Joueur'
              : speaker === 'Narrator'
                ? 'Narrateur'
                : characters.find(c => c.id === speaker)?.name || speaker}
          </span>
        </div>
        <Select value={speaker} onValueChange={onChange}>
          <SelectTrigger
            id="speaker-select"
            className="w-full"
            style={{
              background: isCosmosTheme ? 'rgba(0,0,0,0.3)' : undefined,
              borderColor: isCosmosTheme ? '#3b82f6' : undefined,
              color: textColor,
            }}
          >
            <SelectValue placeholder="Choisir..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Narrator">
              <span className="flex items-center gap-2"><span>📖</span> Narrateur</span>
            </SelectItem>
            <SelectItem value="player">
              <span className="flex items-center gap-2"><span>🎮</span> Joueur</span>
            </SelectItem>
            {filteredCharacters.map((character) => (
              <SelectItem key={character.id} value={character.id}>
                <span className="flex items-center gap-2"><span>👤</span> {character.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
