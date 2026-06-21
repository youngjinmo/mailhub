import crypto from 'node:crypto';

export class Protection {
  private readonly key: Buffer;

  constructor(base64Key: string) {
    this.key = Buffer.from(base64Key, 'base64');
    if (this.key.length !== 32) {
      throw new Error('Encryption key must be 32 bytes (256 bits)');
    }
  }

  decrypt(value: string): string {
    const [encrypted, iv, authTag, ...extra] = value.split(':');
    if (!encrypted || !iv || !authTag || extra.length > 0) {
      throw new Error('Invalid encrypted data format');
    }

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));
    return decipher.update(encrypted, 'base64', 'utf8') + decipher.final('utf8');
  }

  encrypt(value: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = cipher.update(value, 'utf8', 'base64') + cipher.final('base64');
    return `${encrypted}:${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}`;
  }

  hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }
}
