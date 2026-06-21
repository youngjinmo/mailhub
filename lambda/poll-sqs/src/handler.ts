import { SQSBatchResponse, SQSEvent } from 'aws-lambda';
import { parseS3Event, S3EventRecord } from './events';

export interface RecordProcessor {
  process(record: S3EventRecord): Promise<void>;
}

export function createHandler(processor: RecordProcessor) {
  return async (event: SQSEvent): Promise<SQSBatchResponse> => {
    const failures: SQSBatchResponse['batchItemFailures'] = [];

    await Promise.all(
      event.Records.map(async (message) => {
        try {
          const records = parseS3Event(message.body);
          const results = await Promise.allSettled(records.map((record) => processor.process(record)));

          const rejected = results.find((result) => result.status === 'rejected');
          if (rejected) {
            throw rejected.reason;
          }

          console.info('SQS message processed', { messageId: message.messageId });
        } catch (error) {
          console.error('SQS message processing failed', { messageId: message.messageId, error });
          failures.push({ itemIdentifier: message.messageId });
        }
      }),
    );

    return { batchItemFailures: failures };
  };
}
