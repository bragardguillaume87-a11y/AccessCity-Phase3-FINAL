# Instructions de synchronisation

## ⚠️ Les changements sont sur GitHub mais pas en local

Si ton application affiche encore les anciens bugs, c'est que tu dois synchroniser ton code local avec GitHub.

---

## 🔄 ETAPES DE SYNCHRONISATION

### 1. Sauvegarde ton travail local (si tu as des modifs non committees)

```bash
cd AccessCity-Phase3-FINAL
git stash
```

### 2. Bascule sur la bonne branche

```bash
git checkout Access-City-CLEAN
```

### 3. Recupere les derniers commits depuis GitHub

```bash
git fetch origin
git pull origin Access-City-CLEAN
```

### 4. Verifie que tu as bien les derniers commits

```bash
git log --oneline -10
```

Tu dois voir ces commits recents :
- `9ac2289` - fix(ui): improve ScenesPanel layout
- `5c28efe` - fix(ui): improve BackgroundPanel
- `3ee07c1` - fix(ui): improve CharactersPanel
- `cc9f748` - fix(a11y): improve CharacterEditor
- `3be801c` - fix(a11y): integrate AccessibleTabs
- `bf662e6` - feat(a11y): add AccessibleTabs component
- `1dc5ab8` - fix(a11y): improve focus indicators
- `456503f` - docs: add accessibility audit report

### 5. Reinstalle les dependances (au cas ou)

```bash
npm install
```

### 6. Redemarre le serveur de dev

```bash
# Arrete le serveur actuel (Ctrl+C)
# Puis relance
npm run dev
```

### 7. Vide le cache du navigateur

- **Chrome/Edge** : Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)
- **Firefox** : Ctrl+F5 (Windows) ou Cmd+Shift+R (Mac)
- Ou ouvre en navigation privee

---

## ✅ VERIFICATION

Apres synchronisation, tu dois voir :

1. **Onglets Scenes/Dialogues** : Navigation avec fleches clavier fonctionnelle
2. **CharactersPanel** : "Conseiller muni..." avec tooltip complet au survol
3. **BackgroundPanel** : Images avec fallback SVG si erreur
4. **ScenesPanel** : Boutons Modifier/Supprimer mieux espaces
5. **Focus indicators** : Outline bleu 3px visible au clavier

---

## 🎯 COMMITS APPLIQUES

Voir le fichier `docs/A11Y_AUDIT_2025-12.md` pour le detail complet.

**8 commits** de corrections :
- Accessibilite WCAG 2.2 AA : 75% -> 85%
- UI/UX : Tous debordements corriges
- Code quality : 100% ASCII, structure respectee

---

## 🐛 Si ca ne marche toujours pas

### Option A : Clone fresh

```bash
cd ..
git clone https://github.com/bragardguillaume87-a11y/AccessCity-Phase3-FINAL.git AccessCity-FRESH
cd AccessCity-FRESH
git checkout Access-City-CLEAN
npm install
npm run dev
```

### Option B : Reset hard

```bash
git reset --hard origin/Access-City-CLEAN
npm install
npm run dev
```

---

**Derniere mise a jour** : 7 decembre 2025, 00:40 CET
