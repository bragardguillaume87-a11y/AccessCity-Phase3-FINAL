/**
 * UIStore Tests
 *
 * Couvre les actions de uiStore :
 *   - Layout (activeModal, activeSection, fullscreenMode, commandPalette)
 *   - Scène sélectionnée (selectedSceneId, selectedSceneForEdit)
 *   - Dialogues (wizard, graph modal)
 *   - Éditeur cinématique
 *   - Thème graphe (graphThemeId)
 *   - Mode éditeur (kid/pro)
 *   - Module studio (activeModule)
 *   - Serpentine layout (enable/disable, exclusion mutuelle)
 *   - Pro mode clusters (toggle, collapse, expand)
 *   - Pagination pro
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../../src/stores/uiStore.js';

// ── Reset helper ──────────────────────────────────────────────────────────────

function resetStore() {
  useUIStore.setState({
    fullscreenMode: null,
    activeSection: null,
    activeModal: null,
    modalContext: {},
    showProblemsPanel: false,
    commandPaletteOpen: false,
    selectedSceneId: null,
    selectedSceneForEdit: null,
    lastSaved: null,
    isSaving: false,
    announcement: '',
    urgentAnnouncement: '',
    dialogueWizardOpen: false,
    dialogueWizardEditIndex: undefined,
    dialogueWizardInitialComplexity: null,
    dialogueGraphModalOpen: false,
    dialogueGraphSelectedScene: null,
    cinematicEditorOpen: false,
    cinematicEditorSceneId: null,
    graphThemeId: 'default',
    serpentineEnabled: false,
    serpentineMode: 'branch-aware',
    serpentineDirection: 'grid',
    serpentineGroupSize: 6,
    editorMode: 'pro',
    activeModule: 'vn-editor',
    proModeEnabled: false,
    proModeDirection: 'TB',
    proCollapseEnabled: false,
    proExpandedClusters: [],
    proPaginationEnabled: false,
    proPageSize: 8,
    proCurrentPage: 0,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('UIStore', () => {
  beforeEach(resetStore);

  // ── Layout ────────────────────────────────────────────────────────────────

  describe('setActiveModal()', () => {
    it('ouvre une modale', () => {
      useUIStore.getState().setActiveModal('characters');
      expect(useUIStore.getState().activeModal).toBe('characters');
    });

    it('ferme la modale avec null', () => {
      useUIStore.getState().setActiveModal('assets');
      useUIStore.getState().setActiveModal(null);
      expect(useUIStore.getState().activeModal).toBeNull();
    });
  });

  describe('setActiveSection()', () => {
    it('définit la section active', () => {
      useUIStore.getState().setActiveSection('dialogues');
      expect(useUIStore.getState().activeSection).toBe('dialogues');
    });

    it('accepte null pour désélectionner', () => {
      useUIStore.getState().setActiveSection('scenes');
      useUIStore.getState().setActiveSection(null);
      expect(useUIStore.getState().activeSection).toBeNull();
    });
  });

  describe('setFullscreenMode()', () => {
    it('passe en mode plein écran canvas', () => {
      useUIStore.getState().setFullscreenMode('canvas');
      expect(useUIStore.getState().fullscreenMode).toBe('canvas');
    });
  });

  describe('setCommandPaletteOpen()', () => {
    it('ouvre la palette de commandes', () => {
      useUIStore.getState().setCommandPaletteOpen(true);
      expect(useUIStore.getState().commandPaletteOpen).toBe(true);
    });

    it('accepte une chaîne comme query initiale', () => {
      useUIStore.getState().setCommandPaletteOpen('scène');
      expect(useUIStore.getState().commandPaletteOpen).toBe('scène');
    });
  });

  describe('setShowProblemsPanel()', () => {
    it('affiche le panneau des problèmes', () => {
      useUIStore.getState().setShowProblemsPanel(true);
      expect(useUIStore.getState().showProblemsPanel).toBe(true);
    });
  });

  // ── Scène ─────────────────────────────────────────────────────────────────

  describe('setSelectedSceneId()', () => {
    it('sélectionne une scène', () => {
      useUIStore.getState().setSelectedSceneId('scene-42');
      expect(useUIStore.getState().selectedSceneId).toBe('scene-42');
    });
  });

  describe('setSelectedSceneForEdit()', () => {
    it('sélectionne une scène pour édition', () => {
      useUIStore.getState().setSelectedSceneForEdit('scene-edit');
      expect(useUIStore.getState().selectedSceneForEdit).toBe('scene-edit');
    });
  });

  describe('setLastSaved() / setIsSaving()', () => {
    it('met à jour lastSaved et isSaving', () => {
      const now = new Date().toISOString();
      useUIStore.getState().setLastSaved(now);
      useUIStore.getState().setIsSaving(true);
      expect(useUIStore.getState().lastSaved).toBe(now);
      expect(useUIStore.getState().isSaving).toBe(true);
    });
  });

  describe('setAnnouncement() / setUrgentAnnouncement()', () => {
    it('définit les annonces screen reader', () => {
      useUIStore.getState().setAnnouncement('Scène sauvegardée');
      useUIStore.getState().setUrgentAnnouncement('Erreur critique');
      expect(useUIStore.getState().announcement).toBe('Scène sauvegardée');
      expect(useUIStore.getState().urgentAnnouncement).toBe('Erreur critique');
    });
  });

  // ── Dialogue Wizard ───────────────────────────────────────────────────────

  describe('setDialogueWizardOpen()', () => {
    it('ouvre et ferme le wizard', () => {
      useUIStore.getState().setDialogueWizardOpen(true);
      expect(useUIStore.getState().dialogueWizardOpen).toBe(true);
      useUIStore.getState().setDialogueWizardOpen(false);
      expect(useUIStore.getState().dialogueWizardOpen).toBe(false);
    });
  });

  describe('setDialogueWizardEditIndex()', () => {
    it("définit l'index d'édition", () => {
      useUIStore.getState().setDialogueWizardEditIndex(3);
      expect(useUIStore.getState().dialogueWizardEditIndex).toBe(3);
    });
  });

  describe('setDialogueWizardInitialComplexity() / clearDialogueWizardInitialComplexity()', () => {
    it('définit et efface la complexité initiale', () => {
      useUIStore.getState().setDialogueWizardInitialComplexity('choice');
      expect(useUIStore.getState().dialogueWizardInitialComplexity).toBe('choice');
      useUIStore.getState().clearDialogueWizardInitialComplexity();
      expect(useUIStore.getState().dialogueWizardInitialComplexity).toBeNull();
    });
  });

  // ── Dialogue Graph Modal ──────────────────────────────────────────────────

  describe('setDialogueGraphModalOpen()', () => {
    it('ouvre le graphe de dialogues', () => {
      useUIStore.getState().setDialogueGraphModalOpen(true);
      expect(useUIStore.getState().dialogueGraphModalOpen).toBe(true);
    });
  });

  describe('setDialogueGraphSelectedScene()', () => {
    it('sélectionne une scène pour le graphe', () => {
      useUIStore.getState().setDialogueGraphSelectedScene('scene-1');
      expect(useUIStore.getState().dialogueGraphSelectedScene).toBe('scene-1');
    });
  });

  // ── Cinematic Editor ──────────────────────────────────────────────────────

  describe('setCinematicEditorOpen()', () => {
    it("ouvre l'éditeur cinématique avec une scène", () => {
      useUIStore.getState().setCinematicEditorOpen(true, 'scene-abc');
      expect(useUIStore.getState().cinematicEditorOpen).toBe(true);
      expect(useUIStore.getState().cinematicEditorSceneId).toBe('scene-abc');
    });

    it('ferme sans scène → sceneId null', () => {
      useUIStore.getState().setCinematicEditorOpen(true, 'scene-abc');
      useUIStore.getState().setCinematicEditorOpen(false);
      expect(useUIStore.getState().cinematicEditorOpen).toBe(false);
      expect(useUIStore.getState().cinematicEditorSceneId).toBeNull();
    });
  });

  // ── Graph Theme ───────────────────────────────────────────────────────────

  describe('setGraphThemeId()', () => {
    it('change le thème du graphe', () => {
      useUIStore.getState().setGraphThemeId('cosmos-dark');
      expect(useUIStore.getState().graphThemeId).toBe('cosmos-dark');
    });
  });

  // ── Editor Mode ───────────────────────────────────────────────────────────

  describe('setEditorMode()', () => {
    it('passe en mode kid', () => {
      useUIStore.getState().setEditorMode('kid');
      expect(useUIStore.getState().editorMode).toBe('kid');
    });

    it('repasse en mode pro', () => {
      useUIStore.getState().setEditorMode('kid');
      useUIStore.getState().setEditorMode('pro');
      expect(useUIStore.getState().editorMode).toBe('pro');
    });
  });

  // ── Active Module ─────────────────────────────────────────────────────────

  describe('setActiveModule()', () => {
    it('bascule vers le module topdown', () => {
      useUIStore.getState().setActiveModule('topdown-editor');
      expect(useUIStore.getState().activeModule).toBe('topdown-editor');
    });

    it('revient au module vn-editor', () => {
      useUIStore.getState().setActiveModule('topdown-editor');
      useUIStore.getState().setActiveModule('vn-editor');
      expect(useUIStore.getState().activeModule).toBe('vn-editor');
    });
  });

  // ── Serpentine Layout ─────────────────────────────────────────────────────

  describe('setSerpentineEnabled()', () => {
    it('active le layout serpentine', () => {
      useUIStore.getState().setSerpentineEnabled(true);
      expect(useUIStore.getState().serpentineEnabled).toBe(true);
    });

    it('désactive le pro mode si serpentine activé (exclusion mutuelle)', () => {
      useUIStore.setState({ proModeEnabled: true });
      useUIStore.getState().setSerpentineEnabled(true);
      expect(useUIStore.getState().serpentineEnabled).toBe(true);
      expect(useUIStore.getState().proModeEnabled).toBe(false);
    });

    it('désactive le serpentine sans effet si pro mode off', () => {
      useUIStore.getState().setSerpentineEnabled(false);
      expect(useUIStore.getState().serpentineEnabled).toBe(false);
    });
  });

  describe('setSerpentineMode()', () => {
    it('change le mode serpentine', () => {
      useUIStore.getState().setSerpentineMode('auto-y');
      expect(useUIStore.getState().serpentineMode).toBe('auto-y');
    });
  });

  describe('setSerpentineDirection()', () => {
    it('change la direction serpentine', () => {
      useUIStore.getState().setSerpentineDirection('zigzag');
      expect(useUIStore.getState().serpentineDirection).toBe('zigzag');
    });
  });

  describe('setSerpentineGroupSize()', () => {
    it('change la taille du groupe', () => {
      useUIStore.getState().setSerpentineGroupSize(10);
      expect(useUIStore.getState().serpentineGroupSize).toBe(10);
    });
  });

  // ── Pro Mode ──────────────────────────────────────────────────────────────

  describe('setProModeEnabled()', () => {
    it('active le pro mode', () => {
      useUIStore.getState().setProModeEnabled(true);
      expect(useUIStore.getState().proModeEnabled).toBe(true);
    });

    it('désactive serpentine si pro mode activé (exclusion mutuelle)', () => {
      useUIStore.setState({ serpentineEnabled: true });
      useUIStore.getState().setProModeEnabled(true);
      expect(useUIStore.getState().proModeEnabled).toBe(true);
      expect(useUIStore.getState().serpentineEnabled).toBe(false);
    });
  });

  describe('setProModeDirection()', () => {
    it('change la direction du graphe pro', () => {
      useUIStore.getState().setProModeDirection('LR');
      expect(useUIStore.getState().proModeDirection).toBe('LR');
    });
  });

  describe('setProCollapseEnabled()', () => {
    it('active le collapse des clusters', () => {
      useUIStore.getState().setProCollapseEnabled(true);
      expect(useUIStore.getState().proCollapseEnabled).toBe(true);
    });
  });

  describe('toggleClusterExpanded()', () => {
    it('ajoute un cluster aux expansions', () => {
      useUIStore.getState().toggleClusterExpanded('cluster-A');
      expect(useUIStore.getState().proExpandedClusters).toContain('cluster-A');
    });

    it('retire un cluster déjà présent', () => {
      useUIStore.getState().toggleClusterExpanded('cluster-A');
      useUIStore.getState().toggleClusterExpanded('cluster-A');
      expect(useUIStore.getState().proExpandedClusters).not.toContain('cluster-A');
    });
  });

  describe('collapseAllClusters()', () => {
    it('vide la liste des clusters expansés', () => {
      useUIStore.setState({ proExpandedClusters: ['A', 'B', 'C'] });
      useUIStore.getState().collapseAllClusters();
      expect(useUIStore.getState().proExpandedClusters).toHaveLength(0);
    });
  });

  describe('expandAllClusters()', () => {
    it('remplace la liste avec tous les ids fournis', () => {
      useUIStore.getState().expandAllClusters(['A', 'B', 'C']);
      expect(useUIStore.getState().proExpandedClusters).toEqual(['A', 'B', 'C']);
    });
  });

  // ── Pagination Pro ────────────────────────────────────────────────────────

  describe('Pagination Pro', () => {
    it('setProPaginationEnabled() active la pagination et reset la page', () => {
      useUIStore.setState({ proCurrentPage: 3 });
      useUIStore.getState().setProPaginationEnabled(true);
      expect(useUIStore.getState().proPaginationEnabled).toBe(true);
      expect(useUIStore.getState().proCurrentPage).toBe(0);
    });

    it('setProPageSize() change la taille et reset la page', () => {
      useUIStore.setState({ proCurrentPage: 2 });
      useUIStore.getState().setProPageSize(12);
      expect(useUIStore.getState().proPageSize).toBe(12);
      expect(useUIStore.getState().proCurrentPage).toBe(0);
    });

    it('setProCurrentPage() navigue vers la bonne page', () => {
      useUIStore.getState().setProCurrentPage(5);
      expect(useUIStore.getState().proCurrentPage).toBe(5);
    });
  });

  describe('setModalContext()', () => {
    it('stocke le contexte de la modale', () => {
      useUIStore.getState().setModalContext({ sceneId: 'sc-1', action: 'edit' });
      expect(useUIStore.getState().modalContext).toMatchObject({ sceneId: 'sc-1' });
    });
  });
});
