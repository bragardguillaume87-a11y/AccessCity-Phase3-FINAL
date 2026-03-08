/**
 * Graph Themes Registry
 *
 * Central registry for all available graph themes.
 * Import themes from here to use in components.
 */
import type { GraphTheme } from './types';
import { defaultTheme } from './themes/default';
import { cosmosTheme } from './themes/cosmos';
import { blenderTheme } from './themes/blender';

/**
 * All available graph themes
 */
export const GRAPH_THEMES: Record<string, GraphTheme> = {
  default: defaultTheme,
  cosmos: cosmosTheme,
  blender: blenderTheme,
};

/**
 * Default theme ID used when no theme is selected
 */
export const DEFAULT_THEME_ID = 'default';

export type { GraphTheme, EdgeStyle } from './types';
