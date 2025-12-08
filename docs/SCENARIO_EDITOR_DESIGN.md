# AccessCity Studio – Scenario Editor MVP (Synthese)

**Date** : 8 decembre 2025  
**Branche** : `scenario-editor-MVP`  
**Objectif** : Editeur de scenarios interactifs accessibles pour ateliers avec personnes en situation de handicap.

---

## 1. Contexte projet

**Public cible** : Debutants complets (y compris enfants), animateurs, publics en situation de handicap.

**Tech stack** : React + Vite + Tailwind CSS, code 100% ASCII, accessibilite WCAG 2.2 AA visee.

**Principe** : Application locale, pas de compte, pas de cloud, stockage localStorage.

---

## 2. Architecture generale du Scenario Editor

### 2.1. Shell principal

**Nouveau composant** : `ScenarioEditorShell` (`src/components/ScenarioEditorShell.jsx`)

**Roles** :
1. Afficher un ecran d accueil avec :
   - Choix d espace (MVP : un seul « Espace local »)
   - Liste d histoires stockees dans `localStorage`
   - Actions : creer, selectionner, ouvrir, supprimer une histoire
2. Apres ouverture d une histoire :
   - Bandeau superieur indiquant l espace et l histoire active
   - Bouton « Retour a l accueil »
   - Affichage de `StudioShell` (editeur scenes/dialogues existant)

### 2.2. Point d entree App.jsx

**Structure conservee** :

```jsx
<AppProvider>
  <ToastProvider>
    <SkipToContent />
    <ScenarioEditorShell />
  </ToastProvider>
</AppProvider>
```

`ScenarioEditorShell` remplace l affichage direct de `StudioShell` pour introduire le workflow multi histoires.

---

## 3. Ecran d accueil (ScenarioEditorShell)

### 3.1. Objectifs UX

- Eviter la page blanche pour les debutants
- Permettre plusieurs histoires sur un meme ordinateur
- Rester 100% local (pas de synchronisation cloud)
- Limite gratuite claire : 5 histoires maximum par espace

### 3.2. Fonctionnalites

**Espace local** : Un seul espace disponible dans le MVP (« Espace local »).

**Histoires** :
- Stockage : cle localStorage `ac_scenario_stories_v1`
- Structure : tableau JSON avec `id`, `name`, `createdAt`, `updatedAt`
- Limite : 5 histoires maximum (version gratuite)

**Actions disponibles** :
- Creer une nouvelle histoire (formulaire avec nom libre)
- Selectionner une histoire dans la liste
- Ouvrir l histoire selectionnee (passe a la vue editeur)
- Supprimer une histoire (confirmation requise)

### 3.3. Layout wireframe

**En tete** :
- Titre : « AccessCity Studio »
- Sous titre : « Choisis ton espace et ton histoire »
- Description : « Un espace correspond a une personne ou a un groupe. Dans cet espace, tu peux creer jusqu a 5 histoires differentes en version gratuite. »

**Bloc 1 : Choisir un espace** :
- MVP : une seule carte « Espace local » (active par defaut)
- Affichage : « Espace actif », « Histoires creees sur cet ordinateur »

**Bloc 2 : Choisir ton histoire dans cet espace** :
- Liste verticale de cartes d histoires (nom + badge « Histoire locale »)
- Indicateur visuel pour l histoire selectionnee
- Compteur : « Tu peux avoir jusqu a 5 histoires dans cet espace (version gratuite). »
- Formulaire de creation :
  - Champ texte : « Nom de la nouvelle histoire »
  - Placeholder : « Exemple : La visite a la mairie »
  - Bouton : « Creer une nouvelle histoire » (desactive si limite atteinte)
- Actions :
  - Bouton « Ouvrir cette histoire » (desactive si aucune selection)
  - Bouton « Supprimer cette histoire » (desactive si aucune selection)

**Pied de page** :
- Liens texte : « Comment ca marche ? », « Accessibilite », « A propos d AccessCity »

---

## 4. Vue editeur (apres ouverture d une histoire)

### 4.1. Bandeau contextuel

**Affichage collant en haut** :
- « Espace local » (texte petit)
- « Histoire : {nom} » (texte moyen, gras)
- Bouton « Retour a l accueil »

### 4.2. Composant StudioShell

