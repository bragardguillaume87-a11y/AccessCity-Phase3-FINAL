# Changelog
## [Unreleased]
### Added
- Browser coverage hook (`e2e/coverage-hook.ts`) collecting `window.__coverage__` when instrumentation is present.
- Coverage merge script (`tools/merge_coverage.js`) and npm script `coverage:merge` producing unified lcov + HTML.
- Scripts section in root `README.md` documenting coverage workflow.
## [5.5.0] - 2025-11-23
### Added
- **VariableManager**: Typed narrative variables (number, boolean, string) with min/max clamping.
- **Character System**: `characters.json` data, `CharacterLoader` with schema validation, and `CharacterPortrait` UI component.
- **ConditionEvaluator**: Logic engine for branching dialogues (operators: >, <, ==, !=, etc.).
- **Narrative UI**: `DialogueArea` component for displaying text and choices.
- **DevTools**: Real-time variable monitoring and editing panel.
- **Inspector**: Character selection dropdown for dialogue speakers.

### Changed
- Updated `ui_layout.json` with "Narrative" preset and new panel configurations.
- Enhanced `main.js` to initialize narrative systems before UI.

## [5.0.0] - 2025-11-22
### Added
- Full JSON data loading with validation and fallback
- UI layout system driven by ui_layout.json
- Complete CRUD editor for scenes and dialogues
- State journal with undo/redo support
- Export/Import project functionality
- Comprehensive test suite

### Enhanced
- Schema validation supports arrays and nested objects
- Improved error handling with fallback to sample data
- ASCII-only enforcement across all modules

## [4.5.0] - 2025-11-20
- Added core modules
- Implemented UI layout system
