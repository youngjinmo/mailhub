# poll-sqs Lambda

Thin Lambda that periodically triggers the mailhub backend to drain its SQS queue
of incoming relay email events. Replaces the in-process `@Cron` poller that used to
live in `back-end/src/relay-emails/queue-poller.service.ts`.

## Architecture

```
EventBridge Schedule (15s)
        │
        ▼
   poll-sqs Lambda  ──HTTP POST──▶  Backend `/relay-emails/internal/poll-sqs`
                                              │
                                              ▼
                                    RelayEmailsService.processIncomingEmails()
                                              │
                                              ▼
                                          SQS / S3 / DB
```

The Lambda holds no business logic. It only:

1. Reads `BACKEND_URL` and `INTERNAL_POLL_SECRET` from env.
2. Issues `POST {BACKEND_URL}/relay-emails/internal/poll-sqs` with the secret
   in the `x-internal-secret` header.
3. Throws on non-2xx so the invocation shows as failed in CloudWatch.

## Environment variables

| Name                  | Required | Description                                              |
| --------------------- | -------- | -------------------------------------------------------- |
| `BACKEND_URL`         | yes      | Base URL of the backend, e.g. `https://api.example.com`. |
| `INTERNAL_POLL_SECRET`| yes      | Shared secret. Must match backend's env of the same name.|
| `REQUEST_TIMEOUT_MS`  | no       | Fetch timeout in ms. Default `25000`.                    |

## Build

```
npm install
npm run build      # tsc → dist/
npm run package    # produces poll-sqs.zip from dist/
```

The Lambda has no runtime dependencies — only TypeScript dev deps — so the
zip contains compiled JS only.

## Runtime

- Node.js 20.x or newer (global `fetch` and `AbortController` required).
- Suggested timeout: 30s.
- Suggested memory: 128 MB.

## Trigger

EventBridge rule with schedule expression `rate(1 minute)` (minimum for rate)
or `cron(*/15 * * * ? *)`-style cron when sub-minute cadence is needed.

> Note: EventBridge's minimum `rate()` is 1 minute. If 15-second cadence is
> required, configure an EventBridge Scheduler (not classic Rules) with a
> `rate(15 seconds)` schedule.
