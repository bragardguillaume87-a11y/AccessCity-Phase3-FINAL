/**
 * TextSection_v2/index.tsx
 * Panneau Style (onglet Texte) — refonte ergonomique complète.
 *
 * Nouvelle hiérarchie :
 *   APERÇU (sticky) → THÈMES → MISE EN PAGE → BOÎTE → POSITION → PORTRAIT → NOM → NARRATEUR
 *
 * Corrections vs v1 :
 *   - Thèmes : état actif persistant (activeTheme local state)
 *   - Slider vitesse : inversé (gauche = Rapide)
 *   - Aperçu : mini-canvas 16:9 montrant la position live + nameFont appliqué
 *   - BOÎTE : regroupe le visuel (vitesse, taille, couleurs, bordure, arrondi, transitions)
 *   - POSITION : section propre (layout ≠ style)
 *   - MISE EN PAGE : promue au premier niveau
 *   - Defaults : DIALOGUE_BOX_DEFAULTS importé (plus de duplication)
 */

import { useState, useCallback } from 'react';
import { useSettingsStore } from '@/stores';
import { PanelSection } from '@/components/ui/CollapsibleSection';
import { DIALOGUE_BOX_DEFAULTS } from '@/components/ui/DialogueBox';
import {
  NAME_FONTS,
  NAME_SHADOW_CSS,
  DEFAULT_NAME_FONT_ID,
  DEFAULT_NAME_SHADOW,
} from '@/config/nameFonts';
import type { DialogueBoxStyle } from '@/types/scenes';

import { MiniCanvasPreview } from './MiniCanvasPreview';
import { ThemePresets } from './ThemePresets';
import { CardGrid } from './shared';
import { BoxAppearance } from './BoxAppearance';
import { BoxPosition } from './BoxPosition';
import { PortraitControls } from './PortraitControls';
import { CharacterNameSection } from './CharacterNameSection';
import { NarratorSection } from './NarratorSection';

// ─── Options de mise en page ──────────────────────────────────────────────────

const LAYOUT_OPTIONS = [
  { value: 'classique' as const, icon: '🗨️', label: 'Classique', desc: 'Tout-en-un' },
  { value: 'visual' as const, icon: '🎭', label: 'Visual', desc: 'Tab + boîte' },
] as const;

// ─── Composant principal ──────────────────────────────────────────────────────

