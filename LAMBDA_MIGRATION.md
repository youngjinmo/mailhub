# Lambda Migration Guide

This guide documents the migration of the SQS worker from PM2 to AWS Lambda.

## Overview

### Before (PM2 Worker)
```
PM2 Process → Cron (30s) → Poll SQS → Process → Delete Message
```

### After (Lambda)
```
SQS Event Source → Lambda (auto-triggered) → Process → Auto-delete
```

## Benefits

✅ **Cost Reduction**: Pay only for execution time (vs. always-running EC2)
✅ **Auto-scaling**: Scales automatically with queue depth
✅ **Simplified Operations**: No PM2 management, no cron jobs
✅ **Better Reliability**: Automatic retries and dead-letter queues
✅ **Faster Processing**: Real-time triggering (vs. 30-second polling)

## Architecture Changes

### Components

| Component | Before | After |
|-----------|--------|-------|
| **Trigger** | Cron schedule (30s) | SQS Event Source Mapping |
| **Polling** | Manual (`sqsService.receiveMessages()`) | Automatic by Lambda |
| **Scaling** | Single instance | Auto-scaling (up to 1000 concurrent) |
| **Message Deletion** | Manual (`sqsService.deleteMessage()`) | Automatic by Lambda |
| **Deployment** | PM2 on EC2 | Lambda via CDK |

### Code Changes

#### Lambda Handler (New)
```typescript
// back-end/src/lambda/sqs-worker.handler.ts
export const handler: SQSHandler = async (event: SQSEvent) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(RelayEmailsService);

  for (const record of event.Records) {
    await service.processMessage(record);
  }
};
```

#### RelayEmailsService (Modified)
```typescript
// Before: private
private async processMessage(message: Message): Promise<void>

// After: public (for Lambda to call)
async processMessage(message: Message): Promise<void>
```

## Deployment Steps

### 1. Prerequisites

- [ ] AWS CLI configured
- [ ] Node.js 18+ installed
- [ ] GitHub repository access
- [ ] Production environment variables

### 2. Build Lambda Function

```bash
cd back-end
npm run build:lambda
```

Verify build:
```bash
ls -lh dist-lambda/lambda/sqs-worker.handler.js
du -sh dist-lambda
```

### 3. Configure Infrastructure

```bash
cd infrastructure
cp .env.example .env
```

Edit `.env` with your values:
- Database credentials
- Redis endpoint
- VPC ID (if using VPC)
- Encryption key (must match backend)

### 4. Deploy with CDK (Manual)

```bash
cd infrastructure

# First time only
npm run bootstrap

# Preview changes
npm run diff

# Deploy
export $(cat .env | xargs) && npm run deploy
```

### 5. Set Up GitHub Actions (Recommended)

1. Configure GitHub Secrets:
   ```bash
   # See .github/SECRETS.md for full list
   gh secret set AWS_ACCESS_KEY_ID -b "YOUR_KEY"
   gh secret set AWS_SECRET_ACCESS_KEY -b "YOUR_SECRET"
   # ... (set all required secrets)
   ```

2. Push to main branch to trigger deployment:
   ```bash
   git add .
   git commit -m "Add Lambda worker"
   git push origin main
   ```

3. Monitor deployment:
   - Go to **Actions** tab in GitHub
   - Watch the "Deploy Lambda Worker" workflow

### 6. Verify Deployment

```bash
# Check Lambda function
aws lambda get-function --function-name mailhub-email-worker

# View logs
aws logs tail /aws/lambda/mailhub-email-worker --follow

# Test invocation
aws lambda invoke \
  --function-name mailhub-email-worker \
  --payload '{"Records":[]}' \
  response.json
```

### 7. Monitor in Production

#### CloudWatch Metrics

- **Invocations**: Number of times Lambda was triggered
- **Duration**: Execution time (should be <60s)
- **Errors**: Failed executions
- **Throttles**: Rate limiting events

#### CloudWatch Alarms

Two alarms are automatically created:
1. **Error Alarm**: >5 errors in 5 minutes
2. **Duration Alarm**: Avg duration >50 seconds

#### SQS Queue Monitoring

```bash
# Check queue depth
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/xxx/Private-MailHub-incoming-queue \
  --attribute-names ApproximateNumberOfMessages
```

### 8. Parallel Running (Recommended)

Run both PM2 and Lambda for 3-7 days:

1. Deploy Lambda (Lambda will process messages)
2. Keep PM2 worker running (as backup)
3. Monitor Lambda metrics and logs
4. Verify all emails are processed correctly

**Note:** SQS ensures each message is processed only once (by either Lambda or PM2).

### 9. Remove PM2 Worker

After verifying Lambda works correctly:

```bash
# Edit ecosystem.config.js
# Remove the 'mailhub-worker' section

# Restart PM2
pm2 delete mailhub-worker
pm2 save
```

Optional: Clean up code
```bash
# Remove QueuePollerService (if not needed)
rm back-end/src/relay-emails/queue-poller.service.ts

# Remove WORKER_MODE logic from main.ts
# (keep web server mode only)
```

## VPC Configuration

### Option 1: No VPC (Simpler)

Leave `VPC_ID` empty in infrastructure/.env

**Requirements:**
- RDS must be publicly accessible
- Security group allows Lambda's IP range

**Pros:**
- No NAT Gateway costs (~$32/month)
- Faster cold starts

**Cons:**
- Less secure (RDS exposed to internet)

