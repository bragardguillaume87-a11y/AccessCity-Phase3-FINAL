/**
 * Tests — stores/selectors/index.ts
 *
 * Valide l'invariant architectural fondamental du projet (Phase 3) :
 *   scenesStore.scenes[n].dialogues est TOUJOURS [].
 *   Les données réelles viennent de dialoguesStore + sceneElementsStore.
 *
 * Selectors couverts :
 *   - useSceneWithElements()      (1 scène fusionnée depuis 3 stores)
 *   - useAllScenesWithElements()  (toutes les scènes fusionnées)
 *   - useSceneDialogues()         (raccourci dialoguesStore)
 *
 * Ces hooks sont React (useMemo + hooks Zustand) → renderHook requis.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScenesStore } from '../../src/stores/scenesStore.js';
import { useDialoguesStore } from '../../src/stores/dialoguesStore.js';
import { useSceneElementsStore } from '../../src/stores/sceneElementsStore.js';
import {
  useSceneWithElements,
  useAllScenesWithElements,
  useSceneDialogues,
} from '../../src/stores/selectors/index.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function resetStores() {
  useScenesStore.setState({ scenes: [] });
  useDialoguesStore.setState({ dialoguesByScene: {} });
  useSceneElementsStore.setState({ elementsByScene: {} });
}

/** Ajoute une scène dans scenesStore et retourne son ID. */
function addTestScene(title = 'Scène test'): string {
  const id = useScenesStore.getState().addScene();
  useScenesStore.getState().updateScene(id, { title });
  return id;
}

// ── useSceneWithElements ──────────────────────────────────────────────────────

describe('useSceneWithElements()', () => {
  beforeEach(resetStores);

  it('retourne undefined si sceneId est undefined', () => {
    const { result } = renderHook(() => useSceneWithElements(undefined));
    expect(result.current).toBeUndefined();
  });

  it('retourne undefined si la scène est absente des stores', () => {
    const { result } = renderHook(() => useSceneWithElements('id-inexistant'));
    expect(result.current).toBeUndefined();
  });

  it('retourne la scène avec ses métadonnées (titre, backgroundUrl)', () => {
    const id = addTestScene('Introduction');
    useScenesStore.getState().updateScene(id, { backgroundUrl: '/bg.png' });

    const { result } = renderHook(() => useSceneWithElements(id));

    expect(result.current).toBeDefined();
    expect(result.current!.id).toBe(id);
    expect(result.current!.title).toBe('Introduction');
    expect(result.current!.backgroundUrl).toBe('/bg.png');
  });

  // ── INVARIANT CRITIQUE (CLAUDE.md §3 — Store Split) ──────────────────────

  it('INVARIANT : dialogues viennent de dialoguesStore, pas de scenesStore', () => {
    const id = addTestScene();

    // scenesStore n'a PAS de dialogues (architecture Phase 3)
    expect(useScenesStore.getState().scenes[0].dialogues).toBeUndefined();

    // Injecter des dialogues dans dialoguesStore
    useDialoguesStore.setState({
      dialoguesByScene: {
        [id]: [
          { id: 'd1', speaker: 'Alice', text: 'Bonjour', choices: [], isResponse: false },
          { id: 'd2', speaker: 'Bob', text: 'Salut', choices: [], isResponse: false },
        ],
      },
    });

    const { result } = renderHook(() => useSceneWithElements(id));

    // Le selector DOIT retourner les vrais dialogues
    expect(result.current!.dialogues).toHaveLength(2);
    expect(result.current!.dialogues[0].id).toBe('d1');
    expect(result.current!.dialogues[1].id).toBe('d2');
  });

  it('retourne [] pour dialogues si aucun dialogue pour cette scène', () => {
    const id = addTestScene();
    const { result } = renderHook(() => useSceneWithElements(id));
    expect(result.current!.dialogues).toEqual([]);
  });

  it('fusionne les personnages depuis sceneElementsStore', () => {
    const id = addTestScene();
    useSceneElementsStore.setState({
      elementsByScene: {
        [id]: {
          characters: [
            { id: 'sc1', characterId: 'char-alice', mood: 'happy', position: { x: 0.3, y: 0.8 } },
          ],
          textBoxes: [],
          props: [],
        },
      },
    });

    const { result } = renderHook(() => useSceneWithElements(id));

    expect(result.current!.characters).toHaveLength(1);
    expect(result.current!.characters[0].characterId).toBe('char-alice');
  });

  it('fusionne les données des 3 stores en même temps (dialogues + personnages + props)', () => {
    const id = addTestScene();

    useDialoguesStore.setState({
      dialoguesByScene: {
        [id]: [{ id: 'd1', speaker: 'Alice', text: 'Coucou', choices: [], isResponse: false }],
      },
    });
    useSceneElementsStore.setState({
      elementsByScene: {
        [id]: {
          characters: [
            { id: 'sc1', characterId: 'char-1', mood: 'neutral', position: { x: 0.5, y: 0.8 } },
          ],
          textBoxes: [
            { id: 'tb1', text: 'Une textbox', position: { x: 0.1, y: 0.1 }, style: {} as never },
          ],
          props: [{ id: 'p1', name: 'Chaise', url: '', position: { x: 0.2, y: 0.5 } }],
        },
      },
    });

    const { result } = renderHook(() => useSceneWithElements(id));

    expect(result.current!.dialogues).toHaveLength(1);
    expect(result.current!.characters).toHaveLength(1);
    expect(result.current!.textBoxes).toHaveLength(1);
    expect(result.current!.props).toHaveLength(1);
  });

  it("retourne des tableaux vides stables (pas undefined) quand une scène n'a pas d'éléments", () => {
    const id = addTestScene();
    const { result } = renderHook(() => useSceneWithElements(id));

    expect(Array.isArray(result.current!.dialogues)).toBe(true);
    expect(Array.isArray(result.current!.characters)).toBe(true);
    expect(Array.isArray(result.current!.textBoxes)).toBe(true);
    expect(Array.isArray(result.current!.props)).toBe(true);
  });
});

