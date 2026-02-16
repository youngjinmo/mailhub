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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const subscription_tier_enum_1 = require("../../common/enums/subscription-tier.enum");
const relay_email_entity_1 = require("../../relay-emails/entities/relay-email.entity");
const user_enums_1 = require("../user.enums");
let User = class User {
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint' }),
    __metadata("design:type", BigInt)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'char',
        length: 64,
        unique: true,
        name: 'username_hash',
    }),
    __metadata("design:type", String)
], User.prototype, "usernameHash", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
        enum: user_enums_1.UserRole,
        default: user_enums_1.UserRole.USER,
        name: 'role',
    }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
        enum: user_enums_1.UserStatus,
        default: user_enums_1.UserStatus.ACTIVE,
        name: 'status',
    }),
    __metadata("design:type", String)
], User.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: subscription_tier_enum_1.SubscriptionTier,
        default: subscription_tier_enum_1.SubscriptionTier.FREE,
        name: 'subscription_tier',
    }),
    __metadata("design:type", String)
], User.prototype, "subscriptionTier", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'datetime' }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'datetime' }),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'deactivated_at',
        type: 'datetime',
        nullable: true,
    }),
    __metadata("design:type", Object)
], User.prototype, "deactivatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'deleted_at',
        type: 'datetime',
        nullable: true,
    }),
    __metadata("design:type", Object)
], User.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'last_logined_at',
        type: 'datetime',
        nullable: true,
    }),
    __metadata("design:type", Object)
], User.prototype, "lastLoginedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'gh_oauth',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], User.prototype, "githubOAuth", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'aapl_oauth',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], User.prototype, "appleOAuth", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'goog_oauth',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], User.prototype, "googleOAuth", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'gh_oauth_token',
        type: 'varchar',
        length: 512,
        nullable: true,
    }),
    __metadata("design:type", Object)
], User.prototype, "githubOAuthToken", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'goog_oauth_token',
        type: 'varchar',
        length: 512,
        nullable: true,
    }),
    __metadata("design:type", Object)
], User.prototype, "googleOAuthToken", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => relay_email_entity_1.RelayEmail, (relayEmail) => relayEmail.user),
    __metadata("design:type", Array)
], User.prototype, "relayEmails", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=user.entity.js.map