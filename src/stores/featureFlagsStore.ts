import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import {
  DEFAULT_FEATURE_FLAGS,
  DEFAULT_ROADMAP_ITEMS,
  type FeatureFlag,
  type FeatureStatus,
  type RoadmapItem,
} from '@/config/roadmapData';

// ============================================================
// FEATURE FLAGS STORE — Dev Dashboard
// Persisté dans localStorage : 'accesscity-dev-dashboard'
// ⚠️ Ce store est uniquement pour Guillaume (dev) — invisible en prod.
// ============================================================

interface FeatureFlagsState {
  roadmapItems: RoadmapItem[];
  flags: Record<string, FeatureFlag>;
  lastUpdated: string | null;

  // ── Actions roadmap ──────────────────────────────────────
  updateItemStatus: (id: string, status: FeatureStatus) => void;
  updateItemNotes: (id: string, notes: string) => void;
  addItem: (item: RoadmapItem) => void;
  removeItem: (id: string) => void;

  // ── Actions feature flags ────────────────────────────────
  toggleFlag: (key: string) => void;
  setFlagEnabled: (key: string, enabled: boolean) => void;

  // ── Selectors (dans handler uniquement) ─────────────────
  getItemsByStatus: (status: FeatureStatus) => RoadmapItem[];
}

function buildFlagsMap(flags: FeatureFlag[]): Record<string, FeatureFlag> {
  return Object.fromEntries(flags.map((f) => [f.key, f]));
}

export const useFeatureFlagsStore = create<FeatureFlagsState>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        roadmapItems: DEFAULT_ROADMAP_ITEMS,
        flags: buildFlagsMap(DEFAULT_FEATURE_FLAGS),
        lastUpdated: null,

        // ── Actions roadmap ──────────────────────────────
        updateItemStatus: (id, status) => {
          set(
            (s) => ({
              roadmapItems: s.roadmapItems.map((item) =>
                item.id === id ? { ...item, status } : item
              ),
              lastUpdated: new Date().toISOString(),
            }),
            false,
            'featureFlags/updateItemStatus'
          );
        },

        updateItemNotes: (id, notes) => {
          set(
            (s) => ({
              roadmapItems: s.roadmapItems.map((item) =>
                item.id === id ? { ...item, notes } : item
              ),
              lastUpdated: new Date().toISOString(),
            }),
            false,
            'featureFlags/updateItemNotes'
          );
        },

        addItem: (item) => {
          set(
            (s) => ({
              roadmapItems: [...s.roadmapItems, item],
              lastUpdated: new Date().toISOString(),
            }),
            false,
            'featureFlags/addItem'
          );
        },

        removeItem: (id) => {
          set(
            (s) => ({
              roadmapItems: s.roadmapItems.filter((item) => item.id !== id),
              lastUpdated: new Date().toISOString(),
            }),
            false,
            'featureFlags/removeItem'
          );
        },

        // ── Actions feature flags ────────────────────────
        toggleFlag: (key) => {
          set(
            (s) => ({
              flags: {
                ...s.flags,
                [key]: s.flags[key]
                  ? { ...s.flags[key], enabled: !s.flags[key].enabled }
                  : s.flags[key],
              },
              lastUpdated: new Date().toISOString(),
            }),
            false,
            'featureFlags/toggleFlag'
          );
        },

        setFlagEnabled: (key, enabled) => {
          set(
            (s) => ({
              flags: {
                ...s.flags,
                [key]: s.flags[key] ? { ...s.flags[key], enabled } : s.flags[key],
              },
              lastUpdated: new Date().toISOString(),
            }),
            false,
            'featureFlags/setFlagEnabled'
          );
        },

        // ── Selectors ────────────────────────────────────
        getItemsByStatus: (status) => {
          return get().roadmapItems.filter((item) => item.status === status);
        },
      })),
      {
        name: 'accesscity-dev-dashboard',
        // Ne persister que les données mutables (pas les fonctions)
        partialize: (s) => ({
          roadmapItems: s.roadmapItems,
          flags: s.flags,
          lastUpdated: s.lastUpdated,
        }),
      }
    ),
    { name: 'FeatureFlagsStore' }
  )
);
