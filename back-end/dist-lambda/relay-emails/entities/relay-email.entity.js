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
exports.RelayEmail = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
let RelayEmail = class RelayEmail {
};
exports.RelayEmail = RelayEmail;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint' }),
    __metadata("design:type", BigInt)
], RelayEmail.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', name: 'user_id' }),
    (0, typeorm_1.Index)('idx_user_id'),
    __metadata("design:type", BigInt)
], RelayEmail.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        name: 'primary_email',
    }),
    (0, typeorm_1.Index)('idx_primary_email'),
    __metadata("design:type", String)
], RelayEmail.prototype, "primaryEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        name: 'relay_email',
    }),
    (0, typeorm_1.Index)('idx_relay_email'),
    __metadata("design:type", String)
], RelayEmail.prototype, "relayEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], RelayEmail.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: true,
        name: 'is_active',
    }),
    __metadata("design:type", Boolean)
], RelayEmail.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'bigint',
        default: 0,
        name: 'forward_count',
    }),
    __metadata("design:type", BigInt)
], RelayEmail.prototype, "forwardCount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'datetime',
        nullable: true,
        name: 'last_forwarded_at',
    }),
    __metadata("design:type", Object)
], RelayEmail.prototype, "lastForwardedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'datetime' }),
    __metadata("design:type", Date)
], RelayEmail.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'datetime' }),
    __metadata("design:type", Date)
], RelayEmail.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({
        name: 'paused_at',
        type: 'datetime',
        nullable: true,
    }),
    __metadata("design:type", Object)
], RelayEmail.prototype, "pausedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.relayEmails, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], RelayEmail.prototype, "user", void 0);
exports.RelayEmail = RelayEmail = __decorate([
    (0, typeorm_1.Entity)('relay_emails')
], RelayEmail);
//# sourceMappingURL=relay-email.entity.js.map