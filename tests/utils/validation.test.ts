/**
 * Validation Utils Tests
 *
 * Couvre :
 *   - isObject()
 *   - isValidAssetUrl() — URLs sûres, protocoles dangereux, Tauri, relatif
 *   - sanitizeUrl()
 *   - validateDragDropData() — types valides, champs optionnels, URL sanitisée, injection
 *   - safeJsonParse() — JSON valide, invalide, échec de validation
 *   - validateStringArray()
 *   - validateArray()
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isObject,
  isValidAssetUrl,
  sanitizeUrl,
  validateDragDropData,
  safeJsonParse,
  validateStringArray,
  validateArray,
} from '../../src/utils/validation';

// ── Mocks ─────────────────────────────────────────────────────────────────────

// isValidAssetUrl utilise window.location.origin pour résoudre les URLs relatives
Object.defineProperty(window, 'location', {
  value: { origin: 'http://localhost:5173' },
  writable: true,
});

// ── isObject() ───────────────────────────────────────────────────────────────

describe('isObject()', () => {
  it('true pour un objet vide', () => expect(isObject({})).toBe(true));
  it('true pour un objet peuplé', () => expect(isObject({ a: 1 })).toBe(true));
  it('false pour null', () => expect(isObject(null)).toBe(false));
  it('false pour un tableau', () => expect(isObject([])).toBe(false));
  it('false pour une string', () => expect(isObject('hello')).toBe(false));
  it('false pour un number', () => expect(isObject(42)).toBe(false));
  it('false pour undefined', () => expect(isObject(undefined)).toBe(false));
});

// ── isValidAssetUrl() ─────────────────────────────────────────────────────────

describe('isValidAssetUrl()', () => {
  // URLs sûres
  it('accepte https://', () => {
    expect(isValidAssetUrl('https://example.com/image.png')).toBe(true);
  });
  it('accepte http://', () => {
    expect(isValidAssetUrl('http://localhost/asset.jpg')).toBe(true);
  });
  it('accepte asset:// (Tauri WebView)', () => {
    expect(isValidAssetUrl('asset://localhost/Users/foo/image.png')).toBe(true);
  });
  it('accepte un chemin absolu /assets/...', () => {
    expect(isValidAssetUrl('/assets/backgrounds/city.jpg')).toBe(true);
  });
  it('accepte un chemin relatif ./...', () => {
    expect(isValidAssetUrl('./images/bg.png')).toBe(true);
  });
  it('accepte un chemin relatif ../...', () => {
    expect(isValidAssetUrl('../images/bg.png')).toBe(true);
  });

  // Protocoles dangereux
  it('bloque javascript:', () => {
    expect(isValidAssetUrl('javascript:alert(1)')).toBe(false);
  });
  it('bloque data:', () => {
    expect(isValidAssetUrl('data:image/png;base64,abc')).toBe(false);
  });
  it('bloque vbscript:', () => {
    expect(isValidAssetUrl('vbscript:msgbox(1)')).toBe(false);
  });
  it('bloque file:', () => {
    expect(isValidAssetUrl('file:///etc/passwd')).toBe(false);
  });
  it('bloque about:', () => {
    expect(isValidAssetUrl('about:blank')).toBe(false);
  });
  it('bloque blob:', () => {
    expect(isValidAssetUrl('blob:http://localhost/uuid')).toBe(false);
  });

  // Cas limites
  it('false pour chaîne vide', () => {
    expect(isValidAssetUrl('')).toBe(false);
  });
  it('insensible à la casse pour les protocoles dangereux', () => {
    expect(isValidAssetUrl('JavaScript:alert(1)')).toBe(false);
    expect(isValidAssetUrl('DATA:text/html,<h1>x</h1>')).toBe(false);
  });
});

// ── sanitizeUrl() ─────────────────────────────────────────────────────────────

describe('sanitizeUrl()', () => {
  it("retourne l'URL originale si valide", () => {
    expect(sanitizeUrl('https://example.com/img.png')).toBe('https://example.com/img.png');
  });
  it("retourne '' si URL dangereuse", () => {
    expect(sanitizeUrl('javascript:alert()')).toBe('');
  });
  it("retourne '' si chaîne vide", () => {
    expect(sanitizeUrl('')).toBe('');
  });
});

// ── validateDragDropData() ────────────────────────────────────────────────────

describe('validateDragDropData()', () => {
  // Types valides
  it('accepte type background', () => {
    const r = validateDragDropData({ type: 'background', url: 'https://ex.com/bg.jpg' });
    expect(r?.type).toBe('background');
  });
  it('accepte type character', () => {
    const r = validateDragDropData({ type: 'character', characterId: 'char-1', mood: 'happy' });
    expect(r?.type).toBe('character');
    expect(r?.characterId).toBe('char-1');
    expect(r?.mood).toBe('happy');
  });
  it('accepte type prop', () => {
    const r = validateDragDropData({ type: 'prop', emoji: '📦' });
    expect(r?.type).toBe('prop');
    expect(r?.emoji).toBe('📦');
  });
  it('accepte type emoji', () => {
    const r = validateDragDropData({ type: 'emoji', emoji: '⭐' });
    expect(r?.type).toBe('emoji');
  });
  it('accepte type textbox', () => {
    const r = validateDragDropData({ type: 'textbox' });
    expect(r?.type).toBe('textbox');
  });

  // Type invalide
  it('retourne null pour type inconnu', () => {
    expect(validateDragDropData({ type: 'malware' })).toBeNull();
  });
  it('retourne null si type manquant', () => {
    expect(validateDragDropData({ characterId: 'char-1' })).toBeNull();
  });

  // Entrée non-objet
  it('retourne null pour null', () => {
    expect(validateDragDropData(null)).toBeNull();
  });
  it('retourne null pour une string', () => {
    expect(validateDragDropData('background')).toBeNull();
  });
  it('retourne null pour un tableau', () => {
    expect(validateDragDropData([{ type: 'background' }])).toBeNull();
  });

  // Sanitisation des URLs
  it('sanitise url dangereuse → chaîne vide', () => {
    const r = validateDragDropData({ type: 'background', url: 'javascript:alert()' });
    expect(r?.url).toBe('');
  });
  it('sanitise assetPath dangereux → chaîne vide', () => {
    const r = validateDragDropData({ type: 'background', assetPath: 'data:text/html,<b>x</b>' });
    expect(r?.assetPath).toBe('');
  });
  it('conserve une url valide', () => {
    const r = validateDragDropData({ type: 'background', url: '/assets/bg.jpg' });
    expect(r?.url).toBe('/assets/bg.jpg');
  });

  // Champs non-string ignorés silencieusement
  it('ignore characterId non-string', () => {
    const r = validateDragDropData({ type: 'character', characterId: 123 });
    expect(r?.characterId).toBeUndefined();
  });
  it('ignore mood non-string', () => {
    const r = validateDragDropData({ type: 'character', characterId: 'c1', mood: true });
    expect(r?.mood).toBeUndefined();
  });
});

// ── safeJsonParse() ───────────────────────────────────────────────────────────

describe('safeJsonParse()', () => {
  const identity = (x: unknown) => x as string | null;
  const alwaysNull = (_: unknown): null => null;

  it('parse et retourne les données validées', () => {
    const result = safeJsonParse('{"type":"background"}', validateDragDropData);
    expect(result?.type).toBe('background');
  });

  it('retourne null sur JSON invalide', () => {
    expect(safeJsonParse('{bad json}', identity)).toBeNull();
  });

  it('retourne null si le validateur retourne null', () => {
    expect(safeJsonParse('{}', alwaysNull)).toBeNull();
  });

  it('retourne null sur chaîne vide', () => {
    expect(safeJsonParse('', identity)).toBeNull();
  });

  it('retourne null sur undefined casté en string', () => {
    expect(safeJsonParse('undefined', identity)).toBeNull();
  });
});

// ── validateStringArray() ─────────────────────────────────────────────────────

describe('validateStringArray()', () => {
  it('accepte un tableau de strings', () => {
    expect(validateStringArray(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
  });
  it('accepte un tableau vide', () => {
    expect(validateStringArray([])).toEqual([]);
  });
  it("retourne null si un élément n'est pas une string", () => {
    expect(validateStringArray(['a', 2, 'c'])).toBeNull();
  });
  it('retourne null si non-tableau', () => {
    expect(validateStringArray('hello')).toBeNull();
  });
  it('retourne null pour null', () => {
    expect(validateStringArray(null)).toBeNull();
  });
});

// ── validateArray() ───────────────────────────────────────────────────────────

describe('validateArray()', () => {
  const isPositiveNumber = (x: unknown): number | null =>
    typeof x === 'number' && x > 0 ? x : null;

  it('valide un tableau dont tous les éléments passent le validateur', () => {
    expect(validateArray([1, 2, 3], isPositiveNumber)).toEqual([1, 2, 3]);
  });
  it('accepte un tableau vide', () => {
    expect(validateArray([], isPositiveNumber)).toEqual([]);
  });
  it('retourne null si un élément échoue la validation', () => {
    expect(validateArray([1, -1, 3], isPositiveNumber)).toBeNull();
  });
  it('retourne null si non-tableau', () => {
    expect(validateArray('pas un tableau', isPositiveNumber)).toBeNull();
  });
});
