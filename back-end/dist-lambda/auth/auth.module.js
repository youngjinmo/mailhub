"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const oauth_service_1 = require("./oauth.service");
const token_service_1 = require("./jwt/token.service");
const cache_module_1 = require("../cache/cache.module");
const users_module_1 = require("../users/users.module");
const aws_module_1 = require("../aws/aws.module");
const mail_module_1 = require("src/mail/mail.module");
const custom_env_service_1 = require("../config/custom-env.service");
const protection_util_1 = require("src/common/utils/protection.util");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            jwt_1.JwtModule.registerAsync({
                useFactory: (customEnvService) => {
                    const secret = customEnvService.get('JWT_SECRET');
                    const expiresIn = customEnvService.get('JWT_ACCESS_TOKEN_EXPIRATION');
                    return {
                        secret,
                        signOptions: {
                            expiresIn: `${expiresIn}ms`,
                        },
                    };
                },
                inject: [custom_env_service_1.CustomEnvService],
            }),
            cache_module_1.CacheModule,
            users_module_1.UsersModule,
            aws_module_1.AwsModule,
            mail_module_1.MailModule,
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [auth_service_1.AuthService, oauth_service_1.OAuthService, token_service_1.TokenService, protection_util_1.ProtectionUtil],
        exports: [auth_service_1.AuthService, oauth_service_1.OAuthService, token_service_1.TokenService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map