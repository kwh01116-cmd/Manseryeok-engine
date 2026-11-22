import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { assertNode22, check, parsePairs } from '../offline/integrity.mjs';
import { prepareE2Birth } from './e2.mjs';
import { loadEngineE3, validateE3Selection } from './e3.mjs';

export function validateE3Request(input) {
  check(input?.schemaVersion === 'manseryeok-engine-e3-request-v1' && Object.keys(input).length === 3
    && Object.hasOwn(input, 'birth') && Object.hasOwn(input, 'selection'), 'E3_REQUEST_SCHEMA');
  validateE3Selection(input.selection);
  prepareE2Birth(input.birth);
}

export async function main(args = process.argv.slice(2)) {
  assertNode22();
  const options = parsePairs(args, ['--data-pack', '--request']);
  check(options['--data-pack'] && options['--request'], 'E3_REQUEST_AND_DATA_REQUIRED');
  const bytes = await readFile(options['--request']);
  check(bytes.length <= 32768, 'E3_REQUEST_SIZE');
  const input = JSON.parse(bytes.toString('utf8'));
  validateE3Request(input);
  const engine = await loadEngineE3({ dataDirectory: resolve(options['--data-pack']) });
  const result = engine.calculate(input.birth, input.selection);
  process.stdout.write(JSON.stringify(result) + '\n');
  if (!result.candidates.length) process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(() => {
    process.stderr.write('E3_INPUT_POLICY_OR_DATA_REJECTED\n');
    process.exitCode = 1;
  });
}
