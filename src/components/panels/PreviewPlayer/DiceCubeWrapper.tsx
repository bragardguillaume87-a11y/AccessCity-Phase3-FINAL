/**
 * DiceCubeWrapper — CSS est le rendu principal.
 *
 * Le rendu WebGL (Three.js / React Three Fiber) est conservé dans DiceCubeR3F.tsx
 * mais désactivé par défaut. Il sera utile dès que tu importes un modèle Blender (.glb).
 *
 * Pour réactiver le WebGL :
 *   1. Décommenter le bloc "R3F lazy loading" ci-dessous
 *   2. Commenter le `return <DiceCubeCSS {...props} />;`
 */
import { DiceCubeCSS, type DiceCubeProps } from './DiceCubeCSS';

// ── R3F lazy loading (décommenter pour activer le rendu WebGL/Blender) ─────────
// import { lazy, Suspense } from 'react';
// const hasWebGL = typeof window !== 'undefined' && !!window.WebGLRenderingContext;
// const DiceCubeR3FLazy = hasWebGL
//   ? lazy(() => import('./DiceCubeR3F').then(m => ({ default: m.DiceCubeR3F })))
//   : null;
// ────────────────────────────────────────────────────────────────────────────────

export function DiceCubeWrapper(props: DiceCubeProps) {
  // CSS : rendu net, transitions fluides, 0 dépendance réseau, aucun crash WebGL.
  return <DiceCubeCSS {...props} />;

  // WebGL (décommenter + commenter la ligne ci-dessus pour activer) :
  // if (!hasWebGL || !DiceCubeR3FLazy) return <DiceCubeCSS {...props} />;
  // return (
  //   <Suspense fallback={<DiceCubeCSS {...props} />}>
  //     <DiceCubeR3FLazy {...props} />
  //   </Suspense>
  // );
}
