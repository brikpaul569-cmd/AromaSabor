import { describe, it, expect } from 'vitest';
import { generateBase58 } from './base58';

const AMBIGUOUS_CHARS = /[0OIl]/;

describe('generateBase58', () => {
  it('generates a 7-character code by default', () => {
    const code = generateBase58();
    expect(code).toHaveLength(7);
  });

  it('generates codes with no ambiguous characters (0, O, I, l)', () => {
    for (let i = 0; i < 1000; i++) {
      const code = generateBase58();
      expect(code).not.toMatch(AMBIGUOUS_CHARS);
    }
  });

  it('generates codes that only use base58 alphabet characters', () => {
    const validChars = /^[1-9A-HJ-NP-Za-km-z]+$/;
    for (let i = 0; i < 1000; i++) {
      const code = generateBase58();
      expect(code).toMatch(validChars);
    }
  });

  it('generates unique codes (no collisions in 1000 samples)', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const code = generateBase58();
      expect(codes.has(code)).toBe(false);
      codes.add(code);
    }
    expect(codes.size).toBe(1000);
  });

  it('respects custom length parameter', () => {
    const code = generateBase58(12);
    expect(code).toHaveLength(12);
  });
});
