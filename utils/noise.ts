// A simple, self-contained Perlin noise implementation
// Based on standard permutation table approaches

const PERMUTATION = new Uint8Array(512);
const p = new Uint8Array(256);

// Initialize with a random seed
export function seedNoise(seed: number) {
  for (let i = 0; i < 256; i++) {
    p[i] = i;
  }
  
  // Shuffle based on seed
  let buffer: number;
  let s = seed % 256;
  
  for (let i = 255; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296; // Simple LCG
    const j = Math.floor(s % (i + 1));
    buffer = p[i];
    p[i] = p[j];
    p[j] = buffer;
  }

  for (let i = 0; i < 512; i++) {
    PERMUTATION[i] = p[i & 255];
  }
}

function fade(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(t: number, a: number, b: number) {
  return a + t * (b - a);
}

function grad(hash: number, x: number, y: number, z: number) {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

// 2D Perlin Noise
export function noise2D(x: number, y: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;

  x -= Math.floor(x);
  y -= Math.floor(y);

  const u = fade(x);
  const v = fade(y);

  const A = PERMUTATION[X] + Y;
  const AA = PERMUTATION[A];
  const AB = PERMUTATION[A + 1];
  const B = PERMUTATION[X + 1] + Y;
  const BA = PERMUTATION[B];
  const BB = PERMUTATION[B + 1];

  return lerp(
    v,
    lerp(u, grad(PERMUTATION[AA], x, y, 0), grad(PERMUTATION[BA], x - 1, y, 0)),
    lerp(u, grad(PERMUTATION[AB], x, y - 1, 0), grad(PERMUTATION[BB], x - 1, y - 1, 0))
  );
}

// 1D Noise helper
export function noise1D(x: number): number {
  return noise2D(x, 0);
}
