/**
 * DiceCubeR3F — Rendu WebGL qualité premium via React Three Fiber.
 *
 * Techniques :
 *   - BoxGeometry + 6 materials canvas individuels (une face = une texture)
 *   - meshPhysicalMaterial clearcoat=1 → effet résine/plastique laqué
 *   - Environment preset="studio" → IBL (Image-Based Lighting) for reflections
 *   - Face avant (+Z) : chiffre mis à jour dynamiquement (canvas 2D)
 *   - Faces latérales : pips d6 classiques (layout standard)
 *
 * Support modèle Blender : décommenter le bloc useGLTF dans DiceMesh3D.
 * ⚠️ Ne pas importer directement — utiliser DiceCubeWrapper (lazy + WebGL check).
 */
import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { AnimatePresence, motion } from 'framer-motion';
import { BoxGeometry, MeshPhysicalMaterial, CanvasTexture } from 'three';
import type { Mesh } from 'three';

import {
  type DiceCubeProps,
  type Phase,
  DIE_SIZE,
  getGlowStyle,
} from './DiceCubeCSS';

// ── Canvas texture helpers ────────────────────────────────────────────────────

/** Positions normalisées des pips pour faces 1-6 (layout d6 classique). */
const PIP_POSITIONS: Record<number, [number, number][]> = {
  1: [[0.50, 0.50]],
  2: [[0.28, 0.28], [0.72, 0.72]],
  3: [[0.28, 0.28], [0.50, 0.50], [0.72, 0.72]],
  4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
  5: [[0.28, 0.28], [0.72, 0.28], [0.50, 0.50], [0.28, 0.72], [0.72, 0.72]],
  6: [[0.28, 0.22], [0.72, 0.22], [0.28, 0.50], [0.72, 0.50], [0.28, 0.78], [0.72, 0.78]],
};

/**
 * Pip counts per face in BoxGeometry material order (+X, -X, +Y, -Y, -Z).
 * Face +Z (index 4) = face avant, chiffre dynamique — absente de ce tableau.
 * Faces opposées : 2+5=7, 3+4=7, 6+front — layout d6 classique sur les côtés.
 */
const SIDE_PIP_COUNTS = [2, 5, 3, 4, 6] as const; // +X, -X, +Y, -Y, -Z

function drawRoundedRect(ctx: CanvasRenderingContext2D, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(w - r, 0); ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r); ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(r, h);     ctx.quadraticCurveTo(0, h, 0, h - r);
  ctx.lineTo(0, r);     ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
}

/** Texture canvas d'une face pip (faces latérales). */
function createPipTexture(pipCount: number, bgColor: string, pipColor: string): CanvasTexture {
  const s = 256;
  const canvas = document.createElement('canvas');
  canvas.width = s; canvas.height = s;
  const ctx = canvas.getContext('2d')!;

  // Fond arrondi avec clip
  ctx.save();
  drawRoundedRect(ctx, s, s, 24);
  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.clip();

  // Pips
  ctx.fillStyle = pipColor;
  for (const [nx, ny] of (PIP_POSITIONS[pipCount] ?? [])) {
    ctx.beginPath();
    ctx.arc(nx * s, ny * s, s * 0.085, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  return new CanvasTexture(canvas);
}

/** Texture canvas de la face avant (chiffre + label d20 + dot décoratif). */
function createNumberTexture(num: number, bgColor: string, textColor: string): CanvasTexture {
  const s = 512;
  const canvas = document.createElement('canvas');
  canvas.width = s; canvas.height = s;
  const ctx = canvas.getContext('2d')!;

  // Fond arrondi avec clip
  ctx.save();
  drawRoundedRect(ctx, s, s, 48);
  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.clip();

  // Label "d20" — coin haut-gauche
  ctx.globalAlpha = 0.38;
  ctx.fillStyle = textColor;
  ctx.font = `700 ${Math.round(s * 0.07)}px monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('d20', s * 0.06, s * 0.06);

  // Dot décoratif — coin haut-droite
  ctx.beginPath();
  ctx.arc(s * 0.91, s * 0.09, s * 0.024, 0, Math.PI * 2);
  ctx.fill();

  // Dot décoratif — coin bas-gauche
  ctx.beginPath();
  ctx.arc(s * 0.09, s * 0.91, s * 0.024, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;

  // Chiffre central — grand, gras, centré
  const fontSize = num >= 10 ? Math.round(s * 0.50) : Math.round(s * 0.60);
  ctx.font = `900 ${fontSize}px 'Georgia', serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = textColor;
  ctx.fillText(String(num), s / 2, s / 2 + fontSize * 0.03);

  ctx.restore();
  return new CanvasTexture(canvas);
}

// ── DiceMesh3D (intérieur du <Canvas>) ───────────────────────────────────────

interface DiceMesh3DProps {
  phase: Phase;
  success: boolean;
  displayNumber: number;
}

function makeMat(map: CanvasTexture): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    map,
    roughness: 0.05,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    envMapIntensity: 2.2,
  });
}

