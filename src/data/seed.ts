// Deterministic seeded pseudo-random utilities.
// All synthetic data is generated through these helpers so the demo is
// byte-for-byte reproducible across reloads, machines, and deployments.

/** mulberry32 — a tiny, fast, deterministic PRNG. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash an arbitrary string into a 32-bit integer seed (FNV-1a style). */
export function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A small stateful RNG with convenience samplers. */
export class Rng {
  private next: () => number;

  constructor(seed: number | string) {
    const s = typeof seed === "string" ? hashSeed(seed) : seed;
    this.next = mulberry32(s);
  }

  /** Uniform float in [0, 1). */
  float(): number {
    return this.next();
  }

  /** Uniform float in [min, max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /** Approximate standard normal via sum of uniforms (Irwin–Hall). */
  normal(mean = 0, sd = 1): number {
    let sum = 0;
    for (let i = 0; i < 6; i++) sum += this.next();
    return mean + (sum - 3) * (sd / Math.sqrt(0.5));
  }

  /** Pick a random element. */
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Weighted pick. weights need not sum to 1. */
  weighted<T>(arr: readonly T[], weights: readonly number[]): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = this.next() * total;
    for (let i = 0; i < arr.length; i++) {
      r -= weights[i];
      if (r <= 0) return arr[i];
    }
    return arr[arr.length - 1];
  }

  /** True with probability p. */
  chance(p: number): boolean {
    return this.next() < p;
  }
}

/** Clamp a number to a range. */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Linear interpolation. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Round to n decimal places. */
export function round(n: number, decimals = 0): number {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}
