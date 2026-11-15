/** Fresh data-free server artifact. Reuses the pinned v3 compilation/vendor mechanisms. */
import {readFile} from 'node:fs/promises';
import {resolve,dirname,join,relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire,isBuiltin} from 'node:module';
import {execFileSync} from 'node:child_process';
import {freshCompilation} from './build.mjs';
import {INTEGRATED_ENTRIES,INTEGRATED_LITERAL_IMPORTS,integratedImportsIn,relinkIntegratedSchema,addVendor} from './build-v2.mjs';
import {assertNode22,check,portable,digest,createNewDirectory,writeNew,hashFiles,parsePairs} from './integrity.mjs';
import {SERVER_ARTIFACT_SCHEMA,SERVER_ARTIFACT_VERSION} from './integrity-v4.mjs';
import {SERVER_API_ONLY_ACCEPTED_PIN} from '../server-data/constants.mjs';
const repo=resolve(import.meta.dirname,'../..');
export const SERVER_ARTIFACT_ENTRIES=Object.freeze(['scripts/server/engine.mjs']);
const packaging=['integrity.mjs','integrity-v4.mjs','run-v4.mjs','verify-v4.mjs','restore-v4.mjs'];
const allowed=new Set([...INTEGRATED_ENTRIES,...SERVER_ARTIFACT_ENTRIES,'scripts/kasi/candidate.mjs','scripts/kasi/local-chart-facts.mjs','scripts/kasi/boundary-supplement.mjs','scripts/kasi/local-monthly-luck.mjs','scripts/kasi/annual-solar-extension.mjs','scripts/kasi/local-extended-chart.mjs','scripts/kasi/local-extended-report.mjs','scripts/server-data/load.mjs','scripts/server-data/core.mjs','scripts/server-data/constants.mjs','scripts/server-data/binding.mjs']);
const builtins=['node:crypto','node:fs/promises','node:path','node:url'];
export async function buildServerOfflineArtifact({root=repo,outDir,sourceRevision}={}){
 assertNode22();check(typeof outDir==='string'&&outDir.length>0,'OUTPUT_REQUIRED');
 const ts=createRequire(join(root,'package.json'))('typescript');check(ts.version==='5.8.3','PINNED_TYPESCRIPT_REQUIRED');
 const git=args=>execFileSync('git',['-c','safe.directory='+portable(root),'-c','core.excludesFile=',...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 const revision=git(['rev-parse','HEAD']),status=git(['status','--porcelain=v1','--untracked-files=all']);check(/^[a-f0-9]{40}$/.test(revision)&&(!sourceRevision||sourceRevision===revision),'SERVER_SOURCE_REVISION_REQUIRED');
 const compiled=freshCompilation(root,ts),outputs=new Map(),queue=[...SERVER_ARTIFACT_ENTRIES],schema=compiled.emitted.get('.kasi-build/schema.js')?.text;check(schema,'FRESH_SCHEMA_EMIT_REQUIRED');
 const {vendor,sourceInputs:vendorInputs}=await addVendor(root,outputs,ts);
 while(queue.length){
  const path=queue.shift();if(outputs.has(path))continue;
  check(path==='.kasi-build/schema.js'||path.startsWith('dist/')||allowed.has(path)||path==='docs/research/m2-policy-catalog.json','UNAPPROVED_SERVER_MODULE_PATH');
  check(!/(?:Fixtures|collector|research|network|client|web)\.(?:m?js)$/.test(path),'SERVER_ACQUISITION_OR_FIXTURE_MODULE_REJECTED');
  const source=path==='.kasi-build/schema.js'?relinkIntegratedSchema(schema,ts):path.startsWith('dist/')?compiled.emitted.get(path)?.text:await readFile(join(root,path),'utf8');check(typeof source==='string','FRESH_MODULE_EMIT_REQUIRED');outputs.set(path,source);
  for(const specifier of path.endsWith('.json')?[]:integratedImportsIn(source,path,ts)){
   if(isBuiltin(specifier)){check(builtins.includes(specifier),'UNAPPROVED_SERVER_BUILTIN_IMPORT');continue;}
   check(specifier.startsWith('.'),'SERVER_EXTERNAL_PACKAGE_REJECTED');const target=portable(relative(root,resolve(root,dirname(path),specifier)));check(!target.startsWith('../'),'SERVER_MODULE_ESCAPES_REPOSITORY');queue.push(target);
  }
 }
 for(const file of packaging)outputs.set('scripts/offline/'+file,await readFile(join(root,'scripts/offline',file),'utf8'));
 for(const [entry,file]of [['run.mjs','run-v4.mjs'],['verify.mjs','verify-v4.mjs'],['restore.mjs','restore-v4.mjs']])outputs.set(entry,`import {main} from './scripts/offline/${file}';\nawait main();\n`);
 outputs.set('package.json',JSON.stringify({name:'@manseryeok/offline-server-api-only-engine',version:SERVER_ARTIFACT_VERSION,private:true,type:'module',engines:{node:'>=22 <23'}},null,2)+'\n');
 outputs.set('THIRD_PARTY_NOTICES.md',await readFile(join(root,'THIRD_PARTY_NOTICES.md'),'utf8'));
 for(const path of ['docs/contracts/SERVER_API_ONLY_DATA_PACK_V01.md','docs/contracts/OFFLINE_SERVER_API_ONLY_V4.md','docs/research/KASI_DATA_RIGHTS_DISTRIBUTION_AUDIT_V01.md'])outputs.set(path,await readFile(join(root,path),'utf8'));
 outputs.set('OFFLINE.txt','Manseryeok API-only offline server engine v4\nNode22 only. No npm, Git, KASI key, network, original repository or external Saju API at runtime.\nThe engine excludes calendar data. Operators restore the separately fixed API-only server data pack.\nNever publish the pack or add a calendar-file endpoint. Server-internal conditional reuse and customer file redistribution have different rights gates.\nExplicit JSON requests preserve selected policies, unknown birth time, DST gaps/folds, minute alternatives and missing data. No implicit date/time or source fallback.\nRun: node run.mjs --data-pack <server-private-pack> --request-json <explicit-JSON> --output json|text --detail summary|detailed\nVerify: node verify.mjs --artifact . [--data-pack <server-private-pack>]\nRestore: node restore.mjs --artifact <engine> --out <new-engine> [--data-pack <pack> --data-out <new-.private-path>]\nPublic release is not approved.\n');
 for(const [path,bytes]of outputs)if(/\.(?:mjs|js)$/.test(path))for(const specifier of integratedImportsIn(String(bytes),path,ts)){
  if(isBuiltin(specifier)){check(builtins.includes(specifier),'UNAPPROVED_SERVER_PACKAGING_BUILTIN');continue;}
  check(specifier.startsWith('.'),'SERVER_PACKAGING_EXTERNAL_IMPORT');const target=portable(relative(root,resolve(root,dirname(path),specifier)));check(outputs.has(target),'SERVER_PACKAGING_CLOSURE_MISSING');
 }
 const sourceInputs=[...vendorInputs];
 for(const path of [...outputs.keys()].filter(p=>p.startsWith('dist/')||p.startsWith('scripts/')||p.startsWith('docs/')||p==='.kasi-build/schema.js').sort()){const bytes=Buffer.from(compiled.emitted.get(path)?.text??await readFile(join(root,path)));sourceInputs.push({path,sha256:digest(bytes),bytes:bytes.length});}
 const target=await createNewDirectory(outDir);for(const [path,bytes]of outputs)await writeNew(target,path,bytes);
 const manifest={schemaVersion:SERVER_ARTIFACT_SCHEMA,artifactVersion:SERVER_ARTIFACT_VERSION,containsCalendarData:false,sourceRevision:revision,sourceState:{revisionMeaning:'BASE_COMMIT_PLUS_ACTUAL_INPUT_HASHES',workingTreeDirty:status.length>0,workingTreeStatusSha256:digest(status)},acceptedServerDataPackContentSha256:SERVER_API_ONLY_ACCEPTED_PIN,rightsStatus:'SERVER_INTERNAL_API_ONLY_CONDITIONAL_USE_CUSTOMER_DATA_DISTRIBUTION_UNRESOLVED',releaseStatus:'NOT_APPROVED_FOR_PUBLIC_RELEASE',runtime:{nodeMajor:22,builtWithNode:process.versions.node,typescript:ts.version,externalDependencies:0,npmInstallRequired:false,gitRequired:false,networkRequired:false,bundledVendorBundles:1,vendorLicenseNotices:8},vendor,sourcePackageSha256:digest(await readFile(join(root,'package.json'))),sourceLockSha256:digest(await readFile(join(root,'package-lock.json'))),compilation:{method:'PINNED_TYPESCRIPT_FRESH_IN_MEMORY_EMIT',diagnostics:0,inputs:[...compiled.inputs].sort(([a],[b])=>a.localeCompare(b,'en')).map(([path,text])=>({path,sha256:digest(text),bytes:Buffer.byteLength(text)})),modules:[...outputs.keys()].filter(path=>compiled.emitted.has(path)).sort().map(path=>({path,sha256:digest(compiled.emitted.get(path).text),sources:compiled.emitted.get(path).sources}))},schemaRelink:{sourcePath:'.kasi-build/schema.js',sourceSha256:digest(schema),outputSha256:digest(outputs.get('.kasi-build/schema.js')),method:'EXISTING_FULL_SCHEMA_XML_IMPORT_RELINK_ONLY'},literalImportAllowlist:INTEGRATED_LITERAL_IMPORTS,sourceInputs,entries:SERVER_ARTIFACT_ENTRIES,files:await hashFiles(target,[...outputs.keys()])};
 await writeNew(target,'artifact-manifest.json',JSON.stringify(manifest,null,2)+'\n');return manifest;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{const o=parsePairs(process.argv.slice(2),['--out']);check(o['--out'],'OUTPUT_REQUIRED');const m=await buildServerOfflineArtifact({outDir:o['--out']});process.stdout.write(JSON.stringify({status:'BUILT',schemaVersion:m.schemaVersion,files:m.files.length,sourceRevision:m.sourceRevision})+'\n');}catch(error){process.stderr.write('OFFLINE_SERVER_BUILD_REJECTED\n');process.exitCode=1;}}
