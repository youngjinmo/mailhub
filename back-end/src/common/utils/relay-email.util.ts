import { randomBytes } from 'crypto';

/**
 * Relay email username validation pattern
 * - Must start and end with alphanumeric characters
 * - Can contain dots (.) and hyphens (-) only in the middle
 * - Single character usernames are allowed
 */
export const RELAY_USERNAME_PATTERN = /^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$/;

/**
 * Validate relay email username
 * @param username - The username to validate
 * @returns true if valid, false otherwise
 */
export function isValidRelayUsername(username: string): boolean {
  return RELAY_USERNAME_PATTERN.test(username);
}

/**
 * Generate random relay email username
 * Generates a 10-character alphanumeric string with a hyphen after the 4th character.
 * e.g. xx12-xxx34
 * @returns A random username
 */
export function generateRelayUsername(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(9);

  let pre = '';
  let post = '';

  for (let i = 0; i < 4; i++) {
    pre += chars[bytes[i] % chars.length];
  }
  for (let i = 4; i < 9; i++) {
    post += chars[bytes[i] % chars.length];
  }

  return `${pre}-${post}`;
}

/**
 * Error message for invalid relay username
 */
export const RELAY_USERNAME_ERROR_MESSAGE =
  'Username must start and end with alphanumeric characters, and can only contain letters, numbers, dots, and hyphens';
