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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const token_service_1 = require("./jwt/token.service");
const cache_service_1 = require("../cache/cache.service");
const users_service_1 = require("../users/users.service");
const send_mail_service_1 = require("../mail/send-mail.service");
const custom_env_service_1 = require("../config/custom-env.service");
const protection_util_1 = require("src/common/utils/protection.util");
let AuthService = AuthService_1 = class AuthService {
    constructor(tokenService, cacheService, usersService, sendMailService, customEnvService, protectionUtil) {
        this.tokenService = tokenService;
        this.cacheService = cacheService;
        this.usersService = usersService;
        this.sendMailService = sendMailService;
        this.customEnvService = customEnvService;
        this.protectionUtil = protectionUtil;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async sendVerificationCode(encryptedUsername) {
        const username = this.protectionUtil.decrypt(encryptedUsername);
        const usernameHash = this.protectionUtil.hash(username);
        const existingUser = await this.usersService.findByUsernameHash(usernameHash);
        const isNewUser = !existingUser;
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await this.cacheService.setVerificationCode(usernameHash, code);
        void this.cacheService.resetVerificationAttempts(usernameHash);
        if (isNewUser) {
            await this.sendMailService.sendVerificationCodeForNewUser(username, code);
        }
        else {
            await this.sendMailService.sendVerificationCodeForReturningUser(username, code);
        }
        return { isNewUser };
    }
    async verifyCodeAndLogin(dto) {
        const { encryptedUsername, code } = dto;
        const usernameHash = this.protectionUtil.hash(this.protectionUtil.decrypt(encryptedUsername));
        const maxAttempts = this.customEnvService.getWithDefault('VERIFICATION_CODE_MAX_ATTEMPTS', 3);
        const attempts = await this.cacheService.getVerificationAttempts(usernameHash);
        if (maxAttempts && attempts >= maxAttempts) {
            throw new common_1.HttpException('Too many failed attempts. Please request a new code.', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        const storedCode = await this.cacheService.getVerificationCode(usernameHash);
        if (!storedCode) {
            throw new common_1.BadRequestException('Verification code not found or expired. Please request a new code.');
        }
        if (storedCode !== code) {
            await this.cacheService.incrementVerificationAttempts(usernameHash);
            throw new common_1.UnauthorizedException('Invalid verification code');
        }
        await this.cacheService.deleteVerificationCode(usernameHash);
        await this.cacheService.resetVerificationAttempts(usernameHash);
        let user = await this.usersService.findByUsernameHash(usernameHash);
        if (!user) {
            user = await this.usersService.createEmailUser(encryptedUsername);
            await this.sendMailService.sendWelcomeEmail(this.protectionUtil.decrypt(encryptedUsername));
        }
        await this.usersService.updateUser(usernameHash, {
            lastLoginedAt: new Date(),
        });
        const { accessToken, refreshToken } = this.tokenService.generateTokens(user.id, user.username);
        await this.cacheService.setSession(accessToken, refreshToken);
        return { accessToken };
    }
    verifyToken(accessToken) {
        try {
            this.parsePayloadFromToken(accessToken);
            return true;
        }
        catch {
            return false;
        }
    }
    parsePayloadFromToken(accessToken) {
        return this.tokenService.parsePayloadFromToken(accessToken);
    }
    async refreshAccessToken(refreshToken) {
        try {
            const { userId, username } = this.parsePayloadFromToken(refreshToken);
            const isValid = await this.validateRefreshToken(userId, refreshToken);
            if (!isValid) {
                throw new common_1.UnauthorizedException('Invalid or revoked refresh token');
            }
            const newAccessToken = this.tokenService.generateAccessToken(userId, username);
            return newAccessToken;
        }
        catch (error) {
            this.logger.error(error, 'failed to refresh access token');
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async logout(accessToken) {
        await this.cacheService.delSession(accessToken);
    }
    generateRefreshToken(userId, username) {
        return this.tokenService.generateRefreshToken(userId, username);
    }
    async validateRefreshToken(userId, token) {
        const session = await this.cacheService.getSession(token);
        const payload = this.parsePayloadFromToken(token);
        return session === payload.userId.toString();
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [token_service_1.TokenService,
        cache_service_1.CacheService,
        users_service_1.UsersService,
        send_mail_service_1.SendMailService,
        custom_env_service_1.CustomEnvService,
        protection_util_1.ProtectionUtil])
], AuthService);
//# sourceMappingURL=auth.service.js.map