"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
BigInt.prototype['toJSON'] = function () {
    return this.toString();
};
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const isWorker = process.env.WORKER_MODE === 'true';
    if (!isWorker) {
        app.setGlobalPrefix('api');
        app.enableCors({
            origin: process.env.CORS_ORIGINS?.split(',') || [
                'http://localhost:3000',
                'http://localhost:8080',
            ],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
            allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
        });
        app.use((0, cookie_parser_1.default)());
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));
        app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
        app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
        const port = process.env.PORT || 8080;
        await app.listen(port);
        console.log(`🚀 Web Server is running on: http://localhost:${port}/api`);
    }
    else {
        await app.init();
        console.log(`⚙️  Worker started - SQS polling enabled`);
    }
}
bootstrap().catch((err) => {
    console.error('Failed to start application:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map