En dessous du bandeau, affichage de `StudioShell` existant avec tous ses modules :
- Scenes (liste + edition)
- Dialogues (timeline + textes)
- Background (choix decor)
- Characters (personnages)
- Import / Export
- Previsualisation joueur

---

## 5. Workflow narratif cible (vision MVP)

Les etapes suivantes guident la conception future de l editeur. Toutes ne sont pas encore implementees comme ecrans separes :

### 5.1. Contexte

**Objectif** : Definir le cadre de l histoire

**Champs** :
- Titre de l histoire
- Description courte (2-3 phrases)
- Objectif pedagogique (en langage simple)

### 5.2. Personnages

**Objectif** : Creer les protagonistes

**Champs** :
- Nom
- Role dans l histoire
- Avatar (image ou emoji)
- Position par defaut : gauche / centre / droite

### 5.3. Lieux / Scenes

**Objectif** : Definir les environnements

**Structure** :
- Liste de lieux (Mairie, Parc, Bus, Ecole, etc.)
- Pour chaque lieu :
  - Nom du lieu
  - Image de fond
  - Liste de personnages presents dans ce lieu

### 5.4. Histoires / Dialogues

**Objectif** : Construire la narration interactive

**Structure par lieu** :
- Timeline symbolique d etapes (1, 2, 3, 4...)
- Pour chaque etape :
  - **Qui parle ?** (personnage)
  - **Texte du dialogue**
  - **Choix du joueur** (facultatif)
  - **Effets eventuels** (physique / mental, voir section 6)

### 5.5. Essayer le jeu

**Objectif** : Tester l histoire creee

**Fonctionnalites** :
- Previsualisation modale plein ecran
- Navigation clavier complete
- Compatibilite lecteur d ecran

### 5.6. Partager / Exporter

**Objectif** : Recuperer et reutiliser l histoire

**Structure export JSON** :
```
Histoire
  → Lieux
    → Etapes
      → Choix
        → Effets
```

**Documentation export** :
- Texte explicatif simple sur l usage du fichier
- Instructions pour GDevelop / lecteur de scenarios
- Emplacement du fichier exporte

---

## 6. Systeme RPG pedagogique (Physique / Mental)

### 6.1. Deux jauges globales

**Affichage compact en jeu** :
- Energie physique : `[❤] 72 / 100`
- Energie mentale : `[emoji] 45 / 100`

### 6.2. Emoji mental par paliers

**Paliers de 20 points** :
- 80–100 : Visage tres content 😄
- 60–79 : Sourire leger 🙂
- 40–59 : Neutre / fatigue 😐
- 20–39 : Triste 🙁
- 0–19 : Detresse 😣 ou 😢

### 6.3. Interface editeur : langage simple

**Pas de jargon technique** : aucune notion de « variable » ou « score » dans l interface utilisateur.

**Exemples de formulations** :
- « Ce choix rassure le personnage » → augmente legerement le mental
- « Ce choix fatigue physiquement » → baisse legerement la physique
- « Ce choix redonne confiance » → augmente mental
- « Ce choix epuise » → baisse physique

---

## 7. Choix et lancer de de (evolution future)

### 7.1. Structure d un choix

Pour chaque choix dans une etape :
- Texte du choix (visible par le joueur)
- Effet simple :
  - Avancer a l etape suivante
  - Modifier Physique / Mental (valeurs discretes)
  - Declencher un evenement narratif

### 7.2. Option lancer de de (phase ulterieure)

**Objectif** : Introduire un facteur chance controle

**Structure** :
- Texte qui introduit le lancer : « Tu tentes de convaincre l employe... »
- Deux branches internes :
  - **Resultat eleve** (ex : 4-6) : effet A + etape cible A
  - **Resultat faible** (ex : 1-3) : effet B + etape cible B

**Principe** : Enrichir sans exploser la structure (micro variations, pas arbre infini).

---

## 8. Accessibilite et langage

### 8.1. Langage interface

- Francais simple, pas de jargon technique
- Formulations positives et encourageantes
- Vocabulaire adapte aux enfants et debutants

### 8.2. Navigation clavier

**Tous les elements interactifs** :
- Tab : navigation sequentielle
- Entree / Espace : activation
- Echap : fermeture modales / retour
- Fleches : navigation dans listes / onglets

### 8.3. Roles ARIA

**Elements correctement annonces** :
- Onglets : `role="tablist"`, `role="tab"`, `role="tabpanel"`
- Modales : `role="dialog"`, `aria-modal="true"`
- Boutons : `role="button"`, `aria-label` explicites
- Alertes : `role="alert"`, `role="status"`

