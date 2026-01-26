# Principes fondamentaux & standards qualité

- Cohérence visuelle : respect du design system, uniformité dans les guides et les workflows.
- Accessibilité : instructions claires, feedback utilisateur explicite, guide utilisable par IA et humains.
- Inclusivité : langage neutre, contenu accessible à tous, guide ouvert aux débutants.
- Documentation actionnable et IA-friendly : exemples prêts à copier, sections bien délimitées, sémantique explicite, checklists et workflows clairs.
- Automatisation & CI/CD : validation automatisée, intégration continue des bonnes pratiques dans les workflows.
- Contribution : feedback encouragé, documentation et guides à jour, conventions de commit.

> Ces principes guident l’utilisation de Copilot Workspace et ses alternatives pour garantir une expérience optimale, accélérer le développement (+20 à +30 %), réduire les bugs et faciliter l’onboarding.

---

# Guide Copilot Workspace pour AccessCity

## Qu'est-ce que Copilot Workspace ?

**Copilot Workspace** est une fonctionnalite GitHub (actuellement en Technical Preview) qui permet de :
- Planifier des modifications multi-fichiers
- Generer du code dans plusieurs fichiers simultanement
- Suivre un plan structuré avec validation etape par etape

## Comment y acceder ?

### Option 1 : Via GitHub.com
1. Va sur ton repo GitHub : `https://github.com/bragardguillaume87-a11y/AccessCity-Phase3-FINAL`
2. Clique sur le bouton **"Open in Copilot Workspace"** (si disponible)
3. Decris ta tache : "Completer Phase 5.5 selon PROJECT_MEMORY_SEED.md"

### Option 2 : Via VS Code (si actif)
1. Ouvre la Command Palette (`Ctrl+Shift+P`)
2. Tape : `GitHub Copilot: Open Workspace`
3. Suis les instructions

### Option 3 : Demande acces
Si tu ne vois pas l'option :
1. Va sur `https://githubnext.com/projects/copilot-workspace`
2. Clique "Request Access"
3. Attend confirmation GitHub (peut prendre quelques jours/semaines)

## Alternative IMMEDIATE : Utiliser @workspace dans Copilot Chat

**Tu peux faire ca MAINTENANT dans VS Code :**

### 1. Ouvre Copilot Chat
- Raccourci : `Ctrl+Alt+I` (Windows) ou `Cmd+Shift+I` (Mac)
- Ou clique sur l'icone chat GitHub Copilot dans la barre laterale

### 2. Utilise @workspace avec contexte
```
@workspace Suis strictement .copilot-instructions.md et docs/PROJECT_MEMORY_SEED.md
pour completer la Phase 5.5. Commence par creer data/characters.json.
```

### 3. Pour chaque tache, demande validation
```
@workspace Verifie que characters.json respecte le schema dans schemas.json
avant de continuer.
```

### 4. Force la checklist
```
@workspace Affiche la checklist Phase 5.5 de .copilot-instructions.md
et indique ce qui reste a faire.
```

## Workflow Recommande SANS Copilot Workspace

Puisque Copilot Workspace n'est pas encore accessible a tous :

### Methode 1 : Chat + Checklist manuelle
1. Ouvre `.copilot-instructions.md` dans un onglet
2. Dans Copilot Chat : `@workspace Quelle est la prochaine tache Phase 5.5 ?`
3. Je te donne la tache
4. Tu valides : "OK, fais-le"
5. Je coche la checklist

### Methode 2 : Multi-step prompts
```
@workspace Etape 1/4 Phase 5.5 : Cree data/characters.json avec player, counsellor, narrator.
Respecte le schema Character de schemas.json. ASCII-only.
```

Puis :
```
@workspace Etape 2/4 Phase 5.5 : Enrichis data/ui_layout.json avec 4 layouts
(standard, focus, accessibility, devtools). ASCII-only.
```

### Methode 3 : Task-specific context
```
@workspace #file:.copilot-instructions.md #file:docs/PROJECT_MEMORY_SEED.md
Cree data/characters.json selon specifications Phase 5.5
```

## Tips pour maximiser Copilot

### 1. Reference explicite des fichiers
```
@workspace Modifie data/schemas.json pour ajouter le schema Character,
puis cree data/characters.json conforme a ce schema.
```

### 2. Demande verification
```
@workspace Verifie que le code genere respecte les regles ASCII-only
de .copilot-instructions.md
```

### 3. Incremental validation
```
@workspace Apres avoir cree characters.json, lance npm test
et montre-moi le resultat avant de continuer.
```

## Statut Copilot Workspace (Nov 2025)

- **Disponibilite** : Technical Preview (acces limite)
- **Cout** : Inclus dans GitHub Copilot Business/Enterprise
- **Acces individuel** : Sur demande via githubnext.com

**Pour l'instant, utilise @workspace dans VS Code Chat - c'est tout aussi efficace !**

## Exemple Session Complete

```
Toi: @workspace Suis .copilot-instructions.md. Quelle est la prochaine tache Phase 5.5 ?

Copilot: D'apres la checklist, il faut creer data/characters.json avec player, counsellor, narrator.

Toi: OK, fais-le en respectant ASCII-only.

Copilot: [cree le fichier]

Toi: @workspace Lance npm test pour valider.

Copilot: [execute et montre resultats]

Toi: @workspace Tache suivante ?

Copilot: Enrichir ui_layout.json avec 4 layouts...
```

Veux-tu qu'on teste ca maintenant avec la creation de `data/characters.json` ?
