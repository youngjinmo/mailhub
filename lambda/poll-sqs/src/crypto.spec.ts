import crypto from 'node:crypto';
import { Protection } from './crypto';

describe('Protection', () => {
  it('encrypts and decrypts values using the backend-compatible format', () => {
    const protection = new Protection(crypto.randomBytes(32).toString('base64'));
    const encrypted = protection.encrypt('user@example.com');
    expect(protection.decrypt(encrypted)).toBe('user@example.com');
    expect(encrypted.split(':')).toHaveLength(3);
  });
});
