# Lambda SQS Worker Handler

This directory contains the AWS Lambda handler for processing incoming email notifications from SQS.

## Overview

The Lambda function replaces the PM2-based worker that polls SQS every 30 seconds. Instead, it uses **SQS Event Source Mapping** to trigger the Lambda automatically when messages arrive in the queue.

## Architecture

```
SES → S3 → SQS → Lambda (this handler) → RDS/Redis → SES (forward email)
```

## Handler Flow

1. **Event Reception**: Lambda receives batch of SQS messages (max 10)
2. **App Initialization**: NestJS app context is initialized (cached for warm starts)
3. **Parallel Processing**: All messages are processed in parallel
4. **Error Handling**: Failed messages are reported for retry via `batchItemFailures`
5. **Auto Deletion**: Successfully processed messages are automatically deleted by Lambda

## Key Features

- ✅ **Warm Start Optimization**: NestJS app is cached globally
- ✅ **Partial Batch Failure**: Failed messages are retried individually
- ✅ **Parallel Processing**: All messages in batch processed concurrently
- ✅ **Reuses Existing Logic**: Calls `RelayEmailsService.processMessage()`
- ✅ **Detailed Logging**: CloudWatch Logs with timing metrics

## Local Testing

You can test the handler locally using the sample event:

```bash
# Using ts-node
npx ts-node -r tsconfig-paths/register src/lambda/sqs-worker.handler.ts

# Or compile and run
npm run build:lambda
node dist-lambda/lambda/sqs-worker.handler.js
```

Sample event: `test-events/sqs-event.json`

## Environment Variables

The Lambda requires the same environment variables as the main app:

- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`
- `REDIS_HOST`, `REDIS_PORT`
- `AWS_REGION`, `AWS_S3_EMAIL_BUCKET`, `AWS_SES_FROM_EMAIL`
- `APP_NAME`, `APP_DOMAIN`
- `ENCRYPTION_KEY`

## Deployment

Deployed via AWS CDK in the `infrastructure/` directory.

See: `infrastructure/lib/mailhub-worker-stack.ts`

## Differences from PM2 Worker

| Aspect | PM2 Worker | Lambda |
|--------|-----------|--------|
| Trigger | Cron (30s interval) | SQS Event Source Mapping |
| Polling | `sqsService.receiveMessages()` | Automatic by Lambda |
| Message Deletion | Manual `sqsService.deleteMessage()` | Automatic by Lambda |
| Scaling | Single instance | Auto-scaling per message |
| Cost | Always running | Pay per execution |

## Monitoring

- **CloudWatch Logs**: `/aws/lambda/mailhub-email-worker`
- **Metrics**:
  - `Invocations`: Number of times Lambda invoked
  - `Duration`: Execution time
  - `Errors`: Failed invocations
  - `Throttles`: Rate limiting events

## Notes

- Lambda timeout: 60 seconds (sufficient for email processing)
- Memory: 512MB (same as PM2 worker)
- VPC: Must be in same VPC as RDS/Redis
- SQS Visibility Timeout: Should be > Lambda timeout (recommended: 90s)
