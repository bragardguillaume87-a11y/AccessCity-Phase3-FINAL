import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Star, Clock, AlertTriangle, Crown, FolderOpen, FolderPlus,
  Trash2, Pencil, Check, X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { AssetCollection } from '@/types/collections';

export type SidebarSection =
  | `cat:${string}`       // cat:all, cat:backgrounds, cat:characters, etc.
  | 'smart:favorites'
  | 'smart:recents'
  | 'smart:unused'
  | 'smart:protagonist'
  | `folder:${string}`;   // folder:{collection.id}

interface CategoryItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
}

export interface AssetsLibrarySidebarProps {
  activeSection: SidebarSection;
  onSectionChange: (section: SidebarSection) => void;
  categories: CategoryItem[];
  favoritesCount: number;
  recentsCount: number;
  unusedCount: number;
  protagonistCount: number;
  collections: AssetCollection[];
  onCreateCollection: (name: string) => void;
  onDeleteCollection: (id: string) => void;
  onRenameCollection: (id: string, name: string) => void;
}

/** Badge de comptage — style violet solide (= bouton Propriétés / Voir) */
function CountDot({ count, active = false }: { count: number; active?: boolean }) {
  if (count === 0) return null;
  return (
    <span className={`ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold leading-none tabular-nums shrink-0 transition-all duration-150 ${
      active ? 'bg-primary text-white' : 'bg-primary/60 text-white'
    }`}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

/**
 * AssetsLibrarySidebar — Navigation latérale de la bibliothèque d'assets.
 *
 * Sections :
 * 1. Types (catégories du manifest)
 * 2. Collections intelligentes (auto-calculées, non modifiables)
 * 3. Mes dossiers (collections personnalisées, CRUD)
 */
export function AssetsLibrarySidebar({
  activeSection,
  onSectionChange,
  categories,
  favoritesCount,
  recentsCount,
  unusedCount,
  protagonistCount,
  collections,
  onCreateCollection,
  onDeleteCollection,
  onRenameCollection,
}: AssetsLibrarySidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const newInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating) newInputRef.current?.focus();
  }, [isCreating]);

  const handleCreate = () => {
    if (newName.trim()) {
      onCreateCollection(newName.trim());
      setNewName('');
    }
    setIsCreating(false);
  };

  const handleStartEdit = (col: AssetCollection) => {
    setEditingId(col.id);
    setEditName(col.name);
  };

  const handleConfirmEdit = () => {
    if (editingId && editName.trim()) {
      onRenameCollection(editingId, editName.trim());
    }
    setEditingId(null);
  };

  const sidebarBtn = (section: SidebarSection, icon: React.ComponentType<{ className?: string }>, label: string, count: number) => {
    const Icon = icon;
    const isActive = activeSection === section;
    return (
      <button
        key={section}
        onClick={() => onSectionChange(section)}
        className={`relative w-full flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[13px] transition-all duration-150 ease-out ${
          isActive
            ? 'bg-primary/15 text-white font-semibold'
            : 'text-slate-300/70 hover:text-slate-100 hover:bg-white/[0.06]'
        }`}
      >
        {/* Indicateur gauche animé */}
        <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-primary transition-all duration-200 ease-out origin-center ${
          isActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'
        }`} />
        <Icon className={`h-4 w-4 shrink-0 transition-colors duration-150 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
        <span className="truncate flex-1 text-left">{label}</span>
        <CountDot count={count} active={isActive} />
      </button>
    );
  };

  return (
    <div className="w-[190px] shrink-0 border-r border-slate-700/50 flex flex-col bg-slate-900/30">
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-5">

          {/* ── Section Types ── */}
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.1em] px-3 mb-1.5">
              Types
            </p>
            <div className="space-y-0.5">
              {categories.map(cat =>
                sidebarBtn(`cat:${cat.id}`, cat.icon, cat.label, cat.count)
              )}
            </div>
          </div>

          {/* ── Collections intelligentes ── */}
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.1em] px-3 mb-1.5">
              Collections
            </p>
            <div className="space-y-0.5">
              {sidebarBtn('smart:favorites',   Star,          'Favoris',       favoritesCount)}
              {sidebarBtn('smart:recents',      Clock,         'Récents',       recentsCount)}
              {sidebarBtn('smart:unused',       AlertTriangle, 'Non utilisés',  unusedCount)}
              {sidebarBtn('smart:protagonist',  Crown,         'Protagoniste',  protagonistCount)}
            </div>
          </div>

          {/* ── Mes dossiers ── */}
          <div>
            <div className="flex items-center justify-between px-3 mb-1.5">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.1em]">
                Mes dossiers
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
                title="Nouveau dossier"
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-0.5">
              {collections.map(col => {
                const isActive = activeSection === `folder:${col.id}`;
                const isEditing = editingId === col.id;

                if (isEditing) {
                  return (
                    <div key={col.id} className="flex items-center gap-1 px-2">
                      <Input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleConfirmEdit(); if (e.key === 'Escape') setEditingId(null); }}
                        className="h-6 text-xs px-2 flex-1"
                        autoFocus
                      />
                      <button onClick={handleConfirmEdit} className="text-green-400 hover:text-green-300"><Check className="h-3 w-3" /></button>
                      <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-slate-300"><X className="h-3 w-3" /></button>
                    </div>
                  );
                }

                return (
                  <div key={col.id} className="group relative">
                    <button
                      onClick={() => onSectionChange(`folder:${col.id}`)}
                      className={`relative w-full flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[13px] transition-all duration-150 ease-out pr-14 ${
                        isActive
                          ? 'bg-primary/15 text-white font-semibold'
                          : 'text-slate-300/70 hover:text-slate-100 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-primary transition-all duration-200 ease-out origin-center ${
                        isActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'
                      }`} />
                      <FolderOpen className={`h-4 w-4 shrink-0 transition-colors duration-150 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                      <span className="truncate flex-1 text-left">{col.name}</span>
                      <CountDot count={col.assetIds.length} active={isActive} />
                    </button>
                    {/* Actions sur hover */}
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-slate-800 rounded px-0.5">
                      <button onClick={() => handleStartEdit(col)} className="p-0.5 text-slate-400 hover:text-slate-200"><Pencil className="h-3 w-3" /></button>
                      <button onClick={() => onDeleteCollection(col.id)} className="p-0.5 text-slate-400 hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                );
              })}

              {/* Champ de création inline */}
              {isCreating && (
                <div className="flex items-center gap-1 px-2">
                  <Input
                    ref={newInputRef}
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setIsCreating(false); setNewName(''); } }}
                    placeholder="Nom du dossier…"
                    className="h-6 text-xs px-2 flex-1"
                  />
                  <button onClick={handleCreate} className="text-green-400 hover:text-green-300"><Check className="h-3 w-3" /></button>
                  <button onClick={() => { setIsCreating(false); setNewName(''); }} className="text-slate-500 hover:text-slate-300"><X className="h-3 w-3" /></button>
                </div>
              )}

              {collections.length === 0 && !isCreating && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreating(true)}
                  className="w-full h-7 text-xs text-slate-500 hover:text-slate-300 justify-start px-3"
                >
                  <FolderPlus className="h-3 w-3 mr-2" />
                  Créer un dossier
                </Button>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export default AssetsLibrarySidebar;
