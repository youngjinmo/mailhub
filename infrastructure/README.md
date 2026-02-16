# Mailhub Infrastructure

AWS CDK infrastructure for Mailhub Lambda Email Worker.

## Prerequisites

- Node.js >= 18
- AWS CLI configured
- AWS CDK CLI: `npm install -g aws-cdk`

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Configure `.env` with your values:
   - Database credentials
   - Redis endpoint
   - VPC ID (if deploying in VPC)
   - Encryption key (must match backend)

## Build Lambda First

Before deploying, build the Lambda function:

```bash
cd ../back-end
npm run build:lambda
cd ../infrastructure
```

## Deploy

### 1. Bootstrap CDK (first time only)

```bash
npm run bootstrap
```

### 2. Preview changes

```bash
npm run diff
```

### 3. Deploy

```bash
# Load environment variables and deploy
export $(cat .env | xargs) && npm run deploy
```

Or use a deployment script:

```bash
#!/bin/bash
set -a
source .env
set +a
npm run deploy
```

## CDK Commands

- `npm run build` - Compile TypeScript
- `npm run watch` - Watch for changes
- `npm run synth` - Synthesize CloudFormation template
- `npm run diff` - Compare deployed stack with current state
- `npm run deploy` - Deploy stack to AWS
- `npm run destroy` - Delete stack from AWS

## Stack Resources

The CDK stack creates:

- **Lambda Function**: `mailhub-email-worker`
  - Runtime: Node.js 18
  - Memory: 512MB
  - Timeout: 60 seconds
  - VPC: Optional (based on VPC_ID env var)

- **SQS Event Source Mapping**
  - Batch size: 10 messages
  - Partial batch failure: Enabled

- **IAM Permissions**
  - S3: GetObject (read emails)
  - SES: SendEmail, SendRawEmail (forward emails)
  - SQS: Receive, Delete messages (via event source)

- **CloudWatch Alarms**
  - Error alarm: Triggers when >5 errors in 5 minutes
  - Duration alarm: Triggers when avg duration >50 seconds

- **Security Group** (if VPC enabled)
  - Outbound: All traffic allowed
  - Inbound: None (Lambda doesn't accept incoming connections)

## VPC Configuration

### Option 1: Deploy without VPC (Simple)

Leave `VPC_ID` empty in `.env`. Lambda will run outside VPC.

**Pros:**
- Faster cold starts
- No NAT Gateway costs
- Simpler setup

**Cons:**
- Cannot access RDS in private subnet
- Must use public RDS endpoint (security risk)

### Option 2: Deploy in VPC (Recommended for Production)

Set `VPC_ID` in `.env` to your VPC ID.

**Requirements:**
- RDS/Redis must be in the same VPC
- Private subnets with NAT Gateway (for internet access)
- Security groups properly configured

**After deployment:**
1. Get Lambda Security Group ID from stack outputs
2. Add inbound rule to RDS security group:
   - Source: Lambda Security Group
   - Port: 3306
3. Add inbound rule to Redis security group:
   - Source: Lambda Security Group
   - Port: 6379

## Monitoring

### CloudWatch Logs

View logs:
```bash
aws logs tail /aws/lambda/mailhub-email-worker --follow
```

### Metrics

Check Lambda metrics:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=mailhub-email-worker \
  --start-time $(date -u -v-1H +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

## Troubleshooting

### Lambda timeout

Increase timeout in `lib/mailhub-worker-stack.ts`:
```typescript
timeout: cdk.Duration.seconds(120), // Increase to 2 minutes
```

### Out of memory

Increase memory in `lib/mailhub-worker-stack.ts`:
```typescript
memorySize: 1024, // Increase to 1GB
```

### VPC connectivity issues

- Check NAT Gateway exists in VPC
- Verify Lambda uses PRIVATE_WITH_EGRESS subnets
- Ensure security groups allow outbound traffic

### Database connection errors

- Verify DATABASE_HOST is correct
- Check security group allows Lambda SG on port 3306
- Test connection from Lambda:
  ```bash
  aws lambda invoke \
    --function-name mailhub-email-worker \
    --payload '{"Records":[]}' \
    response.json
  ```

## Cost Estimation

Monthly costs (estimated):

- **Lambda**: ~$5-20 (depends on invocations)
  - First 1M requests/month: Free
  - $0.20 per 1M requests after
  - $0.0000166667 per GB-second

- **VPC (if used)**: ~$32/month
  - NAT Gateway: $0.045/hour = ~$32/month
  - Data transfer: $0.045/GB

- **CloudWatch Logs**: ~$1-5/month
  - $0.50 per GB ingested

**Total: $6-57/month** (depending on VPC usage)

## Cleanup

To delete all resources:

```bash
npm run destroy
```

**Warning:** This will delete the Lambda function and all associated resources. SQS queue and S3 bucket are not deleted (they're imported, not created by this stack).
