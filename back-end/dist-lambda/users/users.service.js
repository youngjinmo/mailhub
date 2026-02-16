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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const oauth_provider_enum_1 = require("../common/enums/oauth-provider.enum");
const protection_util_1 = require("src/common/utils/protection.util");
const user_enums_1 = require("./user.enums");
const cache_service_1 = require("../cache/cache.service");
const send_mail_service_1 = require("../mail/send-mail.service");
let UsersService = UsersService_1 = class UsersService {
    constructor(userRepository, proectionUtil, cacheService, sendMailService) {
        this.userRepository = userRepository;
        this.proectionUtil = proectionUtil;
        this.cacheService = cacheService;
        this.sendMailService = sendMailService;
        this.logger = new common_1.Logger(UsersService_1.name);
    }
    async findById(id) {
        return await this.userRepository.findOne({
            where: { id },
        });
    }
    async findByUsernameHash(usernameHash) {
        return await this.userRepository.findOne({
            where: { usernameHash },
        });
    }
    async existsByUsername(usernameHash) {
        const user = await this.findByUsernameHash(usernameHash);
        return !!user;
    }
    async createEmailUser(encryptedUsername) {
        try {
            const username = this.proectionUtil.decrypt(encryptedUsername);
            const usernameHash = this.proectionUtil.hash(username);
            const existingUser = await this.findByUsernameHash(usernameHash);
            if (existingUser) {
                throw new common_1.ConflictException('User already exists');
            }
            const user = this.userRepository.create({
                username: encryptedUsername,
                usernameHash,
            });
            return await this.userRepository.save(user);
        }
        catch (err) {
            this.logger.error(err, 'Failed to create user');
            throw new common_1.InternalServerErrorException('Failed to create user');
        }
    }
    async updateUser(usernameHash, properties) {
        const user = await this.findByUsernameHash(usernameHash);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        else {
            Object.assign(user, properties);
            await this.userRepository.save(user);
        }
    }
    async deactivateUser(userId) {
        await this.userRepository
            .update({ id: userId }, {
            status: user_enums_1.UserStatus.DEACTIVATED,
        })
            .then(() => {
            this.logger.log('success to deactivated');
        })
            .catch((err) => {
            this.logger.error(err, `failed to deactivate user, userId=${userId}`);
        });
    }
    async deleteUser(userId) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.userRepository.softRemove(user);
    }
    async updateSubscriptionTier(userId, tier) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        user.subscriptionTier = tier;
        return await this.userRepository.save(user);
    }
    async getUserInfo(userId) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            username: this.proectionUtil.decrypt(user.username),
            subscriptionTier: user.subscriptionTier,
            createdAt: user.createdAt,
            ghOauth: !!user.githubOAuth,
            aaplOauth: !!user.appleOAuth,
            googOauth: !!user.googleOAuth,
        };
    }
    async findByOAuthId(provider, oauthId) {
        const field = UsersService_1.OAUTH_FIELD_MAP[provider];
        return await this.userRepository.findOne({
            where: { [field]: oauthId },
        });
    }
    async createOAuthUser(encryptedEmail, provider, oauthId, encryptedToken) {
        try {
            const email = this.proectionUtil.decrypt(encryptedEmail);
            const usernameHash = this.proectionUtil.hash(email);
            const existingUser = await this.findByUsernameHash(usernameHash);
            if (existingUser) {
                throw new common_1.ConflictException('User already exists');
            }
            const field = UsersService_1.OAUTH_FIELD_MAP[provider];
            const tokenField = UsersService_1.OAUTH_TOKEN_FIELD_MAP[provider];
            const user = this.userRepository.create({
                username: encryptedEmail,
                usernameHash,
                [field]: oauthId,
                ...(tokenField && encryptedToken
                    ? { [tokenField]: encryptedToken }
                    : {}),
            });
            return await this.userRepository.save(user);
        }
        catch (err) {
            if (err instanceof common_1.ConflictException)
                throw err;
            this.logger.error(err, 'Failed to create OAuth user');
            throw new common_1.InternalServerErrorException('Failed to create user');
        }
    }
    async linkOAuth(userId, provider, oauthId, encryptedToken) {
        const field = UsersService_1.OAUTH_FIELD_MAP[provider];
        const tokenField = UsersService_1.OAUTH_TOKEN_FIELD_MAP[provider];
        await this.userRepository.update({ id: userId }, {
            [field]: oauthId,
            ...(tokenField && encryptedToken
                ? { [tokenField]: encryptedToken }
                : {}),
        });
    }
    async unlinkOAuth(userId, provider) {
        const field = UsersService_1.OAUTH_FIELD_MAP[provider];
        const tokenField = UsersService_1.OAUTH_TOKEN_FIELD_MAP[provider];
        await this.userRepository.update({ id: userId }, {
            [field]: null,
            ...(tokenField ? { [tokenField]: null } : {}),
        });
    }
    async getOAuthToken(userId, provider) {
        const tokenField = UsersService_1.OAUTH_TOKEN_FIELD_MAP[provider];
        if (!tokenField)
            return null;
        const user = await this.findById(userId);
        if (!user)
            return null;
        return user[tokenField] || null;
    }
    async requestUsernameChange(userId, encryptedNewUsername) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const newUsername = this.proectionUtil.decrypt(encryptedNewUsername);
        const newUsernameHash = this.proectionUtil.hash(newUsername);
        if (newUsernameHash === user.usernameHash) {
            throw new common_1.BadRequestException('New email is same as current email');
        }
        const existingUser = await this.findByUsernameHash(newUsernameHash);
        if (existingUser) {
            throw new common_1.ConflictException('Email already in use');
        }
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await this.cacheService.setUsernameChangeData(userId, encryptedNewUsername, code);
        await this.sendMailService.sendVerificationCodeForReturningUser(newUsername, code);
    }
    async verifyUsernameChange(userId, code) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const cachedData = await this.cacheService.getUsernameChangeData(userId);
        if (!cachedData) {
            throw new common_1.BadRequestException('Verification code not found or expired. Please request a new code.');
        }
        if (cachedData.code !== code) {
            throw new common_1.BadRequestException('Invalid verification code');
        }
        const newUsername = this.proectionUtil.decrypt(cachedData.encryptedNewUsername);
        const newUsernameHash = this.proectionUtil.hash(newUsername);
        const existingUser = await this.findByUsernameHash(newUsernameHash);
        if (existingUser) {
            await this.cacheService.deleteUsernameChangeData(userId);
            throw new common_1.ConflictException('Email already in use');
        }
        user.username = cachedData.encryptedNewUsername;
        user.usernameHash = newUsernameHash;
        await this.userRepository.save(user);
        await this.cacheService.deleteUsernameChangeData(userId);
    }
};
exports.UsersService = UsersService;
UsersService.OAUTH_FIELD_MAP = {
    [oauth_provider_enum_1.OAuthProvider.GITHUB]: 'githubOAuth',
    [oauth_provider_enum_1.OAuthProvider.APPLE]: 'appleOAuth',
    [oauth_provider_enum_1.OAuthProvider.GOOGLE]: 'googleOAuth',
};
UsersService.OAUTH_TOKEN_FIELD_MAP = {
    [oauth_provider_enum_1.OAuthProvider.GITHUB]: 'githubOAuthToken',
    [oauth_provider_enum_1.OAuthProvider.GOOGLE]: 'googleOAuthToken',
};
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        protection_util_1.ProtectionUtil,
        cache_service_1.CacheService,
        send_mail_service_1.SendMailService])
], UsersService);
//# sourceMappingURL=users.service.js.map