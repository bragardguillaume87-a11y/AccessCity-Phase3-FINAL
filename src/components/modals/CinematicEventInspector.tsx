/**
 * CinematicEventInspector
 *
 * Affiche les champs d'édition pour un CinematicEvent sélectionné.
 * Chaque type d'event a ses propres contrôles adaptés.
 * Philosophie no-code : labels simples, pas de valeurs brutes exposées.
 */
import type { CinematicEvent, CinematicSpeed, CinematicSide, CinematicIntensity } from '@/types';
import {
  CINEMATIC_SPEED_LABELS,
  CINEMATIC_EVENT_META,
  TINT_PRESET_LABELS,
} from '@/types/cinematic';
import type { Character } from '@/types';

// ── Shared field components ───────────────────────────────────────────────────

interface FieldProps { label: string; children: React.ReactNode; }
function Field({ label, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</label>
      {children}
    </div>
  );
}

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}
function Select({ value, onChange, options }: SelectProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg px-3 py-2 text-sm bg-[var(--color-bg-elevated)] border border-[var(--color-border-base)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-violet-500"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

interface TextInputProps { value: string; onChange: (v: string) => void; placeholder?: string; }
function TextInput({ value, onChange, placeholder }: TextInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg px-3 py-2 text-sm bg-[var(--color-bg-elevated)] border border-[var(--color-border-base)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-violet-500"
    />
  );
}

interface TextareaProps { value: string; onChange: (v: string) => void; rows?: number; }
function Textarea({ value, onChange, rows = 4 }: TextareaProps) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      className="w-full rounded-lg px-3 py-2 text-sm bg-[var(--color-bg-elevated)] border border-[var(--color-border-base)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
    />
  );
}

