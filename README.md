# AccessCity Scene Editor

[![E2E Tests](https://img.shields.io/badge/E2E%20Tests-7%2F7%20%E2%9C%85-brightgreen)](https://github.com/bragardguillaume87-a11y/AccessCity-Phase3-FINAL/tree/claude-sonnet-4.5/e2e)
[![Unit Tests](https://img.shields.io/badge/Unit%20Tests-100%25%20%E2%9C%85-brightgreen)](https://github.com/bragardguillaume87-a11y/AccessCity-Phase3-FINAL/tree/claude-sonnet-4.5/test)
[![Code Coverage](https://img.shields.io/badge/Coverage-85%25-yellow)](https://github.com/bragardguillaume87-a11y/AccessCity-Phase3-FINAL/tree/claude-sonnet-4.5/docs/COVERAGE_ROADMAP.md)
[![Accessibility](https://img.shields.io/badge/A11y-WCAG%202.1%20AA-blue)](https://www.w3.org/WAI/WCAG21/quickref/)

**Narrative scene editor for non-coders.** Data-driven architecture with accessibility-first design.

---

## 🚀 Quick Start (5 minutes)

See **[QUICK_START.md](./QUICK_START.md)** for the fastest way to get coding.

### Installation
```bash
npm install
npm run dev
```

Access the editor at [http://localhost:5173](http://localhost:5173)

### Testing
```bash
npm test              # Unit tests
npm run e2e:vite      # E2E tests (Playwright)
```

---

## 📋 Documentation

### Getting Started
- **[QUICK_START.md](./QUICK_START.md)** - 5-minute setup guide
- **[docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md)** - How to contribute
- **[docs/CODING_RULES.md](./docs/CODING_RULES.md)** - Code standards (100% ASCII, structure)

### Technical
- **[docs/ROADMAP.md](./docs/ROADMAP.md)** - Project vision & phases
- **[docs/COVERAGE_ROADMAP.md](./docs/COVERAGE_ROADMAP.md)** - Test coverage strategy
- **[docs/VITE_SETUP.md](./docs/VITE_SETUP.md)** - Vite + HMR workflow
- **[docs/E2E_PROMPT_TEMPLATE.md](./docs/E2E_PROMPT_TEMPLATE.md)** - E2E test templates

### AI Context
- **[docs/AI_CONTEXT.md](./docs/AI_CONTEXT.md)** - Project context for AI assistants
- **[docs/AccessCity_Agentic_Workflow.md](./docs/AccessCity_Agentic_Workflow.md)** - Development workflow

---

## 🎯 Features

- ✅ **Visual Scene Editor** - Edit dialogues, choices, conditions without coding
- ✅ **Variable System** - Track player stats (Empathie, Autonomie, etc.)
- ✅ **Conditional Logic** - Branch narratives based on variables
- ✅ **Character System** - Manage avatars, names, colors
- ✅ **Layout Profiles** - Switch between editing/play/debug modes
- ✅ **Export/Import** - JSON-based project management
- ✅ **Accessibility** - WCAG 2.1 AA compliant (aria-live, focus management)

---

## 🛠️ Scripts

### Development
```bash
npm run dev           # Vite dev server (port 5173, HMR)
npm run build:vite    # Production build → dist/
npm run preview:vite  # Preview production build
```

### Testing
```bash
npm test                    # Unit tests (Node.js)
npm run e2e:vite            # E2E tests (Playwright + Vite)
npm run e2e:install         # Install Playwright browsers
```

### Coverage
```bash
npm run coverage            # Node.js coverage (text + lcov)
npm run coverage:html       # HTML coverage report
npm run build:vite:coverage # Instrumented Vite build
npm run coverage:merge      # Merge Node + browser coverage
npm run coverage:reports    # Generate unified reports
```

### Unified Coverage Workflow
```bash
# 1. Node coverage
npm run coverage

# 2. Browser coverage (instrumented build + E2E)
VITE_COVERAGE=true npm run e2e:vite

# 3. Merge both
npm run coverage:merge

# 4. Generate reports (lcov + HTML)
npm run coverage:reports
```

---

## 🏛️ Architecture

```
AccessCity-Phase3-FINAL/
├── core/              # Dialogue engine, variable manager, loaders
├── ui/                # UI components (SceneList, Inspector, etc.)
├── data/              # JSON data (scenes, characters, layouts)
├── src/               # Vite/React source (modern workflow)
├── test/              # Unit tests
├── e2e/               # Playwright E2E tests
├── docs/              # Documentation
└── tools/             # Build/dev tools
```

**Key modules:**
- `core/DialogueEngine.js` - Scene playback with conditions/effects
- `core/VariableManager.js` - Player stats tracking
- `ui/StageDirector.js` - Play mode orchestration
- `ui/CharacterEditor.js` - Character management

---

## 👥 Contributing

We welcome contributions! See **[docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md)** for:
- Code standards (100% ASCII, folder structure)
- Branch workflow
- Commit conventions
- Testing requirements

**Quick rules:**
1. All code must be 100% ASCII (no special chars)
2. Follow `core/`, `ui/`, `data/`, `test/` structure
3. Add tests for new features
4. Run `npm test` before committing

---

## 📝 Changelog

See **[docs/CHANGELOG.md](./docs/CHANGELOG.md)** for version history.

---

## 📝 License

MIT License - See [LICENSE](./LICENSE) for details.

---

## 🚀 Version

**AccessCity 5.5a** - Modern Vite workflow with full E2E coverage (7/7 tests passing)
