import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly cache: any;
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  // Generic cache operations
  async get<T>(key: string): Promise<T | null> {
    const value = await this.cacheManager.get<T>(key);
    return value ?? null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null && value !== undefined;
  }

  // Verification code operations
  async storeVerificationCode(
    username: string,
    code: string,
    ttl: number,
  ): Promise<void> {
    const key = `verification:code:${username}`;
    await this.set(key, code, ttl);
  }

  async getVerificationCode(username: string): Promise<string | null> {
    const key = `verification:code:${username}`;
    return await this.get<string>(key);
  }

  async deleteVerificationCode(username: string): Promise<void> {
    const key = `verification:code:${username}`;
    await this.del(key);
  }

  // Verification attempts tracking
  async getVerificationAttempts(username: string): Promise<number> {
    const key = `verification:attempts:${username}`;
    const attempts = await this.get<number>(key);
    return attempts || 0;
  }

  async incrementVerificationAttempts(
    username: string,
    ttl: number,
  ): Promise<number> {
    const key = `verification:attempts:${username}`;
    const currentAttempts = await this.getVerificationAttempts(username);
    const newAttempts = currentAttempts + 1;
    await this.set(key, newAttempts, ttl);
    return newAttempts;
  }

  async resetVerificationAttempts(username: string): Promise<void> {
    const key = `verification:attempts:${username}`;
    await this.del(key);
  }

  // Refresh token operations
  async storeRefreshToken(
    userId: bigint,
    token: string,
    ttl: number,
  ): Promise<void> {
    const key = `auth:refresh:token:${userId.toString()}`;
    await this.set(key, token, ttl);
  }

  async getRefreshToken(userId: bigint): Promise<string | null> {
    const key = `auth:refresh:token:${userId.toString()}`;
    return await this.get<string>(key);
  }

  async deleteRefreshToken(userId: bigint): Promise<void> {
    const key = `auth:refresh:token:${userId.toString()}`;
    await this.del(key);
  }

  async validateRefreshToken(userId: bigint, token: string): Promise<boolean> {
    const storedToken = await this.getRefreshToken(userId);
    return storedToken === token;
  }

  // Session management
  async storeSession(userId: bigint, data: any, ttl?: number): Promise<void> {
    const key = `session:${userId.toString()}`;
    await this.set(key, data, ttl);
  }

  async getSession<T>(userId: bigint): Promise<T | null> {
    const key = `session:${userId.toString()}`;
    return await this.get<T>(key);
  }

  async deleteSession(userId: bigint): Promise<void> {
    const key = `session:${userId.toString()}`;
    await this.del(key);
  }

  // Relay email mapping cache
  async storeRelayEmailMapping(
    relayAddress: string,
    primaryEmail: string,
  ): Promise<void> {
    const key = `relay-email:${relayAddress}`;
    // No TTL for relay email mappings (permanent until explicitly deleted)
    await this.set(key, primaryEmail);
  }

  async getPrimaryEmailByRelayEmail(
    relayAddress: string,
  ): Promise<string | null> {
    const key = `relay-email:${relayAddress}`;
    return await this.get<string>(key);
  }

  async deleteRelayEmailMapping(relayAddress: string): Promise<void> {
    const key = `relay-email:${relayAddress}`;
    await this.del(key);
  }
}
