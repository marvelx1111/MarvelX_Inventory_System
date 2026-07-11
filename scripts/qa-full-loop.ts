/**
 * Full QA/QC loop — runs all validation scripts twice.
 * Run: npm run qa:full [baseUrl]
 */
import { spawnSync } from 'node:child_process';

const BASE = process.argv[2] ?? 'http://localhost:5173';
const LOOPS = 2;

type Step = { name: string; cmd: string; args: string[] };

const STEPS: Step[] = [
  { name: 'TypeScript build', cmd: 'npm', args: ['run', 'build'] },
  { name: 'DB crosscheck', cmd: 'npm', args: ['run', 'db:crosscheck'] },
  { name: 'DB edit check', cmd: 'npm', args: ['run', 'db:edit-check'] },
  { name: 'UI edit loop', cmd: 'npx', args: ['tsx', 'scripts/ui-edit-loop.ts', BASE] },
  { name: 'Create customer loop', cmd: 'npx', args: ['tsx', 'scripts/create-customer-loop.ts', BASE] },
  { name: 'Clear QA test data', cmd: 'npm', args: ['run', 'db:clear-qa'] },
];

function runStep(step: Step): boolean {
  console.log(`\n>>> ${step.name}`);
  const result = spawnSync(step.cmd, step.args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env,
    shell: false,
  });
  const ok = result.status === 0;
  console.log(ok ? `<<< ${step.name}: PASS` : `<<< ${step.name}: FAIL (exit ${result.status})`);
  return ok;
}

function main() {
  console.log(`=== FULL QA/QC (${LOOPS} loops) — ${BASE} ===\n`);

  const failures: string[] = [];

  for (let loop = 1; loop <= LOOPS; loop++) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`QA LOOP ${loop} of ${LOOPS}`);
    console.log('='.repeat(60));

    for (const step of STEPS) {
      if (!runStep(step)) {
        failures.push(`Loop ${loop}: ${step.name}`);
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('QA SUMMARY');
  console.log('='.repeat(60));

  if (failures.length === 0) {
    console.log(`All ${LOOPS} loops passed.`);
    return;
  }

  console.log(`Failures (${failures.length}):`);
  for (const f of failures) {
    console.log(`  ✗ ${f}`);
  }
  process.exit(1);
}

main();
