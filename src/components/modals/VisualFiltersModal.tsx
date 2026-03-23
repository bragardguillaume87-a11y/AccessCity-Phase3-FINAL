/**
 * VisualFiltersModal — Paramétrage des filtres visuels post-processing
 *
 * Filtres disponibles :
 * - 📺 CRT Balatro (scanlines + courbure + aberration + flicker)
 * - 〰️ Scanlines + Vignette (indépendants)
 * - 🎞 Film grain
 * - 👾 Dithering / Rétro palette
 *
 * Presets rapides en haut + toggles par filtre avec sliders.
 * La preview est live via VisualFilterLayer (dans PreviewPlayer).
 */

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Monitor, Sliders } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { VISUAL_FILTER_PRESETS } from '@/config/visualFilters';
import type { VisualFilterConfig } from '@/types/visualFilter';

interface VisualFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Helpers UI ────────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--color-text-muted)',
        marginBottom: 10,
        marginTop: 4,
      }}
    >
      {children}
    </div>
  );
}

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}

function SliderRow({ label, value, min, max, step, unit = '', onChange }: SliderRowProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ flex: '0 0 110px', fontSize: 11, color: 'var(--color-text-secondary)' }}>
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: 'var(--color-primary)', height: 4 }}
      />
      <span
        style={{
          flex: '0 0 38px',
          fontSize: 11,
          color: 'var(--color-text-muted)',
          textAlign: 'right',
        }}
      >
        {value}
        {unit}
      </span>
    </div>
  );
}

interface FilterToggleProps {
  enabled: boolean;
  emoji: string;
  label: string;
  onToggle: () => void;
  children?: React.ReactNode;
}

