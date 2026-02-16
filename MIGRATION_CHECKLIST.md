# Lambda Migration Checklist

Complete checklist for migrating SQS worker from PM2 to Lambda.

## ✅ Pre-Migration (Completed)

- [x] Lambda handler code written (`back-end/src/lambda/sqs-worker.handler.ts`)
- [x] `RelayEmailsService.processMessage()` made public
- [x] Lambda build configuration created (`tsconfig.lambda.json`)
- [x] Build scripts added to `package.json`
- [x] Lambda builds successfully (`npm run build:lambda`)
- [x] AWS CDK infrastructure code written
- [x] CDK synth successful
- [x] GitHub Actions workflow created
- [x] Documentation completed

## 📋 Deployment Checklist

### Phase 1: Preparation

- [ ] Review all generated files:
  - [ ] `back-end/src/lambda/sqs-worker.handler.ts`
  - [ ] `infrastructure/lib/mailhub-worker-stack.ts`
  - [ ] `.github/workflows/deploy-lambda.yml`

- [ ] Gather production credentials:
  - [ ] RDS endpoint and credentials
  - [ ] Redis endpoint
  - [ ] VPC ID (if using VPC)
  - [ ] Encryption key (from backend `.env`)

### Phase 2: Local Testing

- [ ] Build Lambda function:
  ```bash
  cd back-end
  npm run build:lambda
  ```

- [ ] Verify build output:
  ```bash
  ls -lh dist-lambda/lambda/sqs-worker.handler.js
  du -sh dist-lambda
  ```

- [ ] Build CDK infrastructure:
  ```bash
  cd infrastructure
  cp .env.example .env
  # Edit .env with your values
  npm run synth
  ```

### Phase 3: Manual Deployment (Optional)

- [ ] Bootstrap CDK (first time only):
  ```bash
  cd infrastructure
  npm run bootstrap
  ```

- [ ] Preview changes:
  ```bash
  export $(cat .env | xargs) && npm run diff
  ```

- [ ] Deploy:
  ```bash
  export $(cat .env | xargs) && npm run deploy
  ```

- [ ] Note outputs:
  - [ ] Lambda function name
  - [ ] Lambda ARN
  - [ ] CloudWatch log group
  - [ ] Security group ID (if VPC)

### Phase 4: VPC Configuration (If Using VPC)

- [ ] Get Lambda Security Group ID from CDK output

- [ ] Update RDS security group:
  ```bash
  aws ec2 authorize-security-group-ingress \
    --group-id <RDS-SG-ID> \
    --protocol tcp \
    --port 3306 \
    --source-group <LAMBDA-SG-ID>
  ```

- [ ] Update Redis security group:
  ```bash
  aws ec2 authorize-security-group-ingress \
    --group-id <REDIS-SG-ID> \
    --protocol tcp \
    --port 6379 \
    --source-group <LAMBDA-SG-ID>
  ```

### Phase 5: GitHub Actions Setup (Recommended)

- [ ] Configure GitHub Secrets (see `.github/SECRETS.md`):
  ```bash
  # AWS
  gh secret set AWS_ACCESS_KEY_ID -b "xxx"
  gh secret set AWS_SECRET_ACCESS_KEY -b "xxx"
  gh secret set AWS_REGION -b "us-east-1"

  # Database
  gh secret set DATABASE_HOST -b "xxx"
  gh secret set DATABASE_PORT -b "3306"
  gh secret set DATABASE_NAME -b "private_mailhub"
  gh secret set DATABASE_USERNAME -b "xxx"
  gh secret set DATABASE_PASSWORD -b "xxx"

  # Redis
  gh secret set REDIS_HOST -b "xxx"
  gh secret set REDIS_PORT -b "6379"
  gh secret set REDIS_TTL -b "3600"

  # VPC (optional)
  # gh secret set VPC_ID -b "vpc-xxx"

  # AWS Services
  gh secret set SQS_QUEUE_ARN -b "arn:aws:sqs:us-east-1:xxx"
  gh secret set AWS_S3_EMAIL_BUCKET -b "private-mailhub-bucket"
  gh secret set AWS_SES_FROM_EMAIL -b "noreply@private-mailhub.com"

  # App Config
  gh secret set APP_NAME -b "Mailhub"
  gh secret set APP_DOMAIN -b "private-mailhub.com"
  gh secret set ENCRYPTION_KEY -b "xxx"
  ```

- [ ] Verify secrets:
  ```bash
  gh secret list
  ```

- [ ] Commit and push:
  ```bash
  git add .
  git commit -m "Add Lambda SQS worker"
  git push origin main
  ```

- [ ] Monitor deployment:
  - [ ] Go to GitHub → Actions
  - [ ] Watch "Deploy Lambda Worker" workflow
  - [ ] Verify all steps pass

### Phase 6: Verification

- [ ] Check Lambda function exists:
  ```bash
  aws lambda get-function --function-name mailhub-email-worker
  ```

- [ ] View Lambda configuration:
  ```bash
  aws lambda get-function-configuration --function-name mailhub-email-worker
  ```

