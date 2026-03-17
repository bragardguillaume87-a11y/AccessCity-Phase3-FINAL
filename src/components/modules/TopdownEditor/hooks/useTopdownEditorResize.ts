/**
 * useTopdownEditorResize — gestion des panneaux redimensionnables de TopdownEditor.
 *
 * Encapsule la logique de resize de :
 *   - la palette droite (largeur persistée via localStorage)
 *   - la sidebar gauche (largeur persistée via localStorage)
 *
 * Extrait de TopdownEditor.tsx pour isoler la logique de layout.
 */
import { useState, useCallback, useEffect } from 'react';

// ── Constantes palette ───────────────────────────────────────────────────────

const PALETTE_STORAGE_KEY = 'ac_palette_width';
const SIDEBAR_STORAGE_KEY = 'ac_sidebar_width';
const SIDEBAR_MIN = 150;
const SIDEBAR_MAX = 320;
const SIDEBAR_DEFAULT = 200;

// Breakpoints : 720p (≥1280), 1080p (≥1920), 1440p (≥2560)
// Valeurs cibles : palette ≈ 22-25% de la largeur d'écran
function getPaletteConfig(screenWidth: number) {
  if (screenWidth >= 2560) return { min: 280, max: 800, default: 520 }; // 1440p
  if (screenWidth >= 1920) return { min: 240, max: 630, default: 420 }; // 1080p
  if (screenWidth >= 1280) return { min: 200, max: 480, default: 320 }; // 720p
  return { min: 180, max: 380, default: 260 }; // < 720p
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface UseTopdownEditorResizeResult {
  paletteWidth: number;
  sidebarWidth: number;
  handleResizerMouseDown: (e: React.MouseEvent) => void;
  handleSidebarResizerMouseDown: (e: React.MouseEvent) => void;
}

export function useTopdownEditorResize(): UseTopdownEditorResizeResult {
  // ── Palette droite ─────────────────────────────────────────────────────────
  const [paletteWidth, setPaletteWidth] = useState(() => {
    const cfg = getPaletteConfig(window.innerWidth);
    const stored = localStorage.getItem(PALETTE_STORAGE_KEY);
    const parsed = stored ? parseInt(stored, 10) : NaN;
    return isNaN(parsed) ? cfg.default : Math.min(cfg.max, Math.max(cfg.min, parsed));
  });

  useEffect(() => {
    localStorage.setItem(PALETTE_STORAGE_KEY, String(paletteWidth));
  }, [paletteWidth]);

  const handleResizerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const cfg = getPaletteConfig(window.innerWidth);
      const startX = e.clientX;
      const startWidth = paletteWidth;
      const onMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX;
        setPaletteWidth(Math.min(cfg.max, Math.max(cfg.min, startWidth - delta)));
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [paletteWidth]
  );

  // ── Sidebar gauche ─────────────────────────────────────────────────────────
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    const parsed = stored ? parseInt(stored, 10) : NaN;
    return isNaN(parsed) ? SIDEBAR_DEFAULT : Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, parsed));
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  const handleSidebarResizerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = sidebarWidth;
      const onMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX;
        setSidebarWidth(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startWidth + delta)));
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [sidebarWidth]
  );

  return { paletteWidth, sidebarWidth, handleResizerMouseDown, handleSidebarResizerMouseDown };
}
