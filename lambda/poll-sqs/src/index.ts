import { loadConfig } from './config';
import { Protection } from './crypto';
import { Database } from './database';
import { createHandler } from './handler';
import { Mailer } from './mailer';
import { EmailProcessor } from './processor';
import { Storage } from './storage';

const config = loadConfig();
const processor = new EmailProcessor(
  config,
  new Database(config.database, new Protection(config.encryptionKey)),
  new Storage(),
  new Mailer(config),
);

export const handler = createHandler(processor);