### Option 2: VPC (Recommended)

Set `VPC_ID` in infrastructure/.env

**Requirements:**
- Private subnets with NAT Gateway
- Lambda Security Group created
- RDS/Redis security groups updated

**After deployment:**
1. Get Lambda Security Group ID from CDK output
2. Add inbound rule to RDS security group:
   ```
   Type: MySQL/Aurora
   Protocol: TCP
   Port: 3306
   Source: <Lambda-Security-Group-ID>
   ```
3. Add inbound rule to Redis security group:
   ```
   Type: Custom TCP
   Port: 6379
   Source: <Lambda-Security-Group-ID>
   ```

## Troubleshooting

### Lambda Timeout

**Symptom:** Task timed out after 60.00 seconds

**Solution:**
```typescript
// infrastructure/lib/mailhub-worker-stack.ts
timeout: cdk.Duration.seconds(120), // Increase to 2 minutes
```

### Out of Memory

**Symptom:** Lambda runs out of memory

**Solution:**
```typescript
// infrastructure/lib/mailhub-worker-stack.ts
memorySize: 1024, // Increase to 1GB
```

### Database Connection Failed

**Symptom:** Error connecting to RDS

**Solutions:**
1. Check DATABASE_HOST in Lambda environment
2. Verify Lambda is in correct VPC
3. Check security group allows Lambda SG on port 3306
4. Test from Lambda:
   ```bash
   aws lambda invoke \
     --function-name mailhub-email-worker \
     --payload '{"Records":[]}' \
     /tmp/response.json && cat /tmp/response.json
   ```

### SQS Messages Not Triggering Lambda

**Symptom:** Messages in queue but Lambda not invoked

**Solutions:**
1. Check event source mapping is enabled:
   ```bash
   aws lambda list-event-source-mappings \
     --function-name mailhub-email-worker
   ```
2. Verify SQS queue ARN is correct
3. Check Lambda has permission to read from SQS

### Cold Start Issues

**Symptom:** First invocation takes 5-10 seconds

**Solutions:**
1. **Provisioned Concurrency** (costs more):
   ```typescript
   const version = emailWorker.currentVersion;
   const alias = new lambda.Alias(this, 'ProdAlias', {
     aliasName: 'prod',
     version,
     provisionedConcurrentExecutions: 1,
   });
   ```

2. **Keep Lambda Warm** (via EventBridge):
   ```typescript
   import * as events from 'aws-cdk-lib/aws-events';
   import * as targets from 'aws-cdk-lib/aws-events-targets';

   new events.Rule(this, 'KeepWarm', {
     schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
     targets: [new targets.LambdaFunction(emailWorker)],
   });
   ```

## Rollback Plan

If Lambda has critical issues:

### Immediate Rollback

1. **Disable Lambda event source mapping:**
   ```bash
   UUID=$(aws lambda list-event-source-mappings \
     --function-name mailhub-email-worker \
     --query 'EventSourceMappings[0].UUID' --output text)

   aws lambda update-event-source-mapping \
     --uuid $UUID \
     --no-enabled
   ```

2. **Restart PM2 worker:**
   ```bash
   pm2 restart mailhub-worker
   ```

### Complete Rollback

```bash
cd infrastructure
npm run destroy
```

This deletes Lambda function and all associated resources.

## Cost Comparison

### Before (EC2 + PM2)

| Item | Cost/Month |
|------|------------|
| EC2 t3.small (always on) | $15 |
| **Total** | **$15** |

### After (Lambda)

| Item | Calculation | Cost/Month |
|------|-------------|------------|
| Lambda Invocations | 100,000 msgs × $0.20/1M | $0.02 |
| Lambda Duration | 100,000 × 2s × 512MB × $0.0000166667 | $1.67 |
| NAT Gateway (if VPC) | $0.045/hour × 730 hours | $32.85 |
| **Total (No VPC)** | | **$1.69** |
| **Total (With VPC)** | | **$34.54** |

**Savings:** $13.31/month (without VPC) or -$19.54/month (with VPC)

**Recommendation:** Use Lambda without VPC initially, or optimize NAT Gateway usage.

## Performance Comparison

| Metric | PM2 Worker | Lambda |
|--------|------------|--------|
| **Latency** | 0-30s (polling interval) | <1s (real-time) |
| **Cold Start** | N/A | 2-5s (first invocation) |
| **Warm Start** | Instant | <100ms |
| **Concurrency** | 1 instance | Auto-scaling (up to 1000) |
| **Processing Time** | 2-5s per email | 2-5s per email |

## Next Steps

After successful migration:

1. **Monitor for 7 days**
   - Check CloudWatch metrics daily
   - Review error logs
   - Verify all emails processed

2. **Optimize costs**
   - Consider removing NAT Gateway (if VPC)
   - Adjust memory/timeout based on metrics
   - Set reserved concurrency if needed

3. **Remove PM2 worker**
   - Delete PM2 process
   - Clean up old code
   - Update documentation

4. **Add monitoring alerts**
   - Set up SNS topic for alarms
   - Configure email/Slack notifications
   - Create dashboard in CloudWatch

## Support

- **Lambda Logs**: `/aws/lambda/mailhub-email-worker`
- **CloudWatch Dashboard**: [Create custom dashboard]
- **AWS Support**: https://console.aws.amazon.com/support/
- **GitHub Issues**: https://github.com/youngjinmo/mailhub/issues

---

**Migration completed!** 🎉
