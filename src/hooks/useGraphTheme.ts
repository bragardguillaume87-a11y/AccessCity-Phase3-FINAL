/**
 * useGraphTheme - Hook to access the active graph theme
 *
 * Returns the current theme object based on the theme ID stored in uiStore.
 * Falls back to default theme if the selected theme doesn't exist.
 */
import { useUIStore } from '@/stores';
import { GRAPH_THEMES, DEFAULT_THEME_ID } from '@/config/graphThemes';
import type { GraphTheme } from '@/config/graphThemes/types';
import { COSMOS_THEME_ID } from '@/config/layoutConfig';

/**
 * Hook to get the currently active graph theme
 *
 * @returns The active GraphTheme object
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const theme = useGraphTheme();
 *
 *   return (
 *     <div style={{
 *       backgroundColor: theme.nodes.dialogue.bg,
 *       borderRadius: theme.sizes.nodeBorderRadius
 *     }}>
 *       ...
 *     </div>
 *   );
 * }
 * ```
 */
export function useGraphTheme(): GraphTheme {
  const themeId = useUIStore((state) => state.graphThemeId);

  return GRAPH_THEMES[themeId] || GRAPH_THEMES[DEFAULT_THEME_ID];
}

/**
 * Hook to get just the theme ID and setter
 * Useful when you only need to change the theme
 *
 * @returns Object with themeId and setThemeId
 */
export function useGraphThemeId(): {
  themeId: string;
  setThemeId: (id: string) => void;
} {
  const themeId = useUIStore((state) => state.graphThemeId);
  const setThemeId = useUIStore((state) => state.setGraphThemeId);

  return { themeId, setThemeId };
}

/**
 * Check if the current theme is the cosmos theme
 * Useful for conditionally rendering cosmos-specific components
 */
export function useIsCosmosTheme(): boolean {
  const themeId = useUIStore((state) => state.graphThemeId);
  return themeId === COSMOS_THEME_ID;
}