function DiceMesh3D({ phase, success, displayNumber }: DiceMesh3DProps) {
  const meshRef  = useRef<Mesh>(null);
  const rotXRef  = useRef(0);
  const rotYRef  = useRef(0);

  const isPostImpact = phase === 'reveal' || phase === 'result' || phase === 'ready';

  // Palette selon la phase
  const bgColor    = isPostImpact ? (success ? '#052e16' : '#3d0808') : '#f8f3e8';
  const mainColor  = isPostImpact ? (success ? '#86efac' : '#fca5a5') : '#1a1008';
  const lightColor = isPostImpact ? (success ? '#10b981' : '#dc2626') : '#f5d48a';

  // Géométrie (stable — recréée une seule fois)
  const geometry = useMemo(() => new BoxGeometry(1.8, 1.8, 1.8), []);

  // Textures pip (5 faces statiques) — recréées si la palette change (5 fois max par lancer)
  const pipTextures = useMemo(
    () => SIDE_PIP_COUNTS.map(n => createPipTexture(n, bgColor, mainColor)),
    [bgColor, mainColor]
  );

  // Texture face avant (dynamique — recréée à chaque flash, 12 fois pendant le roulement)
  const frontTexture = useMemo(
    () => createNumberTexture(displayNumber, bgColor, mainColor),
    [displayNumber, bgColor, mainColor]
  );

  // Materials : BoxGeometry order [+X, -X, +Y, -Y, +Z(front), -Z]
  const materials = useMemo(() => [
    makeMat(pipTextures[0]),  // +X : 2 pips
    makeMat(pipTextures[1]),  // -X : 5 pips
    makeMat(pipTextures[2]),  // +Y : 3 pips
    makeMat(pipTextures[3]),  // -Y : 4 pips
    makeMat(frontTexture),    // +Z : chiffre dynamique (face caméra)
    makeMat(pipTextures[4]),  // -Z : 6 pips
  ], [pipTextures, frontTexture]);

  // Dispose — déclenché quand les dépendances changent ou au démontage
  useEffect(() => () => {
    geometry.dispose();
  }, [geometry]);

  useEffect(() => () => {
    pipTextures.forEach(t => t.dispose());
  }, [pipTextures]);

  useEffect(() => () => {
    frontTexture.dispose();
  }, [frontTexture]);

  useEffect(() => () => {
    materials.forEach(m => m.dispose());
  }, [materials]);

  // Rotation impérative via useFrame — 2 tours X + 3 tours Y en ~1.4s
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (phase === 'rolling') {
      rotXRef.current += delta * (4 * Math.PI / 1.4);
      rotYRef.current += delta * (6 * Math.PI / 1.4);
    } else {
      // Spring retour à 0 — converge en ~300ms @ 60fps
      const decay = Math.max(0, 1 - delta * 8);
      rotXRef.current *= decay;
      rotYRef.current *= decay;
    }
    meshRef.current.rotation.x = rotXRef.current;
    meshRef.current.rotation.y = rotYRef.current;
  });

  // ── Support modèle GLB Blender (décommenter pour l'activer) ─────────────────
  // const { scene } = useGLTF('/assets/dice/mon_de.glb');
  // return (
  //   <>
  //     <Environment preset="studio" />
  //     <ambientLight intensity={0.15} />
  //     <directionalLight position={[3, 5, 3]} intensity={0.6} />
  //     <pointLight position={[-2, -1, 3]} color={lightColor} intensity={isPostImpact ? 1.2 : 0.4} />
  //     <group ref={meshRef as React.Ref<any>}>
  //       <primitive object={scene} scale={1.0} />
  //     </group>
  //   </>
  // );
  // ────────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* IBL studio : source principale de lumière pour les matériaux clearcoat */}
      <Environment preset="studio" />
      <ambientLight intensity={0.15} />
      <directionalLight position={[3, 5, 3]} intensity={0.6} />
      <pointLight
        position={[-2, -1, 3]}
        color={lightColor}
        intensity={isPostImpact ? 1.2 : 0.4}
      />
      <mesh ref={meshRef} geometry={geometry} material={materials} />
    </>
  );
}

