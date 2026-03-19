/**
 * TriggerZonePanel — Panneau d'édition des zones trigger, sorties et zones sonores
 *
 * S'affiche dans la palette droite quand la couche "triggers" est active.
 * Permet de créer, éditer et supprimer :
 *   - DialogueTrigger : zone déclenchant une scène VN quand le joueur entre dedans
 *   - SceneExit       : zone téléportant le joueur vers une autre carte
 *   - AudioZone       : zone jouant une brique sonore quand le joueur entre dedans
 *
 * Les coordonnées sont en tuiles (converties en pixels px = col * tileSize).
 *
 * @module components/modules/TopdownEditor/TriggerZonePanel
 */

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useMapsStore } from '@/stores/mapsStore';
import { useScenesStore } from '@/stores/scenesStore';
import { SOUND_BRICKS } from '@/config/soundBricks';
import type { DialogueTrigger, SceneExit, AudioZone } from '@/types/map';
import type { SceneMetadata } from '@/types';

// ⚠️ Référence stable pour éviter la boucle infinie Zustand 5 (useSyncExternalStore)
// Voir konva-patterns.md §16 — jamais de [] inline dans un sélecteur
const EMPTY_SCENES: SceneMetadata[] = [];

// ============================================================================
// HELPERS
// ============================================================================

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

// ============================================================================
// PROPS
// ============================================================================

interface TriggerZonePanelProps {
  mapId: string;
  tileSize: number;
  /** ID de la zone sélectionnée (pour surligner dans le canvas) */
  selectedZoneId?: string | null;
  onSelectZone?: (zoneId: string | null) => void;
  /**
   * Quand non-null, ouvre le formulaire pré-rempli avec ces coordonnées (en tuiles).
   * Envoyé par TopdownEditor quand l'utilisateur dessine une zone par drag sur le canvas.
   */
  pendingZoneRect?: { xTile: number; yTile: number; wTile: number; hTile: number } | null;
  /** Appelé après que pendingZoneRect a été consommé (pour reset dans le parent) */
  onPendingZoneConsumed?: () => void;
  /**
   * Quand non-null, ouvre le formulaire type=audio pré-sélectionné avec cette brique.
   * Envoyé par TopdownEditor via SoundPalette → "Placer sur la carte".
   */
  pendingAudioBrickId?: string | null;
  /** Appelé après que pendingAudioBrickId a été consommé (pour reset dans le parent) */
  onPendingAudioBrickConsumed?: () => void;
  /**
   * Appelé chaque fois que le formulaire d'édition est ouvert/fermé ou que les coordonnées changent.
   * null = formulaire fermé (pas de contour à afficher sur le canvas).
   */
  onEditingZoneChange?: (
    rect: { xTile: number; yTile: number; wTile: number; hTile: number } | null
  ) => void;
}

// ============================================================================
// ZONE FORM (dialogue trigger, scene exit ou audio zone)
// ============================================================================

type ZoneType = 'dialogue' | 'exit' | 'audio';

interface ZoneFormState {
  type: ZoneType;
  label: string;
  // Grid coords (tiles)
  x: number;
  y: number;
  w: number;
  h: number;
  // Dialogue trigger
  dialogueSceneId: string;
  once: boolean;
  bgmBehavior: 'keep' | 'replace' | 'silence';
  transitionType: 'fade-black' | 'fade-white' | 'iris' | 'none';
  // Dialogue sub-type & interaction mode
  triggerType: 'dialogue' | 'sign';
  interactionMode: 'auto' | 'interact';
  signText: string;
  // Scene exit
  targetMapId: string;
  targetX: number;
  targetY: number;
  // Audio zone
  soundBrickId: string;
}

