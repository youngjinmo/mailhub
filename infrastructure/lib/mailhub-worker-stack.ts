import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

export class MailhubWorkerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Environment variables
    const vpcId = process.env.VPC_ID;
    const sqsQueueArn = process.env.SQS_QUEUE_ARN || 'arn:aws:sqs:us-east-1:584669670737:Private-MailHub-incoming-queue';
    const s3BucketName = process.env.AWS_S3_EMAIL_BUCKET || 'private-mailhub-bucket';

    // Import existing VPC (if VPC_ID is provided, otherwise use default VPC)
    let vpc: ec2.IVpc | undefined;
    let vpcSubnets: ec2.SubnetSelection | undefined;
    let securityGroups: ec2.ISecurityGroup[] | undefined;

    if (vpcId) {
      // Use existing VPC
      vpc = ec2.Vpc.fromLookup(this, 'ExistingVPC', {
        vpcId: vpcId,
      });

      // Use private subnets with egress (for NAT Gateway)
      vpcSubnets = {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      };

      // Create security group for Lambda
      const lambdaSG = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
        vpc: vpc,
        description: 'Security group for Mailhub Lambda worker',
        allowAllOutbound: true,
      });

      securityGroups = [lambdaSG];

      // Output security group ID for reference
      new cdk.CfnOutput(this, 'LambdaSecurityGroupId', {
        value: lambdaSG.securityGroupId,
        description: 'Security Group ID for Lambda (add this to RDS/Redis inbound rules)',
      });
    }

    // Import existing SQS queue
    const emailQueue = sqs.Queue.fromQueueArn(this, 'EmailQueue', sqsQueueArn);

    // Lambda function
    const emailWorker = new lambda.Function(this, 'EmailWorker', {
      functionName: 'mailhub-email-worker',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'lambda/sqs-worker.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../back-end/dist-lambda')),
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,

      // VPC configuration (only if VPC_ID is provided)
      ...(vpcId && {
        vpc: vpc,
        vpcSubnets: vpcSubnets,
        securityGroups: securityGroups,
      }),

      // Environment variables
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'production',

        // Database
        DATABASE_HOST: process.env.DATABASE_HOST || '',
        DATABASE_PORT: process.env.DATABASE_PORT || '3306',
        DATABASE_NAME: process.env.DATABASE_NAME || '',
        DATABASE_USERNAME: process.env.DATABASE_USERNAME || '',
        DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || '',

        // Redis
        REDIS_HOST: process.env.REDIS_HOST || '',
        REDIS_PORT: process.env.REDIS_PORT || '6379',
        REDIS_TTL: process.env.REDIS_TTL || '3600',

        // AWS (AWS_REGION is automatically set by Lambda runtime)
        AWS_S3_EMAIL_BUCKET: s3BucketName,
        AWS_SES_FROM_EMAIL: process.env.AWS_SES_FROM_EMAIL || '',

        // App config
        APP_NAME: process.env.APP_NAME || 'Mailhub',
        APP_DOMAIN: process.env.APP_DOMAIN || 'private-mailhub.com',

        // Encryption
        ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',
      },

      // CloudWatch Logs configuration
      logRetention: logs.RetentionDays.ONE_WEEK,

      // Reserved concurrent executions (optional, for cost control)
      // reservedConcurrentExecutions: 10,
    });

    // Grant S3 read permissions
    emailWorker.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:GetObjectVersion',
      ],
      resources: [`arn:aws:s3:::${s3BucketName}/*`],
    }));

    // Grant SES send permissions
    emailWorker.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ses:SendEmail',
        'ses:SendRawEmail',
      ],
      resources: ['*'],
    }));

    // Add SQS event source mapping
    emailWorker.addEventSource(
      new lambdaEventSources.SqsEventSource(emailQueue, {
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(0), // Process immediately
        reportBatchItemFailures: true, // Enable partial batch failure handling
        enabled: true,
      })
    );

    // CloudWatch Alarms
    const errorAlarm = emailWorker.metricErrors({
      period: cdk.Duration.minutes(5),
      statistic: 'Sum',
    }).createAlarm(this, 'EmailWorkerErrorAlarm', {
      threshold: 5,
      evaluationPeriods: 1,
      alarmDescription: 'Alert when Lambda function has errors',
      alarmName: 'mailhub-email-worker-errors',
    });

    const durationAlarm = emailWorker.metricDuration({
      period: cdk.Duration.minutes(5),
      statistic: 'Average',
    }).createAlarm(this, 'EmailWorkerDurationAlarm', {
      threshold: 50000, // 50 seconds (close to 60s timeout)
      evaluationPeriods: 2,
      alarmDescription: 'Alert when Lambda duration is close to timeout',
      alarmName: 'mailhub-email-worker-duration',
    });

    // Outputs
    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: emailWorker.functionName,
      description: 'Lambda function name',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: emailWorker.functionArn,
      description: 'Lambda function ARN',
    });

    new cdk.CfnOutput(this, 'CloudWatchLogGroup', {
      value: emailWorker.logGroup.logGroupName,
      description: 'CloudWatch Log Group for Lambda',
    });
  }
}
