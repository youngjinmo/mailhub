import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

const client = new S3Client({});

export class Storage {
  async getObject(bucket: string, key: string): Promise<Buffer> {
    const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!response.Body) {
      throw new Error(`S3 object body is empty: s3://${bucket}/${key}`);
    }
    return Buffer.from(await response.Body.transformToByteArray());
  }
}
