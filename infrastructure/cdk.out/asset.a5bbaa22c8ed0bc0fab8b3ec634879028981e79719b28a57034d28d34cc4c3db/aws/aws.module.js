"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsModule = void 0;
const common_1 = require("@nestjs/common");
const ses_service_1 = require("./ses/ses.service");
const s3_service_1 = require("./s3/s3.service");
const sqs_service_1 = require("./sqs/sqs.service");
let AwsModule = class AwsModule {
};
exports.AwsModule = AwsModule;
exports.AwsModule = AwsModule = __decorate([
    (0, common_1.Module)({
        providers: [ses_service_1.SesService, s3_service_1.S3Service, sqs_service_1.SqsService],
        exports: [ses_service_1.SesService, s3_service_1.S3Service, sqs_service_1.SqsService],
    })
], AwsModule);
//# sourceMappingURL=aws.module.js.map