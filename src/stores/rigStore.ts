import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import { shallow } from 'zustand/shallow';
import { setupAutoSave } from '../utils/storeSubscribers';
import type { CharacterRig, Bone, SpritePart, BonePose, AnimationClip } from '../types/bone';

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
            const id = `rig-${Date.now()}`;
            const newRig: CharacterRig = {
              id,
              characterId,
              originX: 300,
              originY: 100,
              bones: [],
              parts: [],
              poses: [],
              animationClips: [],
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
            const id = `bone-${Date.now()}`;
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
            const id = `part-${Date.now()}`;
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
            const id = `pose-${Date.now()}`;
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
            const id = `clip-${Date.now()}`;
            set(
              (state) => ({
                rigs: state.rigs.map((r) =>
                  r.id === rigId
                    ? { ...r, animationClips: [...r.animationClips, { id, ...clip }] }
                    : r
                ),
              }),
              false,
              'rigs/addClip'
            );
            return id;
          },

          updateClip: (rigId, clipId, patch) => {
            set(
              (state) => ({
                rigs: state.rigs.map((r) =>
                  r.id === rigId
                    ? {
                        ...r,
                        animationClips: r.animationClips.map((c) =>
                          c.id === clipId ? { ...c, ...patch } : c
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
        version: 1,
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