// ── DiceCubeR3F (wrapper DOM + Canvas) ───────────────────────────────────────

export function DiceCubeR3F({ phase, success, displayNumber }: DiceCubeProps) {
  const glow = getGlowStyle(phase, success);

  return (
    <motion.div
      initial={{ scaleX: 0, scaleY: 0, opacity: 0 }}
      animate={{
        scaleX:
          phase === 'entry'  ? [0, 1.18, 1] :
          phase === 'impact' ? [1, 1.13, 0.94, 1] : 1,
        scaleY:
          phase === 'entry'  ? [0, 1.18, 1] :
          phase === 'impact' ? [1, 0.86, 1.06, 1] : 1,
        opacity: 1,
      }}
      transition={{
        scaleX:
          phase === 'entry'
            ? { duration: 0.40, times: [0, 0.65, 1], ease: [0.34, 1.56, 0.64, 1] }
            : phase === 'impact'
            ? { duration: 0.28, times: [0, 0.38, 0.72, 1], ease: 'easeOut' }
            : { duration: 0.2 },
        scaleY:
          phase === 'entry'
            ? { duration: 0.40, times: [0, 0.65, 1], ease: [0.34, 1.56, 0.64, 1] }
            : phase === 'impact'
            ? { duration: 0.28, times: [0, 0.38, 0.72, 1], ease: 'easeOut' }
            : { duration: 0.2 },
        opacity: { duration: 0.15 },
      }}
      style={{ position: 'relative', width: DIE_SIZE, height: DIE_SIZE }}
    >

      {/* ── Halo lumineux (Emission) — SIBLING du canvas ── */}
      <div style={{
        position: 'absolute', inset: -42, borderRadius: 52,
        background: glow.background, opacity: glow.opacity,
        filter: 'blur(38px)', pointerEvents: 'none',
        transition: 'background 0.45s ease, opacity 0.40s ease',
      }} />

      {/* ── Flash à la révélation ── */}
      <AnimatePresence>
        {phase === 'reveal' && (
          <motion.div
            key="flash"
            initial={{ opacity: 0.88 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.52, ease: 'easeOut' }}
            style={{
              position: 'absolute', inset: -60, borderRadius: 60,
              background: success ? 'rgba(52,211,153,0.75)' : 'rgba(248,113,113,0.75)',
              filter: 'blur(8px)', pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Onde de choc ── */}
      <AnimatePresence>
        {phase === 'reveal' && (
          <motion.div
            key="shockwave"
            initial={{ scale: 0.65, opacity: 0.90 }}
            animate={{ scale: 4.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.58, ease: [0.0, 0.55, 0.65, 1.0] }}
            style={{
              position: 'absolute',
              top: '50%', left: '50%',
              marginTop: -(DIE_SIZE / 2), marginLeft: -(DIE_SIZE / 2),
              width: DIE_SIZE, height: DIE_SIZE,
              borderRadius: '50%',
              border: `3px solid ${success ? 'rgba(52,211,153,0.95)' : 'rgba(248,113,113,0.95)'}`,
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Canvas WebGL — fond transparent → halo visible derrière ── */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <Canvas
          style={{ width: '100%', height: '100%' }}
          gl={{ antialias: true, alpha: true }}
          camera={{ fov: 45, position: [0, 0, 3.2] as [number, number, number] }}
        >
          <DiceMesh3D phase={phase} success={success} displayNumber={displayNumber} />
        </Canvas>
      </div>

    </motion.div>
  );
}