- [ ] Test Lambda invocation:
  ```bash
  aws lambda invoke \
    --function-name mailhub-email-worker \
    --payload '{"Records":[]}' \
    /tmp/response.json
  cat /tmp/response.json
  ```

- [ ] Check CloudWatch logs:
  ```bash
  aws logs tail /aws/lambda/mailhub-email-worker --follow
  ```

- [ ] Send test email:
  - [ ] Send email to a relay address
  - [ ] Verify SQS receives message
  - [ ] Verify Lambda processes message
  - [ ] Verify email is forwarded
  - [ ] Check logs for errors

### Phase 7: Monitoring Setup

- [ ] Set up CloudWatch Dashboard:
  - [ ] Lambda invocations
  - [ ] Lambda errors
  - [ ] Lambda duration
  - [ ] SQS queue depth

- [ ] Configure SNS topic for alarms (optional):
  ```bash
  aws sns create-topic --name mailhub-lambda-alerts
  aws sns subscribe \
    --topic-arn arn:aws:sns:us-east-1:xxx:mailhub-lambda-alerts \
    --protocol email \
    --notification-endpoint your-email@example.com
  ```

- [ ] Update CloudWatch alarms to use SNS:
  ```typescript
  // In mailhub-worker-stack.ts
  const topic = sns.Topic.fromTopicArn(this, 'AlertTopic', 'arn:...');
  errorAlarm.addAlarmAction(new cw_actions.SnsAction(topic));
  ```

### Phase 8: Parallel Running (Recommended)

- [ ] Keep PM2 worker running
- [ ] Monitor both systems for 3-7 days:
  - [ ] Lambda metrics (CloudWatch)
  - [ ] PM2 worker logs
  - [ ] Email delivery rate
  - [ ] Error rate

- [ ] Compare performance:
  - [ ] Processing latency
  - [ ] Error rate
  - [ ] Cost

### Phase 9: PM2 Worker Removal

After confirming Lambda works correctly:

- [ ] Stop PM2 worker:
  ```bash
  pm2 stop mailhub-worker
  ```

- [ ] Wait 24 hours to ensure no issues

- [ ] Delete PM2 worker:
  ```bash
  pm2 delete mailhub-worker
  pm2 save
  ```

- [ ] Update `ecosystem.config.js`:
  - [ ] Remove `mailhub-worker` configuration
  - [ ] Keep only `mailhub-server` (web server)

- [ ] Optional code cleanup:
  - [ ] Remove `QueuePollerService` (if not needed elsewhere)
  - [ ] Remove `WORKER_MODE` logic from `main.ts`
  - [ ] Update documentation

- [ ] Commit changes:
  ```bash
  git add ecosystem.config.js
  git commit -m "Remove PM2 worker, Lambda is now handling SQS"
  git push origin main
  ```

### Phase 10: Post-Migration

- [ ] Update `README.md`:
  - [ ] Document Lambda worker
  - [ ] Update architecture diagram
  - [ ] Update deployment instructions

- [ ] Update team documentation:
  - [ ] Deployment process
  - [ ] Monitoring procedures
  - [ ] Troubleshooting guide

- [ ] Cost optimization review:
  - [ ] Check actual Lambda costs vs. estimates
  - [ ] Consider removing NAT Gateway (if using VPC and RDS is public)
  - [ ] Adjust memory/timeout based on metrics

- [ ] Security review:
  - [ ] Ensure secrets are in GitHub Secrets, not in code
  - [ ] Review IAM permissions (least privilege)
  - [ ] Check VPC security groups

## 🔥 Emergency Rollback

If Lambda has critical issues:

### Immediate Actions

1. **Disable Lambda event source:**
   ```bash
   UUID=$(aws lambda list-event-source-mappings \
     --function-name mailhub-email-worker \
     --query 'EventSourceMappings[0].UUID' --output text)

   aws lambda update-event-source-mapping --uuid $UUID --no-enabled
   ```

2. **Restart PM2 worker:**
   ```bash
   pm2 restart mailhub-worker
   ```

3. **Investigate issue:**
   - Check CloudWatch logs
   - Review error messages
   - Check SQS queue depth

### Complete Rollback

If you need to completely remove Lambda:

```bash
cd infrastructure
npm run destroy
```

Then ensure PM2 worker is running correctly.

## 📊 Success Metrics

Track these metrics to confirm successful migration:

- [ ] **Latency**: <5s average processing time
- [ ] **Error Rate**: <1% of messages fail
- [ ] **Delivery Rate**: 100% of emails delivered
- [ ] **Cost**: Within expected range
- [ ] **SQS Queue Depth**: Stays near 0 (messages processed quickly)
- [ ] **Lambda Throttles**: 0 (no rate limiting)

## 🎯 Final Verification

- [ ] All emails are being processed
- [ ] No errors in CloudWatch logs
- [ ] SQS queue depth is low (<10 messages)
- [ ] CloudWatch alarms are not firing
- [ ] Cost is within expected range
- [ ] Team is trained on new deployment process

---

**Migration Status:** ⏳ In Progress / ✅ Completed

**Date Started:** ________________

**Date Completed:** ________________

**Notes:**
_______________________________________
_______________________________________
_______________________________________
