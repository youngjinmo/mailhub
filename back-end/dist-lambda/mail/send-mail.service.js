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
var SendMailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendMailService = void 0;
const common_1 = require("@nestjs/common");
const custom_env_service_1 = require("../config/custom-env.service");
const mailgun_service_1 = require("src/mail/mailgun.service");
const ses_service_1 = require("src/aws/ses/ses.service");
let SendMailService = SendMailService_1 = class SendMailService {
    constructor(mailgunService, sesService, customEnvService) {
        this.mailgunService = mailgunService;
        this.sesService = sesService;
        this.customEnvService = customEnvService;
        this.logger = new common_1.Logger(SendMailService_1.name);
        this.fromEmail = customEnvService.get('NO_REPLY_ADDRESS');
        this.contactMail = customEnvService.get('CONTACT_ADDRESS');
    }
    async sendVerificationCodeForNewUser(username, code) {
        const appName = this.customEnvService.get('APP_NAME');
        const subject = `[${appName}] Welcome! Here's your verification code`;
        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .welcome { background-color: #895BF5; color: white; padding: 20px; border-radius: 5px; text-align: center; margin-bottom: 20px; }
        .code { font-size: 32px; font-weight: bold; color: #895BF5; text-align: center; padding: 20px; background-color: #f8f9fa; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="welcome">
            <h2>Welcome to ${appName}!</h2>
        </div>
        <p>Hello,</p>
        <p>We're excited to have you join us! Let's get you started with protecting your email privacy.</p>
        <p>Your verification code is:</p>
        <div class="code">${code}</div>
        <p>This code will expire in <strong>5 minutes</strong>.</p>
        <p>If you did not request this code, please ignore this email.</p>
        <div class="footer">
            <p>Best regards,<br>${appName} Team</p>
        </div>
    </div>
</body>
</html>
    `.trim();
        const textBody = `
Welcome to ${appName}!

Hello,

We're excited to have you join us! Let's get you started with protecting your email privacy.

Your verification code is: ${code}

This code will expire in 5 minutes.

If you did not request this code, please ignore this email.

Best regards,
${appName} Team
    `.trim();
        await this.sendMail({
            to: username,
            from: this.fromEmail,
            subject,
            htmlBody,
            textBody,
        });
    }
    async sendVerificationCodeForReturningUser(username, code) {
        const appName = this.customEnvService.get('APP_NAME');
        const subject = `[${appName}] Welcome back! Here's your verification code`;
        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .welcome-back { background-color: #895BF5; color: white; padding: 20px; border-radius: 5px; text-align: center; margin-bottom: 20px; }
        .code { font-size: 32px; font-weight: bold; color: #895BF5; text-align: center; padding: 20px; background-color: #f8f9fa; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="welcome-back">
            <h2>Welcome Back!</h2>
        </div>
        <p>Hello,</p>
        <p>Great to see you again! Here's your verification code to continue:</p>
        <div class="code">${code}</div>
        <p>This code will expire in <strong>5 minutes</strong>.</p>
        <p>If you did not request this code, please ignore this email.</p>
        <div class="footer">
            <p>Best regards,<br>${appName} Team</p>
        </div>
    </div>
</body>
</html>
    `.trim();
        const textBody = `
Welcome Back!

Hello,

Great to see you again! Here's your verification code to continue:

Your verification code is: ${code}

This code will expire in 5 minutes.

If you did not request this code, please ignore this email.

Best regards,
${appName} Team
    `.trim();
        await this.sendMail({
            to: username,
            from: this.fromEmail,
            subject,
            htmlBody,
            textBody,
        });
    }
    async sendWelcomeEmail(username) {
        const subject = `Welcome to ${this.customEnvService.get('APP_NAME')}!`;
        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .welcome { background-color: #007bff; color: white; padding: 30px; border-radius: 5px; text-align: center; }
        .content { padding: 20px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="welcome">
            <h1>Welcome to ${this.customEnvService.get('APP_NAME')}!</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>Your account has been successfully created. You can now start using our email relay service to protect your privacy.</p>
            <p>Thank you for choosing ${this.customEnvService.get('APP_NAME')}!</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>${this.customEnvService.get('APP_NAME')} Team</p>
        </div>
    </div>
</body>
</html>
    `.trim();
        const textBody = `
Welcome to ${this.customEnvService.get('APP_NAME')}!

Hello,

Your account has been successfully created. You can now start using our email relay service to protect your privacy.

Thank you for choosing ${this.customEnvService.get('APP_NAME')}!

Best regards,
${this.customEnvService.get('APP_NAME')} Team
    `.trim();
        await this.sendMail({
            to: username,
            from: this.fromEmail,
            subject,
            htmlBody,
            textBody,
        });
    }
    async sendUsernameChangeVerificationCode(newEmail, code) {
        const subject = `[${this.customEnvService.get('APP_NAME')}] Verify Your New Email Address`;
        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .code { font-size: 32px; font-weight: bold; color: #007bff; text-align: center; padding: 20px; background-color: #f8f9fa; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Email Address Change Verification</h2>
        <p>Hello,</p>
        <p>You have requested to change your primary email address. Please enter the following verification code to complete the process:</p>
        <div class="code">${code}</div>
        <p>This code will expire in <strong>5 minutes</strong>.</p>
        <p>If you did not request this change, please ignore this email and your email address will remain unchanged.</p>
        <div class="footer">
            <p>Best regards,<br>${this.customEnvService.get('APP_NAME')} Team</p>
        </div>
    </div>
</body>
</html>
    `.trim();
        const textBody = `
Email Address Change Verification

Hello,

You have requested to change your primary email address. Please enter the following verification code to complete the process:

${code}

This code will expire in 5 minutes.

If you did not request this change, please ignore this email and your email address will remain unchanged.

Best regards,
${this.customEnvService.get('APP_NAME')} Team
    `.trim();
        await this.sendMail({
            to: newEmail,
            from: this.fromEmail,
            subject,
            htmlBody,
            textBody,
        });
    }
    async sendUsernameChangedNotification(oldEmail, newEmail) {
        const subject = `[${this.customEnvService.get('APP_NAME')}] Email Address Changed`;
        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Email Address Successfully Changed</h2>
        <p>Hello,</p>
        <p>This is to notify you that your primary email address has been successfully changed.</p>
        <div class="warning">
            <p><strong>Old email:</strong> ${oldEmail}</p>
            <p><strong>New email:</strong> ${newEmail}</p>
        </div>
        <p>All relay emails will now forward to your new email address.</p>
        <p>If you did not make this change, please contact our <a href="mailto:${this.contactMail}">support team</a> immediately.</p>
        <div class="footer">
            <p>Best regards,<br>${this.customEnvService.get('APP_NAME')} Team</p>
        </div>
    </div>
</body>
</html>
    `.trim();
        const textBody = `
Email Address Successfully Changed

Hello,

This is to notify you that your primary email address has been successfully changed.

Old email: ${oldEmail}
New email: ${newEmail}

All relay emails will now forward to your new email address.

If you did not make this change, please contact our <a href="mailto:${this.contactMail}">support team</a> immediately.

Best regards,
${this.customEnvService.get('APP_NAME')} Team
    `.trim();
        await this.sendMail({
            to: oldEmail,
            from: this.fromEmail,
            subject,
            htmlBody,
            textBody,
        });
    }
    async sendMail(dto) {
        if (this.customEnvService.get('NODE_ENV') === 'production') {
            await this.mailgunService.sendEmail(dto);
        }
        else {
            await this.sesService.sendEmail(dto);
        }
    }
};
exports.SendMailService = SendMailService;
exports.SendMailService = SendMailService = SendMailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mailgun_service_1.MailgunService,
        ses_service_1.SesService,
        custom_env_service_1.CustomEnvService])
], SendMailService);
//# sourceMappingURL=send-mail.service.js.map