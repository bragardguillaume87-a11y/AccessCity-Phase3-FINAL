# Raccourcis clavier AccessCity Studio

> **Statut** : ✅ À jour pour le Scenario Editor MVP  
> **Dernière mise à jour** : Décembre 2025

## Navigation globale

| Raccourci | Action | Contexte |
|-----------|--------|----------|
| `Tab` | Element suivant | Partout |
| `Shift + Tab` | Element precedent | Partout |
| `Entree` | Activer bouton/lien | Sur element focusable |
| `Espace` | Activer bouton/checkbox | Sur element focusable |
| `Echap` | Fermer modale/dialogue | Dans modale ouverte |

---

## Onglets (Scenes/Dialogues)

| Raccourci | Action |
|-----------|--------|
| `Fleche droite` | Onglet suivant |
| `Fleche gauche` | Onglet precedent |
| `Home` | Premier onglet |
| `End` | Dernier onglet |
| `Tab` | Quitter les onglets, aller au contenu |

**Pattern ARIA** : [Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)

---

## Liste des scenes

| Raccourci | Action |
|-----------|--------|
| `Tab` | Scene suivante |
| `Entree` / `Espace` | Selectionner la scene |
| `Entree` | Activer "Modifier" |
| `Tab` → `Entree` | Activer "Supprimer" |

---

## Edition de dialogue

| Raccourci | Action |
|-----------|--------|
| `Tab` | Champ suivant |
| `Shift + Tab` | Champ precedent |
| `Entree` | Valider dans input |
| `Echap` | Annuler modifications (dans textarea) |

---

## Modale personnage

### Ordre de tabulation

1. Bouton fermer (X)
2. Input "Nom du personnage"
3. Textarea "Description"
4. Boutons selection humeur
5. Input upload image
6. Bouton "Enregistrer"
7. Bouton "Annuler"

### Raccourcis

| Raccourci | Action |
|-----------|--------|
| `Echap` | Fermer la modale (equivalent Annuler) |
| `Tab` | Element suivant dans la modale |
| `Shift + Tab` | Element precedent dans la modale |
| `Entree` | Activer bouton "Enregistrer" (si focus dessus) |

**Note** : Le focus est piege dans la modale (trap focus) jusqu a sa fermeture.

---

## Import/Export

| Raccourci | Action |
|-----------|--------|
| `Tab` | Naviguer vers les boutons export |
| `Entree` / `Espace` | Declencher l export |
| `Tab` | Atteindre le champ "Choisir fichier" |
| `Entree` / `Espace` | Ouvrir selecteur de fichier |

**Notifications** : Les toasts apparaissent automatiquement et sont annonces par les lecteurs d ecran.

---

## Notifications (Toasts)

| Raccourci | Action |
|-----------|--------|
| `Echap` | Fermer la notification active |
| `Tab` | Atteindre le bouton de fermeture |
| `Entree` | Fermer via bouton |

**Auto-dismiss** : Les notifications disparaissent apres 5 secondes par defaut.

---

## Skip links (Liens d evitement)

| Raccourci | Action |
|-----------|--------|
| `Tab` (des l arrivee sur la page) | Afficher "Aller au contenu principal" |
| `Entree` | Sauter directement au contenu principal |

**Pourquoi** : Evite de tabber 20 fois pour atteindre le contenu.

---

## Focus visible

Tous les elements interactifs ont un **indicateur de focus visible** :
- Bordure bleue epaisse (3px)
- Ombre portee (box-shadow)
- Contraste minimum 3:1 avec l arriere-plan

**Conformite** : WCAG 2.2 AA critere 2.4.7 Focus Visible

---

## Pieges a eviter

### ❌ Ne PAS faire

- Utiliser `tabIndex="-1"` sur elements interactifs
- Supprimer les outlines de focus sans alternative
- Creer des raccourcis sur touche unique sans modificateur
- Bloquer Tab en dehors des modales

### ✅ Bonnes pratiques

- Toujours tester au clavier avant validation
- Verifier l ordre de tabulation logique
- S assurer que tous les boutons sont activables a l Entree
- Utiliser des labels explicites sur tous les champs

---

## Compatibilite lecteurs d ecran

### NVDA (Windows)

| Raccourci NVDA | Action AccessCity |
|----------------|-------------------|
| `Insert + F7` | Liste des landmarks |
| `H` | Titre suivant |
| `B` | Bouton suivant |
| `E` | Champ de saisie suivant |
| `Tab` | Element interactif suivant |

### VoiceOver (macOS)

| Raccourci VO | Action AccessCity |
|--------------|-------------------|
| `VO + U` | Rotor (navigation rapide) |
| `VO + Cmd + H` | Titre suivant |
| `VO + Cmd + J` | Controle suivant |
| `Tab` | Element interactif suivant |

---

## Tests de conformite

### Checklist manuelle

- [ ] Tous les elements sont atteignables au Tab
- [ ] L ordre de tabulation est logique
- [ ] Le focus est toujours visible
- [ ] Les modales piege le focus correctement
- [ ] Echap ferme bien les modales
- [ ] Les toasts sont annonces aux lecteurs d ecran
- [ ] Aucun piege clavier (on peut toujours sortir)

### Commande de test

```bash
# Demarrer l application
npm run dev

# Dans le navigateur :
# 1. Debrancher la souris
# 2. Naviguer uniquement au clavier
# 3. Verifier que tout est accessible
```

---

**Documentation complete** : Voir [ACCESSIBILITY.md](./ACCESSIBILITY.md)

**Derniere mise a jour** : 7 decembre 2025
