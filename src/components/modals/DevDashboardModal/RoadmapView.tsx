import { useState, useMemo, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useFeatureFlagsStore } from '@/stores/featureFlagsStore';
import type { FeatureStatus, FeatureCategory, RoadmapItem } from '@/config/roadmapData';
import { KanbanColumn } from './KanbanColumn';

const STATUSES: FeatureStatus[] = ['done', 'in-progress', 'backlog', 'broken'];

const CATEGORIES: FeatureCategory[] = [
  'Visuel',
  'Audio',
  'UX',
  'Narratif',
  'Moteur',
  'Export',
  'Infrastructure',
];

// Constante module-level — évite les références instables (Acton §15.4)
const EMPTY_ITEMS: RoadmapItem[] = [];

interface AddItemFormState {
  title: string;
  description: string;
  category: FeatureCategory;
  status: FeatureStatus;
  priority: '' | 'P0' | 'P1' | 'P2' | 'P3';
}

const DEFAULT_FORM: AddItemFormState = {
  title: '',
  description: '',
  category: 'UX',
  status: 'backlog',
  priority: '',
};

interface EditNotesState {
  id: string;
  notes: string;
}

export function RoadmapView() {
  const roadmapItems = useFeatureFlagsStore((s) => s.roadmapItems);
  const addItem = useFeatureFlagsStore((s) => s.addItem);
  const updateItemNotes = useFeatureFlagsStore((s) => s.updateItemNotes);

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<AddItemFormState>(DEFAULT_FORM);
  const [editNotes, setEditNotes] = useState<EditNotesState | null>(null);
  const [filterCategory, setFilterCategory] = useState<FeatureCategory | 'all'>('all');

  // Pré-filtrer par catégorie avant répartition en colonnes (Carmack §12.2)
  const filteredItems = useMemo(
    () =>
      filterCategory === 'all'
        ? roadmapItems
        : roadmapItems.filter((i) => i.category === filterCategory),
    [roadmapItems, filterCategory]
  );

  // Répartir les items par statut — calculé une fois (pas dans chaque KanbanColumn)
  const itemsByStatus = useMemo(() => {
    const map: Record<FeatureStatus, RoadmapItem[]> = {
      done: [],
      'in-progress': [],
      backlog: [],
      broken: [],
    };
    for (const item of filteredItems) {
      map[item.status].push(item);
    }
    return map;
  }, [filteredItems]);

  const handleAddSubmit = useCallback(() => {
    if (!form.title.trim()) return;
    const newItem: RoadmapItem = {
      id: `item-${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      category: form.category,
      status: form.status,
      priority: form.priority || undefined,
      since: new Date().toISOString().slice(0, 7),
    };
    addItem(newItem);
    setForm(DEFAULT_FORM);
    setShowAddForm(false);
  }, [form, addItem]);

  const handleEditNotesOpen = useCallback(
    (id: string) => {
      const item = roadmapItems.find((i) => i.id === id);
      if (item) setEditNotes({ id, notes: item.notes ?? '' });
    },
    [roadmapItems]
  );

  const handleEditNotesSave = useCallback(() => {
    if (!editNotes) return;
    updateItemNotes(editNotes.id, editNotes.notes);
    setEditNotes(null);
  }, [editNotes, updateItemNotes]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      {/* Toolbar : filtre catégorie + bouton ajout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as FeatureCategory | 'all')}
          style={{
            background: 'var(--color-bg-hover)',
            border: '1px solid var(--color-border-base)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-primary)',
            fontSize: 12,
            padding: '4px 8px',
            cursor: 'pointer',
          }}
          aria-label="Filtrer par catégorie"
        >
          <option value="all">Toutes les catégories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 4 }}>
          {filteredItems.length} feature{filteredItems.length !== 1 ? 's' : ''}
        </span>

        <button
          onClick={() => setShowAddForm((v) => !v)}
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: showAddForm ? 'var(--color-primary-subtle)' : 'transparent',
            border: '1px solid var(--color-primary-40)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-primary)',
            fontSize: 12,
            fontWeight: 600,
            padding: '4px 10px',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
          }}
        >
          <Plus size={13} />
          Ajouter une feature
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <div
          style={{
            background: 'var(--color-bg-hover)',
            border: '1px solid var(--color-primary-40)',
            borderRadius: 'var(--radius-lg)',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <p
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}
          >
            ➕ Nouvelle feature
          </p>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Titre *"
              autoFocus
              style={inputStyle}
            />
            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value as FeatureCategory }))
              }
              style={{ ...inputStyle, flex: '0 0 140px' }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as FeatureStatus }))}
              style={{ ...inputStyle, flex: '0 0 140px' }}
            >
              <option value="done">✅ Livré</option>
              <option value="in-progress">🚧 En cours</option>
              <option value="backlog">💡 Backlog</option>
              <option value="broken">⚠️ Problème</option>
            </select>
            <select
              value={form.priority}
              onChange={(e) =>
                setForm((f) => ({ ...f, priority: e.target.value as AddItemFormState['priority'] }))
              }
              style={{ ...inputStyle, flex: '0 0 80px' }}
            >
              <option value="">Priorité</option>
              <option value="P0">P0</option>
              <option value="P1">P1</option>
              <option value="P2">P2</option>
              <option value="P3">P3</option>
            </select>
          </div>

          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Description (optionnel)"
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
          />

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowAddForm(false)} style={btnSecondaryStyle}>
              Annuler
            </button>
            <button
              onClick={handleAddSubmit}
              disabled={!form.title.trim()}
              style={{
                ...btnPrimaryStyle,
                opacity: form.title.trim() ? 1 : 0.4,
                cursor: form.title.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Ajouter
            </button>
          </div>
        </div>
      )}

      {/* Modal édition notes */}
      {editNotes && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={(e) => e.target === e.currentTarget && setEditNotes(null)}
        >
          <div
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-base)',
              borderRadius: 'var(--radius-lg)',
              padding: 20,
              width: 400,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--color-text-primary)',
              }}
            >
              ✏️ Modifier les notes
            </p>
            <textarea
              value={editNotes.notes}
              onChange={(e) => setEditNotes((s) => (s ? { ...s, notes: e.target.value } : s))}
              placeholder="Notes, contexte, liens, bugs connus…"
              rows={5}
              autoFocus
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditNotes(null)} style={btnSecondaryStyle}>
                Annuler
              </button>
              <button onClick={handleEditNotesSave} style={btnPrimaryStyle}>
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban — 4 colonnes */}
      <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            items={itemsByStatus[status] ?? EMPTY_ITEMS}
            onEditNotes={handleEditNotesOpen}
          />
        ))}
      </div>
    </div>
  );
}

// ── Styles inline partagés ────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: 'var(--color-bg-base)',
  border: '1px solid var(--color-border-base)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-primary)',
  fontSize: 12,
  padding: '6px 10px',
  outline: 'none',
  minWidth: 120,
};

const btnPrimaryStyle: React.CSSProperties = {
  background: 'var(--color-primary)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  color: '#fff',
  fontSize: 12,
  fontWeight: 600,
  padding: '6px 14px',
  cursor: 'pointer',
};

const btnSecondaryStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--color-border-base)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-muted)',
  fontSize: 12,
  padding: '6px 14px',
  cursor: 'pointer',
};
