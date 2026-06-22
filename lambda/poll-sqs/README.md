# Mailhub inbound email Lambda

This package handles inbound email forwarding through:

`SES -> S3/SNS -> SQS -> Lambda -> RDS -> Mailgun or SES`

The SAM stack creates the Lambda function, attaches the existing processing
queue as its event source, and creates the required IAM permissions. Reusing the
existing queue preserves queued messages and avoids duplicate SNS fan-out during
the worker-to-Lambda cutover.

Production uses Mailgun. Other environments send through SES.

## Local verification

```bash
# Node.js 22 and AWS SAM CLI are required.
npm ci
npm test
npm run build
sam validate --lint
sam build
```

The Lambda must run in subnets that can reach RDS and, for production Mailgun
delivery, the public internet through NAT. S3 access also requires NAT or an S3
VPC endpoint. Sensitive values are passed as CloudFormation parameters and
stored as Lambda environment variables.

Before the first production deployment, set `AWS_EMAIL_SQS_QUEUE_ARN` and
`AWS_EMAIL_SQS_QUEUE_URL` to the queue currently polled by `mailhub-worker`. Its
dead-letter queue policy remains managed outside this stack. The deployment
workflow raises its visibility timeout, runs database migrations, deploys the
Lambda against that queue, and leaves the existing worker running during the
initial verification period.

After confirming successful Lambda forwarding and stable queue metrics, set the
GitHub environment variable `RETIRE_POLLING_WORKER=true`. The next successful
deployment removes the retired `mailhub-worker` PM2 process.
