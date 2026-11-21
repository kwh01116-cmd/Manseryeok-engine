import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {assertNode22, check, parsePairs} from '../offline/integrity.mjs';
import {loadEngineE1, validateE1Selection} from './e1.mjs';
import {validateApiOnlyServerRequest} from '../server/engine.mjs';

export function validateE1Request(input) {
  check(input && input.schemaVersion === 'manseryeok-engine-e1-request-v1'
    && Object.keys(input).length === 3 && Object.hasOwn(input,'birth')
    && Object.hasOwn(input,'selection'), 'E1_REQUEST_SCHEMA');
  validateE1Selection(input.selection);
  validateApiOnlyServerRequest(input.birth);
}
export async function main(args=process.argv.slice(2)) {
  assertNode22();
  const o=parsePairs(args,['--data-pack','--request']);
  check(o['--data-pack'] && o['--request'],'E1_REQUEST_AND_DATA_REQUIRED');
  const bytes=await readFile(o['--request']);
  check(bytes.length<=32768,'E1_REQUEST_SIZE');
  const input=JSON.parse(bytes.toString('utf8'));
  validateE1Request(input);
  const engine=await loadEngineE1({dataDirectory:resolve(o['--data-pack'])});
  const result=engine.calculate(input.birth,input.selection);
  process.stdout.write(JSON.stringify(result)+'\n');
  if (!result.candidates.length) process.exitCode=2;
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(()=>{process.stderr.write('E1_INPUT_POLICY_OR_DATA_REJECTED\n');process.exitCode=1;});
}
