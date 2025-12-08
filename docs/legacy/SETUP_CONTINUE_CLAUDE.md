# Principes fondamentaux & standards qualité

- Cohérence visuelle : respect du design system, uniformité dans les guides et les configurations.
- Accessibilité : instructions claires, feedback utilisateur explicite, guide utilisable par IA et humains.
- Inclusivité : langage neutre, contenu accessible à tous, guide ouvert aux débutants.
- Documentation actionnable et IA-friendly : exemples prêts à copier, sections bien délimitées, sémantique explicite, sécurité des données (clé API).
- Automatisation & CI/CD : validation automatisée, intégration continue des bonnes pratiques dans les workflows et configurations.
- Contribution : feedback encouragé, documentation et guides à jour, conventions de commit.

> Ces principes guident l’installation et la configuration de Continue + Claude pour garantir une expérience optimale, accélérer le développement (+20 à +30 %), réduire les bugs et faciliter l’onboarding.

---

# Guide Installation Continue + Claude API pour AccessCity

## Etape 1 : Obtenir cle API Claude (5 min)

1. Va sur https://console.anthropic.com
2. Cree un compte (email + verification)
3. Section "API Keys" → "Create Key"
4. Copie la cle (commence par `sk-ant-...`)
5. **IMPORTANT** : Garde cette cle secrete (ne la committe JAMAIS)

## Etape 2 : Installer Continue dans VS Code (2 min)

1. Ouvre VS Code
2. Extensions (Ctrl+Shift+X)
3. Cherche "Continue"
4. Clique "Install" sur "Continue - Codestral, Claude, and more"
5. Icone Continue apparait dans la barre laterale gauche

## Etape 3 : Configurer Continue avec Claude (3 min)

1. Clique sur l'icone Continue (barre laterale)
2. Dans le chat Continue qui s'ouvre, clique sur l'icone engrenage (settings)
3. Ou : Ctrl+Shift+P → "Continue: Open config.json"
4. Remplace le contenu par :

```json
{
  "models": [
    {
      "title": "Claude Sonnet 4.5",
      "provider": "anthropic",
      "model": "claude-sonnet-4-20250514",
      "apiKey": "sk-ant-VOTRE_CLE_ICI"
    }
  ],
  "tabAutocompleteModel": {
    "title": "Codestral",
    "provider": "free-trial",
    "model": "codestral-latest"
  },
  "embeddingsProvider": {
    "provider": "free-trial"
  }
}
```

5. Remplace `sk-ant-VOTRE_CLE_ICI` par ta vraie cle API
6. Sauvegarde (Ctrl+S)
7. Ferme et rouvre VS Code

## Etape 4 : Tester Continue (1 min)

1. Clique sur l'icone Continue
2. Dans le chat, tape :
```
@codebase Lis .copilot-instructions.md et resume la checklist Phase 5.5
```
3. Continue devrait repondre avec la checklist complete

## Etape 5 : Utilisation pour AccessCity

### Commandes essentielles

**Demarrer une session :**
```
@codebase Lis .copilot-instructions.md et docs/PROJECT_MEMORY_SEED.md.
Quelle est la prochaine tache Phase 5.5 non terminee ?
```

**Modifier du code :**
```
@codebase Cree data/characters.json selon specs Phase 5.5.
Respecte ASCII-only et valide avec schemas.json.
```

**Verifier conformite :**
```
@codebase Verifie que tous les fichiers modifies respectent
les regles de .copilot-instructions.md (ASCII-only, pas de fragments).
```

**Multi-fichiers :**
```
@codebase Enrichis data/ui_layout.json avec 4 layouts (standard, focus,
accessibility, devtools) ET cree les tests correspondants.
```

### Avantages vs Copilot Chat

- `@codebase` = plus precis que `@workspace` (indexation locale)
- Continue garde l'historique de conversation (meme apres fermeture VS Code)
- Peut editer plusieurs fichiers simultanement avec confirmation
- Meilleur respect des contraintes (ASCII-only, checklist, etc.)

## Gestion des couts

### Estimation pour AccessCity Phase 5.5 :
- ~50-100 messages pour completer Phase 5.5
- ~500k tokens input + 200k tokens output
- **Cout estime : $2-4 pour toute la Phase 5.5**

### Monitorer les couts :
1. Console Anthropic → "Usage"
2. Continue affiche les tokens utilises dans le chat

### Limites recommandees :
Dans console.anthropic.com → "Organization" → "Usage limits" :
- Definis $10/mois max pour securite

## Troubleshooting

**Erreur "API key invalid" :**
- Verifie que la cle commence par `sk-ant-`
- Regenere une nouvelle cle sur console.anthropic.com

**Continue ne voit pas les fichiers :**
- Ferme/rouvre VS Code
- Verifie que tu es dans le bon workspace
- Clique sur "Refresh" dans Continue settings

**Reponses lentes :**
- Normal pour Claude (2-5 secondes)
- Si >30s, check ta connexion internet

## Securite

**IMPORTANT - Proteger ta cle API :**

1. Ajoute `.continue/` au .gitignore :
```bash
echo ".continue/" >> .gitignore
```

2. **JAMAIS** committer config.json avec la vraie cle
3. Si cle exposee accidentellement : regenere-la immediatement sur console.anthropic.com

## Alternative : Variables d'environnement

Pour plus de securite, utilise une variable d'env :

**Windows PowerShell :**
```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-votre-cle"
```

**config.json :**
```json
{
  "models": [
    {
      "title": "Claude Sonnet 4.5",
      "provider": "anthropic",
      "model": "claude-sonnet-4-20250514",
      "apiKey": "${ANTHROPIC_API_KEY}"
    }
  ]
}
```

## Workflow optimal AccessCity

1. **Debut session :**
```
@codebase Checklist Phase 5.5 complete avec statut
```

2. **Avant chaque tache :**
```
@codebase Verifie .copilot-instructions.md. Peut-on faire [TACHE] maintenant ?
```

3. **Apres modification :**
```
@codebase Lance npm test et verifie que tout passe
```

4. **Fin session :**
```
@codebase Resume ce qui a ete fait et ce qui reste pour Phase 5.5
```

---

## Annexe : Guide Installation Continue + Claude API (optionnel)

Ce guide est proposé en annexe car l’intégration d’IA tierces (Claude, Codestral, etc.) dépend du contexte d’équipe et de l’évolution rapide des outils. Pour un usage solo, il est recommandé de consulter ou adapter ce guide uniquement si besoin.

**Temps total setup : ~10 minutes**  
**Cout Phase 5.5 complete : ~$3-5**  
**Efficacite vs oublis : 9/10**
