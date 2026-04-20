import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddForwardEventsTable1771700000000 implements MigrationInterface {
  name = 'AddForwardEventsTable1771700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`forward_events\` (
        \`id\` bigint NOT NULL AUTO_INCREMENT,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`relay_email_id\` bigint NOT NULL,
        INDEX \`idx_forward_events_relay_email_id\` (\`relay_email_id\`),
        INDEX \`idx_forward_events_created_at\` (\`created_at\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      ALTER TABLE \`forward_events\`
      ADD CONSTRAINT \`FK_forward_events_relay_email\`
      FOREIGN KEY (\`relay_email_id\`) REFERENCES \`relay_emails\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `forward_events` DROP FOREIGN KEY `FK_forward_events_relay_email`',
    );
    await queryRunner.query('DROP TABLE `forward_events`');
  }
}
