/**
 * Character Editor Modal Components
 *
 * Extracted components from CharacterEditorModal for better maintainability
 * and code organization.
 */

export { default as CompletenessHeader } from './CompletenessHeader';
export { default as EditorFooter } from './EditorFooter';
export { default as CharacterIdentitySection } from './CharacterIdentitySection';
export { default as MoodManagementSection } from './MoodManagementSection';
export { default as CharacterPreviewPanel } from './CharacterPreviewPanel';

// Export types
export type { CompletenessHeaderProps } from './CompletenessHeader';
export type { EditorFooterProps } from './EditorFooter';
export type { CharacterIdentitySectionProps, CharacterIdentityFormData, CharacterIdentityErrors } from './CharacterIdentitySection';
export type { MoodManagementSectionProps, MoodManagementFormData, MoodManagementErrors, MoodManagementWarnings } from './MoodManagementSection';
export type { CharacterPreviewPanelProps, CharacterPreviewFormData } from './CharacterPreviewPanel';
