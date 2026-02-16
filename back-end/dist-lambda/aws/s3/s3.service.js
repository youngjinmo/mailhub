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
var S3Service_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const custom_env_service_1 = require("../../config/custom-env.service");
let S3Service = S3Service_1 = class S3Service {
    constructor(customEnvService) {
        this.customEnvService = customEnvService;
        this.logger = new common_1.Logger(S3Service_1.name);
        const accessKeyId = this.customEnvService.get('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.customEnvService.get('AWS_SECRET_ACCESS_KEY');
        const region = this.customEnvService.get('AWS_REGION');
        this.s3Client = new client_s3_1.S3Client({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
        this.logger.log('S3 Service initialized');
    }
    async getObject(bucket, key) {
        try {
            this.logger.debug(`Fetching object from S3: s3://${bucket}/${key}`);
            const command = new client_s3_1.GetObjectCommand({
                Bucket: bucket,
                Key: key,
            });
            const response = await this.s3Client.send(command);
            if (!response.Body) {
                throw new Error('S3 object body is empty');
            }
            const stream = response.Body;
            const chunks = [];
            return new Promise((resolve, reject) => {
                stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
                stream.on('error', reject);
                stream.on('end', () => resolve(Buffer.concat(chunks)));
            });
        }
        catch (error) {
            this.logger.error(`Failed to get object from S3: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getObjectAsString(bucket, key) {
        const buffer = await this.getObject(bucket, key);
        return buffer.toString('utf-8');
    }
};
exports.S3Service = S3Service;
exports.S3Service = S3Service = S3Service_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [custom_env_service_1.CustomEnvService])
], S3Service);
//# sourceMappingURL=s3.service.js.map