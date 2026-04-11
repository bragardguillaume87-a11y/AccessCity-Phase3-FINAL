import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import { shallow } from 'zustand/shallow';
import { setupAutoSave } from '../utils/storeSubscribers';
import type {
  CharacterRig,
  Bone,
  SpritePart,
  BonePose,
  AnimationClip,
  KeyframeEntry,
  IKChain,
} from '../types/bone';
import { DEFAULT_KEYFRAME_DURATION } from '../types/bone';
import { generateId } from '../utils/generateId';
import { RIG_TEMPLATES } from '../config/rigTemplates';
import type { RigTemplate } from '../config/rigTemplates';
import { generateIdleClip } from '../utils/generateIdleClip';

/** Génère un tableau de KeyframeEntry depuis un tableau de poseIds (migration / défaut). */
function poseIdsToKeyframes(poseIds: string[]): KeyframeEntry[] {
  return poseIds.map((poseId) => ({
    poseId,
    duration: DEFAULT_KEYFRAME_DURATION,
    easing: 'linear' as const,
  }));
}

/**
 * Rig Store — Squelettes cut-out pour le module Distribution.
 * Modèle : charactersStore.ts (temporal + persist + devtools, PAS subscribeWithSelector).
 */

// ============================================================================
// TYPES
// ============================================================================

interface RigState {
  rigs: CharacterRig[];

  // Lecture
  getRigForCharacter: (characterId: string) => CharacterRig | undefined;

  // Rig CRUD
  addRig: (characterId: string) => string;
  updateRig: (rigId: string, patch: Partial<Omit<CharacterRig, 'id' | 'characterId'>>) => void;
  deleteRig: (rigId: string) => void;

  // Bone CRUD
  addBone: (rigId: string, bone: Omit<Bone, 'id'>) => string;
  updateBone: (rigId: string, boneId: string, patch: Partial<Omit<Bone, 'id'>>) => void;
  deleteBone: (rigId: string, boneId: string) => void;

  // SpritePart CRUD
  addPart: (rigId: string, part: Omit<SpritePart, 'id'>) => string;
  updatePart: (rigId: string, partId: string, patch: Partial<Omit<SpritePart, 'id'>>) => void;
  deletePart: (rigId: string, partId: string) => void;

  // BonePose CRUD
  addPose: (rigId: string, pose: Omit<BonePose, 'id'>) => string;
  updatePose: (rigId: string, poseId: string, patch: Partial<Omit<BonePose, 'id'>>) => void;
  deletePose: (rigId: string, poseId: string) => void;

  // AnimationClip CRUD
  addClip: (rigId: string, clip: Omit<AnimationClip, 'id'>) => string;
  updateClip: (rigId: string, clipId: string, patch: Partial<Omit<AnimationClip, 'id'>>) => void;
  deleteClip: (rigId: string, clipId: string) => void;

  // IKChain CRUD
  addIKChain: (rigId: string, chain: Omit<IKChain, 'id'>) => string;
  removeIKChain: (rigId: string, chainId: string) => void;

  // Template
  addRigFromTemplate: (characterId: string, templateId: string) => string | null;

  // Clip assignment
  setIdleClip: (rigId: string, clipId: string | null) => void;
  setSpeakClip: (rigId: string, clipId: string | null) => void;
  /** Génère et ajoute un clip idle breathing. Retourne le clipId créé, ou null si impossible. */
  generateAndAddIdleClip: (characterId: string) => string | null;

