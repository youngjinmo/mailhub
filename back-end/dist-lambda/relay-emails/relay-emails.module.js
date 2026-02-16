"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayEmailsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const relay_emails_controller_1 = require("./relay-emails.controller");
const relay_emails_service_1 = require("./relay-emails.service");
const relay_email_entity_1 = require("./entities/relay-email.entity");
const cache_module_1 = require("../cache/cache.module");
const users_module_1 = require("../users/users.module");
const aws_module_1 = require("../aws/aws.module");
const queue_poller_service_1 = require("./queue-poller.service");
const protection_util_1 = require("../common/utils/protection.util");
const config_module_1 = require("src/config/config.module");
const mail_module_1 = require("src/mail/mail.module");
let RelayEmailsModule = class RelayEmailsModule {
};
exports.RelayEmailsModule = RelayEmailsModule;
exports.RelayEmailsModule = RelayEmailsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([relay_email_entity_1.RelayEmail]),
            cache_module_1.CacheModule,
            users_module_1.UsersModule,
            aws_module_1.AwsModule,
            mail_module_1.MailModule,
            config_module_1.ConfigModule,
        ],
        controllers: [relay_emails_controller_1.RelayEmailsController],
        providers: [relay_emails_service_1.RelayEmailsService, queue_poller_service_1.QueuePollerService, protection_util_1.ProtectionUtil],
        exports: [relay_emails_service_1.RelayEmailsService],
    })
], RelayEmailsModule);
//# sourceMappingURL=relay-emails.module.js.map