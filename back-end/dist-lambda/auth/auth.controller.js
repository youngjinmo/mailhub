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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const oauth_service_1 = require("./oauth.service");
const send_verification_code_dto_1 = require("./dto/send-verification-code.dto");
const oauth_login_dto_1 = require("./dto/oauth-login.dto");
const unlink_oauth_dto_1 = require("../users/dto/unlink-oauth.dto");
const public_decorator_1 = require("../common/decorators/public.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const login_dto_1 = require("./dto/login.dto");
let AuthController = class AuthController {
    constructor(authService, oauthService) {
        this.authService = authService;
        this.oauthService = oauthService;
    }
    async sendVerificationCode(dto) {
        const { isNewUser } = await this.authService.sendVerificationCode(dto.encryptedUsername);
        return { message: 'Verification code sent successfully', isNewUser };
    }
    async login(dto) {
        const { accessToken } = await this.authService.verifyCodeAndLogin(dto);
        return { accessToken };
    }
    async logout(request) {
        const accessToken = request.headers.authorization?.split(' ')[1];
        if (accessToken) {
            await this.authService.logout(accessToken);
        }
        return { message: 'Logged out successfully' };
    }
    getGithubAuthUrl(redirectUri) {
        return this.oauthService.getGithubAuthUrl(redirectUri);
    }
    getGoogleAuthUrl(redirectUri) {
        return this.oauthService.getGoogleAuthUrl(redirectUri);
    }
    async oauthGithub(dto) {
        return this.oauthService.loginWithGithub(dto.code, dto.redirectUri);
    }
    async oauthGoogle(dto) {
        return this.oauthService.loginWithGoogle(dto.code, dto.redirectUri);
    }
    async oauthApple(dto) {
        return this.oauthService.loginWithApple(dto.idToken);
    }
    async unlinkOAuth(user, dto) {
        await this.oauthService.unlinkOAuth(user.userId, dto.provider);
        return { message: `${dto.provider} OAuth unlinked successfully` };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('send-verification-code'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_verification_code_dto_1.SendVerificationCodeDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "sendVerificationCode", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('oauth/github/url'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Query)('redirectUri')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], AuthController.prototype, "getGithubAuthUrl", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('oauth/google/url'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Query)('redirectUri')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], AuthController.prototype, "getGoogleAuthUrl", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('oauth/github'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [oauth_login_dto_1.OAuthGithubDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "oauthGithub", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('oauth/google'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [oauth_login_dto_1.OAuthGoogleDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "oauthGoogle", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('oauth/apple'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [oauth_login_dto_1.OAuthAppleDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "oauthApple", null);
__decorate([
    (0, common_1.Post)('oauth/unlink'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, unlink_oauth_dto_1.UnlinkOAuthDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "unlinkOAuth", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        oauth_service_1.OAuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map