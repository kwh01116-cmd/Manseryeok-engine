import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {assertNode22,check,parsePairs} from '../offline/integrity.mjs';
import {loadEngineE2,prepareE2Birth,validateE2Selection} from './e2.mjs';

export function validateE2Request(input) {
  check(input?.schemaVersion==='manseryeok-engine-e2-request-v1' && Object.keys(input).length===3
    && Object.hasOwn(input,'birth') && Object.hasOwn(input,'selection'),'E2_REQUEST_SCHEMA');
  validateE2Selection(input.selection);
  prepareE2Birth(input.birth);
}
export async function main(args=process.argv.slice(2)) {
  assertNode22();
  const o=parsePairs(args,['--data-pack','--request']);
  check(o['--data-pack'] && o['--request'],'E2_REQUEST_AND_DATA_REQUIRED');
  const bytes=await readFile(o['--request']);
  check(bytes.length<=32768,'E2_REQUEST_SIZE');
  const input=JSON.parse(bytes.toString('utf8'));
  validateE2Request(input);
  const engine=await loadEngineE2({dataDirectory:resolve(o['--data-pack'])});
  const result=engine.calculate(input.birth,input.selection);
  process.stdout.write(JSON.stringify(result)+'\n');
  if(!result.candidates.length)process.exitCode=2;
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  main().catch(()=>{process.stderr.write('E2_INPUT_POLICY_OR_DATA_REJECTED\n');process.exitCode=1;});
}
