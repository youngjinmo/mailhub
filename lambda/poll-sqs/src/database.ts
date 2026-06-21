import { randomUUID } from 'node:crypto';
import mysql, { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { Config } from './config';
import { Protection } from './crypto';

interface RelayRow extends RowDataPacket {
  primary_email: string;
  is_active: number | boolean;
}

interface ReplyRow extends RowDataPacket {
  sender_address: string;
  receiver_address: string;
}

interface MysqlError {
  code?: string;
}

export class Database {
  private readonly pool: Pool;

  constructor(
    config: Config['database'],
    private readonly protection: Protection,
  ) {
    this.pool = mysql.createPool({
      host: config.host,
      port: config.port,
      database: config.name,
      user: config.username,
      password: config.password,
      connectionLimit: 2,
      enableKeepAlive: true,
      waitForConnections: true,
    });
  }

  async findRelayAddress(relayAddress: string): Promise<{ primaryAddress: string; active: boolean } | null> {
    const [rows] = await this.pool.execute<RelayRow[]>(
      'SELECT primary_email, is_active FROM relay_emails WHERE relay_email = ? AND paused_at IS NULL LIMIT 1',
      [relayAddress],
    );
    const row = rows[0];
    return row
      ? { primaryAddress: this.protection.decrypt(row.primary_email), active: Boolean(row.is_active) }
      : null;
  }

  async findReplyAddress(replyAddress: string): Promise<{ sender: string; receiver: string } | null> {
    const [rows] = await this.pool.execute<ReplyRow[]>(
      'SELECT sender_address, receiver_address FROM reply_maskings WHERE reply_address = ? LIMIT 1',
      [replyAddress],
    );
    const row = rows[0];
    return row
      ? {
          sender: this.protection.decrypt(row.sender_address),
          receiver: this.protection.decrypt(row.receiver_address),
        }
      : null;
  }

  async findOrCreateReplyAddress(sender: string, receiver: string, domain: string): Promise<string> {
    const replyAddress = `reply-${this.protection.hash(`${sender}:${receiver}`)}@${domain}`;
    const existing = await this.findReplyAddress(replyAddress);
    if (existing) {
      return replyAddress;
    }

    await this.pool.execute(
      `INSERT INTO reply_maskings
        (reply_address, sender_address, sender_address_hash, receiver_address, receiver_address_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [
        replyAddress,
        this.protection.encrypt(sender),
        this.protection.hash(sender),
        this.protection.encrypt(receiver),
        this.protection.hash(receiver),
      ],
    );
    return replyAddress;
  }

  async incrementForwardCount(relayAddress: string): Promise<void> {
    await this.pool.execute(
      `UPDATE relay_emails
       SET forward_count = forward_count + 1, last_forwarded_at = CURRENT_TIMESTAMP
       WHERE relay_email = ?`,
      [relayAddress],
    );
  }

  async acquireProcessing(
    idempotencyKey: string,
    bucket: string,
    objectKey: string,
  ): Promise<string | null> {
    const processingToken = randomUUID();
    try {
      await this.pool.execute(
        `INSERT INTO email_forwarding_attempts
          (idempotency_key, bucket_name, object_key, status, processing_token, lease_expires_at, attempts)
         VALUES (?, ?, ?, 'PROCESSING', ?, DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL 10 MINUTE), 1)`,
        [idempotencyKey, bucket, objectKey, processingToken],
      );
      return processingToken;
    } catch (error) {
      if ((error as MysqlError).code !== 'ER_DUP_ENTRY') {
        throw error;
      }
    }

    const [result] = await this.pool.execute<ResultSetHeader>(
      `UPDATE email_forwarding_attempts
       SET processing_token = ?,
           lease_expires_at = DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL 10 MINUTE),
           attempts = attempts + 1
       WHERE idempotency_key = ?
         AND status = 'PROCESSING'
         AND lease_expires_at <= CURRENT_TIMESTAMP(6)`,
      [processingToken, idempotencyKey],
    );
    return result.affectedRows === 1 ? processingToken : null;
  }

  async completeProcessing(idempotencyKey: string, processingToken: string): Promise<void> {
    const [result] = await this.pool.execute<ResultSetHeader>(
      `UPDATE email_forwarding_attempts
       SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP(6), lease_expires_at = NULL
       WHERE idempotency_key = ? AND status = 'PROCESSING' AND processing_token = ?`,
      [idempotencyKey, processingToken],
    );
    if (result.affectedRows !== 1) {
      throw new Error(`Email forwarding claim was lost before completion: ${idempotencyKey}`);
    }
  }

  async releaseProcessing(idempotencyKey: string, processingToken: string): Promise<void> {
    await this.pool.execute(
      `UPDATE email_forwarding_attempts
       SET lease_expires_at = CURRENT_TIMESTAMP(6)
       WHERE idempotency_key = ? AND status = 'PROCESSING' AND processing_token = ?`,
      [idempotencyKey, processingToken],
    );
  }
}
