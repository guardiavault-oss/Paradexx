/**
 * BigInt polyfill and utilities for safe BigInt to number conversion
 * Prevents "Cannot convert a BigInt value to a number" errors
 */

import { logWarn } from './logger';

/**
 * Safely convert BigInt to number
 * Returns null if value is too large for Number
 */
export function bigIntToNumber(value: bigint): number | null {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) {
    return null; // Value too large
  }
  return Number(value);
}

/**
 * Safe Math.pow that handles BigInt
 */
export function safePow(base: bigint | number, exponent: number): bigint | number {
  if (typeof base === 'bigint') {
    // For BigInt, use manual calculation or convert safely
    if (exponent === 0) return 1n;
    if (exponent === 1) return base;
    if (exponent < 0) {
      // Can't handle negative exponents with BigInt easily
      const numBase = bigIntToNumber(base);
      if (numBase === null) throw new Error('BigInt too large for number conversion');
      return Math.pow(numBase, exponent);
    }
    // For positive exponents, use iterative multiplication
    let result = 1n;
    for (let i = 0; i < exponent; i++) {
      result *= base;
    }
    return result;
  }
  return Math.pow(base, exponent);
}

/**
 * Convert BigInt to string (for display/logging)
 */
export function bigIntToString(value: bigint): string {
  return value.toString();
}

/**
 * Check if a value is BigInt
 */
export function isBigInt(value: unknown): value is bigint {
  return typeof value === 'bigint';
}

/**
 * Polyfill for environments that don't support BigInt properly
 */
if (typeof BigInt === 'undefined') {
  logWarn('BigInt is not supported in this environment');
}

