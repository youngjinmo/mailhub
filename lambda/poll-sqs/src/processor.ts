import { ParsedMail, simpleParser } from 'mailparser';
import Mail from 'nodemailer/lib/mailer';
import { Config } from './config';
import { Database } from './database';
import { getS3RecordId, S3EventRecord } from './events';
import { Mailer } from './mailer';
import { Storage } from './storage';

export class EmailProcessor {
  constructor(
    private readonly config: Config,
    private readonly database: Database,
    private readonly storage: Storage,
    private readonly mailer: Mailer,
  ) {}

  async process(record: S3EventRecord): Promise<void> {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    const idempotencyKey = getS3RecordId(record);
    const processingToken = await this.database.acquireProcessing(idempotencyKey, bucket, key);
    if (!processingToken) {
      console.info('Skipping previously claimed or completed S3 email', { bucket, key });
      return;
    }

    console.info('Processing S3 email', { bucket, key });
    try {
      await this.processClaimedRecord(record, key, idempotencyKey);
      await this.database.completeProcessing(idempotencyKey, processingToken);
    } catch (error) {
      try {
        await this.database.releaseProcessing(idempotencyKey, processingToken);
      } catch (releaseError) {
        console.error('Failed to release email forwarding claim', releaseError);
      }
      throw error;
    }
  }

  private async processClaimedRecord(
    record: S3EventRecord,
    key: string,
    idempotencyKey: string,
  ): Promise<void> {
    const mail = await simpleParser(await this.storage.getObject(record.s3.bucket.name, key));
    const recipient = this.getRecipient(mail);
    const messageId = `<mailhub-${idempotencyKey}@${this.config.appDomain}>`;

    if (recipient.startsWith('reply-')) {
      await this.forwardReply(recipient, mail, messageId);
      return;
    }
    await this.forwardIncoming(recipient, mail, messageId);
  }

  private async forwardIncoming(
    relayAddress: string,
    mail: ParsedMail,
    messageId: string,
  ): Promise<void> {
    const relay = await this.database.findRelayAddress(relayAddress);
    if (!relay || !relay.active) {
      console.info('Skipping unknown or inactive relay address', { relayAddress });
      return;
    }
    const sender = this.getSender(mail);
    let replyTo = relayAddress;
    try {
      replyTo = await this.database.findOrCreateReplyAddress(sender, relayAddress, this.config.appDomain);
    } catch (error) {
      console.error('Failed to create reply masking address; using relay address', error);
    }

    await this.mailer.send({
      to: relay.primaryAddress,
      from: `${sender} [via Mailhub] <${relayAddress}>`,
      resentFrom: relayAddress,
      replyTo,
      subject: mail.subject || '(No Subject)',
      html: this.forwardedHtml(sender, relayAddress, mail),
      attachments: this.attachments(mail),
      messageId,
    });
    await this.incrementForwardCount(relayAddress);
  }

  private async forwardReply(
    replyAddress: string,
    mail: ParsedMail,
    messageId: string,
  ): Promise<void> {
    const reply = await this.database.findReplyAddress(replyAddress);
    if (!reply) {
      console.info('Skipping unknown reply masking address', { replyAddress });
      return;
    }
    await this.mailer.send({
      to: reply.sender,
      from: reply.receiver,
      replyTo: reply.receiver,
      subject: mail.subject || '(No Subject)',
      html: typeof mail.html === 'string' ? mail.html : undefined,
      text: mail.text,
      attachments: this.attachments(mail),
      messageId,
    });
    await this.incrementForwardCount(reply.receiver);
  }

  private async incrementForwardCount(relayAddress: string): Promise<void> {
    try {
      await this.database.incrementForwardCount(relayAddress);
    } catch (error) {
      console.error('Failed to increment forwarding count', error);
    }
  }

  private getRecipient(mail: ParsedMail): string {
    const recipients = Array.isArray(mail.to) ? mail.to : mail.to ? [mail.to] : [];
    const recipient = recipients.flatMap((value) => value.value)[0]?.address;
    if (!recipient) {
      throw new Error('Recipient address not found');
    }
    return recipient;
  }

  private getSender(mail: ParsedMail): string {
    const sender = mail.from?.value[0]?.address;
    if (sender) {
      return sender;
    }
    const returnPath = String(mail.headers.get('return-path') ?? '');
    const match = returnPath.match(/<(.+?)>|([^\s<>]+@[^\s<>]+)/);
    if (!match) {
      throw new Error('Sender address not found');
    }
    return match[1] || match[2];
  }

  private attachments(mail: ParsedMail): Mail.Attachment[] {
    return (mail.attachments ?? []).map((attachment) => ({
      filename: attachment.filename || 'unnamed',
      content: attachment.content,
      contentType: attachment.contentType,
      contentDisposition: attachment.contentDisposition === 'inline' ? 'inline' : 'attachment',
      cid: attachment.cid,
    }));
  }

  private forwardedHtml(sender: string, relayAddress: string, mail: ParsedMail): string {
    const body =
      typeof mail.html === 'string'
        ? mail.html
        : mail.text
          ? `<pre style="white-space: pre-wrap; font-family: inherit;">${this.escapeHtml(mail.text)}</pre>`
          : '<p>(No content)</p>';
    return `<div style="padding:12px 16px;margin-bottom:20px;border:1px solid #e2e8f0;border-radius:8px">
      <strong>Forwarded by ${this.escapeHtml(this.config.appName)}</strong><br>
      From: ${this.escapeHtml(sender)}<br>To: ${this.escapeHtml(relayAddress)}
    </div>${body}`;
  }

  private escapeHtml(value: string): string {
    const chars: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return value.replace(/[&<>"']/g, (char) => chars[char]);
  }
}
