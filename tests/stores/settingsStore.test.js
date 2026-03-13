/**
 * SettingsStore Tests
 *
 * Couvre :
 *   - setContextField / updateProjectData
 *   - updateProjectSettings
 *   - setVariable / modifyVariable (avec clampement)
 *   - setLanguage / setEnableStatsHUD
 *   - setCharacterFx
 *   - setUiSoundsVolume / setUiSoundStyle / setUiSoundsTickInterval
 *   - addAssetCollection / removeAssetCollection / renameAssetCollection
 *   - addAssetToCollection / removeAssetFromCollection
 *   - setAssetDisplayName
 *   - updateDialogueBoxDefaults
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore, DEFAULT_CHARACTER_FX } from '../../src/stores/settingsStore.js';

// Récupérer les valeurs DEFAULT une seule fois pour les assertions
const INITIAL_STATE = useSettingsStore.getState();

describe('SettingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      projectData: { title: 'Sans titre', location: '', tone: 'realiste', description: '' },
      projectSettings: INITIAL_STATE.projectSettings,
      variables: { physique: 100, mentale: 100 },
      language: 'fr',
      enableStatsHUD: false,
      characterFx: { ...DEFAULT_CHARACTER_FX },
      uiSoundsVolume: 0.3,
      uiSoundStyle: 'mecanique',
      uiSoundsTickInterval: 65,
      assetCollections: [],
      assetDisplayNames: {},
    });
  });

  // ─── projectData ──────────────────────────────────────────────────────────

  describe('setContextField()', () => {
    it('met à jour un champ unique de projectData', () => {
      const { setContextField } = useSettingsStore.getState();
      setContextField('title', 'Mon Projet');
      expect(useSettingsStore.getState().projectData.title).toBe('Mon Projet');
    });

    it('ne modifie pas les autres champs de projectData', () => {
      const { setContextField } = useSettingsStore.getState();
      setContextField('location', 'Paris');
      expect(useSettingsStore.getState().projectData.title).toBe('Sans titre');
      expect(useSettingsStore.getState().projectData.location).toBe('Paris');
    });
  });

  describe('updateProjectData()', () => {
    it('met à jour plusieurs champs en une seule opération', () => {
      const { updateProjectData } = useSettingsStore.getState();
      updateProjectData({ title: 'Nouveau', description: 'Une belle histoire.' });
      const pd = useSettingsStore.getState().projectData;
      expect(pd.title).toBe('Nouveau');
      expect(pd.description).toBe('Une belle histoire.');
      expect(pd.tone).toBe('realiste'); // inchangé
    });
  });

  // ─── variables (jeu) ──────────────────────────────────────────────────────

  describe('setVariable()', () => {
    it('définit une variable à la valeur exacte', () => {
      const { setVariable } = useSettingsStore.getState();
      setVariable('physique', 42);
      expect(useSettingsStore.getState().variables.physique).toBe(42);
    });

    it('crée une nouvelle variable si elle n\'existait pas', () => {
      const { setVariable } = useSettingsStore.getState();
      setVariable('courage', 75);
      expect(useSettingsStore.getState().variables.courage).toBe(75);
    });
  });

  describe('modifyVariable()', () => {
    it('applique un delta positif', () => {
      const { modifyVariable } = useSettingsStore.getState();
      modifyVariable('physique', -20); // 100 - 20 = 80
      expect(useSettingsStore.getState().variables.physique).toBe(80);
    });

    it('plafonne à 100 (MAX)', () => {
      const { modifyVariable } = useSettingsStore.getState();
      modifyVariable('physique', 50); // 100 + 50 = 150 → clampé à 100
      expect(useSettingsStore.getState().variables.physique).toBe(100);
    });

    it('plancher à 0 (MIN)', () => {
      const { setVariable, modifyVariable } = useSettingsStore.getState();
      setVariable('physique', 5);
      modifyVariable('physique', -50); // 5 - 50 = -45 → clampé à 0
      expect(useSettingsStore.getState().variables.physique).toBe(0);
    });

    it('traite une variable inconnue comme 0', () => {
      const { modifyVariable } = useSettingsStore.getState();
      modifyVariable('inconnu', 30); // 0 + 30 = 30
      expect(useSettingsStore.getState().variables.inconnu).toBe(30);
    });
  });

  // ─── language / enableStatsHUD ────────────────────────────────────────────

  describe('setLanguage()', () => {
    it('bascule vers la langue cible', () => {
      const { setLanguage } = useSettingsStore.getState();
      setLanguage('en');
      expect(useSettingsStore.getState().language).toBe('en');
    });
  });

  describe('setEnableStatsHUD()', () => {
    it('active le HUD', () => {
      const { setEnableStatsHUD } = useSettingsStore.getState();
      setEnableStatsHUD(true);
      expect(useSettingsStore.getState().enableStatsHUD).toBe(true);
    });

    it('désactive le HUD', () => {
      const { setEnableStatsHUD } = useSettingsStore.getState();
      setEnableStatsHUD(true);
      setEnableStatsHUD(false);
      expect(useSettingsStore.getState().enableStatsHUD).toBe(false);
    });
  });

  // ─── characterFx ─────────────────────────────────────────────────────────

  describe('setCharacterFx()', () => {
    it('applique un patch partiel sans écraser les autres champs', () => {
      const { setCharacterFx } = useSettingsStore.getState();
      setCharacterFx({ breatheEnabled: false, breatheIntensity: 1.5 });
      const fx = useSettingsStore.getState().characterFx;
      expect(fx.breatheEnabled).toBe(false);
      expect(fx.breatheIntensity).toBe(1.5);
      expect(fx.speakingEnabled).toBe(DEFAULT_CHARACTER_FX.speakingEnabled); // inchangé
    });
  });

  // ─── UI Sounds ────────────────────────────────────────────────────────────

  describe('setUiSoundsVolume()', () => {
    it('définit le volume dans la plage [0, 1]', () => {
      const { setUiSoundsVolume } = useSettingsStore.getState();
      setUiSoundsVolume(0.7);
      expect(useSettingsStore.getState().uiSoundsVolume).toBe(0.7);
    });

    it('clampé à 0 minimum', () => {
      const { setUiSoundsVolume } = useSettingsStore.getState();
      setUiSoundsVolume(-0.5);
      expect(useSettingsStore.getState().uiSoundsVolume).toBe(0);
    });

    it('clampé à 1 maximum', () => {
      const { setUiSoundsVolume } = useSettingsStore.getState();
      setUiSoundsVolume(2);
      expect(useSettingsStore.getState().uiSoundsVolume).toBe(1);
    });
  });

  describe('setUiSoundStyle()', () => {
    it('met à jour le style', () => {
      const { setUiSoundStyle } = useSettingsStore.getState();
      setUiSoundStyle('vintage');
      expect(useSettingsStore.getState().uiSoundStyle).toBe('vintage');
    });
  });

  describe('setUiSoundsTickInterval()', () => {
    it('accepte une valeur dans la plage [35, 130]', () => {
      const { setUiSoundsTickInterval } = useSettingsStore.getState();
      setUiSoundsTickInterval(100);
      expect(useSettingsStore.getState().uiSoundsTickInterval).toBe(100);
    });

    it('clampé à 35 minimum', () => {
      const { setUiSoundsTickInterval } = useSettingsStore.getState();
      setUiSoundsTickInterval(10);
      expect(useSettingsStore.getState().uiSoundsTickInterval).toBe(35);
    });

    it('clampé à 130 maximum', () => {
      const { setUiSoundsTickInterval } = useSettingsStore.getState();
      setUiSoundsTickInterval(200);
      expect(useSettingsStore.getState().uiSoundsTickInterval).toBe(130);
    });
  });

  // ─── assetCollections ─────────────────────────────────────────────────────

  describe('addAssetCollection()', () => {
    it('crée une collection avec le nom fourni', () => {
      const { addAssetCollection } = useSettingsStore.getState();
      const id = addAssetCollection('Favoris');
      const cols = useSettingsStore.getState().assetCollections;
      expect(cols).toHaveLength(1);
      expect(cols[0].name).toBe('Favoris');
      expect(cols[0].id).toBe(id);
      expect(cols[0].assetIds).toEqual([]);
    });

    it('génère des IDs uniques', () => {
      const { addAssetCollection } = useSettingsStore.getState();
      const id1 = addAssetCollection('A');
      const id2 = addAssetCollection('B');
      expect(id1).not.toBe(id2);
    });
  });

  describe('removeAssetCollection()', () => {
    it('supprime la collection ciblée', () => {
      const { addAssetCollection, removeAssetCollection } = useSettingsStore.getState();
      const id = addAssetCollection('Test');
      removeAssetCollection(id);
      expect(useSettingsStore.getState().assetCollections).toHaveLength(0);
    });
  });

  describe('renameAssetCollection()', () => {
    it('renomme la collection', () => {
      const { addAssetCollection, renameAssetCollection } = useSettingsStore.getState();
      const id = addAssetCollection('Ancien nom');
      renameAssetCollection(id, 'Nouveau nom');
      const col = useSettingsStore.getState().assetCollections[0];
      expect(col.name).toBe('Nouveau nom');
    });
  });

  describe('addAssetToCollection()', () => {
    it('ajoute un assetId à la collection', () => {
      const { addAssetCollection, addAssetToCollection } = useSettingsStore.getState();
      const colId = addAssetCollection('Col');
      addAssetToCollection(colId, 'asset-123');
      const col = useSettingsStore.getState().assetCollections[0];
      expect(col.assetIds).toContain('asset-123');
    });

    it('n\'ajoute pas en double un asset déjà présent', () => {
      const { addAssetCollection, addAssetToCollection } = useSettingsStore.getState();
      const colId = addAssetCollection('Col');
      addAssetToCollection(colId, 'asset-abc');
      addAssetToCollection(colId, 'asset-abc');
      const col = useSettingsStore.getState().assetCollections[0];
      expect(col.assetIds.filter(id => id === 'asset-abc')).toHaveLength(1);
    });
  });

  describe('removeAssetFromCollection()', () => {
    it('retire l\'assetId de la collection', () => {
      const { addAssetCollection, addAssetToCollection, removeAssetFromCollection } = useSettingsStore.getState();
      const colId = addAssetCollection('Col');
      addAssetToCollection(colId, 'asset-xyz');
      removeAssetFromCollection(colId, 'asset-xyz');
      const col = useSettingsStore.getState().assetCollections[0];
      expect(col.assetIds).not.toContain('asset-xyz');
    });
  });

  // ─── assetDisplayNames ────────────────────────────────────────────────────

  describe('setAssetDisplayName()', () => {
    it('associe un nom d\'affichage à un chemin d\'asset', () => {
      const { setAssetDisplayName } = useSettingsStore.getState();
      setAssetDisplayName('/assets/bg/city.png', 'Vue sur la ville');
      const names = useSettingsStore.getState().assetDisplayNames;
      expect(names['/assets/bg/city.png']).toBe('Vue sur la ville');
    });
  });

  // ─── updateDialogueBoxDefaults ────────────────────────────────────────────

  describe('updateDialogueBoxDefaults()', () => {
    it('met à jour les paramètres de la boîte de dialogue par défaut', () => {
      const { updateDialogueBoxDefaults } = useSettingsStore.getState();
      updateDialogueBoxDefaults({ fontSize: '16px', opacity: 0.9 });
      const defaults = useSettingsStore.getState().projectSettings.game.dialogueBoxDefaults;
      expect(defaults?.fontSize).toBe('16px');
      expect(defaults?.opacity).toBe(0.9);
    });

    it('merge avec les valeurs existantes (ne réinitialise pas)', () => {
      const { updateDialogueBoxDefaults } = useSettingsStore.getState();
      updateDialogueBoxDefaults({ fontSize: '14px' });
      updateDialogueBoxDefaults({ opacity: 0.8 });
      const defaults = useSettingsStore.getState().projectSettings.game.dialogueBoxDefaults;
      expect(defaults?.fontSize).toBe('14px');
      expect(defaults?.opacity).toBe(0.8);
    });
  });
});
