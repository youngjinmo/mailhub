import { SQSEvent, SQSRecord } from 'aws-lambda';
import { createHandler } from './handler';

function message(messageId: string, key: string): SQSRecord {
  return {
    messageId,
    body: JSON.stringify({
      Records: [{ s3: { bucket: { name: 'emails' }, object: { key } } }],
    }),
  } as SQSRecord;
}

function messageWithRecords(messageId: string, keys: string[]): SQSRecord {
  return {
    messageId,
    body: JSON.stringify({
      Records: keys.map((key) => ({ s3: { bucket: { name: 'emails' }, object: { key } } })),
    }),
  } as SQSRecord;
}

describe('createHandler', () => {
  it('returns only failed SQS messages for partial batch retry', async () => {
    const handler = createHandler({
      process: jest.fn(async (record) => {
        if (record.s3.object.key === 'failed') {
          throw new Error('failed');
        }
      }),
    });

    const response = await handler({
      Records: [message('success-id', 'success'), message('failed-id', 'failed')],
    } as SQSEvent);

    expect(response).toEqual({ batchItemFailures: [{ itemIdentifier: 'failed-id' }] });
  });

  it('waits for every S3 record before failing a message', async () => {
    const processed: string[] = [];

    const handler = createHandler({
      process: jest.fn(async (record) => {
        processed.push(record.s3.object.key);

        if (record.s3.object.key === 'failed') {
          throw new Error('failed');
        }
      }),
    });

    const response = await handler({
      Records: [messageWithRecords('failed-id', ['failed', 'success'])],
    } as SQSEvent);

    expect(response).toEqual({ batchItemFailures: [{ itemIdentifier: 'failed-id' }] });
    expect(processed).toEqual(['failed', 'success']);
  });
});
