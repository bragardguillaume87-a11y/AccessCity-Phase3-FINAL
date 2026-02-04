/**
 * Graph Themes Registry
 *
 * Central registry for all available graph themes.
 * Import themes from here to use in components.
 */
import type { GraphTheme } from './types';
import { defaultTheme } from './themes/default';
import { cosmosTheme } from './themes/cosmos';

/**
 * All available graph themes
 */
export const GRAPH_THEMES: Record<string, GraphTheme> = {
  default: defaultTheme,
  cosmos: cosmosTheme,
};

/**
 * Default theme ID used when no theme is selected
 */
export const DEFAULT_THEME_ID = 'default';

/**
 * Get a theme by ID, falls back to default if not found
 */
export function getGraphTheme(themeId: string): GraphTheme {
  return GRAPH_THEMES[themeId] || GRAPH_THEMES[DEFAULT_THEME_ID];
}

/**
 * Get all available theme IDs
 */
export function getAvailableThemeIds(): string[] {
  return Object.keys(GRAPH_THEMES);
}

// Re-export everything for convenience
export { defaultTheme, cosmosTheme };
export type { GraphTheme, NodeColorSet, EdgeStyle } from './types';
