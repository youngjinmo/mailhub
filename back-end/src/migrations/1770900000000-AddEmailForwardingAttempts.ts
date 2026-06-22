import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailForwardingAttempts1770900000000 implements MigrationInterface {
  name = 'AddEmailForwardingAttempts1770900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`email_forwarding_attempts\` (
        \`idempotency_key\` char(64) NOT NULL,
        \`bucket_name\` varchar(255) NOT NULL,
        \`object_key\` varchar(1024) NOT NULL,
        \`status\` varchar(16) NOT NULL,
        \`processing_token\` char(36) NOT NULL,
        \`lease_expires_at\` datetime(6) NULL,
        \`attempts\` int unsigned NOT NULL DEFAULT 1,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`completed_at\` datetime(6) NULL,
        PRIMARY KEY (\`idempotency_key\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`email_forwarding_attempts\``);
  }
}