function FilterToggle({ enabled, emoji, label, onToggle, children }: FilterToggleProps) {
  return (
    <div
      style={{
        border: `1.5px solid ${enabled ? 'var(--color-primary-40)' : 'var(--color-border-base)'}`,
        borderRadius: 10,
        background: enabled ? 'var(--color-primary-subtle)' : 'transparent',
        marginBottom: 8,
        overflow: 'hidden',
        transition: 'all 0.15s ease',
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '9px 12px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-primary)',
        }}
      >
        <span style={{ fontSize: 16 }}>{emoji}</span>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, textAlign: 'left' }}>{label}</span>
        {/* Toggle pill */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            width: 34,
            height: 18,
            borderRadius: 9,
            background: enabled ? 'var(--color-primary)' : 'rgba(255,255,255,0.12)',
            position: 'relative',
            transition: 'background 0.15s ease',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#fff',
              position: 'absolute',
              transition: 'left 0.15s ease',
              left: enabled ? 17 : 2,
              boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
            }}
          />
        </span>
      </button>

      {/* Params panel — only shown when enabled */}
      <AnimatePresence>
        {enabled && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 12px 12px' }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function VisualFiltersModal({ isOpen, onClose }: VisualFiltersModalProps) {
  const visualFilter = useSettingsStore((s) => s.projectSettings.visualFilter);
  const updateVisualFilter = useSettingsStore((s) => s.updateVisualFilter);

  // Deep-patch helpers — granulaire pour éviter le re-render global
  const patchScanlines = useCallback(
    (p: Partial<VisualFilterConfig['scanlines']['params']>) => {
      updateVisualFilter({
        scanlines: {
          ...visualFilter.scanlines,
          params: { ...visualFilter.scanlines.params, ...p },
        },
      });
    },
    [updateVisualFilter, visualFilter.scanlines]
  );

  const patchVignette = useCallback(
    (p: Partial<VisualFilterConfig['vignette']['params']>) => {
      updateVisualFilter({
        vignette: {
          ...visualFilter.vignette,
          params: { ...visualFilter.vignette.params, ...p },
        },
      });
    },
    [updateVisualFilter, visualFilter.vignette]
  );

  const patchGrain = useCallback(
    (p: Partial<VisualFilterConfig['filmGrain']['params']>) => {
      updateVisualFilter({
        filmGrain: {
          ...visualFilter.filmGrain,
          params: { ...visualFilter.filmGrain.params, ...p },
        },
      });
    },
    [updateVisualFilter, visualFilter.filmGrain]
  );

  const patchCRT = useCallback(
    (p: Partial<VisualFilterConfig['crt']['params']>) => {
      updateVisualFilter({
        crt: {
          ...visualFilter.crt,
          params: { ...visualFilter.crt.params, ...p },
        },
      });
    },
    [updateVisualFilter, visualFilter.crt]
  );

  const patchDither = useCallback(
    (p: Partial<VisualFilterConfig['dither']['params']>) => {
      updateVisualFilter({
        dither: {
          ...visualFilter.dither,
          params: { ...visualFilter.dither.params, ...p },
        },
      });
    },
    [updateVisualFilter, visualFilter.dither]
  );

  if (!isOpen) return null;

  const vf = visualFilter;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Panel */}
          <motion.aside
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 340,
              background: 'var(--color-bg-elevated)',
              borderLeft: '1px solid var(--color-border-base)',
              zIndex: 'var(--z-modal)' as never,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Filtres visuels"
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 16px',
                borderBottom: '1px solid var(--color-border-base)',
                flexShrink: 0,
              }}
            >
              <Monitor size={16} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
              <span style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>✨ Filtres visuels</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  padding: 4,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
              {/* Master toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 10,
                  marginBottom: 14,
                  background: vf.enabled ? 'var(--color-primary-muted)' : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${vf.enabled ? 'var(--color-primary-40)' : 'var(--color-border-base)'}`,
                  transition: 'all 0.15s ease',
                }}
              >
                <Sliders
                  size={15}
                  style={{ color: vf.enabled ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
                  aria-hidden="true"
                />
                <span style={{ flex: 1, fontWeight: 600, fontSize: 12 }}>
                  {vf.enabled ? 'Filtres actifs' : 'Filtres désactivés'}
                </span>
                <button
                  type="button"
                  onClick={() => updateVisualFilter({ enabled: !vf.enabled })}
                  aria-pressed={vf.enabled}
                  aria-label={vf.enabled ? 'Désactiver tous les filtres' : 'Activer les filtres'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    width: 40,
                    height: 22,
                    borderRadius: 11,
                    background: vf.enabled ? 'var(--color-primary)' : 'rgba(255,255,255,0.12)',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.15s ease',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#fff',
                      position: 'absolute',
                      transition: 'left 0.15s ease',
                      left: vf.enabled ? 19 : 2,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                    }}
                  />
                </button>
              </div>

              {/* Presets */}
              <SectionTitle>⚡ Presets rapides</SectionTitle>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {VISUAL_FILTER_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    title={preset.description}
                    onClick={() => updateVisualFilter(preset.config)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 7,
                      fontSize: 11,
                      fontWeight: 500,
                      border: '1.5px solid var(--color-border-base)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'var(--color-text-primary)',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        'var(--color-primary-40)';
                      (e.currentTarget as HTMLButtonElement).style.background =
                        'var(--color-primary-subtle)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        'var(--color-border-base)';
                      (e.currentTarget as HTMLButtonElement).style.background =
                        'rgba(255,255,255,0.05)';
                    }}
                  >
                    {preset.emoji} {preset.label}
                  </button>
                ))}
              </div>

              {/* Individual filters */}
              <SectionTitle>🎛 Réglages par filtre</SectionTitle>

              {/* CRT */}
              <FilterToggle
                enabled={vf.crt.enabled}
                emoji="📺"
                label="CRT Balatro"
                onToggle={() =>
                  updateVisualFilter({ crt: { ...vf.crt, enabled: !vf.crt.enabled } })
                }
              >
                <SliderRow
                  label="Courbure"
                  value={vf.crt.params.warp}
                  min={0}
                  max={0.5}
                  step={0.01}
                  onChange={(v) => patchCRT({ warp: v })}
                />
                <SliderRow
                  label="Aberration chr."
                  value={vf.crt.params.caIntensity}
                  min={0}
                  max={6}
                  step={0.1}
                  unit="px"
                  onChange={(v) => patchCRT({ caIntensity: v })}
                />
                <SliderRow
                  label="Scintillement"
                  value={vf.crt.params.flickerAmp}
                  min={0}
                  max={0.12}
                  step={0.005}
                  onChange={(v) => patchCRT({ flickerAmp: v })}
                />
              </FilterToggle>

              {/* Scanlines */}
              <FilterToggle
                enabled={vf.scanlines.enabled}
                emoji="〰️"
                label="Scanlines"
                onToggle={() =>
                  updateVisualFilter({
                    scanlines: { ...vf.scanlines, enabled: !vf.scanlines.enabled },
                  })
                }
              >
                <SliderRow
                  label="Opacité"
                  value={vf.scanlines.params.opacity}
                  min={0.02}
                  max={0.55}
                  step={0.01}
                  onChange={(v) => patchScanlines({ opacity: v })}
                />
                <SliderRow
                  label="Espacement"
                  value={vf.scanlines.params.spacing}
                  min={2}
                  max={8}
                  step={1}
                  unit="px"
                  onChange={(v) => patchScanlines({ spacing: v })}
                />
                <SliderRow
                  label="Épaisseur"
                  value={vf.scanlines.params.thickness}
                  min={1}
                  max={4}
                  step={1}
                  unit="px"
                  onChange={(v) => patchScanlines({ thickness: v })}
                />
              </FilterToggle>

              {/* Vignette */}
              <FilterToggle
                enabled={vf.vignette.enabled}
                emoji="🔘"
                label="Vignette"
                onToggle={() =>
                  updateVisualFilter({
                    vignette: { ...vf.vignette, enabled: !vf.vignette.enabled },
                  })
                }
              >
                <SliderRow
                  label="Intensité"
                  value={vf.vignette.params.intensity}
                  min={0.05}
                  max={0.9}
                  step={0.01}
                  onChange={(v) => patchVignette({ intensity: v })}
                />
                <SliderRow
                  label="Douceur"
                  value={vf.vignette.params.softness}
                  min={0.1}
                  max={0.9}
                  step={0.01}
                  onChange={(v) => patchVignette({ softness: v })}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span
                    style={{
                      flex: '0 0 110px',
                      fontSize: 11,
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    Couleur
                  </span>
                  <input
                    type="color"
                    value={vf.vignette.params.color}
                    onChange={(e) => patchVignette({ color: e.target.value })}
                    style={{
                      width: 32,
                      height: 24,
                      borderRadius: 4,
                      border: '1px solid var(--color-border-base)',
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {vf.vignette.params.color}
                  </span>
                </div>
              </FilterToggle>

              {/* Film grain */}
              <FilterToggle
                enabled={vf.filmGrain.enabled}
                emoji="🎞"
                label="Film grain"
                onToggle={() =>
                  updateVisualFilter({
                    filmGrain: { ...vf.filmGrain, enabled: !vf.filmGrain.enabled },
                  })
                }
              >
                <SliderRow
                  label="Intensité"
                  value={vf.filmGrain.params.intensity}
                  min={0.02}
                  max={0.25}
                  step={0.01}
                  onChange={(v) => patchGrain({ intensity: v })}
                />
                <SliderRow
                  label="Taille grain"
                  value={vf.filmGrain.params.size}
                  min={1}
                  max={3}
                  step={1}
                  unit="px"
                  onChange={(v) => patchGrain({ size: v })}
                />
                <SliderRow
                  label="FPS animation"
                  value={vf.filmGrain.params.fps}
                  min={8}
                  max={30}
                  step={1}
                  onChange={(v) => patchGrain({ fps: v })}
                />
              </FilterToggle>

              {/* Dithering */}
              <FilterToggle
                enabled={vf.dither.enabled}
                emoji="👾"
                label="Dithering rétro"
                onToggle={() =>
                  updateVisualFilter({ dither: { ...vf.dither, enabled: !vf.dither.enabled } })
                }
              >
                <SliderRow
                  label="Niveaux"
                  value={vf.dither.params.levels}
                  min={2}
                  max={16}
                  step={1}
                  onChange={(v) => patchDither({ levels: v })}
                />
                <SliderRow
                  label="Opacité"
                  value={vf.dither.params.opacity}
                  min={0.1}
                  max={0.8}
                  step={0.05}
                  onChange={(v) => patchDither({ opacity: v })}
                />
                {/* Palette selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span
                    style={{
                      flex: '0 0 110px',
                      fontSize: 11,
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    Palette
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['auto', 'gameboy', 'cga', 'snes'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => patchDither({ palette: p })}
                        style={{
                          padding: '3px 7px',
                          fontSize: 10,
                          fontWeight: 600,
                          borderRadius: 5,
                          border: `1.5px solid ${vf.dither.params.palette === p ? 'var(--color-primary)' : 'var(--color-border-base)'}`,
                          background:
                            vf.dither.params.palette === p
                              ? 'var(--color-primary-subtle)'
                              : 'transparent',
                          color: 'var(--color-text-primary)',
                          cursor: 'pointer',
                          transition: 'all 0.1s ease',
                        }}
                      >
                        {p === 'auto' ? '🎨' : p === 'gameboy' ? '🟢' : p === 'cga' ? '🔵' : '🟡'}{' '}
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </FilterToggle>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid var(--color-border-base)',
                fontSize: 10,
                color: 'var(--color-text-muted)',
                flexShrink: 0,
              }}
            >
              Les filtres s'appliquent à la prévisualisation et à l'export.
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
