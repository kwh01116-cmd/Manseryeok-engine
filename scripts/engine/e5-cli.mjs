import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { assertNode22, check, parsePairs } from '../offline/integrity.mjs';
import { prepareE2Birth } from './e2.mjs';
import { hasExactDataFields, loadEngineE5, validateE5Selection } from './e5.mjs';

export function validateE5Request(input) {
  check(hasExactDataFields(input, ['schemaVersion', 'birth', 'selection']) &&
    input.schemaVersion === 'manseryeok-engine-e5-request-v1', 'E5_REQUEST_SCHEMA');
  validateE5Selection(input.selection);
  prepareE2Birth(input.birth);
}

export async function main(args = process.argv.slice(2)) {
  assertNode22();
  const options = parsePairs(args, ['--data-pack', '--request']);
  check(options['--data-pack'] && options['--request'], 'E5_REQUEST_AND_DATA_REQUIRED');
  const bytes = await readFile(options['--request']);
  check(bytes.length <= 32768, 'E5_REQUEST_SIZE');
  const input = JSON.parse(bytes.toString('utf8'));
  validateE5Request(input);
  const engine = await loadEngineE5({ dataDirectory: resolve(options['--data-pack']) });
  const result = engine.calculate(input.birth, input.selection);
  process.stdout.write(JSON.stringify(result) + '\n');
  if (!result.candidates.length) process.exitCode = 2;
}

export function publicError(error) {
  return /^[A-Z][A-Z_0-9]{2,100}$/.test(error?.message) ? error.message : 'E5_INPUT_POLICY_OR_DATA_REJECTED';
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    process.stderr.write(publicError(error) + '\n');
    process.exitCode = 1;
  });
}
