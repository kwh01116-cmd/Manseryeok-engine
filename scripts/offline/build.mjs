/** Build only the static local calculation module closure; never acquires data. */
import {readFile} from 'node:fs/promises';
import {resolve, dirname, join, relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire, isBuiltin} from 'node:module';
import {execFileSync} from 'node:child_process';
import {assertNode22,check,portable,digest,createNewDirectory,writeNew,hashFiles,parsePairs,ARTIFACT_SCHEMA,BASELINE_PIN} from './integrity.mjs';

export const ENTRIES=Object.freeze(['scripts/kasi/local-chart.mjs','scripts/kasi/local-explain.mjs','scripts/kasi/local-m3-evidence.mjs','scripts/experimental/weighted-support.mjs']);
export const PACKAGING_FILES=Object.freeze(['run.mjs','integrity.mjs','verify.mjs','restore.mjs','attach.mjs']);
const repo=resolve(import.meta.dirname,'../..');
/** Extracts exact compiled statements, rather than reimplementing canonical hashing. */
export function extractSchema(source,ts){
  const ast=ts.createSourceFile('schema.js',source,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS),selected=[];
  const required=new Set(['SERVICES','sha','canonical','fingerprint']);const found=new Set();
  for(const statement of ast.statements){
    if(ts.isImportDeclaration(statement)&&statement.moduleSpecifier.text==='node:crypto'){selected.push(statement.getText(ast));continue;}
    const names=ts.isVariableStatement(statement)?statement.declarationList.declarations.map(d=>ts.isIdentifier(d.name)?d.name.text:''):ts.isFunctionDeclaration(statement)?[statement.name?.text]:[];
    if(names.some(name=>required.has(name))){check(names.every(name=>required.has(name)),'SCHEMA_EXTRACTION_AMBIGUOUS');names.forEach(name=>found.add(name));selected.push(statement.getText(ast));}
  }
  check(found.size===required.size&&selected.length===5,'SCHEMA_EXTRACTION_CONTRACT');
  return '// Exact selected declarations from compiled schema.js; source hash is in artifact-manifest.json.\n'+selected.join('\n')+'\n';
}
function importsIn(source,path,ts){
  const ast=ts.createSourceFile(path,source,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS),imports=[];
  function visit(node){
    if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier)imports.push(node.moduleSpecifier.text);
    if(ts.isCallExpression(node)&&(node.expression.kind===ts.SyntaxKind.ImportKeyword||ts.isIdentifier(node.expression)&&node.expression.text==='require'))throw new Error('DYNAMIC_IMPORT_OR_REQUIRE_REJECTED');
    ts.forEachChild(node,visit);
  }
  visit(ast);return imports;
}
/** Compile in memory: packaged JS can never silently come from a stale dist. */
function freshCompilation(root,ts){
  const emitted=new Map(),inputs=new Map();
  for(const configPath of ['tsconfig.json','tsconfig.kasi.json']){
    const absolute=join(root,configPath),raw=ts.sys.readFile(absolute);check(typeof raw==='string','TSCONFIG_REQUIRED');inputs.set(configPath,raw);
    const configuration=ts.readConfigFile(absolute,ts.sys.readFile);check(!configuration.error,'TSCONFIG_INVALID');
    const parsed=ts.parseJsonConfigFileContent(configuration.config,ts.sys,root);check(parsed.errors.length===0,'TSCONFIG_INVALID');
    const program=ts.createProgram(parsed.fileNames,{...parsed.options,noEmitOnError:true,incremental:false});
    check(ts.getPreEmitDiagnostics(program).length===0,'FRESH_COMPILATION_DIAGNOSTICS');
    const result=program.emit(undefined,(filename,text,_bom,_error,sourceFiles)=>{
      const path=portable(relative(root,filename));check(!path.startsWith('../'),'COMPILER_OUTPUT_ESCAPES_REPOSITORY');
      emitted.set(path,{text,sources:(sourceFiles??[]).map(s=>portable(relative(root,s.fileName))).sort()});
    });
    check(!result.emitSkipped&&result.diagnostics.length===0,'FRESH_COMPILATION_REJECTED');
    for(const source of program.getSourceFiles()){
      const path=portable(relative(root,source.fileName));
      if(!path.startsWith('../')&&!path.startsWith('node_modules/'))inputs.set(path,source.text);
    }
  }
  return {emitted,inputs};
}
export async function buildArtifact({root=repo,outDir,sourceRevision}={}){
  assertNode22();check(typeof outDir==='string'&&outDir.length>0,'OUTPUT_REQUIRED');
  const ts=createRequire(join(root,'package.json'))('typescript');
  check(ts.version==='5.8.3','PINNED_TYPESCRIPT_REQUIRED');
  const git=args=>execFileSync('git',['-c',`safe.directory=${portable(root)}`,'-c','core.excludesFile=',...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  const revision=git(['rev-parse','HEAD']);check(/^[a-f0-9]{40}$/.test(revision),'SOURCE_REVISION_REQUIRED');
  check(sourceRevision===undefined||sourceRevision===revision,'EXPECTED_SOURCE_REVISION_MISMATCH');
  const status=git(['status','--porcelain=v1','--untracked-files=all']);
  const compiled=freshCompilation(root,ts);
  const outputs=new Map(),queue=[...ENTRIES],schemaSource=compiled.emitted.get('.kasi-build/schema.js')?.text;check(schemaSource,'FRESH_SCHEMA_EMIT_REQUIRED');
  while(queue.length){
    const path=queue.shift();if(outputs.has(path))continue;
    check(path==='.kasi-build/schema.js'||path.startsWith('dist/')||ENTRIES.includes(path)||['scripts/kasi/candidate.mjs','scripts/kasi/local-chart-facts.mjs','docs/research/m2-policy-catalog.json'].includes(path),'UNAPPROVED_MODULE_PATH');
    check(!/(?:Fixtures|collector|research|network|client|web)\.(?:m?js)$/.test(path),'ACQUISITION_OR_FIXTURE_MODULE_REJECTED');
    const source=path==='.kasi-build/schema.js'?extractSchema(schemaSource,ts):path.startsWith('dist/')?compiled.emitted.get(path)?.text:await readFile(join(root,path),'utf8');check(typeof source==='string','FRESH_MODULE_EMIT_REQUIRED');outputs.set(path,source);
    for(const specifier of path.endsWith('.json')?[]:importsIn(source,path,ts)){
      if(isBuiltin(specifier)){check(['node:crypto','node:fs/promises','node:path','node:url'].includes(specifier),'UNAPPROVED_BUILTIN_IMPORT');continue;}
      check(specifier.startsWith('.'),'EXTERNAL_PACKAGE_REJECTED');
      const target=portable(relative(root,resolve(root,dirname(path),specifier)));check(!target.startsWith('../'),'MODULE_ESCAPES_REPOSITORY');queue.push(target);
    }
  }
  for(const file of PACKAGING_FILES){
    outputs.set('scripts/offline/'+file,await readFile(join(root,'scripts/offline',file),'utf8'));
    if(file!=='integrity.mjs')outputs.set(file,`import {main} from './scripts/offline/${file}';\nawait main();\n`);
  }
  outputs.set('package.json',JSON.stringify({name:'@manseryeok/offline-engine',version:'0.1.0',private:true,type:'module',engines:{node:'>=22 <23'}},null,2)+'\n');
  outputs.set('THIRD_PARTY_NOTICES.md',await readFile(join(root,'THIRD_PARTY_NOTICES.md'),'utf8'));
  for(const file of ['docs/contracts/offline-support-v1.json','docs/contracts/OFFLINE_ANALYSIS_V1.md'])outputs.set(file,await readFile(join(root,file),'utf8'));
  outputs.set('OFFLINE.txt','Manseryeok offline engine v1\nNode.js 22 is required; no npm install, network, API key or developer path is required.\nCalendar data is deliberately absent. Public data redistribution remains RIGHTS_BLOCKED.\nVerify: node verify.mjs --artifact .\nRun: node run.mjs --mode <chart|explain|evidence|experimental> --attachment <private-data-directory> --output <json|text> <existing explicit calendar/profile/policy arguments>\nAttach approved local data: node attach.mjs --candidate <existing-candidate> --out <path-under-.private>\nRestore verified engine: node restore.mjs --artifact <engine> --out <new-engine-directory>\nOptional private restore: add --attachment <private-data> --private-data-out <new-path-under-.private>\nNo supported birth range, default engine or policy is expanded. Experimental mode requires its existing explicit policy flag.\n');
  const target=await createNewDirectory(outDir);
  for(const [path,bytes]of outputs)await writeNew(target,path,bytes);
  const sourceInputs=[];
  for(const path of [...outputs.keys()].filter(p=>p.startsWith('dist/')||p.startsWith('scripts/')||p.startsWith('docs/')||p==='.kasi-build/schema.js').sort()){
    const bytes=Buffer.from(compiled.emitted.get(path)?.text??await readFile(join(root,path)));sourceInputs.push({path,sha256:digest(bytes),bytes:bytes.length});
  }
  const manifest={schemaVersion:ARTIFACT_SCHEMA,artifactVersion:'0.1.0',containsCalendarData:false,rightsStatus:'DATA_REDISTRIBUTION_RIGHTS_BLOCKED',releaseStatus:'NOT_APPROVED_FOR_PUBLIC_RELEASE',sourceRevision:revision,
    sourceState:{revisionMeaning:'BASE_COMMIT_WITH_ACTUAL_INPUT_HASHES_BELOW',workingTreeDirty:status.length>0,workingTreeStatusSha256:digest(status)},
    runtime:{nodeMajor:22,builtWithNode:process.versions.node,typescript:ts.version,externalDependencies:0},baselineManifestContentSha256:BASELINE_PIN,
    sourcePackageSha256:digest(await readFile(join(root,'package.json'))),sourceLockSha256:digest(await readFile(join(root,'package-lock.json'))),
    compilation:{method:'PINNED_TYPESCRIPT_FRESH_IN_MEMORY_EMIT',diagnostics:0,inputs:[...compiled.inputs].sort(([a],[b])=>a.localeCompare(b,'en')).map(([path,text])=>({path,sha256:digest(text),bytes:Buffer.byteLength(text)})),modules:[...outputs.keys()].filter(path=>compiled.emitted.has(path)).sort().map(path=>({path,sha256:digest(compiled.emitted.get(path).text),sources:compiled.emitted.get(path).sources}))},
    schemaExtraction:{sourcePath:'.kasi-build/schema.js',sourceSha256:digest(schemaSource),outputSha256:digest(outputs.get('.kasi-build/schema.js')),declarations:['SERVICES','sha','canonical','fingerprint'],method:'VERBATIM_FRESH_COMPILED_AST_STATEMENTS'},sourceInputs,
    entries:ENTRIES,files:await hashFiles(target,[...outputs.keys()])};
  await writeNew(target,'artifact-manifest.json',JSON.stringify(manifest,null,2)+'\n');return manifest;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{const options=parsePairs(process.argv.slice(2),['--out']);check(options['--out'],'OUTPUT_REQUIRED');const m=await buildArtifact({outDir:options['--out']});process.stdout.write(JSON.stringify({status:'BUILT',schemaVersion:m.schemaVersion,files:m.files.length,sourceRevision:m.sourceRevision})+'\n');}
  catch{process.stderr.write('OFFLINE_BUILD_REJECTED\n');process.exitCode=1;}
}
