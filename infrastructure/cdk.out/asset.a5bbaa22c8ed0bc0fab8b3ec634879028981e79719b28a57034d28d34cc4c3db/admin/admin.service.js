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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/entities/user.entity");
const relay_email_entity_1 = require("../relay-emails/entities/relay-email.entity");
let AdminService = class AdminService {
    constructor(userRepository, relayEmailRepository) {
        this.userRepository = userRepository;
        this.relayEmailRepository = relayEmailRepository;
    }
    async getDashboardStats() {
        const now = new Date();
        const days28Ago = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
        const days7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const [totalUsers, usersLast28Days, usersLast7Days, totalRelayEmails, relayEmailsLast28Days, relayEmailsLast7Days, totalForwardCount, forwardCountLast28Days, forwardCountLast7Days,] = await Promise.all([
            this.userRepository.count(),
            this.userRepository.count({
                where: { createdAt: (0, typeorm_2.MoreThanOrEqual)(days28Ago) },
            }),
            this.userRepository.count({
                where: { createdAt: (0, typeorm_2.MoreThanOrEqual)(days7Ago) },
            }),
            this.relayEmailRepository.count(),
            this.relayEmailRepository.count({
                where: { createdAt: (0, typeorm_2.MoreThanOrEqual)(days28Ago) },
            }),
            this.relayEmailRepository.count({
                where: { createdAt: (0, typeorm_2.MoreThanOrEqual)(days7Ago) },
            }),
            this.relayEmailRepository
                .createQueryBuilder('re')
                .select('COALESCE(SUM(re.forward_count), 0)', 'total')
                .getRawOne()
                .then((result) => Number(result.total)),
            this.relayEmailRepository
                .createQueryBuilder('re')
                .select('COALESCE(SUM(re.forward_count), 0)', 'total')
                .where('re.last_forwarded_at >= :date', { date: days28Ago })
                .getRawOne()
                .then((result) => Number(result.total)),
            this.relayEmailRepository
                .createQueryBuilder('re')
                .select('COALESCE(SUM(re.forward_count), 0)', 'total')
                .where('re.last_forwarded_at >= :date', { date: days7Ago })
                .getRawOne()
                .then((result) => Number(result.total)),
        ]);
        return {
            users: {
                total: totalUsers,
                last28Days: usersLast28Days,
                last7Days: usersLast7Days,
            },
            relayEmails: {
                total: totalRelayEmails,
                last28Days: relayEmailsLast28Days,
                last7Days: relayEmailsLast7Days,
            },
            forwardCount: {
                total: totalForwardCount,
                last28Days: forwardCountLast28Days,
                last7Days: forwardCountLast7Days,
            },
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(relay_email_entity_1.RelayEmail)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AdminService);
//# sourceMappingURL=admin.service.js.map