export function TextSection() {
  const dialogueBoxDefaults = useSettingsStore((s) => s.projectSettings.game.dialogueBoxDefaults);
  const updateDialogueBoxDefaults = useSettingsStore((s) => s.updateDialogueBoxDefaults);

  // Source de vérité unique : DIALOGUE_BOX_DEFAULTS (DialogueBox.tsx) + overrides du store
  const cfg: Required<DialogueBoxStyle> = { ...DIALOGUE_BOX_DEFAULTS, ...dialogueBoxDefaults };

  // Thème actif — local state (UI hint, pas besoin de persister dans le store)
  const [activeTheme, setActiveTheme] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'personnage' | 'narrateur'>('personnage');

  /** Applique un patch de thème — marque le thème comme actif. */
  const handleThemeApply = useCallback(
    (patch: Partial<DialogueBoxStyle>, label: string) => {
      updateDialogueBoxDefaults(patch);
      setActiveTheme(label);
    },
    [updateDialogueBoxDefaults]
  );

  /** Mise à jour manuelle — efface le thème actif (personnalisation). */
  const handleManualUpdate = useCallback(
    (patch: Partial<DialogueBoxStyle>) => {
      updateDialogueBoxDefaults(patch);
      setActiveTheme(null);
    },
    [updateDialogueBoxDefaults]
  );

  // ── Calculs pour l'APERÇU sticky — Dialogue Personnage ──────────────────
  const previewBg = `${cfg.bgColor}${Math.round(cfg.boxOpacity * 255)
    .toString(16)
    .padStart(2, '0')}`;
  const previewBorder =
    cfg.borderStyle === 'none'
      ? 'transparent'
      : cfg.borderColor + (cfg.borderStyle === 'prominent' ? '73' : '2e');
  const previewRadius: Record<string, string> = {
    none: '0px',
    sm: '6px',
    md: '12px',
    lg: '16px',
    xl: '20px',
  };

  // Police du nom (fix bug 2 : appliquée dans l'aperçu pour feedback live)
  const nameFontDef =
    NAME_FONTS.find((f) => f.id === (cfg.nameFont ?? DEFAULT_NAME_FONT_ID)) ?? NAME_FONTS[0];
  const nameShadowCss = NAME_SHADOW_CSS[cfg.nameShadow ?? DEFAULT_NAME_SHADOW];
  const nameColorDisplay =
    cfg.nameColor && cfg.nameColor !== '' ? cfg.nameColor : 'var(--color-primary)';

  // ── Calculs pour l'APERÇU sticky — Dialogue Narrateur ───────────────────
  const narratorBgColor = cfg.narratorBgColor ?? '#070a1a';
  const narratorBorderColor = cfg.narratorBorderColor ?? '#c9a84c';
  const narratorTextColor = cfg.narratorTextColor ?? '#ede8d5';
  const narratorOpacityHex = Math.round((cfg.narratorBgOpacity ?? 0.93) * 255)
    .toString(16)
    .padStart(2, '0');
  const narratorPreviewBg = `${narratorBgColor}${narratorOpacityHex}`;

  return (
    <div>
      {/* ══ APERÇU (sticky) ══════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 2,
          background: 'var(--color-bg-elevated)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.28)',
        }}
      >
        <PanelSection title="APERÇU" id="dlgbox-apercu-v2" defaultOpen={true}>
          {/* Toggle Personnage / Narrateur */}
          <div className="sp-seg mb-2">
            <button
              className={`sp-seg-btn${previewMode === 'personnage' ? ' active' : ''}`}
              onClick={() => setPreviewMode('personnage')}
              aria-pressed={previewMode === 'personnage'}
            >
              🗨️ Personnage
            </button>
            <button
              className={`sp-seg-btn${previewMode === 'narrateur' ? ' active' : ''}`}
              onClick={() => setPreviewMode('narrateur')}
              aria-pressed={previewMode === 'narrateur'}
            >
              📖 Narrateur
            </button>
          </div>

          {/* Preview — Bret Victor §7 : connexion immédiate */}
          <div aria-hidden="true">
            {previewMode === 'personnage' ? (
              <div
                className="p-3 rounded border backdrop-blur-sm mb-2"
                style={{
                  background: previewBg,
                  borderColor: previewBorder,
                  borderRadius: previewRadius[cfg.borderRadius] ?? '0px',
                }}
              >
                <div
                  style={{
                    fontFamily: nameFontDef.fontFamily,
                    fontWeight: 800,
                    fontSize: 11,
                    letterSpacing: `${cfg.nameLetterSpacing ?? 1.5}px`,
                    textTransform: 'uppercase',
                    color: nameColorDisplay,
                    textShadow: nameShadowCss,
                    marginBottom: 4,
                  }}
                >
                  — Léa, ton guide
                </div>
                <span style={{ fontSize: cfg.fontSize, color: cfg.textColor }}>
                  Bonjour ! Je suis Léa, ton guide.
                </span>
              </div>
            ) : (
              <div
                className="mb-2 relative overflow-hidden"
                style={{
                  background: narratorPreviewBg,
                  border: `1.5px solid ${narratorBorderColor}`,
                  borderRadius: 4,
                  padding: '10px 14px',
                  boxShadow: `0 0 0 1px ${narratorBorderColor}18, inset 0 0 20px rgba(0,0,0,0.3)`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background: `linear-gradient(to right, transparent, ${narratorBorderColor}55)`,
                    }}
                  />
                  <span style={{ color: narratorBorderColor, fontSize: 7, lineHeight: 1 }}>✦</span>
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background: `linear-gradient(to left, transparent, ${narratorBorderColor}55)`,
                    }}
                  />
                </div>
                <p
                  style={{
                    fontFamily: "'Crimson Pro', Georgia, serif",
                    fontStyle: 'italic',
                    fontSize: 11,
                    color: narratorTextColor,
                    lineHeight: 1.7,
                    textAlign: 'center',
                    margin: 0,
                  }}
                >
                  Le vent soufflait sur la plaine silencieuse…
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background: `linear-gradient(to right, transparent, ${narratorBorderColor}55)`,
                    }}
                  />
                  <span style={{ color: narratorBorderColor, fontSize: 7, lineHeight: 1 }}>✦</span>
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background: `linear-gradient(to left, transparent, ${narratorBorderColor}55)`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Mini-canvas 16:9 — position live (Bret Victor §7 + Will Wright §4.1) */}
          <MiniCanvasPreview
            position={cfg.position}
            positionX={cfg.positionX}
            positionY={cfg.positionY}
            boxWidth={cfg.boxWidth ?? 76}
            bgColor={cfg.bgColor}
            boxOpacity={cfg.boxOpacity}
            borderColor={cfg.borderColor}
            borderStyle={cfg.borderStyle}
            borderRadius={cfg.borderRadius}
          />
        </PanelSection>
      </div>

      {/* ══ THÈMES ══════════════════════════════════════════════════════════ */}
      <PanelSection title="THÈMES" id="dlgbox-themes-v2" defaultOpen={true}>
        <ThemePresets activeTheme={activeTheme} onApply={handleThemeApply} />
      </PanelSection>

      {/* ══ MISE EN PAGE (promue au premier niveau) ═════════════════════════ */}
      <PanelSection title="MISE EN PAGE" id="dlgbox-layout-v2" defaultOpen={false}>
        <CardGrid
          cols={2}
          options={LAYOUT_OPTIONS}
          value={cfg.layout}
          onChange={(v) => handleManualUpdate({ layout: v })}
        />
      </PanelSection>

      {/* ══ BOÎTE (vitesse, taille, couleurs, bordure, arrondi, transitions) ═ */}
      <PanelSection title="BOÎTE" id="dlgbox-box-v2" defaultOpen={true}>
        <BoxAppearance cfg={cfg} onUpdate={handleManualUpdate} />
      </PanelSection>

      {/* ══ POSITION (grille 3×3 + largeur) ════════════════════════════════ */}
      <PanelSection title="POSITION" id="dlgbox-position-v2" defaultOpen={false}>
        <BoxPosition cfg={cfg} onUpdate={handleManualUpdate} />
      </PanelSection>

      {/* ══ PORTRAIT ════════════════════════════════════════════════════════ */}
      <PanelSection title="PORTRAIT" id="dlgbox-portrait-v2" defaultOpen={false}>
        <PortraitControls cfg={cfg} onUpdate={handleManualUpdate} />
      </PanelSection>

      {/* ══ NOM DU PERSONNAGE ════════════════════════════════════════════════ */}
      <PanelSection title="NOM DU PERSONNAGE" id="dlgbox-name-v2" defaultOpen={false}>
        <CharacterNameSection cfg={cfg} onUpdate={handleManualUpdate} />
      </PanelSection>

      {/* ══ NARRATEUR ════════════════════════════════════════════════════════ */}
      <PanelSection title="NARRATEUR" id="dlgbox-narrator-v2" defaultOpen={false}>
        <NarratorSection cfg={cfg} onUpdate={handleManualUpdate} />
      </PanelSection>
    </div>
  );
}