  // Import (restauration de projet)
  importRigs: (rigs: CharacterRig[]) => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useRigStore = create<RigState>()(
  temporal(
    persist(
      devtools(
        (set, get) => ({
          rigs: [],

          getRigForCharacter: (characterId) =>
            get().rigs.find((r) => r.characterId === characterId),

          // ── Rig ──────────────────────────────────────────────────────────────
          addRig: (characterId) => {
            const id = generateId('rig');
            const newRig: CharacterRig = {
              id,
              characterId,
              originX: 300,
              originY: 280,
              bones: [],
              parts: [],
              poses: [],
              animationClips: [],
              ikChains: [],
            };
            set((state) => ({ rigs: [...state.rigs, newRig] }), false, 'rigs/addRig');
            return id;
          },

          updateRig: (rigId, patch) => {
            set(
              (state) => ({
                rigs: state.rigs.map((r) => (r.id === rigId ? { ...r, ...patch } : r)),
              }),
              false,
              'rigs/updateRig'
            );
          },

          deleteRig: (rigId) => {
            set(
              (state) => ({
                rigs: state.rigs.filter((r) => r.id !== rigId),
              }),
              false,
              'rigs/deleteRig'
            );
          },

          // ── Bone ─────────────────────────────────────────────────────────────
          addBone: (rigId, bone) => {
            const id = generateId('bone');
            set(
              (state) => ({
                rigs: state.rigs.map((r) =>
                  r.id === rigId ? { ...r, bones: [...r.bones, { id, ...bone }] } : r
                ),
              }),
              false,
              'rigs/addBone'
            );
            return id;
          },

          updateBone: (rigId, boneId, patch) => {
            set(
              (state) => ({
                rigs: state.rigs.map((r) =>
                  r.id === rigId
                    ? {
                        ...r,
                        bones: r.bones.map((b) => (b.id === boneId ? { ...b, ...patch } : b)),
                      }
                    : r
                ),
              }),
              false,
              'rigs/updateBone'
            );
          },

          deleteBone: (rigId, boneId) => {
            set(
              (state) => ({
                rigs: state.rigs.map((r) =>
                  r.id === rigId ? { ...r, bones: r.bones.filter((b) => b.id !== boneId) } : r
                ),
              }),
              false,
              'rigs/deleteBone'
            );
          },

          // ── SpritePart ───────────────────────────────────────────────────────
          addPart: (rigId, part) => {
            const id = generateId('part');
            set(
              (state) => ({
                rigs: state.rigs.map((r) =>
                  r.id === rigId ? { ...r, parts: [...r.parts, { id, ...part }] } : r
                ),
              }),
              false,
              'rigs/addPart'
            );
            return id;
          },

          updatePart: (rigId, partId, patch) => {
            set(
              (state) => ({
                rigs: state.rigs.map((r) =>
                  r.id === rigId
                    ? {
                        ...r,
                        parts: r.parts.map((p) => (p.id === partId ? { ...p, ...patch } : p)),
                      }
                    : r
                ),
              }),
              false,
              'rigs/updatePart'
            );
          },

          deletePart: (rigId, partId) => {
            set(
              (state) => ({
                rigs: state.rigs.map((r) =>
                  r.id === rigId ? { ...r, parts: r.parts.filter((p) => p.id !== partId) } : r
                ),
              }),
              false,
              'rigs/deletePart'
            );
          },

          // ── BonePose ─────────────────────────────────────────────────────────
          addPose: (rigId, pose) => {
            const id = generateId('pose');
            set(
              (state) => ({
                rigs: state.rigs.map((r) =>
                  r.id === rigId ? { ...r, poses: [...r.poses, { id, ...pose }] } : r
                ),
              }),
              false,
              'rigs/addPose'
            );
            return id;
          },

          updatePose: (rigId, poseId, patch) => {
            set(
              (state) => ({
                rigs: state.rigs.map((r) =>
                  r.id === rigId
                    ? {
                        ...r,
                        poses: r.poses.map((p) => (p.id === poseId ? { ...p, ...patch } : p)),
                      }
                    : r
                ),
              }),
              false,
              'rigs/updatePose'
            );
          },

          deletePose: (rigId, poseId) => {
            set(
              (state) => ({
                rigs: state.rigs.map((r) =>
                  r.id === rigId ? { ...r, poses: r.poses.filter((p) => p.id !== poseId) } : r
                ),
              }),
              false,
              'rigs/deletePose'
            );
          },

          // ── AnimationClip ────────────────────────────────────────────────────
          addClip: (rigId, clip) => {
            const id = generateId('clip');
            // Garantit que keyframes est toujours en phase avec poseIds
            const keyframes = clip.keyframes?.length
              ? clip.keyframes
              : poseIdsToKeyframes(clip.poseIds ?? []);
            set(
              (state) => ({
                rigs: state.rigs.map((r) =>
                  r.id === rigId
                    ? { ...r, animationClips: [...r.animationClips, { id, ...clip, keyframes }] }
                    : r
                ),
              }),
              false,
              'rigs/addClip'
            );
            return id;
          },

          updateClip: (rigId, clipId, patch) => {
            // Synchronise poseIds ↔ keyframes selon ce qui a été modifié
            const syncedPatch = { ...patch };
            if (patch.poseIds && !patch.keyframes) {
              // poseIds mis à jour → regénérer keyframes (rétrocompat)
              syncedPatch.keyframes = poseIdsToKeyframes(patch.poseIds);
            } else if (patch.keyframes && !patch.poseIds) {
              // keyframes mis à jour → synchroniser poseIds (deprecated mais conservé)
              syncedPatch.poseIds = patch.keyframes.map((kf) => kf.poseId);
            }
            set(
              (state) => ({
                rigs: state.rigs.map((r) =>
                  r.id === rigId
                    ? {
                        ...r,
                        animationClips: r.animationClips.map((c) =>
                          c.id === clipId ? { ...c, ...syncedPatch } : c
                        ),
                      }
                    : r
                ),
              }),
              false,
              'rigs/updateClip'
            );
          },

          deleteClip: (rigId, clipId) => {
            set(
              (state) => ({
                rigs: state.rigs.map((r) =>
                  r.id === rigId
                    ? { ...r, animationClips: r.animationClips.filter((c) => c.id !== clipId) }
                    : r
                ),
              }),
              false,
              'rigs/deleteClip'
            );
          },

          // ── IKChain ──────────────────────────────────────────────────────────
          addIKChain: (rigId, chain) => {
            const id = generateId('ikchain');
            set(
              (state) => ({
                rigs: state.rigs.map((r) =>
                  r.id === rigId ? { ...r, ikChains: [...(r.ikChains ?? []), { id, ...chain }] } : r
                ),
              }),
              false,
              'rigs/addIKChain'
            );
            return id;
          },

          removeIKChain: (rigId, chainId) => {
            set(
              (state) => ({
                rigs: state.rigs.map((r) =>
                  r.id === rigId
                    ? { ...r, ikChains: (r.ikChains ?? []).filter((c) => c.id !== chainId) }
                    : r
                ),
              }),
              false,
              'rigs/removeIKChain'
            );
          },

          // ── Template ─────────────────────────────────────────────────────────
          addRigFromTemplate: (characterId, templateId) => {
            const template: RigTemplate | undefined = RIG_TEMPLATES.find(
              (t) => t.id === templateId
            );
            if (!template) return null;

            // Résout les parentKey → IDs réels, dans l'ordre topologique
            const keyToId: Record<string, string> = {};
            const bones: Bone[] = template.bones.map((node) => {
              const id = generateId('bone');
              keyToId[node.key] = id;
              return {
                id,
                name: node.name,
                parentId: node.parentKey ? (keyToId[node.parentKey] ?? null) : null,
                localX: node.localX,
                localY: node.localY,
                length: node.length,
                rotation: node.rotation,
                color: node.color,
              };
            });

            const existingRig = get().rigs.find((r) => r.characterId === characterId);
            if (existingRig) {
              // Remplace uniquement les os — conserve clips, poses, parts
              set(
                (state) => ({
                  rigs: state.rigs.map((r) => (r.id === existingRig.id ? { ...r, bones } : r)),
                }),
                false,
                'rigs/addRigFromTemplate'
              );
              return existingRig.id;
            }

            const rigId = generateId('rig');
            const newRig: CharacterRig = {
              id: rigId,
              characterId,
              originX: 300,
              originY: 280,
              bones,
              parts: [],
              poses: [],
              animationClips: [],
              ikChains: [],
            };
            set((state) => ({ rigs: [...state.rigs, newRig] }), false, 'rigs/addRigFromTemplate');
            return rigId;
          },

          // ── Clip assignment ──────────────────────────────────────────────────
          setIdleClip: (rigId, clipId) => {
            set(
              (state) => ({
                rigs: state.rigs.map((r) =>
                  r.id === rigId ? { ...r, idleClipId: clipId ?? undefined } : r
                ),
              }),
              false,
              'rigs/setIdleClip'
            );
          },

          setSpeakClip: (rigId, clipId) => {
            set(
              (state) => ({
                rigs: state.rigs.map((r) =>
                  r.id === rigId ? { ...r, speakClipId: clipId ?? undefined } : r
                ),
              }),
              false,
              'rigs/setSpeakClip'
            );
          },

          // ── Génération automatique idle breathing ────────────────────────────
          generateAndAddIdleClip: (characterId) => {
            const rig = get().rigs.find((r) => r.characterId === characterId);
            if (!rig) return null;

            const generated = generateIdleClip(rig);
            if (!generated) return null;

            // Ajouter les poses et récupérer leurs IDs
            const poseIds: string[] = [];
            let updatedRig = rig;

            for (const pose of generated.poses) {
              const poseId = generateId('pose');
              updatedRig = {
                ...updatedRig,
                poses: [...updatedRig.poses, { id: poseId, ...pose }],
              };
              poseIds.push(poseId);
            }

            // Sentinelles → vrais IDs : [neutral, inhale, exhale, neutral]
            const [neutralId, inhaleId, exhaleId] = poseIds;
            const keyframes = generated.clip.keyframes.map((kf) => ({
              ...kf,
              poseId:
                kf.poseId === '__idle_neutral__'
                  ? neutralId
                  : kf.poseId === '__idle_inhale__'
                    ? inhaleId
                    : kf.poseId === '__idle_exhale__'
                      ? exhaleId
                      : kf.poseId,
            }));

            // Nom unique : "Idle Breathing", "Idle Breathing 2", "Idle Breathing 3"...
            const baseName = generated.clip.name;
            const existingCount = updatedRig.animationClips.filter(
              (c) => c.name === baseName || c.name.startsWith(baseName + ' ')
            ).length;
            const clipName = existingCount === 0 ? baseName : `${baseName} ${existingCount + 1}`;

            const clipId = generateId('clip');
            const clip = {
              id: clipId,
              ...generated.clip,
              name: clipName,
              poseIds: [neutralId, inhaleId, exhaleId, neutralId],
              keyframes,
            };

            set(
              (state) => ({
                rigs: state.rigs.map((r) =>
                  r.id === rig.id
                    ? {
                        ...updatedRig,
                        animationClips: [...updatedRig.animationClips, clip],
                        idleClipId: clipId,
                      }
                    : r
                ),
              }),
              false,
              'rigs/generateAndAddIdleClip'
            );

            return clipId;
          },

          // ── Import ───────────────────────────────────────────────────────────
          importRigs: (rigs) => {
            set(() => ({ rigs }), false, 'rigs/importRigs');
          },
        }),
        { name: 'RigStore' }
      ),
      {
        name: 'rigs-storage',
        storage: createJSONStorage(() => localStorage),
        version: 4,
        migrate: (persisted: unknown, version: number) => {
          const state = persisted as { rigs?: CharacterRig[] };
          if (version < 2 && state.rigs) {
            state.rigs = state.rigs.map((r) => ({ ...r, ikChains: r.ikChains ?? [] }));
          }
          // v2→v3 : spriteVariants sur BonePose (optionnel, pas de migration)
          // v3→v4 : idleClipId + speakClipId sur CharacterRig (optionnel, pas de migration)
          return state;
        },
      }
    ),
    {
      limit: 50,
      equality: shallow,
      // @ts-expect-error - Zundo partialize expects subset of state (correct)
      partialize: (state) => ({ rigs: state.rigs }),
    }
  )
);

// Auto-save subscriber with HMR cleanup (centralized in storeSubscribers.ts)
setupAutoSave(useRigStore, (state) => state.rigs, 'rigs');
