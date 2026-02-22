import { useIsCosmosTheme } from '@/hooks/useGraphTheme';

export interface DialogueThemeColors {
  panelBg: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
  isCosmosTheme: boolean;
}

export function useDialogueTheme(): DialogueThemeColors {
  const isCosmosTheme = useIsCosmosTheme();
  return {
    panelBg: isCosmosTheme
      ? 'linear-gradient(180deg, #1a0a2e 0%, #0a1a3e 100%)'
      : 'var(--color-bg-elevated)',
    borderColor: isCosmosTheme ? '#a855f7' : 'var(--color-border-base)',
    textColor: isCosmosTheme ? '#e9d5ff' : 'var(--color-text-primary)',
    mutedColor: isCosmosTheme ? '#c4b5fd' : 'var(--color-text-muted)',
    isCosmosTheme,
  };
}

const SPEAKER_EMOJIS: Record<string, string> = {
  'Narrator': '📖',
  'player': '🎮',
  'default': '👤',
};

export function getSpeakerEmoji(speaker: string): string {
  return SPEAKER_EMOJIS[speaker] || SPEAKER_EMOJIS['default'];
}
