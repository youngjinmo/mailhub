"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const config_module_1 = require("./config/config.module");
const cache_module_1 = require("./cache/cache.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const relay_emails_module_1 = require("./relay-emails/relay-emails.module");
const aws_module_1 = require("./aws/aws.module");
const admin_module_1 = require("./admin/admin.module");
const user_entity_1 = require("./users/entities/user.entity");
const relay_email_entity_1 = require("./relay-emails/entities/relay-email.entity");
const auth_guard_1 = require("./common/guards/auth.guard");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            schedule_1.ScheduleModule.forRoot(),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'mysql',
                host: process.env.DATABASE_HOST,
                port: parseInt(process.env.DATABASE_PORT || '3306'),
                database: process.env.DATABASE_NAME,
                username: process.env.DATABASE_USERNAME,
                password: process.env.DATABASE_PASSWORD,
                entities: [user_entity_1.User, relay_email_entity_1.RelayEmail],
                synchronize: false,
                logging: process.env.NODE_ENV === 'production',
            }),
            config_module_1.ConfigModule,
            cache_module_1.CacheModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            relay_emails_module_1.RelayEmailsModule,
            aws_module_1.AwsModule,
            admin_module_1.AdminModule,
        ],
        controllers: [],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: auth_guard_1.AuthGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map