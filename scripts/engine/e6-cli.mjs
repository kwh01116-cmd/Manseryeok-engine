import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { assertNode22, check, parsePairs } from '../offline/integrity.mjs';
import { loadEngineE6, validateE6Request } from './e6.mjs';

export async function main(args = process.argv.slice(2)) {
  assertNode22();
  const options = parsePairs(args, ['--data-pack', '--request']);
  check(options['--data-pack'] && options['--request'], 'E6_REQUEST_AND_DATA_REQUIRED');
  const bytes = await readFile(options['--request']);
  check(bytes.length <= 32768, 'E6_REQUEST_SIZE');
  const request = JSON.parse(bytes.toString('utf8'));
  validateE6Request(request);
  const engine = await loadEngineE6({ dataDirectory: resolve(options['--data-pack']) });
  const value = engine.calculate(request);
  process.stdout.write(JSON.stringify(value) + '\n');
  if (!value.candidates.length) process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    const code = /^[A-Z][A-Z_0-9]{2,100}$/.test(error?.message) ? error.message : 'E6_INPUT_POLICY_OR_DATA_REJECTED';
    process.stderr.write(code + '\n');
    process.exitCode = 1;
  });
}
