/**
 * ExportModal — Modale d'export de scénario standalone.
 */

import { useState, useCallback } from 'react';
import { Download, Package, Film, AlertCircle, CheckCircle2, X, Layers, FileArchive } from 'lucide-react';
import { useAllScenesWithElements, useSceneWithElements } from '@/stores/selectors';
import { useCharactersStore, useSettingsStore, useUIStore } from '@/stores/index';
import { buildExportData } from '@/utils/exportProject';
import { generateStandaloneZip } from '@/utils/generateStandaloneZip';
import type { Scene } from '@/types';

type ExportScope = 'all' | 'scene';
type ExportStatus = 'idle' | 'building' | 'done' | 'error';

const BUILD_STEPS = [
  'Préparation des données…',
  'Récupération des assets et du player…',
  'Téléchargement…',
];

interface ExportModalProps {
  onClose: () => void;
}

export default function ExportModal({ onClose }: ExportModalProps) {
  const [scope, setScope] = useState<ExportScope>('all');
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [stepIndex, setStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const allScenes = useAllScenesWithElements();
  const selectedSceneForEdit = useUIStore(s => s.selectedSceneForEdit);
  const activeScene = useSceneWithElements(selectedSceneForEdit ?? undefined);
  const characters = useCharactersStore(s => s.characters);
  const projectSettings = useSettingsStore(s => s.projectSettings);
  const language = useSettingsStore(s => s.language);
  const enableStatsHUD = useSettingsStore(s => s.enableStatsHUD);

  const handleExport = useCallback(async () => {
    setStatus('building');
    setStepIndex(0);
    setErrorMessage('');

    try {
      const scenesToExport: Scene[] = scope === 'scene' && activeScene
        ? [activeScene]
        : allScenes;

      if (scenesToExport.length === 0) {
        throw new Error('Aucune scène à exporter. Créez au moins une scène dans l\'éditeur.');
      }

      setStepIndex(0);
      const exportData = buildExportData(
        scenesToExport,
        characters,
        projectSettings,
        { language: language as 'fr' | 'en', enableStatsHUD }
      );

      setStepIndex(1);
      const zipBlob = await generateStandaloneZip(
        exportData,
        projectSettings.project.title || 'accesscity-game'
      );

      setStepIndex(2);
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      const filename = (projectSettings.project.title || 'accesscity-game')
        .replace(/[^a-z0-9\-_ ]/gi, '-')
        .replace(/\s+/g, '-')
        .toLowerCase();
      link.href = url;
      link.download = `${filename}.zip`;
      link.click();
      URL.revokeObjectURL(url);

      setStatus('done');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  }, [scope, activeScene, allScenes, characters, projectSettings, language, enableStatsHUD]);

  const hasActiveScene = !!activeScene;
  const projectTitle = projectSettings.project.title || 'Sans titre';
  const isBuilding = status === 'building';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >

        {/* ── Header avec gradient ── */}
        <div className="relative px-6 pt-6 pb-5 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #1a2744 50%, #1e2035 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Halo décoratif */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />

          <div className="flex items-start gap-4">
            {/* Icône colorée */}
            <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
              <FileArchive className="h-5 w-5 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-base text-white leading-tight">
                Exporter le scénario
              </h2>
              <p className="text-sm mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {projectTitle}
              </p>
            </div>

            <button
              onClick={onClose}
              className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)'; (e.currentTarget as HTMLButtonElement).style.color = 'white'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)'; }}
              aria-label="Fermer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ── Contenu ── */}
        <div className="px-5 py-5 space-y-4">

          {/* Portée */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: 'hsl(var(--muted-foreground))' }}>
              Portée de l&apos;export
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Carte "Projet entier" */}
              <button
                onClick={() => setScope('all')}
                className="relative flex flex-col items-start gap-2 p-3.5 rounded-xl text-left transition-all"
                style={{
                  border: scope === 'all'
                    ? '2px solid #3b82f6'
                    : '2px solid hsl(var(--border))',
                  background: scope === 'all'
                    ? 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.08))'
                    : 'hsl(var(--muted)/40%)',
                  boxShadow: scope === 'all' ? '0 0 0 3px rgba(59,130,246,0.12)' : 'none',
                }}
              >
                {scope === 'all' && (
                  <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: '#3b82f6' }}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: scope === 'all'
                      ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                      : 'hsl(var(--muted))',
                  }}>
                  <Layers className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight"
                    style={{ color: scope === 'all' ? 'white' : 'hsl(var(--foreground))' }}>
                    Projet entier
                  </p>
                  <p className="text-xs mt-0.5"
                    style={{ color: scope === 'all' ? 'rgba(255,255,255,0.6)' : 'hsl(var(--muted-foreground))' }}>
                    {allScenes.length} scène{allScenes.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </button>

              {/* Carte "Scène active" */}
              <button
                onClick={() => hasActiveScene && setScope('scene')}
                disabled={!hasActiveScene}
                className="relative flex flex-col items-start gap-2 p-3.5 rounded-xl text-left transition-all"
                style={{
                  border: scope === 'scene'
                    ? '2px solid #a855f7'
                    : '2px solid hsl(var(--border))',
                  background: scope === 'scene'
                    ? 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(139,92,246,0.08))'
                    : hasActiveScene ? 'hsl(var(--muted)/40%)' : 'hsl(var(--muted)/20%)',
                  opacity: hasActiveScene ? 1 : 0.45,
                  cursor: hasActiveScene ? 'pointer' : 'not-allowed',
                  boxShadow: scope === 'scene' ? '0 0 0 3px rgba(168,85,247,0.12)' : 'none',
                }}
              >
                {scope === 'scene' && (
                  <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: '#a855f7' }}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: scope === 'scene'
                      ? 'linear-gradient(135deg, #a855f7, #8b5cf6)'
                      : 'hsl(var(--muted))',
                  }}>
                  <Film className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 w-full">
                  <p className="text-sm font-semibold leading-tight"
                    style={{ color: scope === 'scene' ? 'white' : 'hsl(var(--foreground))' }}>
                    Scène active
                  </p>
                  <p className="text-xs mt-0.5 truncate"
                    style={{ color: scope === 'scene' ? 'rgba(255,255,255,0.6)' : 'hsl(var(--muted-foreground))' }}>
                    {activeScene ? activeScene.title : 'Aucune sélectionnée'}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Info format */}
          <div className="flex items-start gap-3 rounded-xl px-3.5 py-3"
            style={{
              background: 'rgba(59,130,246,0.06)',
              border: '1px solid rgba(59,130,246,0.2)',
            }}>
            <Package className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: '#60a5fa' }} />
            <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Produit un fichier <strong className="text-white/70 font-medium">.zip</strong> avec un{' '}
              <strong className="text-white/70 font-medium">index.html</strong> jouable directement dans un navigateur.
            </p>
          </div>

          {/* ── États dynamiques ── */}

          {/* Progression */}
          {status === 'building' && (
            <div className="rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(59,130,246,0.25)', background: 'rgba(59,130,246,0.07)' }}>
              <div className="px-4 py-3 space-y-3">
                {BUILD_STEPS.map((label, i) => {
                  const isDone = i < stepIndex;
                  const isCurrent = i === stepIndex;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center transition-all"
                        style={{
                          background: isDone
                            ? 'rgba(34,197,94,0.2)'
                            : isCurrent
                              ? 'rgba(59,130,246,0.3)'
                              : 'rgba(255,255,255,0.05)',
                          border: isDone
                            ? '1px solid rgba(34,197,94,0.5)'
                            : isCurrent
                              ? '1px solid rgba(59,130,246,0.5)'
                              : '1px solid rgba(255,255,255,0.1)',
                        }}>
                        {isDone
                          ? <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          : isCurrent
                            ? <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#60a5fa' }} />
                            : <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
                        }
                      </div>
                      <span className="text-xs"
                        style={{
                          color: isDone
                            ? '#4ade80'
                            : isCurrent
                              ? '#93c5fd'
                              : 'rgba(255,255,255,0.25)',
                          fontWeight: isCurrent ? 500 : 400,
                        }}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Succès */}
          {status === 'done' && (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.3)',
              }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(34,197,94,0.2)' }}>
                <CheckCircle2 className="h-4 w-4" style={{ color: '#4ade80' }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#4ade80' }}>Exporté avec succès !</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(74,222,128,0.6)' }}>
                  Le ZIP a été téléchargé dans vos fichiers.
                </p>
              </div>
            </div>
          )}

          {/* Erreur */}
          {status === 'error' && (
            <div className="rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
              <div className="flex items-center gap-2 px-4 py-2.5"
                style={{ background: 'rgba(239,68,68,0.15)' }}>
                <AlertCircle className="h-3.5 w-3.5 shrink-0" style={{ color: '#f87171' }} />
                <p className="text-xs font-semibold" style={{ color: '#f87171' }}>Erreur d&apos;export</p>
              </div>
              <div className="px-4 py-2.5" style={{ background: 'rgba(239,68,68,0.06)' }}>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(248,113,113,0.8)' }}>
                  {errorMessage}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl transition-colors font-medium"
            style={{
              background: 'hsl(var(--muted))',
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            {status === 'done' ? 'Fermer' : 'Annuler'}
          </button>

          <button
            onClick={handleExport}
            disabled={isBuilding}
            className="flex items-center gap-2 px-5 py-2 text-sm rounded-xl font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: isBuilding
                ? 'rgba(59,130,246,0.4)'
                : 'linear-gradient(135deg, #3b82f6, #6366f1)',
              color: 'white',
              boxShadow: isBuilding ? 'none' : '0 4px 14px rgba(59,130,246,0.35)',
            }}
          >
            {isBuilding
              ? <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Génération…
                </>
              : <>
                  <Download className="h-3.5 w-3.5" />
                  Télécharger ZIP
                </>
            }
          </button>
        </div>

      </div>
    </div>
  );
}
