"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheModule = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const redis_1 = require("@keyv/redis");
const cache_repository_1 = require("./cache.repository");
const cache_service_1 = require("./cache.service");
const custom_env_service_1 = require("../config/custom-env.service");
let CacheModule = class CacheModule {
};
exports.CacheModule = CacheModule;
exports.CacheModule = CacheModule = __decorate([
    (0, common_1.Module)({
        imports: [
            cache_manager_1.CacheModule.registerAsync({
                useFactory: (customEnvService) => ({
                    stores: [
                        (0, redis_1.createKeyv)(`redis://${customEnvService.get('REDIS_HOST')}:${customEnvService.get('REDIS_PORT')}`),
                    ],
                    isGlobal: true,
                }),
                inject: [custom_env_service_1.CustomEnvService],
            }),
        ],
        providers: [cache_repository_1.CacheRepository, cache_service_1.CacheService],
        exports: [cache_service_1.CacheService],
    })
], CacheModule);
//# sourceMappingURL=cache.module.js.map