// ── useAllScenesWithElements ──────────────────────────────────────────────────

describe('useAllScenesWithElements()', () => {
  beforeEach(resetStores);

  it('retourne [] si aucune scène', () => {
    const { result } = renderHook(() => useAllScenesWithElements());
    expect(result.current).toEqual([]);
  });

  it('retourne toutes les scènes avec leurs métadonnées', () => {
    const id1 = addTestScene('Scène 1');
    const id2 = addTestScene('Scène 2');

    const { result } = renderHook(() => useAllScenesWithElements());

    expect(result.current).toHaveLength(2);
    expect(result.current[0].id).toBe(id1);
    expect(result.current[1].id).toBe(id2);
  });

  it('INVARIANT : fusionne dialogues depuis dialoguesStore pour chaque scène', () => {
    const id1 = addTestScene('Scène A');
    const id2 = addTestScene('Scène B');

    useDialoguesStore.setState({
      dialoguesByScene: {
        [id1]: [{ id: 'd1', speaker: 'A', text: 'Scène A texte', choices: [], isResponse: false }],
        [id2]: [
          { id: 'd2', speaker: 'B', text: 'Scène B texte 1', choices: [], isResponse: false },
          { id: 'd3', speaker: 'B', text: 'Scène B texte 2', choices: [], isResponse: false },
        ],
      },
    });

    const { result } = renderHook(() => useAllScenesWithElements());

    const sceneA = result.current.find((s) => s.id === id1)!;
    const sceneB = result.current.find((s) => s.id === id2)!;

    expect(sceneA.dialogues).toHaveLength(1);
    expect(sceneB.dialogues).toHaveLength(2);
  });

  it('les scènes sans dialogues ont dialogues=[] (pas undefined)', () => {
    addTestScene();
    addTestScene();

    const { result } = renderHook(() => useAllScenesWithElements());

    result.current.forEach((scene) => {
      expect(Array.isArray(scene.dialogues)).toBe(true);
      expect(scene.dialogues).toHaveLength(0);
    });
  });

  it('une scène avec éléments + une scène sans — les deux coexistent correctement', () => {
    const id1 = addTestScene('Avec éléments');
    const id2 = addTestScene('Vide');

    useSceneElementsStore.setState({
      elementsByScene: {
        [id1]: {
          characters: [{ id: 'sc1', characterId: 'c1', mood: 'happy', position: { x: 0, y: 0 } }],
          textBoxes: [],
          props: [],
        },
      },
    });

    const { result } = renderHook(() => useAllScenesWithElements());

    const s1 = result.current.find((s) => s.id === id1)!;
    const s2 = result.current.find((s) => s.id === id2)!;

    expect(s1.characters).toHaveLength(1);
    expect(s2.characters).toHaveLength(0);
  });
});

// ── useSceneDialogues ─────────────────────────────────────────────────────────

describe('useSceneDialogues()', () => {
  beforeEach(resetStores);

  it('retourne [] si aucun dialogue pour cette scène', () => {
    const { result } = renderHook(() => useSceneDialogues('id-vide'));
    expect(result.current).toEqual([]);
  });

  it("retourne les dialogues d'une scène connue", () => {
    const id = addTestScene();
    useDialoguesStore.setState({
      dialoguesByScene: {
        [id]: [
          {
            id: 'd1',
            speaker: 'Narrateur',
            text: 'Il était une fois',
            choices: [],
            isResponse: false,
          },
        ],
      },
    });

    const { result } = renderHook(() => useSceneDialogues(id));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].text).toBe('Il était une fois');
  });
});
