import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { assertNode22, check, parsePairs } from '../offline/integrity.mjs';
import { loadEngineE3 } from './e3.mjs';
import { compareCommercialCorpus, compareBirthPolicies } from './e4-comparison.mjs';

export async function main(args=process.argv.slice(2)) {
  assertNode22();
  const opts=parsePairs(args,['--data-pack','--corpus','--birth-policy-request']);
  check(Boolean(opts['--data-pack']) && Boolean(opts['--corpus'])!==Boolean(opts['--birth-policy-request']),
    'E4_DATA_PACK_AND_ONE_REQUEST_REQUIRED');
  const bytes=await readFile(opts['--corpus']??opts['--birth-policy-request']);
  check(bytes.length<=1024*1024,'E4_REQUEST_SIZE');
  const doc=JSON.parse(bytes.toString('utf8'));
  const engine=await loadEngineE3({dataDirectory:resolve(opts['--data-pack'])});
  let result;
  if (opts['--corpus']) result=compareCommercialCorpus(doc,engine);
  else {
    check(doc?.schemaVersion==='engine-e4-birth-policy-request-v1' &&
      Object.keys(doc).length===4 && Object.hasOwn(doc,'selection') && Object.hasOwn(doc,'left') && Object.hasOwn(doc,'right'),
    'E4_BIRTH_REQUEST_SCHEMA');
    result=compareBirthPolicies(engine,doc.left,doc.right,doc.selection);
  }
  process.stdout.write(JSON.stringify({...result,requestSha256:createHash('sha256').update(bytes).digest('hex')})+'\n');
}

if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error=>{
    const code=/^(E[1-4]|SERVER)_([A-Z0-9_]+)$/.test(error?.message??'') ? error.message : 'E4_REQUEST_OR_DATA_REJECTED';
    process.stderr.write(code+'\n');
    process.exitCode=1;
  });
}
