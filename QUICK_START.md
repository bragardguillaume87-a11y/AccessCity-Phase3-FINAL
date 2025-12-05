# 🚀 AccessCity - Quick Start Guide

**Get coding in 5 minutes.** This guide gets you from zero to running AccessCity locally.

---

## ✅ Prerequisites

- **Node.js** 16+ ([Download](https://nodejs.org/))
- **npm** 8+ (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

---

## 💾 1. Clone & Install (2 min)

```bash
# Clone the repository
git clone https://github.com/bragardguillaume87-a11y/AccessCity-Phase3-FINAL.git
cd AccessCity-Phase3-FINAL

# Install dependencies
npm install
```

---

## 🎯 2. Run Development Server (1 min)

```bash
# Start Vite dev server with Hot Module Replacement (HMR)
npm run dev
```

**Open your browser:** [http://localhost:5173](http://localhost:5173)

You should see the AccessCity Scene Editor interface.

---

## 🧪 3. Run Tests (1 min)

### Unit Tests
```bash
npm test
```

**Expected output:** `11/11 tests passing` (DialogueEngine, VariableManager, etc.)

### E2E Tests (Playwright)
```bash
# Install browsers (first time only)
npm run e2e:install

# Run E2E tests
npm run e2e:vite
```

**Expected output:** `7/7 tests passing` (HUD, badges, dialogue, onboarding, etc.)

---

## 📚 4. Understand the Architecture (1 min)

AccessCity is organized into clear modules:

```
AccessCity-Phase3-FINAL/
├── core/              # 🧠 Dialogue engine (DialogueEngine, VariableManager)
├── ui/                # 🎨 UI components (SceneList, Inspector, StageDirector)
├── data/              # 📄 JSON scenarios (scenes, characters, layouts)
├── src/               # ⚛️ Vite/React source (modern dev workflow)
├── test/              # 🧪 Unit tests
├── e2e/               # 🤖 Playwright E2E tests
└── docs/              # 📝 Documentation
```

### Key Files to Know

| File | Purpose |
|------|----------|
| `core/main.js` | Application entry point (initializes all modules) |
| `core/DialogueEngine.js` | Scene playback engine (handles dialogues, choices, effects) |
| `core/VariableManager.js` | Player stats tracking (Empathie, Autonomie, etc.) |
| `ui/StageDirector.js` | Play mode orchestration (dialogue display, choices) |
| `data/scenes.json` | Scene definitions (dialogues, conditions, choices) |
| `data/characters.json` | Character data (avatars, names, colors) |

---

## ✏️ 5. Make Your First Edit (Optional)

### Edit a Scene Visually

1. In the browser, go to **"Chapitres"** tab
2. Click **"✏️ Edit"** on any scene
3. Modify dialogue text in the **Inspector** panel
4. Click **"Play"** to test your changes immediately

### Edit a Scene via JSON

1. Open `data/scenes.json` in your code editor
2. Find a dialogue and change the `text` field:
   ```json
   {
     "speaker": "Alex",
     "text": "Hello! Welcome to AccessCity!"
   }
   ```
3. Save the file
4. Reload the browser (HMR should auto-update)

---

## 🔧 6. Development Workflow

### Hot Module Replacement (HMR)

Vite watches your files. **Any change to JS/CSS** auto-refreshes the browser instantly.

### Testing Before Commit

```bash
# Always run tests before pushing
npm test              # Unit tests must pass (11/11)
npm run e2e:vite      # E2E tests must pass (7/7)
```

### Code Standards

- **100% ASCII only** (no special characters like é, à, ü)
- Use **single quotes `'`** or **double quotes `"`** (not fancy quotes)
- Follow folder structure: `core/`, `ui/`, `data/`, `test/`
- See [docs/CODING_RULES.md](./docs/CODING_RULES.md) for full standards

---

## 📚 Next Steps

### Learn the System

- **[docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md)** - How to contribute (branch workflow, commits)
- **[docs/CODING_RULES.md](./docs/CODING_RULES.md)** - Detailed code standards
- **[docs/ROADMAP.md](./docs/ROADMAP.md)** - Project vision and phases

### Explore Advanced Features

- **Variable System:** Track player stats and use conditions
- **Character Editor:** Manage avatars and character properties
- **Layout Profiles:** Switch between editing/play/debug modes
- **Export/Import:** Save and share project JSON files

### Add a New Feature

1. Create a branch: `git checkout -b feature/my-feature`
2. Write code following standards
3. Add tests: `test/my-feature.test.js`
4. Run tests: `npm test && npm run e2e:vite`
5. Commit: `git commit -m "feat: add my feature"`
6. Push and create PR

---

## ❓ Need Help?

### Common Issues

**Port 5173 already in use:**
```bash
# Kill the process using port 5173
# On Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# On Mac/Linux:
lsof -ti:5173 | xargs kill -9
```

**Tests failing:**
- Ensure dev server is stopped before E2E tests
- Run `npm run e2e:install` to install browsers
- Check `test-results/` folder for screenshots

### Documentation

- **Technical questions:** See [docs/AI_CONTEXT.md](./docs/AI_CONTEXT.md)
- **Coverage strategy:** See [docs/COVERAGE_ROADMAP.md](./docs/COVERAGE_ROADMAP.md)
- **E2E templates:** See [docs/E2E_PROMPT_TEMPLATE.md](./docs/E2E_PROMPT_TEMPLATE.md)

---

## 🎉 You're Ready!

You now have:
- ✅ AccessCity running locally
- ✅ Tests passing (11/11 unit + 7/7 E2E)
- ✅ Architecture understanding
- ✅ Development workflow knowledge

**Start building!** 🚀
