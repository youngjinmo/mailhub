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
var RelayEmailsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayEmailsController = void 0;
const common_1 = require("@nestjs/common");
const relay_emails_service_1 = require("./relay-emails.service");
const users_service_1 = require("../users/users.service");
const create_custom_relay_dto_1 = require("./dto/create-custom-relay.dto");
const update_description_dto_1 = require("./dto/update-description.dto");
const update_active_status_dto_1 = require("./dto/update-active-status.dto");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let RelayEmailsController = RelayEmailsController_1 = class RelayEmailsController {
    constructor(relayEmailsService, usersService) {
        this.relayEmailsService = relayEmailsService;
        this.usersService = usersService;
        this.logger = new common_1.Logger(RelayEmailsController_1.name);
    }
    async getRelayEmails(user) {
        const relayEmails = await this.relayEmailsService.findByUser(user.userId);
        return relayEmails.map((relayEmail) => ({
            id: relayEmail.id.toString(),
            relayEmail: relayEmail.relayEmail,
            primaryEmail: relayEmail.primaryEmail,
            description: relayEmail.description,
            isActive: relayEmail.isActive,
            forwardCount: relayEmail.forwardCount.toString(),
            lastForwardedAt: relayEmail.lastForwardedAt,
            createdAt: relayEmail.createdAt,
        }));
    }
    async createRelayEmail(currentUser) {
        const userEntity = await this.usersService.findById(currentUser.userId);
        if (!userEntity) {
            throw new common_1.NotFoundException('User not found');
        }
        const relayEmailEntity = await this.relayEmailsService.generateRelayEmailAddress(userEntity);
        return {
            relayEmail: relayEmailEntity.relayEmail,
            isActive: relayEmailEntity.isActive,
            description: relayEmailEntity.description,
            createdAt: relayEmailEntity.createdAt,
        };
    }
    async createCustomRelayEmail(user, dto) {
        const userEntity = await this.usersService.findById(user.userId);
        if (!userEntity) {
            throw new common_1.NotFoundException('User not found');
        }
        const relayEmailEntity = await this.relayEmailsService.generateCustomRelayEmailAddress(userEntity, dto.customUsername);
        return {
            relayEmail: relayEmailEntity.relayEmail,
            isActive: relayEmailEntity.isActive,
            description: relayEmailEntity.description,
            createdAt: relayEmailEntity.createdAt,
        };
    }
    async updateDescription(user, id, dto) {
        const relayEmail = await this.relayEmailsService.updateDescription(BigInt(id), user.userId, dto.description);
        return {
            relayEmail: relayEmail.relayEmail,
            description: relayEmail.description,
        };
    }
    async updateActiveStatus(user, id, dto) {
        const relayEmail = await this.relayEmailsService.updateActiveStatus(BigInt(id), user.userId, dto.isActive);
        return {
            relayEmail: relayEmail.relayEmail,
            isActive: relayEmail.isActive,
        };
    }
};
exports.RelayEmailsController = RelayEmailsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RelayEmailsController.prototype, "getRelayEmails", null);
__decorate([
    (0, common_1.Post)('create'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RelayEmailsController.prototype, "createRelayEmail", null);
__decorate([
    (0, common_1.Post)('custom'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_custom_relay_dto_1.CreateCustomRelayDto]),
    __metadata("design:returntype", Promise)
], RelayEmailsController.prototype, "createCustomRelayEmail", null);
__decorate([
    (0, common_1.Patch)(':id/description'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_description_dto_1.UpdateDescriptionDto]),
    __metadata("design:returntype", Promise)
], RelayEmailsController.prototype, "updateDescription", null);
__decorate([
    (0, common_1.Patch)(':id/active'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_active_status_dto_1.UpdateActiveStatusDto]),
    __metadata("design:returntype", Promise)
], RelayEmailsController.prototype, "updateActiveStatus", null);
exports.RelayEmailsController = RelayEmailsController = RelayEmailsController_1 = __decorate([
    (0, common_1.Controller)('relay-emails'),
    __metadata("design:paramtypes", [relay_emails_service_1.RelayEmailsService,
        users_service_1.UsersService])
], RelayEmailsController);
//# sourceMappingURL=relay-emails.controller.js.map