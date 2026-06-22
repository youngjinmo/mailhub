import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';
import { createTransport } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { Readable } from 'node:stream';
import { Config } from './config';

export interface SendEmail {
  to: string;
  from: string;
  subject: string;
  replyTo?: string;
  resentFrom?: string;
  html?: string;
  text?: string;
  attachments?: Mail.Attachment[];
  messageId: string;
}

const ses = new SESClient({});

export class Mailer {
  constructor(private readonly config: Config) {}

  async send(message: SendEmail): Promise<void> {
    const raw = await this.createRawMessage(message);
    if (this.config.nodeEnv === 'production') {
      await this.sendViaMailgun(message.to, raw);
      return;
    }
    await ses.send(new SendRawEmailCommand({ RawMessage: { Data: raw } }));
  }

  private async createRawMessage(message: SendEmail): Promise<Buffer> {
    const transport = createTransport({ streamTransport: true, buffer: true });
    const headers: Record<string, string> = {};
    if (message.resentFrom) {
      headers['Resent-From'] = message.resentFrom;
    }
    const result = await transport.sendMail({
      from: message.from,
      to: message.to,
      replyTo: message.replyTo,
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments: message.attachments,
      messageId: message.messageId,
      headers,
    });
    if (Buffer.isBuffer(result.message)) {
      return result.message;
    }
    if (typeof result.message === 'string') {
      return Buffer.from(result.message);
    }
    return this.streamToBuffer(result.message);
  }

  private async sendViaMailgun(to: string, raw: Buffer): Promise<void> {
    if (!this.config.mailgun.apiKey) {
      throw new Error('MAILGUN_API_KEY is required in production');
    }
    const form = new FormData();
    form.append('to', to);
    form.append('message', new Blob([raw as unknown as BlobPart]), 'message.mime');
    const response = await fetch(
      `${this.config.mailgun.baseUrl}/v3/${this.config.appDomain}/messages.mime`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`api:${this.config.mailgun.apiKey}`).toString('base64')}`,
        },
        body: form,
      },
    );
    if (!response.ok) {
      throw new Error(`Mailgun API error ${response.status}: ${await response.text()}`);
    }
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
}
