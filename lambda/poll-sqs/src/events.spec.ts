import { getS3RecordId, parseS3Event } from './events';

const s3Event = {
  Records: [{ s3: { bucket: { name: 'emails' }, object: { key: 'inbox%2Fmessage' } } }],
};

describe('parseS3Event', () => {
  it('parses a direct S3 event', () => {
    expect(parseS3Event(JSON.stringify(s3Event))).toEqual(s3Event.Records);
  });

  it('parses an SNS-wrapped S3 event', () => {
    expect(parseS3Event(JSON.stringify({ Message: JSON.stringify(s3Event) }))).toEqual(
      s3Event.Records,
    );
  });

  it('rejects an unsupported payload', () => {
    expect(() => parseS3Event('{}')).toThrow('does not contain S3 event records');
  });

  it('creates a stable record id and distinguishes object versions', () => {
    const record = s3Event.Records[0];
    expect(getS3RecordId(record)).toBe(getS3RecordId(record));
    expect(getS3RecordId(record)).not.toBe(
      getS3RecordId({
        ...record,
        s3: { ...record.s3, object: { ...record.s3.object, sequencer: 'next-version' } },
      }),
    );
  });
});
