import { Config } from './config';
import { Database } from './database';
import { Mailer } from './mailer';
import { EmailProcessor } from './processor';
import { Storage } from './storage';

const config: Config = {
  appName: 'Mailhub',
  appDomain: 'private-mailhub.com',
  nodeEnv: 'test',
  encryptionKey: 'unused',
  database: { host: '', port: 3306, name: '', username: '', password: '' },
  mailgun: { apiKey: '', baseUrl: '' },
};

function processorFor(rawEmail: string) {
  const database = {
    findRelayAddress: jest.fn(),
    findReplyAddress: jest.fn(),
    findOrCreateReplyAddress: jest.fn(),
    incrementForwardCount: jest.fn(),
    acquireProcessing: jest.fn().mockResolvedValue('processing-token'),
    completeProcessing: jest.fn(),
    releaseProcessing: jest.fn(),
  };
  const storage = { getObject: jest.fn().mockResolvedValue(Buffer.from(rawEmail)) };
  const mailer = { send: jest.fn() };
  const processor = new EmailProcessor(
    config,
    database as unknown as Database,
    storage as unknown as Storage,
    mailer as unknown as Mailer,
  );
  return { processor, database, mailer };
}

const record = {
  s3: { bucket: { name: 'emails' }, object: { key: 'message.eml' } },
};

describe('EmailProcessor', () => {
  it('forwards an active relay email and updates its count', async () => {
    const { processor, database, mailer } = processorFor(
      'From: sender@example.com\r\nTo: relay@private-mailhub.com\r\nSubject: Hello\r\n\r\nBody',
    );
    database.findRelayAddress.mockResolvedValue({
      primaryAddress: 'primary@example.com',
      active: true,
    });
    database.findOrCreateReplyAddress.mockResolvedValue('reply-token@private-mailhub.com');

    await processor.process(record);

    expect(mailer.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'primary@example.com',
        replyTo: 'reply-token@private-mailhub.com',
        subject: 'Hello',
        messageId: expect.stringMatching(/^<mailhub-[a-f0-9]{64}@private-mailhub\.com>$/),
      }),
    );
    expect(database.incrementForwardCount).toHaveBeenCalledWith('relay@private-mailhub.com');
    expect(database.completeProcessing).toHaveBeenCalled();
  });

  it('relays replies to the original sender', async () => {
    const { processor, database, mailer } = processorFor(
      'From: primary@example.com\r\nTo: reply-token@private-mailhub.com\r\nSubject: Re: Hello\r\n\r\nReply',
    );
    database.findReplyAddress.mockResolvedValue({
      sender: 'sender@example.com',
      receiver: 'relay@private-mailhub.com',
    });

    await processor.process(record);

    expect(mailer.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'sender@example.com',
        from: 'relay@private-mailhub.com',
      }),
    );
    expect(database.incrementForwardCount).toHaveBeenCalledWith('relay@private-mailhub.com');
    expect(database.completeProcessing).toHaveBeenCalled();
  });

  it('acknowledges inactive relay addresses without forwarding', async () => {
    const { processor, database, mailer } = processorFor(
      'From: sender@example.com\r\nTo: relay@private-mailhub.com\r\n\r\nBody',
    );
    database.findRelayAddress.mockResolvedValue({
      primaryAddress: 'primary@example.com',
      active: false,
    });

    await processor.process(record);

    expect(mailer.send).not.toHaveBeenCalled();
    expect(database.completeProcessing).toHaveBeenCalled();
  });

  it('skips an S3 record that is already claimed or completed', async () => {
    const { processor, database, mailer } = processorFor(
      'From: sender@example.com\r\nTo: relay@private-mailhub.com\r\n\r\nBody',
    );
    database.acquireProcessing.mockResolvedValue(null);

    await processor.process(record);

    expect(mailer.send).not.toHaveBeenCalled();
    expect(database.completeProcessing).not.toHaveBeenCalled();
  });

  it('releases the processing claim when forwarding fails', async () => {
    const { processor, database, mailer } = processorFor(
      'From: sender@example.com\r\nTo: relay@private-mailhub.com\r\n\r\nBody',
    );
    database.findRelayAddress.mockResolvedValue({
      primaryAddress: 'primary@example.com',
      active: true,
    });
    database.findOrCreateReplyAddress.mockResolvedValue('reply-token@private-mailhub.com');
    mailer.send.mockRejectedValue(new Error('send failed'));

    await expect(processor.process(record)).rejects.toThrow('send failed');

    expect(database.releaseProcessing).toHaveBeenCalled();
    expect(database.completeProcessing).not.toHaveBeenCalled();
  });
});
