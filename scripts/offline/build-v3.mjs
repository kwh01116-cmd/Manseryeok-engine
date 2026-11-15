/** Fresh extended closure; original v1/v2 entries and output schemas remain explicit. */
import {readFile} from 'node:fs/promises';
import {resolve,dirname,join,relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire,isBuiltin} from 'node:module';
import {execFileSync} from 'node:child_process';
import {freshCompilation} from './build.mjs';
import {INTEGRATED_ENTRIES,INTEGRATED_LITERAL_IMPORTS,integratedImportsIn,relinkIntegratedSchema,addVendor} from './build-v2.mjs';
import {assertNode22,check,portable,digest,createNewDirectory,writeNew,hashFiles,parsePairs,BASELINE_PIN} from './integrity.mjs';
import {EXTENDED_ARTIFACT_SCHEMA,EXTENDED_ARTIFACT_VERSION,ACCEPTED_BOUNDARY_PIN,ACCEPTED_ANNUAL_SOLAR_PIN,EXTENDED_PROFILES} from './integrity-v3.mjs';
const repo=resolve(import.meta.dirname,'../..');
export const EXTENDED_ENTRIES=Object.freeze([...INTEGRATED_ENTRIES,'scripts/kasi/local-extended-report.mjs']);
const packaging=['integrity.mjs','integrity-v2.mjs','integrity-v3.mjs','run.mjs','run-v2.mjs','run-v3.mjs','verify-v3.mjs','restore-v3.mjs','attach-v3.mjs'];
const allowed=new Set([...EXTENDED_ENTRIES,'scripts/kasi/candidate.mjs','scripts/kasi/local-chart-facts.mjs','scripts/kasi/boundary-supplement.mjs','scripts/kasi/local-monthly-luck.mjs','scripts/kasi/annual-solar-extension.mjs','scripts/kasi/local-extended-chart.mjs']);
export async function buildExtendedArtifact({root=repo,outDir,sourceRevision}={}){
 assertNode22();check(typeof outDir==='string'&&outDir.length>0,'OUTPUT_REQUIRED');
 const ts=createRequire(join(root,'package.json'))('typescript');check(ts.version==='5.8.3','PINNED_TYPESCRIPT_REQUIRED');
 const git=args=>execFileSync('git',['-c','safe.directory='+portable(root),'-c','core.excludesFile=',...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 const revision=git(['rev-parse','HEAD']),status=git(['status','--porcelain=v1','--untracked-files=all']);check(/^[a-f0-9]{40}$/.test(revision)&&(!sourceRevision||sourceRevision===revision),'SOURCE_REVISION_REQUIRED');
 const compiled=freshCompilation(root,ts),outputs=new Map(),queue=[...EXTENDED_ENTRIES],schema=compiled.emitted.get('.kasi-build/schema.js')?.text;check(schema,'FRESH_SCHEMA_EMIT_REQUIRED');
 const {vendor,sourceInputs:vendorInputs}=await addVendor(root,outputs,ts);
 while(queue.length){
  const path=queue.shift();if(outputs.has(path))continue;
  check(path==='.kasi-build/schema.js'||path.startsWith('dist/')||allowed.has(path)||path==='docs/research/m2-policy-catalog.json','UNAPPROVED_EXTENDED_MODULE_PATH');
  check(!/(?:Fixtures|collector|research|network|client|web)\.(?:m?js)$/.test(path),'ACQUISITION_OR_FIXTURE_MODULE_REJECTED');
  const source=path==='.kasi-build/schema.js'?relinkIntegratedSchema(schema,ts):path.startsWith('dist/')?compiled.emitted.get(path)?.text:await readFile(join(root,path),'utf8');check(typeof source==='string','FRESH_MODULE_EMIT_REQUIRED');outputs.set(path,source);
  for(const specifier of path.endsWith('.json')?[]:integratedImportsIn(source,path,ts)){
   if(isBuiltin(specifier)){check(['node:crypto','node:fs/promises','node:path','node:url'].includes(specifier),'UNAPPROVED_EXTENDED_BUILTIN_IMPORT');continue;}
   check(specifier.startsWith('.'),'EXTERNAL_PACKAGE_REJECTED');const target=portable(relative(root,resolve(root,dirname(path),specifier)));check(!target.startsWith('../'),'MODULE_ESCAPES_REPOSITORY');queue.push(target);
  }
 }
 for(const file of packaging)outputs.set('scripts/offline/'+file,await readFile(join(root,'scripts/offline',file),'utf8'));
 for(const [entry,file]of [['run.mjs','run-v3.mjs'],['verify.mjs','verify-v3.mjs'],['restore.mjs','restore-v3.mjs'],['attach.mjs','attach-v3.mjs']])outputs.set(entry,`import {main} from './scripts/offline/${file}';\nawait main();\n`);
 outputs.set('package.json',JSON.stringify({name:'@manseryeok/offline-extended-engine',version:EXTENDED_ARTIFACT_VERSION,private:true,type:'module',engines:{node:'>=22 <23'}},null,2)+'\n');
 outputs.set('THIRD_PARTY_NOTICES.md',await readFile(join(root,'THIRD_PARTY_NOTICES.md'),'utf8'));
 for(const path of ['docs/contracts/offline-support-v1.json','docs/contracts/OFFLINE_ANALYSIS_V1.md','docs/contracts/OFFLINE_INTEGRATED_ANALYSIS_V2.md','docs/contracts/OFFLINE_EXTENDED_ANALYSIS_V3.md','docs/research/KASI_DATA_RIGHTS_DISTRIBUTION_AUDIT_V01.md'])outputs.set(path,await readFile(join(root,path),'utf8'));
 outputs.set('OFFLINE.txt','Manseryeok extended offline engine v3\nNode22 only at runtime: no npm, Git, API key, network or developer source imports.\nCalendar corpus is excluded. Attach the separately accepted private base and 2027 boundary files.\nAPI-only internal-use license evidence is distinct from whole-attachment redistribution, which remains unresolved. Public release is not approved.\nExplicit extended-product mode selects the new report/profile; existing product/chart/explain/evidence/experimental modes retain their original DTOs.\nHistorical profile supports only the explicitly verified standard-clock cohort, never all1950-1988. Future profile is solar/Gregorian only for2027; missing lunar/2028 data are not invented.\nVerify: node verify.mjs --artifact . --attachment <private-data>\nRestore: node restore.mjs --artifact <engine> --out <new-engine> [--attachment <private-data> --private-data-out <new-.private-path>]\n');
 // Entry wrappers and manually included packaging modules are part of the same
 // closure proof; do not rely on merely discovering calculator dependencies.
 for(const [path,bytes]of outputs)if(/\.(?:mjs|js)$/.test(path))for(const specifier of integratedImportsIn(String(bytes),path,ts)){
  if(isBuiltin(specifier)){check(['node:crypto','node:fs/promises','node:path','node:url'].includes(specifier),'UNAPPROVED_EXTENDED_PACKAGING_BUILTIN');continue;}
  check(specifier.startsWith('.'),'EXTENDED_PACKAGING_EXTERNAL_IMPORT');const target=portable(relative(root,resolve(root,dirname(path),specifier)));check(outputs.has(target),'EXTENDED_PACKAGING_CLOSURE_MISSING');
 }
 const sourceInputs=[...vendorInputs];
 for(const path of [...outputs.keys()].filter(p=>p.startsWith('dist/')||p.startsWith('scripts/')||p.startsWith('docs/')||p==='.kasi-build/schema.js').sort()){const bytes=Buffer.from(compiled.emitted.get(path)?.text??await readFile(join(root,path)));sourceInputs.push({path,sha256:digest(bytes),bytes:bytes.length});}
 const target=await createNewDirectory(outDir);for(const [path,bytes]of outputs)await writeNew(target,path,bytes);
 const manifest={schemaVersion:EXTENDED_ARTIFACT_SCHEMA,artifactVersion:EXTENDED_ARTIFACT_VERSION,containsCalendarData:false,sourceRevision:revision,sourceState:{revisionMeaning:'BASE_COMMIT_PLUS_ACTUAL_INPUT_HASHES',workingTreeDirty:status.length>0,workingTreeStatusSha256:digest(status)},baselineManifestContentSha256:BASELINE_PIN,boundarySupplementContentSha256:ACCEPTED_BOUNDARY_PIN,annualSolarContentSha256:ACCEPTED_ANNUAL_SOLAR_PIN,extendedProfiles:[...EXTENDED_PROFILES],rightsStatus:'DATA_DISTRIBUTION_UNRESOLVED_PRIVATE_ONLY',releaseStatus:'NOT_APPROVED_FOR_PUBLIC_RELEASE',runtime:{nodeMajor:22,builtWithNode:process.versions.node,typescript:ts.version,externalDependencies:0,npmInstallRequired:false,gitRequired:false,networkRequired:false,bundledVendorBundles:1,vendorLicenseNotices:8},vendor,sourcePackageSha256:digest(await readFile(join(root,'package.json'))),sourceLockSha256:digest(await readFile(join(root,'package-lock.json'))),compilation:{method:'PINNED_TYPESCRIPT_FRESH_IN_MEMORY_EMIT',diagnostics:0,inputs:[...compiled.inputs].sort(([a],[b])=>a.localeCompare(b,'en')).map(([path,text])=>({path,sha256:digest(text),bytes:Buffer.byteLength(text)})),modules:[...outputs.keys()].filter(path=>compiled.emitted.has(path)).sort().map(path=>({path,sha256:digest(compiled.emitted.get(path).text),sources:compiled.emitted.get(path).sources}))},schemaRelink:{sourcePath:'.kasi-build/schema.js',sourceSha256:digest(schema),outputSha256:digest(outputs.get('.kasi-build/schema.js')),method:'EXISTING_FULL_SCHEMA_XML_IMPORT_RELINK_ONLY'},literalImportAllowlist:INTEGRATED_LITERAL_IMPORTS,sourceInputs,entries:EXTENDED_ENTRIES,files:await hashFiles(target,[...outputs.keys()])};
 await writeNew(target,'artifact-manifest.json',JSON.stringify(manifest,null,2)+'\n');return manifest;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{const o=parsePairs(process.argv.slice(2),['--out']);check(o['--out'],'OUTPUT_REQUIRED');const m=await buildExtendedArtifact({outDir:o['--out']});process.stdout.write(JSON.stringify({status:'BUILT',schemaVersion:m.schemaVersion,files:m.files.length,sourceRevision:m.sourceRevision})+'\n');}catch{process.stderr.write('OFFLINE_EXTENDED_BUILD_REJECTED\n');process.exitCode=1;}}
