/**
 * ObjectDefinitionDialog — Éditeur de définition d'objet (style Unity Inspector)
 *
 * Principe pédagogique : on voit uniquement les propriétés des composants
 * attachés à l'objet. Ajouter un composant = débloquer ses réglages.
 * Retirer un composant = ses réglages disparaissent.
 *
 * Structure :
 * - Nom de l'objet + catégorie (en haut)
 * - Une section par composant attaché (empilées, rétractables)
 * - Catalogue "Ajouter un composant" (en bas)
 * - Boutons Enregistrer / Annuler
 *
 * @module components/modules/TopdownEditor/ObjectDefinitionDialog
 */

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, ChevronDown, ChevronRight, Trash2, Settings } from 'lucide-react';
import { useMapsStore } from '@/stores/mapsStore';
import { SPRITE_CATEGORIES, OBJECT_COMPONENT_META } from '@/types/sprite';
import type {
  ObjectDefinition,
  ObjectComponent,
  ObjectComponentType,
  ColliderComponent,
  DialogueComponent,
  PatrolComponent,
  WindComponent,
  SoundComponent,
  LightComponent,
  SpriteComponent,
  AnimatedSpriteComponent,
  PortalComponent,
} from '@/types/sprite';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ObjectDefinitionDialogProps {
  /** ID de la définition à éditer. null = dialog fermé. */
  definitionId: string | null;
  onClose: () => void;
  /** Appelé quand l'utilisateur veut configurer le spritesheet d'un AnimatedSprite */
  onOpenSpriteImport: (defId: string) => void;
}

// ── Valeurs par défaut pour chaque composant ──────────────────────────────────

function makeDefaultComponent(type: ObjectComponentType): ObjectComponent {
  switch (type) {
    case 'sprite':
      return { type: 'sprite', spriteAssetUrl: '', srcX: 0, srcY: 0, srcW: 32, srcH: 32 };
    case 'animatedSprite':
      return { type: 'animatedSprite', spriteAssetUrl: '', spriteSheetConfigUrl: '' };
    case 'collider':
      return { type: 'collider', shape: 'box', offsetX: 0, offsetY: 0, w: 28, h: 28, radius: 14 };
    case 'dialogue':
      return { type: 'dialogue', sceneId: '', text: '', condition: '' };
    case 'patrol':
      return { type: 'patrol', targetCx: 0, targetCy: 0, speed: 80, loop: true };
    case 'wind':
      return { type: 'wind', amplitude: 3, frequency: 0.8, phaseOffset: 0 };
    case 'sound':
      return { type: 'sound', assetUrl: '', radius: 5, volume: 0.7, loop: true };
    case 'light':
      return { type: 'light', color: '#ffdd88', radius: 4, intensity: 0.8 };
    case 'portal':
      return {
        type: 'portal',
        targetMapId: '',
        targetCx: 0,
        targetCy: 0,
        interactionMode: 'auto',
        locked: false,
        unlockCondition: '',
      };
  }
}

// ── Couleur d'accent par composant ────────────────────────────────────────────

const COMPONENT_ACCENT: Record<ObjectComponentType, string> = {
  sprite: '#60a5fa',
  animatedSprite: '#a78bfa',
  collider: '#f87171',
  dialogue: '#34d399',
  patrol: '#fb923c',
  wind: '#38bdf8',
  sound: '#fbbf24',
  light: '#fde68a',
  portal: '#c084fc',
};

// ── Helpers UI ────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        color: 'rgba(255,255,255,0.45)',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}
    >
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 6,
        padding: '5px 8px',
        color: 'rgba(255,255,255,0.9)',
        fontSize: 11,
        outline: 'none',
      }}
    />
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', width: 90, flexShrink: 0 }}>
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: '#8b5cf6' }}
      />
      <span
        style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.7)',
          width: 36,
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        {step < 1 ? value.toFixed(1) : Math.round(value)}
        {unit}
      </span>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
      }}
    >
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 32,
          height: 18,
          borderRadius: 9,
          border: 'none',
          cursor: 'pointer',
          background: value ? '#8b5cf6' : 'rgba(255,255,255,0.12)',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
        aria-label={label}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: 'white',
            position: 'absolute',
            top: 3,
            left: value ? 17 : 3,
            transition: 'left 0.15s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          }}
        />
      </button>
    </div>
  );
}

