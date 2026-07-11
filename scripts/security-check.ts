#!/usr/bin/env tsx
/**
 * Scans source files for accidentally committed secrets.
 * Run: npm run security:check
 */
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const FORBIDDEN_PATTERNS: Array<{ label: string; pattern: RegExp; skipFiles?: string[] }> = [
  { label: 'Service role key env assignment', pattern: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*(?!your)[^\s#'"]{8,}/i },
  { label: 'Hardcoded portal password env', pattern: /AUTH_PASSWORD_(ADMIN|SALES|PPF)\s*=\s*(?!__set_in_env_local__|your|choose)\S{6,}/i },
  { label: 'Known weak password', pattern: /\b(admin123|sales123|ppf123|talha123)\b/ },
  { label: 'Private key block', pattern: /-----BEGIN (RSA |OPENSSH )?PRIVATE KEY-----/ },
  {
    label: 'Hardcoded JWT outside public Supabase config',
    pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
    skipFiles: ['src/config/supabase.ts'],
  },
];

function listFiles(): string[] {
  const raw = execSync('git ls-files README.md .env.example src scripts supabase package.json SECURITY.md', {
    encoding: 'utf8',
  });
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function main() {
  const files = listFiles();
  const findings: string[] = [];

  for (const file of files) {
    let content: string;
    try {
      content = readFileSync(join(process.cwd(), file), 'utf8');
      statSync(join(process.cwd(), file));
    } catch {
      continue;
    }

    for (const { label, pattern, skipFiles } of FORBIDDEN_PATTERNS) {
      if (skipFiles?.includes(file)) continue;
      if (pattern.test(content)) {
        findings.push(`${file}: ${label}`);
      }
    }
  }

  if (findings.length > 0) {
    console.error('Security check failed:\n');
    for (const finding of findings) {
      console.error(`  ✗ ${finding}`);
    }
    console.error('\nRemove secrets from the repo, rotate compromised credentials, and re-run.');
    process.exit(1);
  }

  console.log(`Security check passed (${files.length} files scanned).`);
}

main();
