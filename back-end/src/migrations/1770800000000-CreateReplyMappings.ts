import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReplyMappings1770800000000 implements MigrationInterface {
  name = 'CreateReplyMappings1770800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`reply_mappings\` (
        \`id\` bigint AUTO_INCREMENT PRIMARY KEY,
        \`reply_address\` varchar(255) NOT NULL,
        \`relay_email_id\` bigint NOT NULL,
        \`original_sender_encrypted\` text NOT NULL,
        \`original_sender_hash\` char(64) NOT NULL,
        \`user_id\` bigint NOT NULL,
        \`created_at\` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
        \`last_used_at\` datetime(6) NULL,
        UNIQUE KEY \`uk_relay_sender\` (\`relay_email_id\`, \`original_sender_hash\`),
        INDEX \`idx_reply_address\` (\`reply_address\`),
        FOREIGN KEY (\`relay_email_id\`) REFERENCES \`relay_emails\`(\`id\`),
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`reply_mappings\``);
  }
}
