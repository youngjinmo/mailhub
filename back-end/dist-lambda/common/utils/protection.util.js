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
var ProtectionUtil_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtectionUtil = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const custom_env_service_1 = require("src/config/custom-env.service");
let ProtectionUtil = ProtectionUtil_1 = class ProtectionUtil {
    constructor(customEnvService) {
        this.logger = new common_1.Logger(ProtectionUtil_1.name);
        this.ENCRYPT_ALGORITHM = 'aes-256-gcm';
        this.HASH_ALGORITHM = 'sha256';
        this.ENCODE_ALGORITHM = 'base64';
        this.DIGEST = 'hex';
        this.IV_LENGTH = 16;
        this.SECRET_KEY = customEnvService.get('ENCRYPTION_KEY');
    }
    encrypt(plaintext) {
        try {
            const keyBuffer = Buffer.from(this.SECRET_KEY, this.ENCODE_ALGORITHM);
            if (keyBuffer.length !== 32) {
                throw new Error('Encryption key must be 32 bytes (256 bits)');
            }
            const iv = crypto.randomBytes(this.IV_LENGTH);
            const cipher = crypto.createCipheriv(this.ENCRYPT_ALGORITHM, keyBuffer, iv);
            let encrypted = cipher.update(plaintext, 'utf8', this.ENCODE_ALGORITHM);
            encrypted += cipher.final(this.ENCODE_ALGORITHM);
            const authTag = cipher.getAuthTag();
            return `${encrypted}:${iv.toString(this.ENCODE_ALGORITHM)}:${authTag.toString(this.ENCODE_ALGORITHM)}`;
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`Encryption failed: ${error.message}`);
        }
    }
    decrypt(encryptedData) {
        try {
            const keyBuffer = Buffer.from(this.SECRET_KEY, this.ENCODE_ALGORITHM);
            if (keyBuffer.length !== 32) {
                throw new Error('Encryption key must be 32 bytes (256 bits)');
            }
            const parts = encryptedData.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted data format. Expected: encrypted:iv:authTag');
            }
            const [encrypted, ivBase64, authTagBase64] = parts;
            const iv = Buffer.from(ivBase64, this.ENCODE_ALGORITHM);
            const authTag = Buffer.from(authTagBase64, this.ENCODE_ALGORITHM);
            const decipher = crypto.createDecipheriv(this.ENCRYPT_ALGORITHM, keyBuffer, iv);
            decipher.setAuthTag(authTag);
            let decrypted = decipher.update(encrypted, this.ENCODE_ALGORITHM, 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            this.logger.error(encryptedData, 'encryptedData');
            throw new Error(`Decryption failed: ${error.message}`);
        }
    }
    hash(plain) {
        return crypto
            .createHash(this.HASH_ALGORITHM)
            .update(plain)
            .digest(this.DIGEST);
    }
    generateKey() {
        return crypto.randomBytes(32).toString(this.ENCODE_ALGORITHM);
    }
};
exports.ProtectionUtil = ProtectionUtil;
exports.ProtectionUtil = ProtectionUtil = ProtectionUtil_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [custom_env_service_1.CustomEnvService])
], ProtectionUtil);
//# sourceMappingURL=protection.util.js.map