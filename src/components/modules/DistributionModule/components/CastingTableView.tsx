import { useState, useMemo, useCallback } from 'react';
import { useCharactersStore } from '@/stores';
import type { Character } from '@/types/characters';
import { convertFileSrcIfNeeded } from '@/utils/tauri';
import { AvatarPicker } from '@/components/tabs/characters/components/AvatarPicker';

// Fallback stable pour éviter les [] inline dans les rendus (Acton §15.4)
const EMPTY_MOODS: string[] = [];

interface PickerTarget {
  charId: string;
  mood: string;
  char: Character;
}

interface SpriteCellProps {
  char: Character;
  mood: string;
  onOpen: (char: Character, mood: string) => void;
}

/** Cellule individuelle 64×88px — affiche le sprite du mood ou un slot vide cliquable. */
const SpriteCell = ({ char, mood, onOpen }: SpriteCellProps) => {
  const url = char.sprites[mood] ?? null;
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={() => onOpen(char, mood)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={url ? `${char.name} — ${mood}` : `Assigner un sprite pour "${mood}"`}
      style={{
        width: 64,
        height: 88,
        borderRadius: 8,
        border: `1.5px solid ${hover ? 'var(--color-primary)' : 'var(--color-border-base)'}`,
        background: hover ? 'var(--color-primary-subtle)' : 'var(--color-bg-hover)',
        cursor: 'pointer',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'border-color 0.1s, background 0.1s',
        position: 'relative',
      }}
    >
      {url ? (
        <img
          src={convertFileSrcIfNeeded(url)}
          alt={`${char.name} ${mood}`}
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      ) : (
        <span style={{ fontSize: 22, opacity: hover ? 0.8 : 0.35 }}>+</span>
      )}
      {url && hover && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(139,92,246,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 16 }}>✎</span>
        </div>
      )}
    </div>
  );
};

/**
 * CastingTableView — Grille personnages × moods.
 * Clic sur une cellule → AvatarPicker (assets de l'app, Tauri-compatible).
 * Le sprite est stocké dans Character.sprites via useCharactersStore.getState().
 *
 * Fix #2 : remplace URL.createObjectURL (blob URL perdue au rechargement)
 * par AvatarPicker qui utilise useAssets() → URLs display-ready persistées.
 */
export function CastingTableView() {
  const characters = useCharactersStore((s) => s.characters);

  // Union de tous les moods pour construire les colonnes
  const allMoods = useMemo(() => {
    const moodSet = new Set<string>();
    for (const char of characters) {
      for (const mood of char.moods ?? EMPTY_MOODS) {
        moodSet.add(mood);
      }
    }
    return Array.from(moodSet);
  }, [characters]);

  // État du picker — null = fermé
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);

  const handleOpen = useCallback((char: Character, mood: string) => {
    setPickerTarget({ charId: char.id, mood, char });
  }, []);

  const handleAssign = useCallback(
    (_mood: string, url: string) => {
      if (!pickerTarget || !url) return;
      // getState() dans un handler — pattern correct (CLAUDE.md §3)
      const { updateCharacter } = useCharactersStore.getState();
      const char = useCharactersStore.getState().getCharacterById(pickerTarget.charId);
      if (!char) return;
      updateCharacter({
        id: pickerTarget.charId,
        sprites: { ...char.sprites, [pickerTarget.mood]: url },
      });
      setPickerTarget(null);
    },
    [pickerTarget]
  );

  if (characters.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-muted)',
          fontSize: 14,
        }}
      >
        Aucun personnage. Créez-en un via l'onglet Visual Novel.
      </div>
    );
  }

  return (
    <div
      style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', padding: 16, position: 'relative' }}
    >
      <table style={{ borderCollapse: 'separate', borderSpacing: '8px 6px', minWidth: '100%' }}>
        <thead>
          <tr>
            <th
              style={{
                textAlign: 'left',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                paddingBottom: 8,
                paddingRight: 16,
                whiteSpace: 'nowrap',
              }}
            >
              Personnage
            </th>
            {allMoods.map((mood) => (
              <th
                key={mood}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  paddingBottom: 8,
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {mood}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {characters.map((char: Character) => (
            <tr key={char.id}>
              {/* Cellule nom du personnage */}
              <td style={{ paddingRight: 16, whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      overflow: 'hidden',
                      background: 'var(--color-bg-hover)',
                      flexShrink: 0,
                      border: '1px solid var(--color-border-base)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {char.sprites['default'] ? (
                      <img
                        src={convertFileSrcIfNeeded(char.sprites['default'])}
                        alt={char.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <span style={{ fontSize: 12 }}>🧑</span>
                    )}
                  </div>
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}
                  >
                    {char.name}
                  </span>
                </div>
              </td>

              {/* Cellules sprites par mood */}
              {allMoods.map((mood) => {
                const isCharMood = (char.moods ?? EMPTY_MOODS).includes(mood);
                return (
                  <td key={mood} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                    {isCharMood ? (
                      <SpriteCell char={char} mood={mood} onOpen={handleOpen} />
                    ) : (
                      <div
                        style={{
                          width: 64,
                          height: 88,
                          margin: '0 auto',
                          borderRadius: 8,
                          border: '1.5px dashed var(--color-border-base)',
                          opacity: 0.25,
                        }}
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Picker overlay — portal fixed pour éviter le clipping (tauri-patterns §1) */}
      {pickerTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPickerTarget(null);
          }}
        >
          <div
            style={{
              background: 'var(--color-bg-elevated)',
              borderRadius: 10,
              padding: 16,
              width: 340,
              maxHeight: 520,
              overflowY: 'auto',
              border: '1px solid var(--color-border-base)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.65)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                🎭 {pickerTarget.char.name} — {pickerTarget.mood}
              </p>
              <button
                type="button"
                onClick={() => setPickerTarget(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 16,
                  color: 'var(--color-text-muted)',
                }}
              >
                ✕
              </button>
            </div>
            <AvatarPicker
              mood={pickerTarget.mood}
              currentSprites={pickerTarget.char.sprites}
              onSelect={handleAssign}
            />
          </div>
        </div>
      )}
    </div>
  );
}
