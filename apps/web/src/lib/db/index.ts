import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { databaseUrl } from '@/lib/config';
import * as schema from './schema';

const globalForDb = globalThis as typeof globalThis & {
  copilotTrackerSql?: postgres.Sql;
};

const sql = globalForDb.copilotTrackerSql ?? postgres(databaseUrl(), {
  max: 10,
  prepare: false,
});

if (process.env.NODE_ENV !== 'production') {
  globalForDb.copilotTrackerSql = sql;
}

export const db = drizzle(sql, { schema });

