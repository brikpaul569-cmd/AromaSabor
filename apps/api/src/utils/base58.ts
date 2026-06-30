import { randomBytes } from 'crypto';

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE = ALPHABET.length;

/**
 * Generates a cryptographically random base58 string of the given length.
 *
 * Default 7 chars → ~3.4×10¹¹ combinations.
 * Ambiguous characters (0/O/I/l) are excluded from the alphabet.
 */
export function generateBase58(length: number = 7): string {
  const bytes = randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += ALPHABET[bytes[i] % BASE];
  }
  return result;
}
