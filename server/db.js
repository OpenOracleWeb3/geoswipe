import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { assertServerConfig, getPoolConfig } from "./config.js";

const { Pool } = pg;

assertServerConfig();

const pool = new Pool(getPoolConfig());

const schemaDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../schema");
let schemaReadyPromise = null;

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function bootstrapLegacyInitialMigration() {
  const applied = await pool.query("SELECT 1 FROM schema_migrations WHERE version = '001_initial.sql' LIMIT 1");
  if (applied.rows[0]) {
    return;
  }

  const probe = await pool.query("SELECT to_regclass('public.players') AS players_table");
  if (probe.rows[0]?.players_table) {
    await pool.query("INSERT INTO schema_migrations (version) VALUES ('001_initial.sql') ON CONFLICT (version) DO NOTHING");
  }
}

async function runSchemaIfNeeded() {
  await ensureMigrationsTable();
  await bootstrapLegacyInitialMigration();

  const files = (await fs.readdir(schemaDir))
    .filter((file) => file.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right));

  const appliedResult = await pool.query("SELECT version FROM schema_migrations");
  const applied = new Set(appliedResult.rows.map((row) => row.version));

  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }

    const sql = await fs.readFile(path.join(schemaDir, file), "utf8");
    await pool.query("BEGIN");
    try {
      await pool.query(sql);
      await pool.query("INSERT INTO schema_migrations (version) VALUES ($1)", [file]);
      await pool.query("COMMIT");
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  }
}

export async function ensureDatabaseReady() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = runSchemaIfNeeded().catch((error) => {
      schemaReadyPromise = null;
      throw error;
    });
  }

  return schemaReadyPromise;
}

export async function withTransaction(work) {
  await ensureDatabaseReady();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function query(text, params = []) {
  await ensureDatabaseReady();
  return pool.query(text, params);
}

export async function closePool() {
  await pool.end();
}