// ── Éditeur de propriétés par type de composant ───────────────────────────────

function ComponentEditor({
  comp,
  defId,
  onChange,
  onOpenSpriteImport,
}: {
  comp: ObjectComponent;
  defId: string;
  onChange: (patch: Partial<ObjectComponent>) => void;
  onOpenSpriteImport: (defId: string) => void;
}) {
  switch (comp.type) {
    case 'sprite': {
      const c = comp as SpriteComponent;
      return (
        <div>
          <Label>URL de l'image</Label>
          <TextInput
            value={c.spriteAssetUrl}
            onChange={(v) => onChange({ spriteAssetUrl: v } as Partial<SpriteComponent>)}
            placeholder="chemin/vers/image.png"
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
            {(['srcX', 'srcY', 'srcW', 'srcH'] as const).map((key) => (
              <div key={key}>
                <Label>
                  {key === 'srcX'
                    ? 'Origine X'
                    : key === 'srcY'
                      ? 'Origine Y'
                      : key === 'srcW'
                        ? 'Largeur'
                        : 'Hauteur'}
                </Label>
                <input
                  type="number"
                  value={c[key]}
                  onChange={(e) =>
                    onChange({ [key]: parseInt(e.target.value) || 0 } as Partial<SpriteComponent>)
                  }
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 6,
                    padding: '4px 6px',
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: 11,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'animatedSprite': {
      const c = comp as AnimatedSpriteComponent;
      const hasUrl = !!c.spriteAssetUrl;
      return (
        <div>
          {hasUrl ? (
            <div
              style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.45)',
                marginBottom: 8,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              📁 {c.spriteAssetUrl.split('/').pop()}
            </div>
          ) : (
            <div style={{ fontSize: 10, color: 'rgba(251,191,36,0.8)', marginBottom: 8 }}>
              ⚠️ Aucun spritesheet configuré
            </div>
          )}
          <button
            onClick={() => onOpenSpriteImport(defId)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '7px 12px',
              background: 'rgba(139,92,246,0.15)',
              border: '1px solid rgba(139,92,246,0.35)',
              borderRadius: 7,
              color: '#c4b5fd',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <Settings size={11} />
            {hasUrl ? 'Modifier le spritesheet' : 'Configurer le spritesheet'}
          </button>
        </div>
      );
    }

    case 'collider': {
      const c = comp as ColliderComponent;
      return (
        <div>
          <Label>Forme</Label>
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            {(['box', 'circle', 'none'] as const).map((shape) => (
              <button
                key={shape}
                onClick={() => onChange({ shape } as Partial<ColliderComponent>)}
                style={{
                  flex: 1,
                  padding: '4px 0',
                  borderRadius: 6,
                  border: '1px solid',
                  borderColor: c.shape === shape ? '#f87171' : 'rgba(255,255,255,0.1)',
                  background: c.shape === shape ? 'rgba(248,113,113,0.15)' : 'transparent',
                  color: c.shape === shape ? '#f87171' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                {shape === 'box' ? '▭ Boîte' : shape === 'circle' ? '◯ Cercle' : '✕ Aucun'}
              </button>
            ))}
          </div>
          {c.shape === 'box' && (
            <>
              <SliderRow
                label="Largeur (px)"
                value={c.w}
                min={4}
                max={128}
                onChange={(v) => onChange({ w: v } as Partial<ColliderComponent>)}
                unit="px"
              />
              <SliderRow
                label="Hauteur (px)"
                value={c.h}
                min={4}
                max={128}
                onChange={(v) => onChange({ h: v } as Partial<ColliderComponent>)}
                unit="px"
              />
            </>
          )}
          {c.shape === 'circle' && (
            <SliderRow
              label="Rayon (px)"
              value={c.radius}
              min={2}
              max={64}
              onChange={(v) => onChange({ radius: v } as Partial<ColliderComponent>)}
              unit="px"
            />
          )}
          {c.shape !== 'none' && (
            <>
              <SliderRow
                label="Décalage X"
                value={c.offsetX}
                min={-32}
                max={32}
                onChange={(v) => onChange({ offsetX: v } as Partial<ColliderComponent>)}
                unit="px"
              />
              <SliderRow
                label="Décalage Y"
                value={c.offsetY}
                min={-32}
                max={32}
                onChange={(v) => onChange({ offsetY: v } as Partial<ColliderComponent>)}
                unit="px"
              />
            </>
          )}
        </div>
      );
    }

    case 'dialogue': {
      const c = comp as DialogueComponent;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <Label>ID de la scène VN</Label>
            <TextInput
              value={c.sceneId}
              onChange={(v) => onChange({ sceneId: v } as Partial<DialogueComponent>)}
              placeholder="ex: scene-abc123"
            />
          </div>
          <div>
            <Label>Texte par défaut (optionnel)</Label>
            <TextInput
              value={c.text ?? ''}
              onChange={(v) => onChange({ text: v } as Partial<DialogueComponent>)}
              placeholder="Bonjour !"
            />
          </div>
          <div>
            <Label>Condition de déclenchement (optionnel)</Label>
            <TextInput
              value={c.condition ?? ''}
              onChange={(v) => onChange({ condition: v } as Partial<DialogueComponent>)}
              placeholder="ex: var.flag_rencontre === true"
            />
          </div>
        </div>
      );
    }

    case 'patrol': {
      const c = comp as PatrolComponent;
      return (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <Label>Destination — Colonne</Label>
              <input
                type="number"
                value={c.targetCx}
                onChange={(e) =>
                  onChange({ targetCx: parseInt(e.target.value) || 0 } as Partial<PatrolComponent>)
                }
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 6,
                  padding: '4px 6px',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 11,
                }}
              />
            </div>
            <div>
              <Label>Destination — Rangée</Label>
              <input
                type="number"
                value={c.targetCy}
                onChange={(e) =>
                  onChange({ targetCy: parseInt(e.target.value) || 0 } as Partial<PatrolComponent>)
                }
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 6,
                  padding: '4px 6px',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 11,
                }}
              />
            </div>
          </div>
          <SliderRow
            label="Vitesse (px/s)"
            value={c.speed}
            min={20}
            max={300}
            step={10}
            onChange={(v) => onChange({ speed: v } as Partial<PatrolComponent>)}
            unit="px/s"
          />
          <Toggle
            label="Aller-retour en boucle"
            value={c.loop}
            onChange={(v) => onChange({ loop: v } as Partial<PatrolComponent>)}
          />
        </div>
      );
    }

    case 'wind': {
      const c = comp as WindComponent;
      return (
        <div>
          <SliderRow
            label="Amplitude (px)"
            value={c.amplitude}
            min={1}
            max={20}
            onChange={(v) => onChange({ amplitude: v } as Partial<WindComponent>)}
            unit="px"
          />
          <SliderRow
            label="Fréquence (Hz)"
            value={c.frequency}
            min={0.1}
            max={3}
            step={0.1}
            onChange={(v) => onChange({ frequency: v } as Partial<WindComponent>)}
            unit="Hz"
          />
          <SliderRow
            label="Décalage de phase"
            value={c.phaseOffset ?? 0}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => onChange({ phaseOffset: v } as Partial<WindComponent>)}
          />
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
            💡 Le décalage de phase fait ondule chaque arbre différemment de son voisin
          </div>
        </div>
      );
    }

    case 'sound': {
      const c = comp as SoundComponent;
      return (
        <div>
          <Label>Fichier audio (URL)</Label>
          <TextInput
            value={c.assetUrl}
            onChange={(v) => onChange({ assetUrl: v } as Partial<SoundComponent>)}
            placeholder="chemin/vers/son.wav"
          />
          <div style={{ marginTop: 8 }}>
            <SliderRow
              label="Rayon (tuiles)"
              value={c.radius}
              min={1}
              max={20}
              onChange={(v) => onChange({ radius: v } as Partial<SoundComponent>)}
              unit=" tuiles"
            />
            <SliderRow
              label="Volume"
              value={c.volume}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => onChange({ volume: v } as Partial<SoundComponent>)}
            />
            <Toggle
              label="En boucle"
              value={c.loop}
              onChange={(v) => onChange({ loop: v } as Partial<SoundComponent>)}
            />
          </div>
        </div>
      );
    }

    case 'light': {
      const c = comp as LightComponent;
      return (
        <div>
          <div style={{ marginBottom: 8 }}>
            <Label>Couleur de la lumière</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="color"
                value={c.color}
                onChange={(e) => onChange({ color: e.target.value } as Partial<LightComponent>)}
                style={{
                  width: 32,
                  height: 26,
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  background: 'none',
                }}
              />
              <span
                style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}
              >
                {c.color}
              </span>
            </div>
          </div>
          <SliderRow
            label="Rayon (tuiles)"
            value={c.radius}
            min={1}
            max={20}
            onChange={(v) => onChange({ radius: v } as Partial<LightComponent>)}
            unit=" tuiles"
          />
          <SliderRow
            label="Intensité"
            value={c.intensity}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => onChange({ intensity: v } as Partial<LightComponent>)}
          />
          <div style={{ fontSize: 9, color: 'rgba(253,230,138,0.5)', marginTop: 4 }}>
            💡 Rendu Phase 3 — réservé pour l'implémentation du moteur de lumières
          </div>
        </div>
      );
    }

    case 'portal': {
      const c = comp as PortalComponent;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <Label>Carte de destination (ID)</Label>
            <TextInput
              value={c.targetMapId}
              onChange={(v) => onChange({ targetMapId: v } as Partial<PortalComponent>)}
              placeholder="ex: map-village"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div>
              <Label>Spawn — Colonne</Label>
              <input
                type="number"
                value={c.targetCx}
                onChange={(e) =>
                  onChange({ targetCx: parseInt(e.target.value) || 0 } as Partial<PortalComponent>)
                }
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 6,
                  padding: '4px 6px',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 11,
                }}
              />
            </div>
            <div>
              <Label>Spawn — Rangée</Label>
              <input
                type="number"
                value={c.targetCy}
                onChange={(e) =>
                  onChange({ targetCy: parseInt(e.target.value) || 0 } as Partial<PortalComponent>)
                }
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 6,
                  padding: '4px 6px',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 11,
                }}
              />
            </div>
          </div>
          <div>
            <Label>Mode d'interaction</Label>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['auto', 'interact'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onChange({ interactionMode: mode } as Partial<PortalComponent>)}
                  style={{
                    flex: 1,
                    padding: '5px 0',
                    borderRadius: 6,
                    border: '1px solid',
                    borderColor: c.interactionMode === mode ? '#c084fc' : 'rgba(255,255,255,0.1)',
                    background:
                      c.interactionMode === mode ? 'rgba(192,132,252,0.15)' : 'transparent',
                    color: c.interactionMode === mode ? '#c084fc' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {mode === 'auto' ? '🚶 Passage auto' : '🅴 Touche E'}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
              {c.interactionMode === 'auto'
                ? 'Le joueur traverse en marchant (style Pokémon)'
                : 'Le joueur appuie sur E devant la porte (style JRPG)'}
            </div>
          </div>
          <Toggle
            label="Porte verrouillée"
            value={c.locked}
            onChange={(v) => onChange({ locked: v } as Partial<PortalComponent>)}
          />
          {c.locked && (
            <div>
              <Label>Condition de déverrouillage (optionnel)</Label>
              <TextInput
                value={c.unlockCondition ?? ''}
                onChange={(v) => onChange({ unlockCondition: v } as Partial<PortalComponent>)}
                placeholder="ex: var.clef_obtenue === true"
              />
            </div>
          )}
        </div>
      );
    }
  }
}

