"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const cache_repository_1 = require("./cache.repository");
const custom_env_service_1 = require("src/config/custom-env.service");
let CacheService = CacheService_1 = class CacheService {
    constructor(cacheRepository, customEnvService) {
        this.cacheRepository = cacheRepository;
        this.customEnvService = customEnvService;
        this.logger = new common_1.Logger(CacheService_1.name);
    }
    async setRelayMailCache(setRelayMailCacheDto) {
        const key = this.getRelayMailCacheKey(setRelayMailCacheDto.relayEmail);
        await this.cacheRepository.set(key, setRelayMailCacheDto.encryptedPrimaryEmail);
        this.logger.log('new relay mail mapped cache');
    }
    async findPrimaryMailFromCache(relayMail) {
        const key = this.getRelayMailCacheKey(relayMail);
        return await this.cacheRepository.get(key);
    }
    async deleteRelayMailMappingCache(relayMail) {
        try {
            const key = this.getRelayMailCacheKey(relayMail);
            await this.cacheRepository.del(key);
        }
        catch (err) {
            this.logger.error(err, 'failed to delete relay mapping cache');
        }
    }
    async getSession(token) {
        const key = this.getSessionKey(token);
        const session = await this.cacheRepository.get(key);
        if (!session) {
            throw new common_1.UnauthorizedException('Not found session');
        }
        return session;
    }
    async setSession(accessToken, refreshToken) {
        const key = this.getSessionKey(accessToken);
        const ttl = this.customEnvService.get('JWT_REFRESH_TOKEN_EXPIRATION');
        await this.cacheRepository.set(key, refreshToken, ttl);
    }
    async delSession(token) {
        const key = this.getSessionKey(token);
        await this.cacheRepository.del(key);
    }
    async hasSession(token) {
        const key = this.getSessionKey(token);
        return this.cacheRepository.exists(key);
    }
    getSessionKey(token) {
        return `auth:refresh:token:${token}`;
    }
    async setVerificationCode(usernameHash, code) {
        const key = this.getVerificationCodeKey(usernameHash);
        const ttl = this.customEnvService.get('VERIFICATION_CODE_EXPIRATION');
        await this.cacheRepository.set(key, code, ttl);
    }
    async getVerificationCode(usernameHash) {
        const key = this.getVerificationCodeKey(usernameHash);
        const code = await this.cacheRepository.get(key);
        if (!code) {
            throw new common_1.UnauthorizedException('Not found code');
        }
        return code;
    }
    async deleteVerificationCode(usernameHash) {
        const key = this.getVerificationCodeKey(usernameHash);
        await this.cacheRepository.del(key);
    }
    getVerificationCodeKey(usernameHash) {
        return `verification:code:${usernameHash}`;
    }
    async getVerificationAttempts(usernameHash) {
        const key = this.getVerificationAttemptsKey(usernameHash);
        const attempts = await this.cacheRepository.get(key);
        return attempts || 0;
    }
    async incrementVerificationAttempts(usernameHash) {
        const key = this.getVerificationAttemptsKey(usernameHash);
        const ttl = this.customEnvService.getWithDefault('VERIFICATION_CODE_EXPIRATION', 300000);
        const previous = await this.getVerificationAttempts(usernameHash);
        const current = previous + 1;
        await this.cacheRepository.set(key, current, ttl);
        return current;
    }
    async resetVerificationAttempts(usernameHash) {
        const key = this.getVerificationAttemptsKey(usernameHash);
        await this.cacheRepository.del(key);
    }
    getVerificationAttemptsKey(usernameHash) {
        return `verfication:attempts:${usernameHash}`;
    }
    getRelayMailCacheKey(relayEmail) {
        return `relay:mail:${relayEmail}`;
    }
    async setUsernameChangeData(userId, encryptedNewUsername, code) {
        const key = this.getUsernameChangeKey(userId);
        const ttl = this.customEnvService.get('VERIFICATION_CODE_EXPIRATION');
        await this.cacheRepository.set(key, { encryptedNewUsername, code }, ttl);
    }
    async getUsernameChangeData(userId) {
        const key = this.getUsernameChangeKey(userId);
        return await this.cacheRepository.get(key);
    }
    async deleteUsernameChangeData(userId) {
        const key = this.getUsernameChangeKey(userId);
        await this.cacheRepository.del(key);
    }
    getUsernameChangeKey(userId) {
        return `username:change:${userId}`;
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = CacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cache_repository_1.CacheRepository,
        custom_env_service_1.CustomEnvService])
], CacheService);
//# sourceMappingURL=cache.service.js.map