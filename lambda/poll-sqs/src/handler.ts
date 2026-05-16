import type { ScheduledHandler } from 'aws-lambda';

const DEFAULT_TIMEOUT_MS = 25_000;

function requiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
}

export const handler: ScheduledHandler = async () => {
  const backendUrl = requiredEnv('BACKEND_URL').replace(/\/$/, '');
  const secret = requiredEnv('INTERNAL_POLL_SECRET');
  const timeoutMs = Number(process.env.REQUEST_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);

  const url = `${backendUrl}/relay-emails/internal/poll-sqs`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-internal-secret': secret,
        'content-type': 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Backend poll-sqs failed: ${response.status} ${response.statusText} ${body}`);
    }

    console.log(`poll-sqs triggered: ${response.status}`);
  } finally {
    clearTimeout(timer);
  }
};
