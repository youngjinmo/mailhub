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
 * Format a string into hyphen-separated groups for readability
 * e.g. "abcdefghij" with groupSize=5 → "abcde-fghij"
 * @param str - The string to format
 * @param groupSize - Number of characters per group (default: 5)
 * @returns Hyphen-separated string
 */
export function formatWithHyphens(str: string, groupSize: number = 5): string {
  const groups: string[] = [];
  for (let i = 0; i < str.length; i += groupSize) {
    groups.push(str.slice(i, i + groupSize));
  }
  return groups.join('-');
}

/**
 * Generate a random relay email username in readable hyphen-separated format
 * Generates 15 random alphanumeric characters formatted as xxxxx-xxxxx-xxxxx
 * @returns A random username string (e.g. "i505z-fmife-0gq77")
 */
export function generateRandomRelayUsername(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const totalLength = 15; // 3 groups of 5
  const bytes = randomBytes(totalLength);

  let raw = '';
  for (let i = 0; i < totalLength; i++) {
    raw += chars[bytes[i] % chars.length];
  }

  return formatWithHyphens(raw);
}

/**
 * Error message for invalid relay username
 */
export const RELAY_USERNAME_ERROR_MESSAGE =
  'Username must start and end with alphanumeric characters, and can only contain letters, numbers, dots, and hyphens';
