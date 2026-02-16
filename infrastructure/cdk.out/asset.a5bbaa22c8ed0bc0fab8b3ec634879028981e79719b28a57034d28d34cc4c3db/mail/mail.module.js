"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailModule = void 0;
const common_1 = require("@nestjs/common");
const send_mail_service_1 = require("./send-mail.service");
const mailgun_service_1 = require("./mailgun.service");
const aws_module_1 = require("src/aws/aws.module");
const custom_env_service_1 = require("src/config/custom-env.service");
let MailModule = class MailModule {
};
exports.MailModule = MailModule;
exports.MailModule = MailModule = __decorate([
    (0, common_1.Module)({
        imports: [aws_module_1.AwsModule],
        providers: [custom_env_service_1.CustomEnvService, send_mail_service_1.SendMailService, mailgun_service_1.MailgunService],
        exports: [send_mail_service_1.SendMailService],
    })
], MailModule);
//# sourceMappingURL=mail.module.js.map