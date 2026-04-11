import { SOUND_BRICKS } from '@/config/soundBricks';
import type { SceneMetadata } from '@/types';

// ── Shared types (exported for use by TriggerZonePanel) ─────────────────────

export type ZoneType = 'dialogue' | 'exit' | 'audio';

export interface ZoneFormState {
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

export const DEFAULT_FORM: ZoneFormState = {
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

// ── Local styles ─────────────────────────────────────────────────────────────

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

// ── Props ────────────────────────────────────────────────────────────────────

interface ZoneFormProps {
  form: ZoneFormState;
  setForm: React.Dispatch<React.SetStateAction<ZoneFormState>>;
  editingId: string | null;
  showAdvanced: boolean;
  setShowAdvanced: React.Dispatch<React.SetStateAction<boolean>>;
  onSave: () => void;
  onClose: () => void;
  scenes: SceneMetadata[];
  maps: Array<{ id: string; name: string }>;
  mapId: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export function ZoneForm({
  form,
  setForm,
  editingId,
  showAdvanced,
  setShowAdvanced,
  onSave,
  onClose,
  scenes,
  maps,
  mapId,
}: ZoneFormProps) {
  return (
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
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-base)', flex: 1 }}>
          {editingId ? 'Modifier interaction' : 'Nouvelle interaction'}
        </span>
        <button
          onClick={onClose}
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
                  form.type === t.value ? 'var(--color-primary)' : 'var(--color-text-secondary)',
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
                      form.triggerType === opt.value ? 'var(--color-primary-15)' : 'transparent',
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
                    onChange={(e) => setForm((f) => ({ ...f, dialogueSceneId: e.target.value }))}
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
                  style={{ fontSize: 11, color: 'var(--color-text-secondary)', cursor: 'pointer' }}
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
          onClick={onSave}
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
          onClick={onClose}
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
  );
}
