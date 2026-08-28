import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type PostgresClient = ReturnType<typeof postgres>;
type Database = ReturnType<typeof drizzle<typeof schema, PostgresClient>>;

const globalForDb = globalThis as unknown as {
  postgresClient?: PostgresClient;
  drizzleDb?: Database;
};

function getDatabaseUrl() {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

function getClient() {
  if (!globalForDb.postgresClient) {
    globalForDb.postgresClient = postgres(getDatabaseUrl(), {
      max: process.env.NODE_ENV === "production" ? 1 : 10,
      prepare: false,
    });
  }
  return globalForDb.postgresClient;
}

function getDb() {
  if (!globalForDb.drizzleDb) {
    globalForDb.drizzleDb = drizzle(getClient(), { schema });
  }
  return globalForDb.drizzleDb;
}

function lazy<T extends object>(resolve: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop, receiver) {
      const instance = resolve();
      const value = Reflect.get(instance, prop, receiver);
      return typeof value === "function" ? value.bind(instance) : value;
    },
  });
}

// Connect on first query so `next build` can collect routes without DATABASE_URL.
export const client = lazy(getClient);
export const db = lazy(getDb);
