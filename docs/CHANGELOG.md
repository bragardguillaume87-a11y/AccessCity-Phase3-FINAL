# Changelog
## [Unreleased]
### Added
- **Real browser coverage instrumentation** with `vite-plugin-istanbul@7.2.1` (replaces placeholder).
- **5 E2E tests** for Vite/React app validating engine, HUD, reset, event log, and coverage collection (`e2e/vite-app.spec.ts`).
- **Coverage reports generation** script (`tools/generate_reports.cjs`) producing lcov.info + HTML from merged coverage.
- **Complete coverage workflow**: Node tests → E2E tests → merge → reports (documented in COVERAGE_ROADMAP.md).
- **npm scripts**: `coverage:reports`, `e2e:vite`, `build:vite:coverage` for instrumented builds.
- **Playwright config for Vite** (`playwright.config.vite.ts`) with auto-start preview server.
- **React migration**: `src/App.jsx`, `useDialogueEngine` hook, `DialogueArea`, `VariablesHUD`, `EventLogPanel` components.
- Browser coverage hook (`e2e/coverage-hook.ts`) collecting `window.__coverage__` when instrumentation is present.
- Coverage merge script (`tools/merge_coverage.cjs`) and npm script `coverage:merge` producing unified lcov + HTML.
- Scripts section in root `README.md` documenting coverage workflow.
- Placeholder instrumentation in `index-react.html` via `?covPlaceholder=1` (demo only).
- Comprehensive coverage roadmap (`docs/COVERAGE_ROADMAP.md`) explaining migration path to Vite + real instrumentation.
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
