# GitHub Copilot Instructions – AccessCity Studio

## Contexte du projet

- Nom : AccessCity Scene Editor / AccessCity Studio
- But : editeur de scenarios interactifs accessibles, destine a des ateliers avec des personnes en situation de handicap (debutants complets).
- Stack : React + Vite + Tailwind CSS, code 100% ASCII.
- Branche de travail actuelle : `scenario-editor-MVP`.

Le projet doit rester :
- Accessible (WCAG 2.1/2.2 AA, navigation clavier, lecteurs d ecran).
- Simple a comprendre pour des debutants (aucun jargon technique dans l interface).
- Facile a animer en atelier (structure claire, peu d ecrans, guidage).

## Regles de code et d architecture

- Toujours respecter les regles definies dans `CODING_RULES.md`.
- Pas de refactor massif non demande.
- Ne jamais melanger code et documentation dans un meme fichier.
- Utiliser uniquement des guillemets simples/doubles ASCII, pas d accents dans le code.
- Respecter la structure existante des dossiers :
  - `src/core`, `src/components`, `src/modules`, `src/contexts`, `src/utils`, `docs`, etc.
- Quand un fichier est modifie, renvoyer le fichier ENTIER (pas de patch partiel dans les reponses).

## Lignes directrices UX / accessibilite

- Public cible : debutants complets (y compris enfants) et personnes en situation de handicap.
- Interface type logiciel de bureau, pas de site marketing.
- Navigation :
  - Barre d etapes en haut (1. Contexte, 2. Personnages, 3. Lieux / Scenes, 4. Histoires / Dialogues, 5. Essayer le jeu, 6. Partager / Exporter).
  - Layout 3 zones :
    - Gauche : navigation (liste de scenes / lieux).
    - Centre : zone principale (scene visuelle, dialogues).
    - Droite : panneau d edition (texte, proprietes).
- Texte interface :
  - Toujours en francais simple, sans termes techniques (pas de « variable », « JSON », etc.).
  - Expliquer les effets en langage humain : « Ce choix rassure le personnage », « Ce choix fatigue physiquement », etc.
- Accessibilite :
  - Focus toujours visible.
  - Tous les boutons et liens utilisables au clavier (Tab, Entree, Echap, fleches).
  - Roles ARIA corrects sur onglets, dialogues, modales.
  - Eviter les animations agressives par defaut.

## Scenario Editor MVP (branche `scenario-editor-MVP`)

### ScenarioEditorShell

- Fichier : `src/components/ScenarioEditorShell.jsx`.
- Role :
  - Afficher un ecran d accueil :
    - Espace local (pour l instant un seul : « Espace local »).
    - Liste d histoires stockees dans `localStorage` (jusqu a 5 en version gratuite).
    - Creation / selection / suppression d une histoire.
  - Quand une histoire est selectionnee et ouverte :
    - Afficher un bandeau indiquant l histoire ouverte.
    - Afficher `StudioShell` (editeur scenes + dialogues existant).

### App.jsx

- Doit utiliser `ScenarioEditorShell` comme point d entree editeur au lieu de rendre `StudioShell` directement.
- Garder la structure existante :
  - `AppProvider`
  - `ToastProvider`
  - `SkipToContent`

### Modules/ecrans cibles (vision)

1. Accueil
   - Choix de l espace (MVP : un seul espace local).
   - Liste et creation d histoires (max 5 en gratuit).

2. Contexte
   - Titre de l histoire.
   - Description courte.
   - Objectif pedagogique.

3. Personnages
   - Nom, role, avatar.
   - Position par defaut (gauche / centre / droite).

4. Lieux / Scenes
   - Liste de lieux a gauche.
   - Scene active au centre (decor + personnages).
   - Panneau d edition a droite.

5. Histoires / Dialogues
   - Timeline symbolique des etapes dans un lieu.
   - Pour chaque etape :
     - Qui parle ?
     - Texte du dialogue.
     - Choix du joueur (facultatif).
     - Effets eventuels sur energie physique / mentale.

6. Essayer le jeu
   - Previsualisation en modale plein ecran.
   - Affichage compact des jauges :
     - Physique : `[❤] 72 / 100`
     - Mentale : emoji qui change par paliers de 20 + score (`🙂 45 / 100`).

7. Partager / Exporter
   - Export JSON structure claire (Histoire > Lieux > Etapes > Choix > Effets).
   - Explications en langage simple sur l emplacement du fichier et l usage dans GDevelop.

## IA et extensions

- Ne PAS introduire de bibliotheque lourde (Material UI, etc.) pour le MVP.
- Tailwind CSS reste la base pour le style.
- Eventuels ajouts futurs :
  - Outils d analyse accessibilite (axe-core, etc.).
  - Petit module IA local pour corriger / reformuler des textes de dialogues (phase 2, pas dans le MVP).

## Ce que Copilot doit privilegier

- Generer du code React + Tailwind **simple, lisible, explicite**.
- Respecter les noms et patterns existants (`StudioShell`, panels, providers).
- Ajouter des commentaires courts et utiles seulement quand necessaire.
- Toujours penser :
  - public debutant,
  - accessibilite,
  - pas de detour par des patterns complexes inutiles (hooks generiques, HOC, etc.).
