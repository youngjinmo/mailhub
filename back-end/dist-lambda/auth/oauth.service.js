"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const token_service_1 = require("./jwt/token.service");
const cache_service_1 = require("../cache/cache.service");
const users_service_1 = require("../users/users.service");
const custom_env_service_1 = require("../config/custom-env.service");
const protection_util_1 = require("src/common/utils/protection.util");
const oauth_provider_enum_1 = require("src/common/enums/oauth-provider.enum");
let OAuthService = OAuthService_1 = class OAuthService {
    constructor(tokenService, cacheService, usersService, customEnvService, protectionUtil) {
        this.tokenService = tokenService;
        this.cacheService = cacheService;
        this.usersService = usersService;
        this.customEnvService = customEnvService;
        this.protectionUtil = protectionUtil;
        this.logger = new common_1.Logger(OAuthService_1.name);
    }
    getGithubAuthUrl(redirectUri) {
        const clientId = this.customEnvService.get('GITHUB_CLIENT_ID');
        const state = JSON.stringify({ provider: 'github' });
        const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=${encodeURIComponent(state)}`;
        return { url };
    }
    getGoogleAuthUrl(redirectUri) {
        const clientId = this.customEnvService.get('GOOGLE_CLIENT_ID');
        const state = JSON.stringify({ provider: 'google' });
        const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email&state=${encodeURIComponent(state)}&access_type=offline&prompt=consent`;
        return { url };
    }
    async loginWithGithub(code, redirectUri) {
        const clientId = this.customEnvService.get('GITHUB_CLIENT_ID');
        const clientSecret = this.customEnvService.get('GITHUB_CLIENT_SECRET');
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: redirectUri,
            }),
        });
        const tokenData = await tokenResponse.json();
        if (tokenData.error) {
            this.logger.error(tokenData, 'GitHub OAuth token exchange failed');
            throw new common_1.UnauthorizedException('GitHub OAuth authentication failed');
        }
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                Accept: 'application/json',
            },
        });
        if (!userResponse.ok) {
            throw new common_1.UnauthorizedException('Failed to fetch GitHub user info');
        }
        const githubUser = await userResponse.json();
        const oauthId = githubUser.id.toString();
        const emailResponse = await fetch('https://api.github.com/user/emails', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                Accept: 'application/json',
            },
        });
        let email = null;
        if (emailResponse.ok) {
            const emails = await emailResponse.json();
            const primaryEmail = emails.find((e) => e.primary && e.verified);
            email = primaryEmail?.email || null;
        }
        if (!email) {
            throw new common_1.UnauthorizedException('No verified primary email found on GitHub account');
        }
        const encryptedToken = this.protectionUtil.encrypt(tokenData.access_token);
        return this.processOAuthUser(email, oauth_provider_enum_1.OAuthProvider.GITHUB, oauthId, encryptedToken);
    }
    async loginWithGoogle(code, redirectUri) {
        const clientId = this.customEnvService.get('GOOGLE_CLIENT_ID');
        const clientSecret = this.customEnvService.get('GOOGLE_CLIENT_SECRET');
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });
        const tokenData = await tokenResponse.json();
        if (tokenData.error) {
            this.logger.error(tokenData, 'Google OAuth token exchange failed');
            throw new common_1.UnauthorizedException('Google OAuth authentication failed');
        }
        const idTokenPayload = this.decodeJwtPayload(tokenData.id_token);
        if (!idTokenPayload || !idTokenPayload.email) {
            throw new common_1.UnauthorizedException('Failed to extract user info from Google token');
        }
        const email = idTokenPayload.email;
        const oauthId = idTokenPayload.sub;
        const encryptedToken = tokenData.refresh_token
            ? this.protectionUtil.encrypt(tokenData.refresh_token)
            : undefined;
        return this.processOAuthUser(email, oauth_provider_enum_1.OAuthProvider.GOOGLE, oauthId, encryptedToken);
    }
    async loginWithApple(idToken) {
        const payload = await this.verifyAppleIdToken(idToken);
        if (!payload || !payload.email) {
            throw new common_1.UnauthorizedException('Failed to extract user info from Apple token');
        }
        const email = payload.email;
        const oauthId = payload.sub;
        return this.processOAuthUser(email, oauth_provider_enum_1.OAuthProvider.APPLE, oauthId);
    }
    async processOAuthUser(email, provider, oauthId, encryptedToken) {
        let user = await this.usersService.findByOAuthId(provider, oauthId);
        if (user) {
            if (encryptedToken) {
                await this.usersService.linkOAuth(user.id, provider, oauthId, encryptedToken);
            }
        }
        else {
            const emailHash = this.protectionUtil.hash(email);
            user = await this.usersService.findByUsernameHash(emailHash);
            if (user) {
                await this.usersService.linkOAuth(user.id, provider, oauthId, encryptedToken);
            }
            else {
                const encryptedEmail = this.protectionUtil.encrypt(email);
                user = await this.usersService.createOAuthUser(encryptedEmail, provider, oauthId, encryptedToken);
            }
        }
        await this.usersService.updateUser(user.usernameHash, {
            lastLoginedAt: new Date(),
        });
        const { accessToken, refreshToken } = this.tokenService.generateTokens(user.id, user.username);
        await this.cacheService.setSession(accessToken, refreshToken);
        return { accessToken };
    }
    async unlinkOAuth(userId, provider) {
        const encryptedToken = await this.usersService.getOAuthToken(userId, provider);
        if (encryptedToken) {
            const token = this.protectionUtil.decrypt(encryptedToken);
            this.revokeOAuthToken(provider, token)
                .then(() => {
                this.logger.log(`Success to revoke ${provider}`);
            })
                .catch((err) => {
                this.logger.warn(`Failed to revoke ${provider} token for user ${userId}: ${err.message}`);
            });
        }
        await this.usersService.unlinkOAuth(userId, provider);
    }
    async revokeOAuthToken(provider, token) {
        if (provider === oauth_provider_enum_1.OAuthProvider.GITHUB) {
            const clientId = this.customEnvService.get('GITHUB_CLIENT_ID');
            const clientSecret = this.customEnvService.get('GITHUB_CLIENT_SECRET');
            const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
            const response = await fetch(`https://api.github.com/applications/${clientId}/token`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Basic ${credentials}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ access_token: token }),
            });
            if (!response.ok && response.status !== 422) {
                throw new Error(`GitHub token revocation failed with status ${response.status}`);
            }
        }
        else if (provider === oauth_provider_enum_1.OAuthProvider.GOOGLE) {
            const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            if (!response.ok && response.status !== 400) {
                throw new Error(`Google token revocation failed with status ${response.status}`);
            }
        }
    }
    decodeJwtPayload(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3)
                return null;
            const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
            return JSON.parse(payload);
        }
        catch {
            return null;
        }
    }
    async verifyAppleIdToken(idToken) {
        try {
            const headerB64 = idToken.split('.')[0];
            const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf-8'));
            const kid = header.kid;
            const jwksResponse = await fetch('https://appleid.apple.com/auth/keys');
            const jwks = await jwksResponse.json();
            const key = jwks.keys.find((k) => k.kid === kid);
            if (!key) {
                throw new Error('Apple public key not found');
            }
            const publicKey = crypto.createPublicKey({
                key: key,
                format: 'jwk',
            });
            const [headerPart, payloadPart, signaturePart] = idToken.split('.');
            const data = `${headerPart}.${payloadPart}`;
            const signature = Buffer.from(signaturePart, 'base64url');
            const isValid = crypto.verify('RSA-SHA256', Buffer.from(data), publicKey, signature);
            if (!isValid) {
                throw new Error('Invalid Apple id_token signature');
            }
            const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf-8'));
            const appleClientId = this.customEnvService.get('APPLE_CLIENT_ID');
            if (payload.iss !== 'https://appleid.apple.com') {
                throw new Error('Invalid issuer');
            }
            if (payload.aud !== appleClientId) {
                throw new Error('Invalid audience');
            }
            if (payload.exp * 1000 < Date.now()) {
                throw new Error('Token expired');
            }
            return payload;
        }
        catch (error) {
            this.logger.error(error, 'Apple id_token verification failed');
            throw new common_1.UnauthorizedException('Apple OAuth authentication failed');
        }
    }
};
exports.OAuthService = OAuthService;
exports.OAuthService = OAuthService = OAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [token_service_1.TokenService,
        cache_service_1.CacheService,
        users_service_1.UsersService,
        custom_env_service_1.CustomEnvService,
        protection_util_1.ProtectionUtil])
], OAuthService);
//# sourceMappingURL=oauth.service.js.map