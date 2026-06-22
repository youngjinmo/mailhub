export interface Config {
  appName: string;
  appDomain: string;
  nodeEnv: string;
  encryptionKey: string;
  database: {
    host: string;
    port: number;
    name: string;
    username: string;
    password: string;
  };
  mailgun: {
    apiKey: string;
    baseUrl: string;
  };
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value;
}

export function loadConfig(): Config {
  return {
    appName: required('APP_NAME'),
    appDomain: required('APP_DOMAIN'),
    nodeEnv: required('NODE_ENV'),
    encryptionKey: required('ENCRYPTION_KEY'),
    database: {
      host: required('DATABASE_HOST'),
      port: Number(process.env.DATABASE_PORT ?? '3306'),
      name: required('DATABASE_NAME'),
      username: required('DATABASE_USERNAME'),
      password: required('DATABASE_PASSWORD'),
    },
    mailgun: {
      apiKey: process.env.MAILGUN_API_KEY ?? '',
      baseUrl: process.env.MAILGUN_BASE_URL ?? 'https://api.mailgun.net',
    },
  };
}
