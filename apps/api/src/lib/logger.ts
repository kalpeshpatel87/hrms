import pino from 'pino';
import pretty from 'pino-pretty';
import { isProduction } from '../config/env.js';

// pino's worker-thread `transport: { target: 'pino-pretty' }` option fails to
// resolve the module inside a pnpm workspace's strict node_modules layout, so
// pino-pretty is wired in-process as a plain stream instead.
export const logger = isProduction
  ? pino({ level: 'info' })
  : pino(
      { level: 'debug' },
      pretty({ colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' }),
    );
