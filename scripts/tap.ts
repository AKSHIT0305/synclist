/** Minimal TAP output parser for pgTAP results (pure; unit-tested in __tests__/scripts/tap-test.ts). */

export type TapSummary = {
  passed: number;
  /** "not ok" lines plus their diagnostic lines. */
  failed: string[];
  /** Plan mismatches or other "# Looks like ..." complaints from finish(). */
  problems: string[];
};

export function summariseTap(lines: readonly string[]): TapSummary {
  const summary: TapSummary = { passed: 0, failed: [], problems: [] };
  let inFailure = false;

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^ok \d+/.test(line)) {
      summary.passed += 1;
      inFailure = false;
    } else if (/^not ok \d+/.test(line)) {
      summary.failed.push(line);
      inFailure = true;
    } else if (/^#\s+Looks like/.test(line)) {
      summary.problems.push(line);
      inFailure = false;
    } else if (inFailure && line.startsWith('#')) {
      summary.failed.push(`  ${line}`);
    }
  }

  if (summary.passed === 0 && summary.failed.length === 0 && summary.problems.length === 0) {
    summary.problems.push('no TAP output: did the file call no_plan()/finish()?');
  }
  return summary;
}
