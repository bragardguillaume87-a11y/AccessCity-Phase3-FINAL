/**
 * fogEffect — Renderer WebGL2 pour le brouillard atmosphérique
 *
 * Utilise un fragment shader GLSL ES 300 avec bruit Simplex 2D animé.
 * Le bruit Simplex est implémenté en GLSL pur — aucune dépendance externe.
 *
 * Source GLSL de référence : implémentation Simplex 2D de Ian McEwan /
 * Stefan Gustavson (MIT License, lygia.xyz / glslify).
 *
 * @module utils/sceneEffects/fogEffect
 */

import type { FogEffectParams } from '@/types/sceneEffect';

// ── GLSL shader ───────────────────────────────────────────────────────────────

const VERT_SRC = `#version 300 es
precision mediump float;
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

// Fragment shader : Simplex noise 2D + animation temporelle
// Ref: Stefan Gustavson "Simplex noise demystified" (MIT)
const FRAG_SRC = `#version 300 es
precision mediump float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec3  u_fog_color;
uniform float u_opacity;
uniform float u_speed;
uniform float u_scale;

// ── Simplex 2D noise (GLSL) — Gustavson / McEwan MIT ──────────────────────
vec3 permute(vec3 x) { return mod(x * x * 34.0 + x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1  = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x   = 2.0 * fract(p * C.www) - 1.0;
  vec3 h   = abs(x) - 0.5;
  vec3 ox  = floor(x + 0.5);
  vec3 a0  = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
// ──────────────────────────────────────────────────────────────────────────────

void main() {
  float t = u_time * u_speed * 0.0003;
  vec2 uv = v_uv * u_scale;

  // Fractal Brownian Motion : 3 octaves de bruit superposées
  float n  = snoise(uv + vec2(t * 0.7, t * 0.4)) * 0.55;
         n += snoise(uv * 2.1 + vec2(-t * 0.5, t * 0.6)) * 0.30;
         n += snoise(uv * 4.3 + vec2(t * 0.3, -t * 0.8)) * 0.15;

  // Remap [-1,1] → [0,1]
  float fog = clamp(n * 0.5 + 0.5, 0.0, 1.0);

  // Bords fondus : le brouillard est moins dense en bas de l'écran
  fog *= smoothstep(0.0, 0.35, v_uv.y) * smoothstep(1.0, 0.65, v_uv.y);

  float alpha = fog * u_opacity;
  fragColor = vec4(u_fog_color, alpha);
}`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

function compileShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(`Fog shader compile error: ${gl.getShaderInfoLog(shader)}`);
  }
  return shader;
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface FogRenderer {
  stop: () => void;
  resize: (w: number, h: number) => void;
  updateParams: (params: FogEffectParams) => void;
}

export function startFogEffect(canvas: HTMLCanvasElement, params: FogEffectParams): FogRenderer {
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: false, alpha: true });
  if (!gl) {
    // Fallback si WebGL2 non disponible : canvas 2D avec un rectangle semi-transparent
    return startFogFallback(canvas, params);
  }

  // Compile program
  let program: WebGLProgram;
  try {
    const vert = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    program = gl.createProgram()!;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Fog program link error: ${gl.getProgramInfoLog(program)}`);
    }
  } catch (e) {
    console.warn('[fogEffect] WebGL2 init failed, using fallback:', e);
    return startFogFallback(canvas, params);
  }

  // Full-screen quad
  const buf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(program, 'a_pos');
  const uTime = gl.getUniformLocation(program, 'u_time');
  const uColor = gl.getUniformLocation(program, 'u_fog_color');
  const uOp = gl.getUniformLocation(program, 'u_opacity');
  const uSpeed = gl.getUniformLocation(program, 'u_speed');
  const uScale = gl.getUniformLocation(program, 'u_scale');

  let current = { ...params };
  let running = true;
  let startTime = performance.now();

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  function frame(now: number) {
    if (!running) return;
    const t = now - startTime;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);

    const [r, g, b] = hexToRgb(current.color.startsWith('#') ? current.color : '#b0c8e0');
    gl.uniform1f(uTime, t);
    gl.uniform3f(uColor, r, g, b);
    gl.uniform1f(uOp, current.opacity);
    gl.uniform1f(uSpeed, current.speed);
    gl.uniform1f(uScale, current.scale);

    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  return {
    stop: () => {
      running = false;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    },
    resize: (w, h) => {
      gl.viewport(0, 0, w, h);
      startTime = performance.now(); // reset time on resize to avoid jump
    },
    updateParams: (p) => {
      current = { ...p };
    },
  };
}

// ── Canvas 2D fallback (navigateurs sans WebGL2) ──────────────────────────────

function startFogFallback(canvas: HTMLCanvasElement, params: FogEffectParams): FogRenderer {
  const ctx = canvas.getContext('2d')!;
  let running = true;
  let current = { ...params };

  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = current.color;
    ctx.globalAlpha = current.opacity * 0.5;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  return {
    stop: () => {
      running = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
    resize: () => {},
    updateParams: (p) => {
      current = { ...p };
    },
  };
}
