import { Injectable, Logger } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { CustomEnvService } from '../../config/custom-env.service';

@Injectable()
export class SesService {
  private readonly logger = new Logger(SesService.name);
  private sesClient: SESClient;
  private fromEmail: string;

  constructor(private customEnvService: CustomEnvService) {
    const region = this.customEnvService.getString('AWS_REGION');
    const accessKeyId = this.customEnvService.getString('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.customEnvService.getString('AWS_SECRET_ACCESS_KEY');
    const fromEmail = this.customEnvService.getString('AWS_SES_FROM_EMAIL');

    this.sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this.fromEmail = fromEmail;
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    const command = new SendEmailCommand({
      Source: this.fromEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Text: {
            Data: body,
            Charset: 'UTF-8',
          },
        },
      },
    });

    try {
      await this.sesClient.send(command);
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw error;
    }
  }

  async sendHtmlEmail(
    to: string,
    subject: string,
    htmlBody: string,
  ): Promise<void> {
    const command = new SendEmailCommand({
      Source: this.fromEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
        },
      },
    });

    try {
      await this.sesClient.send(command);
      this.logger.log(`HTML email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send HTML email to ${to}`, error);
      throw error;
    }
  }

  async sendMixedEmail(
    to: string,
    subject: string,
    textBody: string,
    htmlBody: string,
  ): Promise<void> {

    const command = new SendEmailCommand({
      Source: this.fromEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Text: {
            Data: textBody,
            Charset: 'UTF-8',
          },
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
        },
      },
    });

    try {
      await this.sesClient.send(command);
      this.logger.log(`Mixed email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send mixed email to ${to}`, error);
      throw error;
    }
  }
}
