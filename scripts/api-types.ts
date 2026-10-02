// Generates src/libs/api/schema.d.ts from the backend's OpenAPI spec (`pnpm api:types`).
// With --check, generates to a temp file and fails when it differs from the committed one, so
// CI catches backend API changes the frontend hasn't picked up (`pnpm api:check`).
//
// Springdoc emits some schema properties (Spring's Page) in a different order on each start,
// so object keys are sorted before generating; key order carries no meaning in OpenAPI.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const OUTPUT = 'src/libs/api/schema.d.ts';
const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8080';
const check = process.argv.includes('--check');

// Code-point order, not localeCompare: the result must not depend on the machine's locale.
const byCodePoint = ([a]: [string, unknown], [b]: [string, unknown]) => {
  if (a === b) {
    return 0;
  }

  return a < b ? -1 : 1;
};

const sortKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item: unknown) => sortKeys(item));
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .toSorted(byCodePoint)
        .map(([key, item]: [string, unknown]) => [key, sortKeys(item)]),
    );
  }

  return value;
};

const response = await fetch(`${backendUrl}/v3/api-docs`);
if (!response.ok) {
  throw new Error(`GET ${backendUrl}/v3/api-docs answered ${response.status}`);
}
const spec: unknown = await response.json();

const dir = mkdtempSync(path.join(tmpdir(), 'api-types-'));
const specFile = path.join(dir, 'openapi.json');
writeFileSync(specFile, JSON.stringify(sortKeys(spec)));
const output = check ? path.join(dir, 'schema.d.ts') : OUTPUT;

// openapi-typescript 7 needs the TypeScript 5 compiler API; the project itself uses TypeScript 7.
const generate = spawnSync(
  'pnpm',
  [
    'dlx',
    '--package=openapi-typescript@7.13.0',
    '--package=typescript@5.9.3',
    'openapi-typescript',
    specFile,
    '-o',
    output,
  ],
  { stdio: 'inherit' },
);
if (generate.status !== 0) {
  process.exit(generate.status ?? 1);
}

if (check && readFileSync(output, 'utf-8') !== readFileSync(OUTPUT, 'utf-8')) {
  console.error(
    `${OUTPUT} is out of date with the backend at ${backendUrl}. Run \`make api-types\` and commit it.`,
  );
  process.exit(1);
}
