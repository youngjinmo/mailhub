# GitHub Secrets Configuration

This document lists all GitHub Secrets required for the Lambda deployment workflow.

Go to: **Repository Settings → Secrets and variables → Actions → New repository secret**

## AWS Credentials

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS IAM user access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM user secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | AWS region | `us-east-1` |

### Required IAM Permissions

The IAM user must have these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:*",
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:GetRole",
        "iam:PassRole",
        "cloudformation:*",
        "s3:*",
        "logs:*",
        "events:*",
        "sqs:*"
      ],
      "Resource": "*"
    }
  ]
}
```

## Database Configuration

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DATABASE_HOST` | RDS endpoint | `mailhub-db.abc123.us-east-1.rds.amazonaws.com` |
| `DATABASE_PORT` | Database port | `3306` |
| `DATABASE_NAME` | Database name | `private_mailhub` |
| `DATABASE_USERNAME` | Database username | `admin` |
| `DATABASE_PASSWORD` | Database password | `your-secure-password` |

## Redis Configuration

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `REDIS_HOST` | Redis endpoint | `mailhub-redis.abc123.cache.amazonaws.com` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_TTL` | Cache TTL in seconds | `3600` |

## VPC Configuration (Optional)

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `VPC_ID` | VPC ID (leave empty if not using VPC) | `vpc-0123456789abcdef0` |

**Note:** If `VPC_ID` is not set, Lambda will deploy outside VPC.

## AWS Services

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SQS_QUEUE_ARN` | SQS queue ARN | `arn:aws:sqs:us-east-1:123456789:Private-MailHub-incoming-queue` |
| `AWS_S3_EMAIL_BUCKET` | S3 bucket name for emails | `private-mailhub-bucket` |
| `AWS_SES_FROM_EMAIL` | SES sender email | `noreply@private-mailhub.com` |

## Application Configuration

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `APP_NAME` | Application name | `Mailhub` |
| `APP_DOMAIN` | Application domain | `private-mailhub.com` |
| `ENCRYPTION_KEY` | Encryption key (AES-256-GCM) | `O6GrJuP1QDRL4tabQwaSyZSvl0LpVq4bxGr3gaG452I=` |

**⚠️ IMPORTANT:** The `ENCRYPTION_KEY` must be the same as the one used in the main backend application!

---

## Quick Setup Script

Copy and paste this script, replacing values with your actual secrets:

```bash
#!/bin/bash

# AWS Credentials
gh secret set AWS_ACCESS_KEY_ID -b "YOUR_ACCESS_KEY"
gh secret set AWS_SECRET_ACCESS_KEY -b "YOUR_SECRET_KEY"
gh secret set AWS_REGION -b "us-east-1"

# Database
gh secret set DATABASE_HOST -b "your-rds-endpoint.rds.amazonaws.com"
gh secret set DATABASE_PORT -b "3306"
gh secret set DATABASE_NAME -b "private_mailhub"
gh secret set DATABASE_USERNAME -b "your-username"
gh secret set DATABASE_PASSWORD -b "your-password"

# Redis
gh secret set REDIS_HOST -b "your-redis-endpoint.cache.amazonaws.com"
gh secret set REDIS_PORT -b "6379"
gh secret set REDIS_TTL -b "3600"

# VPC (optional - remove if not using VPC)
# gh secret set VPC_ID -b "vpc-0123456789abcdef0"

# AWS Services
gh secret set SQS_QUEUE_ARN -b "arn:aws:sqs:us-east-1:123456789:Private-MailHub-incoming-queue"
gh secret set AWS_S3_EMAIL_BUCKET -b "private-mailhub-bucket"
gh secret set AWS_SES_FROM_EMAIL -b "noreply@private-mailhub.com"

# Application
gh secret set APP_NAME -b "Mailhub"
gh secret set APP_DOMAIN -b "private-mailhub.com"
gh secret set ENCRYPTION_KEY -b "YOUR_ENCRYPTION_KEY_HERE"

echo "✅ All secrets configured!"
```

## Verification

After setting secrets, verify they are set:

```bash
gh secret list
```

You should see all the secrets listed above.

## Security Best Practices

1. **Rotate credentials regularly** - Change AWS keys every 90 days
2. **Use least privilege** - Grant only necessary permissions
3. **Never commit secrets** - Always use GitHub Secrets
4. **Monitor access logs** - Review CloudTrail for unauthorized access
5. **Enable MFA** - Use multi-factor authentication for AWS account

## Troubleshooting

### Secret not found error

If you see "Secret not found" in GitHub Actions:
- Check secret name matches exactly (case-sensitive)
- Ensure secret is set in the correct repository
- Verify you have admin access to the repository

### Permission denied error

If deployment fails with permission errors:
- Check IAM user has required permissions
- Verify AWS credentials are correct
- Review CloudTrail logs for specific denied actions
