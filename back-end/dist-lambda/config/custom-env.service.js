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
exports.CustomEnvService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let CustomEnvService = class CustomEnvService {
    constructor(configService) {
        this.configService = configService;
    }
    get(key) {
        const value = this.configService.get(key);
        if (value === undefined || value === null) {
            throw new Error(`Environment variable ${key} is not defined`);
        }
        return value;
    }
    getWithDefault(key, def) {
        const value = this.configService.get(key);
        if (value === undefined || value === null) {
            return def;
        }
        return value;
    }
};
exports.CustomEnvService = CustomEnvService;
exports.CustomEnvService = CustomEnvService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CustomEnvService);
//# sourceMappingURL=custom-env.service.js.map