// ── Section composant (avec header collapsible + bouton supprimer) ─────────────

function ComponentSection({
  comp,
  index,
  defId,
  onUpdate,
  onRemove,
  onOpenSpriteImport,
}: {
  comp: ObjectComponent;
  index: number;
  defId: string;
  onUpdate: (idx: number, patch: Partial<ObjectComponent>) => void;
  onRemove: (idx: number) => void;
  onOpenSpriteImport: (defId: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const meta = OBJECT_COMPONENT_META[comp.type];
  const accent = COMPONENT_ACCENT[comp.type];

  return (
    <div
      style={{
        borderRadius: 8,
        border: `1px solid ${accent}30`,
        overflow: 'hidden',
        marginBottom: 6,
      }}
    >
      {/* Header */}
      <div
        onClick={() => setCollapsed((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 10px',
          background: `${accent}12`,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 13 }}>{meta.emoji}</span>
        <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: accent }}>{meta.label}</span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginRight: 4 }}>
          {meta.description}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(index);
          }}
          title="Retirer ce composant"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 18,
            height: 18,
            borderRadius: 4,
            border: 'none',
            background: 'transparent',
            color: 'rgba(248,113,113,0.5)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#f87171';
            e.currentTarget.style.background = 'rgba(248,113,113,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(248,113,113,0.5)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <Trash2 size={10} />
        </button>
        {collapsed ? (
          <ChevronRight size={12} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
        ) : (
          <ChevronDown size={12} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
        )}
      </div>

      {/* Body */}
      {!collapsed && (
        <div style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.2)' }}>
          <ComponentEditor
            comp={comp}
            defId={defId}
            onChange={(patch) => onUpdate(index, patch)}
            onOpenSpriteImport={onOpenSpriteImport}
          />
        </div>
      )}
    </div>
  );
}