### 8.4. Contraste et visibilite

- Contraste texte/fond conforme WCAG AA
- Focus visible sur tous les elements interactifs (anneau 2px)
- Tailles de texte lisibles (minimum 14px)

### 8.5. Surcharge cognitive

- Peu d options affichees en meme temps
- Guidage etape par etape
- Possibilite mode simple / avancé pour animateurs (phase 2)

---

## 9. Futures extensions (hors MVP)

### 9.1. Module de templates de scenario

**Objectif** : Aider les debutants avec des structures pre remplies

**Lors de la creation d une histoire** :
- « Partir de zero »
- « Utiliser un modele pour t aider »

**Chaque modele** :
- Liste de scenes pre nommees avec role narratif :
  - Presentation
  - Probleme
  - Resolution
  - Conclusion
- Suggestions de personnages types
- Suggestions de lieux types

### 9.2. IA locale de reformulation (phase 2)

**Objectif** : Ameliorer la qualite des textes sans changer le sens

**Fonctionnalite** :
- Bouton « Relire et ameliorer le texte » sur dialogues / choix
- Modele local leger (pas de cloud)
- Corrections orthographe / grammaire
- Clarification formulations sans modifier le sens

**Contraintes** :
- Modele leger (fonctionnement hors ligne)
- Pas de modification semantique
- Suggestions optionnelles (pas d ecrasement automatique)

### 9.3. Vue carte facon SimCity (phase ulterieure)

**Objectif** : Visualisation spatiale des lieux

**Fonctionnalite** :
- Carte de la ville en 2D
- Lieux cliquables qui ouvrent les scenes correspondantes
- Navigation alternative a la liste textuelle
- Mode exploration pour les joueurs

---

## 10. Structure des fichiers

### Fichiers cles MVP

```
src/
  components/
    ScenarioEditorShell.jsx  # Point d entree MVP
    StudioShell.jsx           # Editeur scenes/dialogues existant
  AppContext.jsx
  contexts/
    ToastContext.jsx
  App.jsx                     # Integration ScenarioEditorShell
```

### Documentation

```
docs/
  SCENARIO_EDITOR_DESIGN.md   # Ce document
  ACCESSIBILITY.md            # Guide accessibilite complet
  KEYBOARD_SHORTCUTS.md       # Reference raccourcis clavier
  PHASE3_SUMMARY.md           # Recapitulatif Phase 3
```

---

## 11. Points de vigilance

### 11.1. Stockage localStorage

- **Limite** : 5-10 MB selon navigateurs
- **Structure** : JSON simple, pas de fichiers binaires
- **Robustesse** : Gestion try/catch pour lecture/ecriture
- **Corruption** : Validation JSON avant parse

### 11.2. Performance

- **Listes longues** : Pas de probleme (max 5 histoires dans MVP)
- **Images** : References URL uniquement (pas de base64)
- **Re renders** : useState local, pas de prop drilling inutile

### 11.3. Compatibilite

- **Navigateurs** : Chrome, Firefox, Edge, Safari (modernes)
- **Lecteurs ecran** : NVDA, JAWS, VoiceOver
- **Clavier** : 100% utilisable sans souris
- **Modes systeme** : High contrast, reduced motion

---

## 12. Prochaines etapes

### Court terme (MVP)

1. ✅ Creer `ScenarioEditorShell.jsx`
2. ✅ Integrer dans `App.jsx`
3. ⏳ Tester workflow complet (accueil → editeur → retour)
4. ⏳ Valider accessibilite clavier
5. ⏳ Tester avec lecteur d ecran

### Moyen terme

1. Ecran « Contexte » (titre, description, objectif)
2. Ecran « Personnages » (nom, role, avatar, position)
3. Amelioration « Lieux / Scenes » (integration personnages)
4. Ecran « Histoires / Dialogues » (timeline etapes)
5. Integration systeme RPG (jauges Physique / Mental)

### Long terme

1. Module templates de scenario
2. IA locale de reformulation
3. Vue carte spatiale
4. Mode collaboratif local (plusieurs animateurs)
5. Export vers GDevelop optimise

---

**Document de reference** : `docs/SCENARIO_EDITOR_DESIGN.md`  
**Derniere mise a jour** : 8 decembre 2025  
**Statut** : MVP en developpement actif
