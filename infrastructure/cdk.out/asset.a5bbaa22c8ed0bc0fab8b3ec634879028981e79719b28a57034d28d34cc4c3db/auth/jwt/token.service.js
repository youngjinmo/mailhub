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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const custom_env_service_1 = require("../../config/custom-env.service");
let TokenService = class TokenService {
    constructor(jwtService, customEnvService) {
        this.jwtService = jwtService;
        this.customEnvService = customEnvService;
    }
    generateAccessToken(userId, username) {
        const payload = {
            sub: userId.toString(),
            username,
        };
        const secret = this.customEnvService.get('JWT_SECRET');
        const expiresIn = this.customEnvService.get('JWT_ACCESS_TOKEN_EXPIRATION');
        return this.jwtService.sign(payload, {
            secret,
            expiresIn: `${expiresIn}ms`,
        });
    }
    generateRefreshToken(userId, username) {
        const payload = {
            sub: userId.toString(),
            username,
        };
        const secret = this.customEnvService.get('JWT_SECRET');
        const expiresIn = this.customEnvService.get('JWT_REFRESH_TOKEN_EXPIRATION');
        return this.jwtService.sign(payload, {
            secret,
            expiresIn: `${expiresIn}ms`,
        });
    }
    generateTokens(userId, username) {
        return {
            accessToken: this.generateAccessToken(userId, username),
            refreshToken: this.generateRefreshToken(userId, username),
        };
    }
    parsePayloadFromToken(token) {
        const payload = this.validateToken(token);
        return {
            userId: BigInt(payload.sub),
            username: payload.username,
        };
    }
    getUsernameFromToken(token) {
        const payload = this.validateToken(token);
        return payload.username;
    }
    validateToken(token) {
        const secret = this.customEnvService.get('JWT_SECRET');
        return this.jwtService.verify(token, { secret });
    }
    decodeToken(token) {
        const decoded = this.jwtService.decode(token);
        if (!decoded) {
            return null;
        }
        return {
            userId: BigInt(decoded.sub),
            username: decoded.username,
        };
    }
};
exports.TokenService = TokenService;
exports.TokenService = TokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        custom_env_service_1.CustomEnvService])
], TokenService);
//# sourceMappingURL=token.service.js.map