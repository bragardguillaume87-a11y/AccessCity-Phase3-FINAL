/**
 * DiceCubeWrapper — Sélecteur WebGL + lazy loading.
 *
 * Stratégie :
 *   - Détecte WebGL une seule fois au chargement du module
 *   - Si WebGL disponible → charge DiceCubeR3F en lazy (chunk vendor-three séparé)
 *   - Si WebGL absent    → DiceCubeCSS immédiat (zéro charge supplémentaire)
 *   - Pendant le chargement du chunk R3F (~200ms au premier lancer) → fallback CSS
 *
 * Performance :
 *   Le chunk vendor-three (~230KB gzip) n'est jamais chargé au démarrage de l'app.
 *   Il se charge uniquement au premier lancer de dé, puis reste en cache navigateur.
 */
import { lazy, Suspense } from 'react';
import { DiceCubeCSS, type DiceCubeProps } from './DiceCubeCSS';

// Détection WebGL à l'initialisation du module (une seule fois, pas de re-render)
const hasWebGL = typeof window !== 'undefined' && !!window.WebGLRenderingContext;

// Lazy import uniquement si WebGL est disponible — évite tout parse du bundle Three.js sinon
const DiceCubeR3FLazy = hasWebGL
  ? lazy(() => import('./DiceCubeR3F').then(m => ({ default: m.DiceCubeR3F })))
  : null;

export function DiceCubeWrapper(props: DiceCubeProps) {
  if (!hasWebGL || !DiceCubeR3FLazy) {
    return <DiceCubeCSS {...props} />;
  }

  return (
    // fallback = DiceCubeCSS identique → transition invisible lors du premier chargement R3F
    <Suspense fallback={<DiceCubeCSS {...props} />}>
      <DiceCubeR3FLazy {...props} />
    </Suspense>
  );
}