const DEFAULT_FORM: ZoneFormState = {
  type: 'dialogue',
  label: '',
  x: 0,
  y: 0,
  w: 2,
  h: 2,
  dialogueSceneId: '',
  once: false,
  bgmBehavior: 'keep',
  transitionType: 'fade-black',
  triggerType: 'dialogue',
  interactionMode: 'auto',
  signText: '',
  targetMapId: '',
  targetX: 0,
  targetY: 0,
  soundBrickId: SOUND_BRICKS[0]?.id ?? '',
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function TriggerZonePanel({
  mapId,
  tileSize,
  selectedZoneId,
  onSelectZone,
  pendingZoneRect,
  onPendingZoneConsumed,
  pendingAudioBrickId,
  onPendingAudioBrickConsumed,
  onEditingZoneChange,
}: TriggerZonePanelProps) {
  const mapData = useMapsStore((s) => s.mapDataById[mapId]);
  const maps = useMapsStore((s) => s.maps);
  // ⚠️ Selector défensif avec ?. : pendant l'hydration persist + zundo/temporal,
  // getState() peut retourner un état partiel. Le ?. évite le crash.
  const scenes = useScenesStore((s) => s?.scenes ?? EMPTY_SCENES);
  const addDialogueTrigger = useMapsStore((s) => s.addDialogueTrigger);
  const updateDialogueTrigger = useMapsStore((s) => s.updateDialogueTrigger);
  const removeDialogueTrigger = useMapsStore((s) => s.removeDialogueTrigger);
  const addSceneExit = useMapsStore((s) => s.addSceneExit);
  const updateSceneExit = useMapsStore((s) => s.updateSceneExit);
  const removeSceneExit = useMapsStore((s) => s.removeSceneExit);
  const addAudioZone = useMapsStore((s) => s.addAudioZone);
  const updateAudioZone = useMapsStore((s) => s.updateAudioZone);
  const removeAudioZone = useMapsStore((s) => s.removeAudioZone);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ZoneFormState>(DEFAULT_FORM);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Notifier le parent des coordonnées en cours d'édition (contour sur canvas)
  useEffect(() => {
    if (showForm) {
      onEditingZoneChange?.({ xTile: form.x, yTile: form.y, wTile: form.w, hTile: form.h });
    } else {
      onEditingZoneChange?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showForm, form.x, form.y, form.w, form.h]);

  // Pré-remplir le formulaire quand une zone est dessinée par drag sur le canvas
  useEffect(() => {
    if (!pendingZoneRect) return;
    setEditingId(null);
    setForm({
      ...DEFAULT_FORM,
      x: pendingZoneRect.xTile,
      y: pendingZoneRect.yTile,
      w: pendingZoneRect.wTile,
      h: pendingZoneRect.hTile,
    });
    setShowForm(true);
    onPendingZoneConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingZoneRect]);

  // Pré-remplir le formulaire audio quand "Placer sur la carte" est cliqué depuis SoundPalette
  useEffect(() => {
    if (!pendingAudioBrickId) return;
    setEditingId(null);
    setForm({ ...DEFAULT_FORM, type: 'audio', soundBrickId: pendingAudioBrickId });
    setShowForm(true);
    onPendingAudioBrickConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAudioBrickId]);

  if (!mapData) return null;

  const triggers = mapData._ac_dialogue_triggers;
  const exits = mapData._ac_scene_exits;
  const audioZones = mapData._ac_audio_zones ?? [];

  // ── Form helpers ──────────────────────────────────────────────────────────

  function openNew() {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setShowForm(true);
  }

  function openEditTrigger(t: DialogueTrigger) {
    setEditingId(t.id);
    setForm({
      type: 'dialogue',
      label: t.label,
      x: Math.round(t.zone.x / tileSize),
      y: Math.round(t.zone.y / tileSize),
      w: Math.round(t.zone.width / tileSize),
      h: Math.round(t.zone.height / tileSize),
      dialogueSceneId: t.dialogueSceneId,
      once: t.once,
      bgmBehavior: t.bgmBehavior ?? 'keep',
      transitionType: t.transitionType ?? 'fade-black',
      triggerType: t.triggerType ?? 'dialogue',
      interactionMode: t.interactionMode ?? 'auto',
      signText: t.signText ?? '',
      targetMapId: '',
      targetX: 0,
      targetY: 0,
      soundBrickId: '',
    });
    setShowForm(true);
    onSelectZone?.(t.id);
  }

  function openEditExit(e: SceneExit) {
    setEditingId(e.id);
    setForm({
      type: 'exit',
      label: e.label,
      x: Math.round(e.zone.x / tileSize),
      y: Math.round(e.zone.y / tileSize),
      w: Math.round(e.zone.width / tileSize),
      h: Math.round(e.zone.height / tileSize),
      dialogueSceneId: '',
      once: false,
      bgmBehavior: 'keep',
      transitionType: 'fade-black',
      triggerType: 'dialogue',
      interactionMode: 'auto',
      signText: '',
      targetMapId: e.targetMapId,
      targetX: Math.round(e.targetPos.x / tileSize),
      targetY: Math.round(e.targetPos.y / tileSize),
      soundBrickId: '',
    });
    setShowForm(true);
    onSelectZone?.(e.id);
  }

  function openEditAudio(az: AudioZone) {
    setEditingId(az.id);
    setForm({
      type: 'audio',
      label: az.label,
      x: Math.round(az.zone.x / tileSize),
      y: Math.round(az.zone.y / tileSize),
      w: Math.round(az.zone.width / tileSize),
      h: Math.round(az.zone.height / tileSize),
      dialogueSceneId: '',
      once: az.once,
      bgmBehavior: 'keep',
      transitionType: 'fade-black',
      triggerType: 'dialogue',
      interactionMode: 'auto',
      signText: '',
      targetMapId: '',
      targetX: 0,
      targetY: 0,
      soundBrickId: az.soundBrickId,
    });
    setShowForm(true);
    onSelectZone?.(az.id);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setShowAdvanced(false);
    onSelectZone?.(null);
  }

  function saveForm() {
    const zone = {
      x: form.x * tileSize,
      y: form.y * tileSize,
      width: form.w * tileSize,
      height: form.h * tileSize,
    };

    if (form.type === 'dialogue') {
      const trigger: DialogueTrigger = {
        id: editingId ?? newId('trigger'),
        zone,
        label: form.label || (form.triggerType === 'sign' ? 'Panneau' : "Zone d'interaction"),
        dialogueSceneId: form.dialogueSceneId,
        once: form.once,
        bgmBehavior: form.bgmBehavior,
        transitionType: form.transitionType,
        triggerType: form.triggerType,
        interactionMode: form.interactionMode,
        signText: form.triggerType === 'sign' ? form.signText : undefined,
      };
      if (editingId) updateDialogueTrigger(mapId, editingId, trigger);
      else addDialogueTrigger(mapId, trigger);
    } else if (form.type === 'exit') {
      const exit: SceneExit = {
        id: editingId ?? newId('exit'),
        zone,
        label: form.label || 'Sortie',
        targetMapId: form.targetMapId,
        targetPos: { x: form.targetX * tileSize, y: form.targetY * tileSize },
      };
      if (editingId) updateSceneExit(mapId, editingId, exit);
      else addSceneExit(mapId, exit);
    } else {
      const az: AudioZone = {
        id: editingId ?? newId('audio'),
        zone,
        label: form.label || 'Zone sonore',
        soundBrickId: form.soundBrickId || (SOUND_BRICKS[0]?.id ?? ''),
        once: form.once,
      };
      if (editingId) updateAudioZone(mapId, editingId, az);
      else addAudioZone(mapId, az);
    }
    closeForm();
  }

  // ── Styles ────────────────────────────────────────────────────────────────

  const sectionLabel: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--color-text-primary)',
    padding: '6px 8px 3px',
  };

  const itemRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 10px',
    cursor: 'pointer',
    fontSize: 11,
    transition: 'background 0.08s',
  };

  const inputSm: React.CSSProperties = {
    fontSize: 11,
    padding: '2px 5px',
    borderRadius: 3,
    border: '1px solid var(--color-border-base)',
    background: 'var(--color-bg-base)',
    color: 'var(--color-text-base)',
    width: '100%',
    outline: 'none',
  };

  const labelSm: React.CSSProperties = {
    fontSize: 10,
    color: 'var(--color-text-secondary)',
    marginBottom: 2,
    display: 'block',
  };

  const isEmpty = triggers.length === 0 && exits.length === 0 && audioZones.length === 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '6px 8px',
          borderBottom: '1px solid var(--color-border-base)',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-base)', flex: 1 }}>
          Zones d'interaction
        </span>
        <button
          onClick={openNew}
          title="Ajouter une zone"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 10,
            padding: '2px 7px',
            borderRadius: 3,
            cursor: 'pointer',
            background: 'var(--color-primary-muted)',
            border: '1px solid var(--color-primary-40)',
            color: 'var(--color-primary)',
          }}
        >
          <Plus size={11} /> Ajouter
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Dialogue triggers */}
        {triggers.length > 0 && (
          <>
            <p style={sectionLabel}>⚡ Interactions ({triggers.length})</p>
            {triggers.map((t) => (
              <div
                key={t.id}
                role="button"
                tabIndex={0}
                style={{
                  ...itemRow,
                  background: selectedZoneId === t.id ? 'var(--zone-dialogue-bg)' : 'transparent',
                  borderLeft:
                    selectedZoneId === t.id
                      ? '2px solid var(--zone-dialogue-border)'
                      : '2px solid transparent',
                }}
                onClick={() => openEditTrigger(t)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openEditTrigger(t);
                  }
                }}
                onMouseEnter={(e) => {
                  if (selectedZoneId !== t.id)
                    (e.currentTarget as HTMLDivElement).style.background =
                      'var(--color-overlay-04)';
                }}
                onMouseLeave={(e) => {
                  if (selectedZoneId !== t.id)
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: 13, flexShrink: 0 }}>
                  {t.triggerType === 'sign' ? '📋' : '💬'}
                </span>
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'var(--color-text-base)',
                  }}
                >
                  {t.label || '(sans nom)'}
                </span>
                <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', flexShrink: 0 }}>
                  {t.interactionMode === 'interact' ? '↵' : '🏃'} col{' '}
                  {Math.round(t.zone.x / tileSize)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeDialogueTrigger(mapId, t.id);
                  }}
                  title="Supprimer"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 1,
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                  }}
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
          </>
        )}

        {/* Scene exits */}
        {exits.length > 0 && (
          <>
            <p style={sectionLabel}>🚪 Sorties ({exits.length})</p>
            {exits.map((e) => (
              <div
                key={e.id}
                role="button"
                tabIndex={0}
                style={{
                  ...itemRow,
                  background: selectedZoneId === e.id ? 'var(--zone-exit-bg)' : 'transparent',
                  borderLeft:
                    selectedZoneId === e.id
                      ? '2px solid var(--zone-exit-border)'
                      : '2px solid transparent',
                }}
                onClick={() => openEditExit(e)}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    openEditExit(e);
                  }
                }}
                onMouseEnter={(ev) => {
                  if (selectedZoneId !== e.id)
                    (ev.currentTarget as HTMLDivElement).style.background =
                      'var(--color-overlay-04)';
                }}
                onMouseLeave={(ev) => {
                  if (selectedZoneId !== e.id)
                    (ev.currentTarget as HTMLDivElement).style.background = 'transparent';
                }}
              >
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'var(--color-text-base)',
                  }}
                >
                  {e.label || '(sans nom)'}
                </span>
                <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', flexShrink: 0 }}>
                  → {maps.find((m) => m.id === e.targetMapId)?.name ?? 'Carte introuvable'}
                </span>
                <button
                  onClick={(ev) => {
                    ev.stopPropagation();
                    removeSceneExit(mapId, e.id);
                  }}
                  title="Supprimer"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 1,
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                  }}
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
          </>
        )}

        {/* Audio zones */}
        {audioZones.length > 0 && (
          <>
            <p style={sectionLabel}>🔊 Sons ({audioZones.length})</p>
            {audioZones.map((az) => {
              const brick = SOUND_BRICKS.find((b) => b.id === az.soundBrickId);
              return (
                <div
                  key={az.id}
                  role="button"
                  tabIndex={0}
                  style={{
                    ...itemRow,
                    background: selectedZoneId === az.id ? 'var(--zone-audio-bg)' : 'transparent',
                    borderLeft:
                      selectedZoneId === az.id
                        ? '2px solid var(--zone-audio-border)'
                        : '2px solid transparent',
                  }}
                  onClick={() => openEditAudio(az)}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault();
                      openEditAudio(az);
                    }
                  }}
                  onMouseEnter={(ev) => {
                    if (selectedZoneId !== az.id)
                      (ev.currentTarget as HTMLDivElement).style.background =
                        'var(--color-overlay-04)';
                  }}
                  onMouseLeave={(ev) => {
                    if (selectedZoneId !== az.id)
                      (ev.currentTarget as HTMLDivElement).style.background = 'transparent';
                  }}
                >
                  <span style={{ fontSize: 13, flexShrink: 0 }}>{brick?.emoji ?? '🔊'}</span>
                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'var(--color-text-base)',
                    }}
                  >
                    {az.label || brick?.label || '(sans nom)'}
                  </span>
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      removeAudioZone(mapId, az.id);
                    }}
                    title="Supprimer"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 1,
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                    }}
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              );
            })}
          </>
        )}

        {isEmpty && (
          <p
            style={{
              fontSize: 11,
              color: 'var(--color-text-secondary)',
              padding: '16px 12px',
              textAlign: 'center',
            }}
          >
            Aucune zone.
            <br />
            Cliquez sur Ajouter.
          </p>
        )}
      </div>

      {/* Inline form */}
      {showForm && (
        <div
          style={{
            borderTop: '1px solid var(--color-border-base)',
            padding: '8px',
            background: 'var(--color-bg-surface)',
            flexShrink: 0,
            overflowY: 'auto',
            maxHeight: 360,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            <span
              style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-base)', flex: 1 }}
            >
              {editingId ? 'Modifier interaction' : 'Nouvelle interaction'}
            </span>
            <button
              onClick={closeForm}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                fontSize: 14,
              }}
            >
              ✕
            </button>
          </div>

          {/* Type */}
          <div style={{ marginBottom: 6 }}>
            <span style={labelSm}>Type</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {(
                [
                  { value: 'dialogue', emoji: '💬', label: 'Dialogue' },
                  { value: 'exit', emoji: '🚪', label: 'Sortie' },
                  { value: 'audio', emoji: '🔊', label: 'Son' },
                ] as const
              ).map((t) => (
                <button
                  key={t.value}
                  onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                  style={{
                    flex: 1,
                    fontSize: 10,
                    padding: '5px 2px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor:
                      form.type === t.value ? 'var(--color-primary)' : 'var(--color-border-base)',
                    background: form.type === t.value ? 'var(--color-primary-15)' : 'transparent',
                    color:
                      form.type === t.value
                        ? 'var(--color-primary)'
                        : 'var(--color-text-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    transition: 'border-color 0.1s, background 0.1s',
                  }}
                >
                  <span style={{ fontSize: 14 }}>{t.emoji}</span>
                  <span style={{ fontWeight: form.type === t.value ? 700 : 400 }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Label */}
          <label style={{ marginBottom: 6, display: 'block' }}>
            <span style={labelSm}>Label</span>
            <input
              type="text"
              value={form.label}
              placeholder="Nom de la zone"
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              style={inputSm}
            />
          </label>

          {/* Dialogue-specific */}
          {form.type === 'dialogue' && (
            <>
              {/* Contenu : VN scene vs sign panel */}
              <div style={{ marginBottom: 6 }}>
                <span style={labelSm}>Contenu</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(
                    [
                      { value: 'dialogue', emoji: '💬', label: 'Scène VN' },
                      { value: 'sign', emoji: '📋', label: 'Panneau' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setForm((f) => ({ ...f, triggerType: opt.value }))}
                      style={{
                        flex: 1,
                        fontSize: 10,
                        padding: '5px 2px',
                        borderRadius: 4,
                        cursor: 'pointer',
                        border: '1px solid',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        borderColor:
                          form.triggerType === opt.value
                            ? 'var(--color-primary)'
                            : 'var(--color-border-base)',
                        background:
                          form.triggerType === opt.value
                            ? 'var(--color-primary-15)'
                            : 'transparent',
                        color:
                          form.triggerType === opt.value
                            ? 'var(--color-primary)'
                            : 'var(--color-text-secondary)',
                        fontWeight: form.triggerType === opt.value ? 700 : 400,
                        transition: 'border-color 0.1s, background 0.1s',
                      }}
                    >
                      {opt.emoji} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Déclenchement : auto vs interact */}
              <div style={{ marginBottom: 6 }}>
                <span style={labelSm}>Déclenchement</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(
                    [
                      { value: 'auto', emoji: '🏃', label: 'En entrant' },
                      { value: 'interact', emoji: '↵', label: 'Touche Entrée' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setForm((f) => ({ ...f, interactionMode: opt.value }))}
                      title={
                        opt.value === 'auto'
                          ? "Se déclenche à l'entrée dans la zone"
                          : 'Affiche "↵ Entrée" — le joueur appuie sur Entrée pour déclencher'
                      }
                      style={{
                        flex: 1,
                        fontSize: 10,
                        padding: '5px 2px',
                        borderRadius: 4,
                        cursor: 'pointer',
                        border: '1px solid',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        borderColor:
                          form.interactionMode === opt.value
                            ? 'var(--color-primary)'
                            : 'var(--color-border-base)',
                        background:
                          form.interactionMode === opt.value
                            ? 'var(--color-primary-15)'
                            : 'transparent',
                        color:
                          form.interactionMode === opt.value
                            ? 'var(--color-primary)'
                            : 'var(--color-text-secondary)',
                        fontWeight: form.interactionMode === opt.value ? 700 : 400,
                        transition: 'border-color 0.1s, background 0.1s',
                      }}
                    >
                      {opt.emoji} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Texte panneau */}
              {form.triggerType === 'sign' && (
                <label style={{ marginBottom: 6, display: 'block' }}>
                  <span style={labelSm}>Texte du panneau</span>
                  <textarea
                    value={form.signText}
                    placeholder="Texte à afficher quand le joueur lit ce panneau…"
                    onChange={(e) => setForm((f) => ({ ...f, signText: e.target.value }))}
                    rows={3}
                    style={{ ...inputSm, resize: 'vertical', minHeight: 56 }}
                  />
                </label>
              )}

              {/* Scène VN */}
              {form.triggerType === 'dialogue' && (
                <>
                  <label style={{ marginBottom: 6, display: 'block' }}>
                    <span style={labelSm}>Scène de dialogue</span>
                    {scenes.length === 0 ? (
                      <p
                        style={{
                          margin: '2px 0 0',
                          fontSize: 10,
                          color: 'var(--color-text-secondary)',
                          fontStyle: 'italic',
                        }}
                      >
                        Aucune scène créée — crée d'abord une scène dans l'onglet Scènes.
                      </p>
                    ) : (
                      <select
                        value={form.dialogueSceneId}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, dialogueSceneId: e.target.value }))
                        }
                        style={inputSm}
                      >
                        <option value="">— choisir une scène —</option>
                        {scenes.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title || '(sans titre)'}
                          </option>
                        ))}
                      </select>
                    )}
                  </label>
                  <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="checkbox"
                      id="once-cb"
                      checked={form.once}
                      onChange={(e) => setForm((f) => ({ ...f, once: e.target.checked }))}
                    />
                    <label
                      htmlFor="once-cb"
                      style={{
                        fontSize: 11,
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      Une seule fois
                    </label>
                  </div>
                </>
              )}
            </>
          )}

          {/* Exit-specific */}
          {form.type === 'exit' && (
            <label style={{ marginBottom: 6, display: 'block' }}>
              <span style={labelSm}>Carte destination</span>
              <select
                value={form.targetMapId}
                onChange={(e) => setForm((f) => ({ ...f, targetMapId: e.target.value }))}
                style={inputSm}
              >
                <option value="">— choisir —</option>
                {maps
                  .filter((m) => m.id !== mapId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </label>
          )}

          {/* Audio-specific */}
          {form.type === 'audio' && (
            <>
              <label style={{ marginBottom: 6, display: 'block' }}>
                <span style={labelSm}>Brique sonore</span>
                <select
                  value={form.soundBrickId}
                  onChange={(e) => setForm((f) => ({ ...f, soundBrickId: e.target.value }))}
                  style={inputSm}
                >
                  {SOUND_BRICKS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.emoji} {b.label}
                    </option>
                  ))}
                </select>
              </label>
              <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  id="audio-once-cb"
                  checked={form.once}
                  onChange={(e) => setForm((f) => ({ ...f, once: e.target.checked }))}
                />
                <label
                  htmlFor="audio-once-cb"
                  style={{ fontSize: 11, color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                >
                  Une seule fois
                </label>
              </div>
            </>
          )}

          {/* ⚙ Avancé — repliable */}
          <div
            style={{
              marginTop: 4,
              borderTop: '1px solid var(--color-border-subtle, var(--color-border-base))',
              paddingTop: 6,
            }}
          >
            <button
              onClick={() => setShowAdvanced((a) => !a)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                width: '100%',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 0',
                color: 'var(--color-text-muted)',
                fontSize: 10,
                transition: 'color 0.1s',
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  display: 'inline-block',
                  transform: showAdvanced ? 'rotate(90deg)' : 'none',
                  transition: 'transform 0.15s',
                  lineHeight: 1,
                }}
              >
                ▶
              </span>
              ⚙ Options avancées
            </button>

            {showAdvanced && (
              <>
                {/* Position de la zone (col/rang/larg/haut) */}
                <div style={{ marginTop: 6, marginBottom: 6 }}>
                  <span style={labelSm}>Position de la zone (tuiles)</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4 }}>
                    {(['x', 'y', 'w', 'h'] as const).map((field) => (
                      <label key={field} style={{ display: 'block' }}>
                        <span style={labelSm}>
                          {field === 'x'
                            ? 'Col'
                            : field === 'y'
                              ? 'Rang'
                              : field === 'w'
                                ? 'Larg'
                                : 'Haut'}
                        </span>
                        <input
                          type="number"
                          min={field === 'w' || field === 'h' ? 1 : 0}
                          value={form[field]}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              [field]: Math.max(
                                field === 'w' || field === 'h' ? 1 : 0,
                                parseInt(e.target.value, 10) || 0
                              ),
                            }))
                          }
                          style={{ ...inputSm, padding: '2px 4px' }}
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Spawn destination (exit uniquement) */}
                {form.type === 'exit' && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 4,
                      marginBottom: 6,
                    }}
                  >
                    <label style={{ display: 'block' }}>
                      <span style={labelSm}>Spawn col</span>
                      <input
                        type="number"
                        min={0}
                        value={form.targetX}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, targetX: parseInt(e.target.value, 10) || 0 }))
                        }
                        style={{ ...inputSm, padding: '2px 4px' }}
                      />
                    </label>
                    <label style={{ display: 'block' }}>
                      <span style={labelSm}>Spawn rang</span>
                      <input
                        type="number"
                        min={0}
                        value={form.targetY}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, targetY: parseInt(e.target.value, 10) || 0 }))
                        }
                        style={{ ...inputSm, padding: '2px 4px' }}
                      />
                    </label>
                  </div>
                )}

                {/* Fondu + BGM (dialogue VN uniquement) */}
                {form.type === 'dialogue' && form.triggerType === 'dialogue' && (
                  <>
                    <div style={{ marginBottom: 6 }}>
                      <span style={labelSm}>🎬 Fondu d'entrée</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {(
                          [
                            { value: 'fade-black', emoji: '⬛', label: 'Noir' },
                            { value: 'fade-white', emoji: '⬜', label: 'Blanc' },
                            { value: 'iris', emoji: '⭕', label: 'Iris' },
                            { value: 'none', emoji: '⚡', label: 'Direct' },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setForm((f) => ({ ...f, transitionType: opt.value }))}
                            title={
                              opt.value === 'fade-black'
                                ? 'Fondu vers le noir (défaut)'
                                : opt.value === 'fade-white'
                                  ? 'Flash blanc'
                                  : opt.value === 'iris'
                                    ? 'Fermeture circulaire (Pokémon)'
                                    : 'Coupure instantanée'
                            }
                            style={{
                              flex: 1,
                              fontSize: 10,
                              padding: '3px 2px',
                              borderRadius: 3,
                              cursor: 'pointer',
                              border: '1px solid',
                              borderColor:
                                form.transitionType === opt.value
                                  ? 'var(--color-primary)'
                                  : 'var(--color-border-base)',
                              background:
                                form.transitionType === opt.value
                                  ? 'var(--color-primary-15)'
                                  : 'transparent',
                              color:
                                form.transitionType === opt.value
                                  ? 'var(--color-primary)'
                                  : 'var(--color-text-secondary)',
                              transition: 'border-color 0.1s',
                            }}
                          >
                            {opt.emoji} {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: 6 }}>
                      <span style={labelSm}>🎵 Musique pendant le dialogue</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {(
                          [
                            { value: 'keep', emoji: '▶', label: 'Continuer' },
                            { value: 'replace', emoji: '🔄', label: 'Remplacer' },
                            { value: 'silence', emoji: '🔇', label: 'Silence' },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setForm((f) => ({ ...f, bgmBehavior: opt.value }))}
                            title={
                              opt.value === 'keep'
                                ? 'La musique de la carte continue'
                                : opt.value === 'replace'
                                  ? 'Stoppe la carte, joue la musique du dialogue'
                                  : 'Silence total pendant le dialogue'
                            }
                            style={{
                              flex: 1,
                              fontSize: 10,
                              padding: '3px 2px',
                              borderRadius: 3,
                              cursor: 'pointer',
                              border: '1px solid',
                              borderColor:
                                form.bgmBehavior === opt.value
                                  ? 'var(--color-primary)'
                                  : 'var(--color-border-base)',
                              background:
                                form.bgmBehavior === opt.value
                                  ? 'var(--color-primary-15)'
                                  : 'transparent',
                              color:
                                form.bgmBehavior === opt.value
                                  ? 'var(--color-primary)'
                                  : 'var(--color-text-secondary)',
                              transition: 'border-color 0.1s',
                            }}
                          >
                            {opt.emoji} {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={saveForm}
              style={{
                flex: 1,
                fontSize: 11,
                padding: '4px 0',
                borderRadius: 3,
                cursor: 'pointer',
                background: 'var(--color-primary)',
                border: 'none',
                color: 'white',
                fontWeight: 700,
              }}
            >
              {editingId ? 'Mettre à jour' : 'Créer'}
            </button>
            <button
              onClick={closeForm}
              style={{
                fontSize: 11,
                padding: '4px 8px',
                borderRadius: 3,
                cursor: 'pointer',
                background: 'transparent',
                border: '1px solid var(--color-border-base)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
