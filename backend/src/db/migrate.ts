import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { Pool } from "pg";

const defaultMigrationsDirectory = fileURLToPath(
  new URL("../../../database/migrations", import.meta.url),
);

export async function runMigrations(
  pool: Pool,
  migrationsDirectory = defaultMigrationsDirectory,
): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const files = (await readdir(migrationsDirectory))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const alreadyApplied = await pool.query<{ name: string }>(
      "SELECT name FROM schema_migrations WHERE name = $1",
      [file],
    );

    if (alreadyApplied.rowCount) continue;

    const sql = await readFile(`${migrationsDirectory}/${file}`, "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations(name) VALUES ($1)", [file]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
