import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CustomEnvService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Get a required environment variable as string
   * @throws Error if the variable is not defined
   */
  getString(key: string): string {
    const value = this.configService.get<string>(key);
    if (value === undefined || value === null) {
      throw new Error(`Environment variable ${key} is not defined`);
    }
    return value;
  }

  /**
   * Get a required environment variable as number
   * @throws Error if the variable is not defined or not a valid number
   */
  getNumber(key: string): number {
    const value = this.configService.get<number>(key);
    if (value === undefined || value === null) {
      throw new Error(`Environment variable ${key} is not defined`);
    }
    if (isNaN(value)) {
      throw new Error(`Environment variable ${key} is not a valid number`);
    }
    return value;
  }

  /**
   * Get an optional environment variable as string
   * Returns undefined if not defined
   */
  getStringOptional(key: string): string | undefined {
    return this.configService.get<string>(key);
  }

  /**
   * Get an optional environment variable as number
   * Returns undefined if not defined
   */
  getNumberOptional(key: string): number | undefined {
    return this.configService.get<number>(key);
  }

  /**
   * Get a required environment variable as boolean
   * @throws Error if the variable is not defined
   */
  getBoolean(key: string): boolean {
    const value = this.configService.get<string>(key);
    if (value === undefined || value === null) {
      throw new Error(`Environment variable ${key} is not defined`);
    }
    return value.toLowerCase() === 'true' || value === '1';
  }

  /**
   * Get an optional environment variable as boolean
   * Returns undefined if not defined
   */
  getBooleanOptional(key: string): boolean | undefined {
    const value = this.configService.get<string>(key);
    if (value === undefined || value === null) {
      return undefined;
    }
    return value.toLowerCase() === 'true' || value === '1';
  }

  /**
   * Get a required environment variable with default value
   */
  getWithDefault<T = string>(key: string, defaultValue: T): T {
    const value = this.configService.get<T>(key);
    if (value === undefined || value === null) {
      return defaultValue;
    }
    return value;
  }
}