// ── Catalogue "Ajouter un composant" ──────────────────────────────────────────

function ComponentCatalog({
  attachedTypes,
  onAdd,
  onClose,
}: {
  attachedTypes: ObjectComponentType[];
  onAdd: (type: ObjectComponentType) => void;
  onClose: () => void;
}) {
  const available = (Object.keys(OBJECT_COMPONENT_META) as ObjectComponentType[]).filter(
    (t) => !attachedTypes.includes(t)
  );

  if (available.length === 0) {
    return (
      <div
        style={{
          padding: '12px 16px',
          textAlign: 'center',
          fontSize: 11,
          color: 'rgba(255,255,255,0.4)',
        }}
      >
        Tous les composants sont déjà attachés.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      style={{
        border: '1px solid rgba(139,92,246,0.3)',
        borderRadius: 8,
        background: 'rgba(20,20,40,0.98)',
        overflow: 'hidden',
        marginBottom: 6,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          fontSize: 10,
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        <span>Choisir un composant</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.3)',
            cursor: 'pointer',
            padding: 2,
          }}
        >
          <X size={11} />
        </button>
      </div>
      <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {available.map((type) => {
          const meta = OBJECT_COMPONENT_META[type];
          const accent = COMPONENT_ACCENT[type];
          return (
            <button
              key={type}
              onClick={() => {
                onAdd(type);
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '7px 10px',
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'rgba(255,255,255,0.82)',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${accent}14`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{meta.emoji}</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: accent }}>{meta.label}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                  {meta.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Dialog principal ──────────────────────────────────────────────────────────

function ObjectDefinitionDialogInner({
  definitionId,
  onClose,
  onOpenSpriteImport,
}: ObjectDefinitionDialogProps) {
  const objectDefinitions = useMapsStore((s) => s.objectDefinitions);
  const updateObjectDefinition = useMapsStore((s) => s.updateObjectDefinition);

  // Brouillon local — on n'écrit dans le store qu'au moment de "Enregistrer"
  const [draft, setDraft] = useState<ObjectDefinition | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);

  // Initialiser le brouillon à l'ouverture
  useEffect(() => {
    if (!definitionId) return;
    const def = objectDefinitions.find((d) => d.id === definitionId);
    if (def) {
      setDraft({ ...def, components: [...def.components] });
      setShowCatalog(false);
    }
  }, [definitionId, objectDefinitions]);

  // Fermer sur Échap
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const updateComp = useCallback((idx: number, patch: Partial<ObjectComponent>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const newComps = [...prev.components];
      newComps[idx] = { ...newComps[idx], ...patch } as ObjectComponent;
      return { ...prev, components: newComps };
    });
  }, []);

  const removeComp = useCallback((idx: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const newComps = prev.components.filter((_, i) => i !== idx);
      return { ...prev, components: newComps };
    });
  }, []);

  const addComp = useCallback((type: ObjectComponentType) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, components: [...prev.components, makeDefaultComponent(type)] };
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!draft || !definitionId) return;
    updateObjectDefinition(definitionId, {
      displayName: draft.displayName,
      category: draft.category,
      components: draft.components,
    });
    onClose();
  }, [draft, definitionId, updateObjectDefinition, onClose]);

  if (!draft) return null;

  const attachedTypes = draft.components.map((c) => c.type);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9990,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 6 }}
        transition={{ type: 'spring', damping: 22, stiffness: 340 }}
        style={{
          width: 400,
          maxHeight: '88vh',
          background: '#13131f',
          border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: 14,
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── En-tête ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 9,
                color: 'rgba(255,255,255,0.3)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 4,
              }}
            >
              Définition d'objet
            </div>
            <input
              value={draft.displayName}
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, displayName: e.target.value } : prev))
              }
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'rgba(255,255,255,0.92)',
                fontSize: 16,
                fontWeight: 700,
                width: '100%',
              }}
              placeholder="Nom de l'objet"
            />
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              height: 26,
              borderRadius: 7,
              border: 'none',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
            aria-label="Fermer"
          >
            <X size={13} />
          </button>
        </div>

        {/* ── Catégorie ── */}
        <div
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 6,
            }}
          >
            Catégorie
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {SPRITE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setDraft((prev) => (prev ? { ...prev, category: cat.id } : prev))}
                style={{
                  padding: '3px 8px',
                  borderRadius: 12,
                  border: '1px solid',
                  borderColor:
                    draft.category === cat.id ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.1)',
                  background: draft.category === cat.id ? 'rgba(139,92,246,0.18)' : 'transparent',
                  color: draft.category === cat.id ? '#c4b5fd' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  fontSize: 10,
                  fontWeight: draft.category === cat.id ? 600 : 400,
                }}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Corps défilant ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {/* Sections composants */}
          {draft.components.length === 0 && !showCatalog && (
            <div
              style={{
                textAlign: 'center',
                padding: '24px 16px',
                color: 'rgba(255,255,255,0.25)',
                fontSize: 11,
              }}
            >
              Aucun composant — cet objet n'a pas encore de comportement.
              <br />
              <span style={{ fontSize: 10 }}>Ajoutez-en un ci-dessous pour commencer.</span>
            </div>
          )}

          {draft.components.map((comp, idx) => (
            <ComponentSection
              key={`${comp.type}-${idx}`}
              comp={comp}
              index={idx}
              defId={definitionId!}
              onUpdate={updateComp}
              onRemove={removeComp}
              onOpenSpriteImport={onOpenSpriteImport}
            />
          ))}

          {/* Catalogue */}
          <AnimatePresence>
            {showCatalog && (
              <ComponentCatalog
                attachedTypes={attachedTypes}
                onAdd={addComp}
                onClose={() => setShowCatalog(false)}
              />
            )}
          </AnimatePresence>

          {/* Bouton ajouter */}
          {!showCatalog && (
            <button
              onClick={() => setShowCatalog(true)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px dashed rgba(139,92,246,0.3)',
                background: 'transparent',
                color: 'rgba(139,92,246,0.7)',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(139,92,246,0.07)';
                e.currentTarget.style.color = '#c4b5fd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(139,92,246,0.7)';
              }}
            >
              <Plus size={12} />
              Ajouter un composant
            </button>
          )}
        </div>

        {/* ── Pied de page ── */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 2,
              padding: '8px 0',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: 'white',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Enregistrer
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Portal wrapper ─────────────────────────────────────────────────────────────

export default function ObjectDefinitionDialog(props: ObjectDefinitionDialogProps) {
  if (!props.definitionId) return null;
  return createPortal(
    <AnimatePresence>
      <ObjectDefinitionDialogInner {...props} />
    </AnimatePresence>,
    document.body
  );
}
