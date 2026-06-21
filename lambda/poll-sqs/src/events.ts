import crypto from 'node:crypto';

export interface S3EventRecord {
  s3: {
    bucket: { name: string };
    object: {
      key: string;
      versionId?: string;
      sequencer?: string;
    };
  };
}

interface S3Event {
  Records: S3EventRecord[];
}

export function parseS3Event(body: string): S3EventRecord[] {
  const parsed: unknown = JSON.parse(body);
  const envelope = asObject(parsed);
  const payload = typeof envelope.Message === 'string' ? JSON.parse(envelope.Message) : parsed;
  const event = asObject(payload) as Partial<S3Event>;

  if (!Array.isArray(event.Records)) {
    throw new Error('SQS message does not contain S3 event records');
  }

  return event.Records;
}

export function getS3RecordId(record: S3EventRecord): string {
  const objectVersion = record.s3.object.versionId ?? record.s3.object.sequencer ?? '';
  return crypto
    .createHash('sha256')
    .update(`${record.s3.bucket.name}\0${record.s3.object.key}\0${objectVersion}`)
    .digest('hex');
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected an object event payload');
  }
  return value as Record<string, unknown>;
}
