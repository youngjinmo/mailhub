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
var AuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const token_service_1 = require("../../auth/jwt/token.service");
const cache_service_1 = require("../../cache/cache.service");
const public_decorator_1 = require("../decorators/public.decorator");
let AuthGuard = AuthGuard_1 = class AuthGuard {
    constructor(reflector, tokenService, cacheService) {
        this.reflector = reflector;
        this.tokenService = tokenService;
        this.cacheService = cacheService;
        this.logger = new common_1.Logger(AuthGuard_1.name);
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const accessToken = this.extractTokenFromHeader(request);
        if (!accessToken) {
            throw new common_1.UnauthorizedException('Access token is required');
        }
        try {
            const payload = this.tokenService.parsePayloadFromToken(accessToken);
            const hasSession = await this.cacheService.hasSession(accessToken);
            if (!hasSession) {
                throw new common_1.UnauthorizedException('Session not found');
            }
            request.user = {
                userId: payload.userId,
                username: payload.username,
            };
            return true;
        }
        catch (error) {
            if (error?.name === 'TokenExpiredError') {
                return this.handleTokenRefresh(request, response, accessToken);
            }
            this.logger.warn(`Authentication failed for ${request.method} ${request.url}: ${error?.message}`);
            throw new common_1.UnauthorizedException('Invalid access token');
        }
    }
    async handleTokenRefresh(request, response, expiredAccessToken) {
        const hasSession = await this.cacheService.hasSession(expiredAccessToken);
        if (!hasSession) {
            this.logger.debug('Session not found for expired token');
            throw new common_1.UnauthorizedException('Session expired. Please login again.');
        }
        const payload = this.tokenService.decodeToken(expiredAccessToken);
        if (!payload) {
            this.logger.debug('Failed to decode expired token');
            throw new common_1.UnauthorizedException('Invalid token');
        }
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = this.tokenService.generateTokens(payload.userId, payload.username);
        await this.cacheService.delSession(expiredAccessToken);
        await this.cacheService.setSession(newAccessToken, newRefreshToken);
        response.setHeader('X-New-Access-Token', newAccessToken);
        request.user = {
            userId: payload.userId,
            username: payload.username,
        };
        this.logger.log(`Tokens refreshed for user ${payload.username}`);
        return true;
    }
    extractTokenFromHeader(request) {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = AuthGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        token_service_1.TokenService,
        cache_service_1.CacheService])
], AuthGuard);
//# sourceMappingURL=auth.guard.js.map