interface ToggleProps { value: boolean; onChange: (v: boolean) => void; label: string; }
function Toggle({ value, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={[
        'flex items-center gap-2 w-full px-3 py-2 rounded-lg border transition-colors text-sm font-medium',
        value
          ? 'bg-violet-900/40 border-violet-500 text-violet-300'
          : 'bg-[var(--color-bg-elevated)] border-[var(--color-border-base)] text-[var(--color-text-secondary)]',
      ].join(' ')}
      aria-pressed={value}
    >
      <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${value ? 'bg-violet-400 border-violet-400' : 'border-[var(--color-border-hover)]'}`} />
      {label}
    </button>
  );
}

// Shared option lists
const speedOptions = (Object.keys(CINEMATIC_SPEED_LABELS) as CinematicSpeed[]).map(s => ({
  value: s, label: CINEMATIC_SPEED_LABELS[s],
}));

const sideOptions: Array<{ value: CinematicSide; label: string }> = [
  { value: 'left', label: 'Gauche' },
  { value: 'right', label: 'Droite' },
  { value: 'top', label: 'Haut' },
  { value: 'bottom', label: 'Bas' },
];

const intensityOptions: Array<{ value: CinematicIntensity; label: string }> = [
  { value: 'light', label: 'Léger' },
  { value: 'medium', label: 'Moyen' },
  { value: 'strong', label: 'Fort' },
];

// ── Inspector ─────────────────────────────────────────────────────────────────

interface Props {
  event: CinematicEvent;
  characters: Character[];
  onUpdate: (updated: CinematicEvent) => void;
}

export function CinematicEventInspector({ event, characters, onUpdate }: Props) {
  const meta = CINEMATIC_EVENT_META.find(m => m.type === event.type);

  // `keyof CinematicEvent` on a union type = only shared keys ('id'|'type').
  // Using string + unknown + double-cast is safe here: we only call patch inside
  // type-narrowed `event.type` blocks, so the key/value are always correct.
  const patch = (key: string, value: unknown) => {
    onUpdate({ ...event, [key]: value } as unknown as CinematicEvent);
  };

  const characterOptions = [
    { value: '', label: '(choisir un personnage)' },
    ...characters.map(c => ({ value: c.id, label: c.name })),
  ];

  const moodOptions = (charId: string) => {
    const char = characters.find(c => c.id === charId);
    if (!char || !char.moods?.length) return [{ value: 'default', label: 'default' }];
    return char.moods.map(m => ({ value: m, label: m }));
  };

  const tintOptions = (Object.keys(TINT_PRESET_LABELS) as Array<keyof typeof TINT_PRESET_LABELS>).map(k => ({
    value: k, label: TINT_PRESET_LABELS[k],
  }));

  return (
    <div className="p-5 space-y-5 max-w-xl">
      {/* Event header */}
      <div className="flex items-center gap-3 pb-3 border-b border-[var(--color-border-base)]">
        <span className="text-2xl leading-none">{meta?.emoji ?? '❓'}</span>
        <div>
          <h3 className="font-bold text-[var(--color-text-primary)] text-base">{meta?.label ?? event.type}</h3>
          <p className="text-xs text-[var(--color-text-muted)]">Événement #{event.id.split('-').pop()}</p>
        </div>
      </div>

      {/* Type-specific fields */}
      {event.type === 'fade' && (<>
        <Field label="Direction">
          <Select value={event.direction} onChange={v => patch('direction', v as 'in' | 'out')}
            options={[{ value: 'out', label: '→ Vers le noir' }, { value: 'in', label: '← Depuis le noir' }]} />
        </Field>
        <Field label="Couleur"><Select value={event.color} onChange={v => patch('color', v as 'black' | 'white')}
          options={[{ value: 'black', label: 'Noir' }, { value: 'white', label: 'Blanc' }]} /></Field>
        <Field label="Vitesse"><Select value={event.speed} onChange={v => patch('speed', v as CinematicSpeed)} options={speedOptions} /></Field>
      </>)}

      {event.type === 'flash' && (<>
        <Field label="Couleur"><Select value={event.color} onChange={v => patch('color', v as 'black' | 'white')}
          options={[{ value: 'white', label: 'Blanc (éblouissement)' }, { value: 'black', label: 'Noir' }]} /></Field>
        <Field label="Vitesse"><Select value={event.speed} onChange={v => patch('speed', v as CinematicSpeed)} options={speedOptions} /></Field>
      </>)}

      {event.type === 'screenShake' && (<>
        <Field label="Intensité"><Select value={event.intensity} onChange={v => patch('intensity', v as CinematicIntensity)} options={intensityOptions} /></Field>
        <Field label="Durée"><Select value={event.speed} onChange={v => patch('speed', v as CinematicSpeed)} options={speedOptions} /></Field>
      </>)}

      {event.type === 'background' && (<>
        <Field label="Image de fond (URL ou chemin)">
          <TextInput value={event.url} onChange={v => patch('url', v)} placeholder="/assets/backgrounds/ville.jpg" />
        </Field>
        <Field label="Transition">
          <Select value={event.transition} onChange={v => patch('transition', v as 'cut' | 'fade' | 'dissolve')}
            options={[{ value: 'cut', label: 'Coupe directe' }, { value: 'fade', label: 'Fondu' }, { value: 'dissolve', label: 'Dissolution' }]} />
        </Field>
      </>)}

      {(event.type === 'characterEnter' || event.type === 'characterExit') && (<>
        <Field label="Personnage">
          <Select value={event.characterId} onChange={v => patch('characterId', v)} options={characterOptions} />
        </Field>
        {event.type === 'characterEnter' && event.characterId && (<>
          <Field label="Expression">
            <Select value={event.mood} onChange={v => patch('mood', v)} options={moodOptions(event.characterId)} />
          </Field>
        </>)}
        <Field label={event.type === 'characterEnter' ? "Côté d'entrée" : "Côté de sortie"}>
          <Select value={event.side} onChange={v => patch('side', v as CinematicSide)} options={sideOptions} />
        </Field>
        <Field label="Vitesse"><Select value={event.speed} onChange={v => patch('speed', v as CinematicSpeed)} options={speedOptions} /></Field>
      </>)}

      {event.type === 'dialogue' && (<>
        <Field label="Personnage (vide = narrateur)">
          <Select value={event.speaker} onChange={v => patch('speaker', v)} options={characterOptions} />
        </Field>
        {event.speaker && (
          <Field label="Expression">
            <Select value={event.speakerMood ?? 'default'} onChange={v => patch('speakerMood', v)} options={moodOptions(event.speaker)} />
          </Field>
        )}
        <Field label="Texte"><Textarea value={event.text} onChange={v => patch('text', v)} rows={4} /></Field>
        <Field label="Avance automatique">
          <Toggle value={event.autoAdvance} onChange={v => patch('autoAdvance', v)} label={event.autoAdvance ? 'Oui — avance seul' : 'Non — attend le clic'} />
        </Field>
        <Field label="Vitesse du texte"><Select value={event.speed} onChange={v => patch('speed', v as CinematicSpeed)} options={speedOptions} /></Field>
      </>)}

      {event.type === 'wait' && (
        <Field label="Durée de la pause">
          <Select value={event.speed} onChange={v => patch('speed', v as CinematicSpeed)} options={speedOptions} />
        </Field>
      )}

      {(event.type === 'sfx' || event.type === 'bgm') && (<>
        <Field label="Fichier audio (URL ou chemin)">
          <TextInput value={event.url} onChange={v => patch('url', v)} placeholder="/assets/audio/son.mp3" />
        </Field>
        <Field label={`Volume (${Math.round((event.volume ?? 0.7) * 100)} %)`}>
          <input type="range" min={0} max={1} step={0.05}
            value={event.volume ?? 0.7}
            onChange={e => patch('volume', parseFloat(e.target.value))}
            className="w-full accent-violet-500"
          />
        </Field>
        {event.type === 'bgm' && (
          <Field label="Transition">
            <Toggle value={event.fade} onChange={v => patch('fade', v)} label={event.fade ? 'Fondu progressif' : 'Changement direct'} />
          </Field>
        )}
      </>)}

      {event.type === 'vignette' && (<>
        <Field label="État">
          <Toggle value={event.on} onChange={v => patch('on', v)} label={event.on ? 'Halo activé' : 'Halo désactivé'} />
        </Field>
        <Field label="Intensité"><Select value={event.intensity} onChange={v => patch('intensity', v as CinematicIntensity)} options={intensityOptions} /></Field>
        <Field label="Vitesse"><Select value={event.speed} onChange={v => patch('speed', v as CinematicSpeed)} options={speedOptions} /></Field>
      </>)}

      {event.type === 'tint' && (<>
        <Field label="Ambiance"><Select value={event.preset} onChange={v => patch('preset', v as typeof event.preset)} options={tintOptions} /></Field>
        <Field label="Vitesse"><Select value={event.speed} onChange={v => patch('speed', v as CinematicSpeed)} options={speedOptions} /></Field>
      </>)}

      {event.type === 'zoom' && (<>
        <Field label="Direction">
          <Select value={event.direction} onChange={v => patch('direction', v as 'in' | 'out')}
            options={[{ value: 'in', label: 'Zoom avant' }, { value: 'out', label: 'Zoom arrière' }]} />
        </Field>
        <Field label={`Niveau de zoom (× ${event.scale})`}>
          <input type="range" min={event.direction === 'in' ? 1.1 : 0.7} max={event.direction === 'in' ? 1.8 : 0.97} step={0.05}
            value={event.scale} onChange={e => patch('scale', parseFloat(e.target.value))}
            className="w-full accent-violet-500"
          />
        </Field>
        <Field label="Vitesse"><Select value={event.speed} onChange={v => patch('speed', v as CinematicSpeed)} options={speedOptions} /></Field>
      </>)}

      {event.type === 'letterbox' && (<>
        <Field label="Barres cinéma">
          <Toggle value={event.on} onChange={v => patch('on', v)} label={event.on ? 'Afficher les barres' : 'Masquer les barres'} />
        </Field>
        <Field label="Vitesse"><Select value={event.speed} onChange={v => patch('speed', v as CinematicSpeed)} options={speedOptions} /></Field>
      </>)}

      {event.type === 'titleCard' && (<>
        <Field label="Titre principal"><TextInput value={event.title} onChange={v => patch('title', v)} placeholder="Chapitre 1 : L'Arrivée" /></Field>
        <Field label="Sous-titre (optionnel)">
          <TextInput value={event.subtitle ?? ''} onChange={v => patch('subtitle', v || undefined)} placeholder="La ville d'Access City" />
        </Field>
        <Field label="Vitesse"><Select value={event.speed} onChange={v => patch('speed', v as CinematicSpeed)} options={speedOptions} /></Field>
      </>)}

      {event.type === 'characterShake' && (<>
        <Field label="Personnage">
          <Select value={event.characterId} onChange={v => patch('characterId', v)} options={characterOptions} />
        </Field>
        <Field label="Intensité"><Select value={event.intensity} onChange={v => patch('intensity', v as CinematicIntensity)} options={intensityOptions} /></Field>
      </>)}
    </div>
  );
}
