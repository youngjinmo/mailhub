"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddOAuthTokenColumns1770700000000 = void 0;
class AddOAuthTokenColumns1770700000000 {
    constructor() {
        this.name = 'AddOAuthTokenColumns1770700000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`gh_oauth_token\` varchar(512) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`goog_oauth_token\` varchar(512) NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`goog_oauth_token\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`gh_oauth_token\``);
    }
}
exports.AddOAuthTokenColumns1770700000000 = AddOAuthTokenColumns1770700000000;
//# sourceMappingURL=1770700000000-AddOAuthTokenColumns.js.map