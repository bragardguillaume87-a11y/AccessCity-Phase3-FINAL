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
import { pixelToTile, tileToPixel } from '@/utils/mapUtils';
import { ZoneForm, DEFAULT_FORM } from './TriggerZonePanel/components/ZoneForm';
import type { ZoneFormState } from './TriggerZonePanel/components/ZoneForm';

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
      x: pixelToTile(t.zone.x, tileSize),
      y: pixelToTile(t.zone.y, tileSize),
      w: pixelToTile(t.zone.width, tileSize),
      h: pixelToTile(t.zone.height, tileSize),
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
      x: pixelToTile(e.zone.x, tileSize),
      y: pixelToTile(e.zone.y, tileSize),
      w: pixelToTile(e.zone.width, tileSize),
      h: pixelToTile(e.zone.height, tileSize),
      dialogueSceneId: '',
      once: false,
      bgmBehavior: 'keep',
      transitionType: 'fade-black',
      triggerType: 'dialogue',
      interactionMode: 'auto',
      signText: '',
      targetMapId: e.targetMapId,
      targetX: pixelToTile(e.targetPos.x, tileSize),
      targetY: pixelToTile(e.targetPos.y, tileSize),
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
      x: pixelToTile(az.zone.x, tileSize),
      y: pixelToTile(az.zone.y, tileSize),
      w: pixelToTile(az.zone.width, tileSize),
      h: pixelToTile(az.zone.height, tileSize),
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
      x: tileToPixel(form.x, tileSize),
      y: tileToPixel(form.y, tileSize),
      width: tileToPixel(form.w, tileSize),
      height: tileToPixel(form.h, tileSize),
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
        targetPos: {
          x: tileToPixel(form.targetX, tileSize),
          y: tileToPixel(form.targetY, tileSize),
        },
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
                  {pixelToTile(t.zone.x, tileSize)}
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
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              padding: '20px 12px',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: 28 }}>🟢</span>
            <p
              style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--color-text-base)' }}
            >
              Aucune zone
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: 'var(--color-text-secondary)',
                lineHeight: 1.5,
              }}
            >
              Les zones déclenchent dialogues, sorties et sons quand le joueur y entre.
              <br />
              Dessinez une zone sur la carte ou cliquez{' '}
              <strong style={{ color: 'var(--color-primary)' }}>+ Ajouter</strong>.
            </p>
          </div>
        )}
      </div>

      {/* Inline form */}
      {showForm && (
        <ZoneForm
          form={form}
          setForm={setForm}
          editingId={editingId}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          onSave={saveForm}
          onClose={closeForm}
          scenes={scenes}
          maps={maps}
          mapId={mapId}
        />
      )}
    </div>
  );
}
