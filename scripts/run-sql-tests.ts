/**
 * Runs the pgTAP RLS tests in supabase/tests against the DEV database (SUPABASE_DB_URL).
 *
 * Each test file runs in its own transaction, with `_fixtures.sql` prepended, and is ROLLED BACK,
 * so the database is left exactly as it was. No Docker / local Supabase needed.
 *
 *   npm run test:rls            # all files
 *   npm run test:rls -- 02      # only files whose name contains "02"
 */
import 'dotenv/config';

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Client, type QueryResult } from 'pg';

import { summariseTap, type TapSummary } from './tap';

const TEST_DIR = join(__dirname, '..', 'supabase', 'tests');

function collectTapLines(results: QueryResult | QueryResult[]): string[] {
  const list = Array.isArray(results) ? results : [results];
  const lines: string[] = [];
  for (const result of list) {
    for (const row of result.rows as Record<string, unknown>[]) {
      for (const value of Object.values(row)) {
        if (typeof value === 'string') lines.push(...value.split('\n'));
      }
    }
  }
  return lines;
}

async function runFile(client: Client, file: string, fixtures: string): Promise<TapSummary> {
  const sql = readFileSync(join(TEST_DIR, file), 'utf8');
  await client.query('begin');
  try {
    await client.query('set local search_path = public, extensions');
    await client.query('create extension if not exists pgtap with schema extensions');
    await client.query(fixtures);
    const results = (await client.query(sql)) as unknown as QueryResult | QueryResult[];
    return summariseTap(collectTapLines(results));
  } finally {
    await client.query('rollback');
  }
}

async function main(): Promise<void> {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    console.error('SUPABASE_DB_URL is not set. Copy .env.example to .env and fill it in.');
    process.exit(2);
  }

  const filter = process.argv[2];
  const files = readdirSync(TEST_DIR)
    .filter((f) => f.endsWith('.sql') && !f.startsWith('_'))
    .filter((f) => !filter || f.includes(filter))
    .sort();
  const fixtures = readFileSync(join(TEST_DIR, '_fixtures.sql'), 'utf8');

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();

  let failedFiles = 0;
  let total = 0;
  try {
    for (const file of files) {
      try {
        const summary = await runFile(client, file, fixtures);
        total += summary.passed + summary.failed.length;
        const ok = summary.failed.length === 0 && summary.problems.length === 0;
        if (!ok) failedFiles += 1;
        console.log(`${ok ? 'PASS' : 'FAIL'}  ${file}  (${summary.passed} passed)`);
        for (const line of [...summary.failed, ...summary.problems]) console.log(`      ${line}`);
      } catch (error) {
        failedFiles += 1;
        console.log(`FAIL  ${file}`);
        console.log(`      ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  } finally {
    await client.end();
  }

  console.log(
    `\n${files.length - failedFiles}/${files.length} files passed, ${total} assertions run.`,
  );
  process.exit(failedFiles === 0 ? 0 : 1);
}

void main();
