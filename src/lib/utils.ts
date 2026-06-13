import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Sum a numeric field across an array. */
export function sumBy<T>(arr: T[], fn: (item: T) => number): number {
  return arr.reduce((acc, item) => acc + fn(item), 0);
}

/** Average a numeric field across an array. */
export function avgBy<T>(arr: T[], fn: (item: T) => number): number {
  if (arr.length === 0) return 0;
  return sumBy(arr, fn) / arr.length;
}

/** Group an array by a string key. */
export function groupBy<T>(arr: T[], fn: (item: T) => string): Record<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const key = fn(item);
      (acc[key] ??= []).push(item);
      return acc;
    },
    {} as Record<string, T[]>,
  );
}

/** Deterministic id helper for keys. */
export function slug(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
