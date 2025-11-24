# FUTURE FEATURES (Modules preparés mais non activés)

## Modules "Patch" (Prêts pour Phase 6.0)
- `core/applyScenesPatch.js` - Application incremental de patches scenes
- `core/applyUiLayoutPatch.js` - Application incremental de patches UI
- **Usage futur** : Permettre modifications partielles sans recharger tout

## Panneaux UI additionnels (Masqués)
- `ui/DevToolsPanel.js` - Panneau debug (ecoute event 'ready')
- `ui/DialogueList.js` - Liste dialogues isolee
- **Activation** : Mettre `visible: true` dans `ui_layout.json`

## Fichiers legacy/inutilisés
- `test/test-phase3.js` - Stub vide (legacy)
- `test/run-all.js` - A implementer pour lancer tous tests
- `test-direct.html` - Mode debug standalone

## Notes
- Ces modules sont fonctionnels mais non integres
- Garder pour compatibilite ascendante
- Documenter avant suppression
