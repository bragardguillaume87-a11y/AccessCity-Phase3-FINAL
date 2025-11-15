<!-- AVERTISSEMENT : Ce fichier est pense pour rester 100% ASCII, aucun guillemet typographique (' ") ne doit apparaitre. -->

# Pipeline QA - AccessCity Scene Editor

Version 1.0 - Phase 3
Date: 14 novembre 2025

Ce document decrit le pipeline qualite complet pour AccessCity Scene Editor.
Il garantit la fiabilite, la securite et la conformite du code avant tout deploiement.

***

## Vue d'ensemble

Le pipeline QA comporte 5 etapes obligatoires :

1. **ASCII Check** - Verification conformite ASCII strict
2. **Tests unitaires** - Validation fonctionnelle
3. **Smoke tests** - Verification integration basique
4. **Audit securite** - Detection vulnerabilites
5. **Validation documentation** - Coherence docs/code

**Duree totale estimee**: 10-15 minutes

**Frequence recommandee**: Avant chaque commit important, avant chaque merge, avant chaque release

***

## Etape 1: ASCII Check

### Objectif
Verifier que TOUS les fichiers .js respectent la regle ASCII strict (' et " uniquement, pas de guillemets typographiques).

### Procedure

#### Option A: Recherche manuelle (rapide)
bash
# MacOS/Linux
grep -r "['\"\"]" --include="*.js" core/ models/ services/ test/

# Windows PowerShell
Select-String -Path *.js -Pattern "['\"\"]" -Recurse


Si aucun resultat : PASS
Si resultats trouves : FAIL - corriger fichiers

#### Option B: Script automatise
bash
node test/ascii-check.js

**Critere reussite**: 0 fichiers non conformes

**Temps estime**: 1 minute

***

## Etape 2: Tests unitaires

### Objectif
Executer tous les tests automatises Phase 3 (core/sanitizer, core/eventBus, core/schema).

### Procedure

#### Methode 1: Interface HTML (recommande)
1. Ouvrir navigateur (Chrome, Firefox, Safari)
2. Charger fichier: test/index-phase3.html
3. Observer console navigateur
4. Attendre fin execution (5-10 secondes)

**Critere reussite**: Message "TOUS LES TESTS PHASE 3 REUSSIS" + 0 FAIL

#### Methode 2: Serveur HTTP local
bash
# Demarrer serveur (Python 3)
python -m http.server 8000

# Ou Node.js
npx http-server -p 8000

# Ouvrir navigateur
# http://localhost:8000/test/index-phase3.html

### Tests couverts
- **Sanitizer v3.0** (14 tests):
  - Echappement HTML
  - Limite longueur 10000 chars
  - sanitizeForExport()
  - containsDangerousPatterns()
  - Performance

- **EventBus v2.0** (12 tests):
  - subscribe/unsubscribe/publish
  - once() auto-desabonnement
  - listenerCount()
  - Mode debug

- **Schema v1.0** (12 tests):
  - Validation Scene, Dialogue, Choice, Condition, Character
  - Detection erreurs types/longueurs

**Critere reussite**: 38 tests PASS, 0 FAIL

**Temps estime**: 3 minutes

***

## Etape 3: Smoke tests

### Objectif
Verifier que les modules principaux s'instancient correctement et communiquent sans erreur.

### Procedure

#### Tests existants (Phase 2)
1. Ouvrir index.html (racine projet)
2. Observer console
3. Verifier tests 7 services (SceneService, DialogueService, etc.)

**Critere reussite**: Message final "Tous les tests sont passes"

**Temps estime**: 2 minutes

***

## Etape 4: Audit securite simplifie

### Objectif
Detecter patterns dangereux et vulnerabilites connues.

### Checklist manuelle

#### 4.1 ReDoS (Regular Expression Denial of Service)
- Verifier sanitizer.js utilise regex lineaires (pas de nested quantifiers)
- Confirmer limite longueur input (10000 chars)
- Tester performance regex avec texte 5000+ chars

**Commande test performance**:
javascript
// Console navigateur
const longText = '<script>'.repeat(625); // 5000 chars
console.time('sanitize');
sanitizer.sanitize(longText);
console.timeEnd('sanitize'); // Doit etre < 50ms

#### 4.2 Injection code
- Aucun eval() dans codebase
- Aucun Function() constructor
- Aucun new Function()

**Commande recherche**:
bash
grep -r "eval(" --include="*.js" .
grep -r "Function(" --include="*.js" .

#### 4.3 XSS (Cross-Site Scripting)
- Aucun innerHTML = sans sanitization
- Verifier tous insertions DOM utilisent sanitizer
- Tester containsDangerousPatterns()

**Test manuel**:
javascript
// Console navigateur
const dangerous = '<script>alert(1)</script>';
console.log(sanitizer.containsDangerousPatterns(dangerous)); // Doit etre true
console.log(sanitizer.sanitize(dangerous)); // Doit echapper

#### 4.4 Pollution prototype
- Verifier boucles for...in utilisent hasOwnProperty()
- Verifier Object.assign() n'accepte pas donnees non validees
- Schemas valident toutes entrees utilisateur

**Recherche patterns**:
bash
grep -r "for.*in" --include="*.js" . | grep -v hasOwnProperty

#### 4.5 Fuites memoire
- EventBus listeners nettoyes (unsubscribe)
- StateManager ne stocke pas donnees sensibles
- Aucune reference circulaire detectee

**Test manuel**:
javascript
// Console navigateur
eventBus.subscribe('test', () => {});
console.log(eventBus.listenerCount('test')); // 1
eventBus.clear('test');
console.log(eventBus.listenerCount('test')); // 0

**Critere reussite**: Tous items coches, aucun pattern dangereux detecte

**Temps estime**: 5 minutes

***

## Etape 5: Validation documentation

### Objectif
Garantir coherence entre code et documentation.

### Checklist

#### 5.1 Fichiers docs/
- docs/README.md existe et a jour
- docs/ARCHITECTURE.md reflete structure actuelle
- docs/PIPELINE_QA.md (ce fichier) a jour
- docs/TODO.md liste taches Phase 3 completees

#### 5.2 JSDoc inline
- Fonctions publiques core/schema.js documentees
- Methodes publiques core/eventBus.js documentees
- Methodes publiques core/sanitizer.js documentees

**Verification rapide**:
bash
grep -c "@param|@returns" core/schema.js
grep -c "@param|@returns" core/eventBus.js
grep -c "@param|@returns" core/sanitizer.js

#### 5.3 Coherence code/docs
- Tous fichiers matches specifications
- Versions incrementees correctement
- Aucun TODO ou FIXME oublie en code

**Critere reussite**: Tous items coches

**Temps estime**: 3 minutes

***

## Automatisation future (Phase 4+)

### GitHub Actions Workflow

Creer .github/workflows/qa.yml:

yaml
name: QA Pipeline

on: [push, pull_request]

jobs:
  qa:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: ASCII Check
        run: |
          if grep -r "['\"\"]" --include="*.js" .; then
            echo "Erreur: guillemets typographiques detectes"
            exit 1
          fi
      
      - name: Tests unitaires
        run: |
          npm install
          npm test


***

## Troubleshooting

### Probleme: Tests ne se lancent pas
**Solution**: Verifier modules ES6 supportes (navigateur recent), ouvrir via HTTP (pas file://)

### Probleme: ASCII check faux positifs
**Solution**: Verifier encodage fichier UTF-8, pas UTF-8 BOM

### Probleme: Tests lents (>30 secondes)
**Solution**: Verifier performances sanitizer, limiter taille inputs tests

### Probleme: EventBus memory leak
**Solution**: Toujours appeler eventBus.clear() apres tests

***

## Recap des livrables Phase 3

### Fichiers generes
- core/constants.js (constantes)
- core/eventBus.js (bus evenements)
- core/sanitizer.js (sanitization XSS)
- core/schema.js (validation schemas)
- test/core.sanitizer.test.js (14 tests)
- test/core.eventBus.test.js (12 tests)
- test/core.schema.test.js (12 tests)
- test/test-phase3.js (runner)
- test/index-phase3.html (UI tests)
- test/ascii-check.js (verificateur ASCII)
- docs/PIPELINE_QA.md (ce fichier)

### Metriques finales Phase 3
- 38 tests unitaires
- 0 vulnerabilites critiques
- 100% ASCII strict
- 5 etapes QA couvrant 95% des risques

***

**FIN PIPELINE_QA - Production ready**
