import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const { Client } = pg;

function loadEnvironment() {
  const rootDir = process.cwd();

  dotenv.config({
    path: path.resolve(rootDir, ".env"),
    override: false,
    quiet: true,
  });

  dotenv.config({
    path: path.resolve(rootDir, "server/.env"),
    override: false,
    quiet: true,
  });
}

function resolveMigrationsDirectory() {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDirectory = path.dirname(currentFile);

  const candidates = [
    path.resolve(process.cwd(), "server/sql/migrations"),
    path.resolve(currentDirectory, "../../sql/migrations"),
  ];

  const migrationsDirectory = candidates.find((candidate) =>
    fs.existsSync(candidate)
  );

  if (!migrationsDirectory) {
    throw new Error("Could not locate server/sql/migrations");
  }

  return migrationsDirectory;
}

function getMigrationFiles(migrationsDirectory: string) {
  return fs
    .readdirSync(migrationsDirectory, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        /^\d{4}_[a-z0-9_-]+\.sql$/i.test(entry.name)
    )
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

function removeOuterTransaction(sql: string) {
  const withoutBom = sql.replace(/^\uFEFF/, "");

  const beginPattern =
    /^((?:\s|--[^\r\n]*(?:\r?\n|$)|\/\*[\s\S]*?\*\/)*)BEGIN\s*;\s*/i;

  const commitPattern = /\s*COMMIT\s*;\s*$/i;

  const hasBegin = beginPattern.test(withoutBom);
  const hasCommit = commitPattern.test(withoutBom);

  if (hasBegin !== hasCommit) {
    throw new Error(
      "Migration contains an incomplete outer transaction"
    );
  }

  if (!hasBegin) {
    return withoutBom;
  }

  return withoutBom
    .replace(beginPattern, "$1")
    .replace(commitPattern, "")
    .trim();
}

async function main() {
  loadEnvironment();

  const databaseUrl =
    process.env.MIGRATION_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error(
      "MIGRATION_DATABASE_URL or DATABASE_URL is required"
    );
  }

  const migrationsDirectory = resolveMigrationsDirectory();
  const migrationFiles = getMigrationFiles(migrationsDirectory);

  if (migrationFiles.length === 0) {
    throw new Error("No migration files found");
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  await client.connect();

  try {
    await client.query(
      "SELECT pg_advisory_lock(hashtext($1))",
      ["elamora_sql_migrations"]
    );

    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        filename text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const appliedResult = await client.query<{ filename: string }>(
      `
        SELECT filename
        FROM _migrations
        ORDER BY filename
      `
    );

    const appliedMigrations = new Set(
      appliedResult.rows.map((row) => row.filename)
    );

    let appliedCount = 0;
    let skippedCount = 0;

    for (const filename of migrationFiles) {
      if (appliedMigrations.has(filename)) {
        console.log(`skip  ${filename}`);
        skippedCount += 1;
        continue;
      }

      const filePath = path.join(migrationsDirectory, filename);
      const rawSql = fs.readFileSync(filePath, "utf8");

      let sql: string;

      try {
        sql = removeOuterTransaction(rawSql);
      } catch (error) {
        throw new Error(
          `Invalid transaction wrapper: ${filename}`,
          { cause: error }
        );
      }

      if (!sql.trim()) {
        throw new Error(`Migration is empty: ${filename}`);
      }

      console.log(`apply ${filename}`);

      await client.query("BEGIN");

      try {
        await client.query(sql);

        await client.query(
          `
            INSERT INTO _migrations (filename)
            VALUES ($1)
          `,
          [filename]
        );

        await client.query("COMMIT");
        appliedCount += 1;
      } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(`Migration failed: ${filename}`, {
          cause: error,
        });
      }
    }

    console.log(
      JSON.stringify({
        ok: true,
        total: migrationFiles.length,
        applied: appliedCount,
        skipped: skippedCount,
      })
    );
  } finally {
    try {
      await client.query(
        "SELECT pg_advisory_unlock(hashtext($1))",
        ["elamora_sql_migrations"]
      );
    } catch {
      // The connection may already be unusable after a database failure.
    }

    await client.end();
  }
}

main().catch((error) => {
  const message =
    error instanceof Error ? error.message : "unknown_migration_error";

  console.error(
    JSON.stringify({
      ok: false,
      error: message,
    })
  );

  if (
    error instanceof Error &&
    error.cause instanceof Error
  ) {
    console.error(error.cause.message);
  }

  process.exitCode = 1;
});
