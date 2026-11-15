/** Explicit integrated artifact. v1 buildArtifact and its payload contract stay unchanged. */
import {readFile} from 'node:fs/promises';
import {resolve,dirname,join,relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire,isBuiltin} from 'node:module';
import {execFileSync} from 'node:child_process';
import {ENTRIES,importsIn,freshCompilation} from './build.mjs';
import {assertNode22,check,portable,digest,createNewDirectory,writeNew,hashFiles,parsePairs,BASELINE_PIN} from './integrity.mjs';
import {INTEGRATED_ARTIFACT_SCHEMA,INTEGRATED_ARTIFACT_VERSION} from './integrity-v2.mjs';
const repo=resolve(import.meta.dirname,'../..');
export const INTEGRATED_ENTRIES=Object.freeze([...ENTRIES,'scripts/kasi/local-analysis-report.mjs','scripts/kasi/local-product-report.mjs','scripts/kasi/local-luck.mjs','scripts/kasi/local-luck-projection.mjs']);
export const INTEGRATED_LITERAL_IMPORTS=Object.freeze([{module:'scripts/kasi/local-luck.mjs',specifier:'./local-luck-projection.mjs',purpose:'EXISTING_CONDITIONAL_CLI_PROJECTION_BRANCH_INCLUDED_IN_STATIC_CLOSURE'}]);
const PACKAGING=['integrity.mjs','integrity-v2.mjs','run.mjs','run-v2.mjs','verify-v2.mjs','restore-v2.mjs','attach.mjs'];
const VENDOR_BUNDLE_SHA='fbddba1ab4b8874fa6010da7f4f65b52b8e6dcb927b07964e2e16d62fd990647';
const VENDOR_VERSIONS=Object.freeze({'fast-xml-parser':'5.11.2','@nodable/entities':'3.1.0','fast-xml-builder':'1.3.1','is-unsafe':'2.0.2','path-expression-matcher':'1.6.2','strnum':'2.5.1','xml-naming':'0.3.0','anynum':'1.0.1'});
const nodableLicenseSource={surface:'UPSTREAM_LICENSE_SNAPSHOT_PLUS_INSTALLED_PACKAGE_MIT_DECLARATION',checkedOn:'2026-11-14',revision:'b89ecb0d419969e2989b74c5304bc9b66931727e',url:'https://raw.githubusercontent.com/nodable/val-parsers/b89ecb0d419969e2989b74c5304bc9b66931727e/LICENSE',limitation:'Installed package 3.1.0 omits a LICENSE file. Package and lock declare MIT; upstream fixed-revision notice is included without claiming an exact release-tag link or legal certification.'};
/** One pre-existing CLI import is a fixed literal, not runtime-selected code. */
export function integratedImportsIn(source,path,ts){
  const ast=ts.createSourceFile(path,source,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS),imports=[];
  function visit(node){
    if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier)imports.push(node.moduleSpecifier.text);
    if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&node.expression.text==='require')throw new Error('DYNAMIC_IMPORT_OR_REQUIRE_REJECTED');
    if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword){
      const value=node.arguments[0];check(node.arguments.length===1&&value&&ts.isStringLiteral(value)&&INTEGRATED_LITERAL_IMPORTS.some(rule=>rule.module===path&&rule.specifier===value.text),'UNAPPROVED_INTEGRATED_DYNAMIC_IMPORT');imports.push(value.text);
    }
    ts.forEachChild(node,visit);
  }visit(ast);return imports;
}
export function relinkIntegratedSchema(source,ts){
  const ast=ts.createSourceFile('schema.js',source,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS);
  const links=ast.statements.filter(s=>ts.isImportDeclaration(s)&&s.moduleSpecifier.text==='fast-xml-parser');check(links.length===1,'PINNED_XML_IMPORT_REQUIRED');
  const link=links[0];check(link.importClause?.namedBindings&&ts.isNamedImports(link.importClause.namedBindings),'PINNED_XML_NAMED_IMPORT_REQUIRED');
  check(link.importClause.namedBindings.elements.map(e=>e.name.text).join(',')==='XMLParser,XMLValidator','PINNED_XML_IMPORT_NAMES');
  const text=source.slice(0,link.getStart(ast))+"import __offlineXmlParserBundle from '../vendor/fast-xml-parser.cjs';\nconst { XMLParser, XMLValidator } = __offlineXmlParserBundle;"+source.slice(link.end);
  check(!importsIn(text,'schema.js',ts).some(s=>!s.startsWith('.')&&!isBuiltin(s)),'SCHEMA_EXTERNAL_IMPORT_REMAINS');return text;
}
export function verifySelfContainedVendor(source,ts){
  check(digest(Buffer.from(source))===VENDOR_BUNDLE_SHA,'PINNED_XML_VENDOR_BYTES_REQUIRED');
  check(importsIn(source,'fxp.cjs',ts).length===0,'XML_VENDOR_EXTERNAL_IMPORT');
  const ast=ts.createSourceFile('fxp.cjs',source,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS);
  const forbidden=new Set(['fetch','XMLHttpRequest','eval','Function']);
  function visit(node){if((ts.isCallExpression(node)||ts.isNewExpression(node))&&ts.isIdentifier(node.expression))check(!forbidden.has(node.expression.text),'XML_VENDOR_DYNAMIC_OR_NETWORK_CALL');ts.forEachChild(node,visit);}visit(ast);return true;
}
export async function addVendor(root,outputs,ts){
  const lock=JSON.parse(await readFile(join(root,'package-lock.json'),'utf8')),packages=[],sourceInputs=[];
  for(const [name,version]of Object.entries(VENDOR_VERSIONS)){
    const path='node_modules/'+name,bytes=await readFile(join(root,path,'package.json')),installed=JSON.parse(bytes),locked=lock.packages[path];
    check(installed.name===name&&installed.version===version&&installed.license==='MIT'&&locked?.version===version&&locked.license==='MIT'&&typeof locked.integrity==='string','PINNED_VENDOR_PACKAGE_METADATA');
    const originalLicensePath=name==='@nodable/entities'?'docs/contracts/offline-v2-vendor-licenses/NODABLE-LICENSE.txt':path+'/LICENSE';
    const license=await readFile(join(root,originalLicensePath));check(license.toString('utf8').includes('MIT License')&&license.toString('utf8').includes('Permission is hereby granted'),'MIT_NOTICE_REQUIRED');
    const key=name.replace(/[@/]/g,'_'),licensePath='vendor/licenses/'+key+'-LICENSE.txt';outputs.set(licensePath,license);
    const info={name,version,license:'MIT',upstreamRepository:installed.repository,lockIntegrity:locked.integrity,installedMetadataSha256:digest(bytes),licensePath,licenseSha256:digest(license),licenseEvidence:name==='@nodable/entities'?nodableLicenseSource:{surface:'INSTALLED_PINNED_PACKAGE_LICENSE',sourcePath:originalLicensePath}};
    packages.push(info);sourceInputs.push({path:path+'/package.json',bytes:bytes.length,sha256:digest(bytes)},{path:originalLicensePath,bytes:license.length,sha256:digest(license)});
  }
  const sourcePath='node_modules/fast-xml-parser/lib/fxp.cjs',bundle=await readFile(join(root,sourcePath));verifySelfContainedVendor(bundle.toString('utf8'),ts);outputs.set('vendor/fast-xml-parser.cjs',bundle);sourceInputs.push({path:sourcePath,bytes:bundle.length,sha256:digest(bundle)});
  const vendor={bundle:{name:'fast-xml-parser',version:'5.11.2',path:'vendor/fast-xml-parser.cjs',sha256:digest(bundle),sourcePath,sourceHashExpectation:'FIXED_BASELINE_CONSTANT_NOT_READ_FROM_TARGET_MANIFEST',format:'UPSTREAM_SELF_CONTAINED_COMMONJS_BUNDLE',externalRequireOrImportCount:0,embeddedComponentVersions:'NOT_INDEPENDENTLY_VERIFIED'},packages,packageInventoryMeaning:'LOCKED_INSTALLED_DECLARED_DEPENDENCY_NOTICES_NOT_EMBEDDED_BUNDLE_VERSION_ATTESTATION',scope:'EXISTING_LOCKED_MIT_RUNTIME_PARSER_BUNDLE_ONLY_NO_NPM_INSTALL_OR_NETWORK',rightsReview:'LICENSE_NOTICES_PRESERVED_NOT_LEGAL_CERTIFICATION'};
  outputs.set('vendor/VENDORED_DEPENDENCIES.json',JSON.stringify(vendor,null,2)+'\n');return {vendor,sourceInputs};
}
const allowedScript=path=>INTEGRATED_ENTRIES.includes(path)||['scripts/kasi/candidate.mjs','scripts/kasi/local-chart-facts.mjs','scripts/kasi/boundary-supplement.mjs','scripts/kasi/local-monthly-luck.mjs'].includes(path);
export async function buildIntegratedArtifact({root=repo,outDir,sourceRevision}={}){
  assertNode22();check(typeof outDir==='string'&&outDir.length>0,'OUTPUT_REQUIRED');
  const ts=createRequire(join(root,'package.json'))('typescript');check(ts.version==='5.8.3','PINNED_TYPESCRIPT_REQUIRED');
  const git=args=>execFileSync('git',['-c',`safe.directory=${portable(root)}`,'-c','core.excludesFile=',...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  const revision=git(['rev-parse','HEAD']);check(/^[a-f0-9]{40}$/.test(revision),'SOURCE_REVISION_REQUIRED');check(sourceRevision===undefined||sourceRevision===revision,'EXPECTED_SOURCE_REVISION_MISMATCH');const status=git(['status','--porcelain=v1','--untracked-files=all']);
  const compiled=freshCompilation(root,ts),outputs=new Map(),queue=[...INTEGRATED_ENTRIES],schemaSource=compiled.emitted.get('.kasi-build/schema.js')?.text;check(schemaSource,'FRESH_SCHEMA_EMIT_REQUIRED');
  const {vendor,sourceInputs:vendorInputs}=await addVendor(root,outputs,ts);
  while(queue.length){
    const path=queue.shift();if(outputs.has(path))continue;
    check(path==='.kasi-build/schema.js'||path.startsWith('dist/')||allowedScript(path)||path==='docs/research/m2-policy-catalog.json','UNAPPROVED_INTEGRATED_MODULE_PATH');
    check(!/(?:Fixtures|collector|research|network|client|web)\.(?:m?js)$/.test(path),'ACQUISITION_OR_FIXTURE_MODULE_REJECTED');
    const source=path==='.kasi-build/schema.js'?relinkIntegratedSchema(schemaSource,ts):path.startsWith('dist/')?compiled.emitted.get(path)?.text:await readFile(join(root,path),'utf8');check(typeof source==='string','FRESH_MODULE_EMIT_REQUIRED');outputs.set(path,source);
    for(const specifier of path.endsWith('.json')?[]:integratedImportsIn(source,path,ts)){
      if(isBuiltin(specifier)){check(['node:crypto','node:fs/promises','node:path','node:url'].includes(specifier),'UNAPPROVED_INTEGRATED_BUILTIN_IMPORT');continue;}
      check(specifier.startsWith('.'),'EXTERNAL_PACKAGE_REJECTED');const target=portable(relative(root,resolve(root,dirname(path),specifier)));check(!target.startsWith('../'),'MODULE_ESCAPES_REPOSITORY');queue.push(target);
    }
  }
  for(const file of PACKAGING)outputs.set('scripts/offline/'+file,await readFile(join(root,'scripts/offline',file),'utf8'));
  for(const [entry,file]of [['run.mjs','run-v2.mjs'],['verify.mjs','verify-v2.mjs'],['restore.mjs','restore-v2.mjs'],['attach.mjs','attach.mjs']])outputs.set(entry,`import {main} from './scripts/offline/${file}';\nawait main();\n`);
  outputs.set('package.json',JSON.stringify({name:'@manseryeok/offline-integrated-engine',version:INTEGRATED_ARTIFACT_VERSION,private:true,type:'module',engines:{node:'>=22 <23'}},null,2)+'\n');
  outputs.set('THIRD_PARTY_NOTICES.md',await readFile(join(root,'THIRD_PARTY_NOTICES.md'),'utf8'));
  for(const path of ['docs/contracts/offline-support-v1.json','docs/contracts/OFFLINE_ANALYSIS_V1.md','docs/contracts/OFFLINE_INTEGRATED_ANALYSIS_V2.md'])outputs.set(path,await readFile(join(root,path),'utf8'));
  outputs.set('OFFLINE.txt','Manseryeok integrated offline engine v2\nNode.js22 is required; no npm install, Git, network, API key or developer source path is required at runtime.\nCalendar data is absent. Data redistribution remains RIGHTS_BLOCKED and public release is not approved.\nVerify: node verify.mjs --artifact .\nRun: node run.mjs --mode product --attachment <private-data-directory> --report-profile <explicit-product-profile> --m5-policy <explicit-purpose-policy> --detail <summary|detailed> --output <json|text> <explicit-birth-and-policy-arguments>\nLegacy chart/explain/evidence/experimental modes preserve their original adapters.\nRestore: node restore.mjs --artifact <engine> --out <new-engine-directory> [--attachment <data> --private-data-out <new-path-under-.private>]\nThe XML parser is a pinned local upstream bundle with all eight MIT notices; no bare package resolution or install is required.\nNo supported birth year, clock policy or interpretation gate is expanded.\n');
  const sourceInputs=[...vendorInputs];
  for(const path of [...outputs.keys()].filter(p=>p.startsWith('dist/')||p.startsWith('scripts/')||p.startsWith('docs/')||p==='.kasi-build/schema.js').sort()){
    const bytes=Buffer.from(compiled.emitted.get(path)?.text??await readFile(join(root,path)));sourceInputs.push({path,sha256:digest(bytes),bytes:bytes.length});
  }
  const target=await createNewDirectory(outDir);for(const [path,bytes]of outputs)await writeNew(target,path,bytes);
  const manifest={schemaVersion:INTEGRATED_ARTIFACT_SCHEMA,artifactVersion:INTEGRATED_ARTIFACT_VERSION,containsCalendarData:false,rightsStatus:'DATA_REDISTRIBUTION_RIGHTS_BLOCKED',releaseStatus:'NOT_APPROVED_FOR_PUBLIC_RELEASE',sourceRevision:revision,
    sourceState:{revisionMeaning:'BASE_COMMIT_WITH_ACTUAL_INPUT_HASHES_BELOW',workingTreeDirty:status.length>0,workingTreeStatusSha256:digest(status)},baselineManifestContentSha256:BASELINE_PIN,
    runtime:{nodeMajor:22,builtWithNode:process.versions.node,typescript:ts.version,externalDependencies:0,npmInstallRequired:false,gitRequired:false,networkRequired:false,bundledVendorBundles:1,vendorLicenseNotices:8},vendor,
    sourcePackageSha256:digest(await readFile(join(root,'package.json'))),sourceLockSha256:digest(await readFile(join(root,'package-lock.json'))),
    compilation:{method:'PINNED_TYPESCRIPT_FRESH_IN_MEMORY_EMIT',diagnostics:0,inputs:[...compiled.inputs].sort(([a],[b])=>a.localeCompare(b,'en')).map(([path,text])=>({path,sha256:digest(text),bytes:Buffer.byteLength(text)})),modules:[...outputs.keys()].filter(path=>compiled.emitted.has(path)).sort().map(path=>({path,sha256:digest(compiled.emitted.get(path).text),sources:compiled.emitted.get(path).sources}))},
    schemaRelink:{sourcePath:'.kasi-build/schema.js',sourceSha256:digest(schemaSource),outputSha256:digest(outputs.get('.kasi-build/schema.js')),method:'VERBATIM_FRESH_COMPILED_SCHEMA_EXCEPT_LOCAL_PINNED_XML_IMPORT_RELINK',transformedDeclaration:'XMLParser/XMLValidator import only'},literalImportAllowlist:INTEGRATED_LITERAL_IMPORTS,sourceInputs,entries:INTEGRATED_ENTRIES,files:await hashFiles(target,[...outputs.keys()])};
  await writeNew(target,'artifact-manifest.json',JSON.stringify(manifest,null,2)+'\n');return manifest;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{const options=parsePairs(process.argv.slice(2),['--out']);check(options['--out'],'OUTPUT_REQUIRED');const m=await buildIntegratedArtifact({outDir:options['--out']});process.stdout.write(JSON.stringify({status:'BUILT',schemaVersion:m.schemaVersion,files:m.files.length,sourceRevision:m.sourceRevision})+'\n');}catch{process.stderr.write('OFFLINE_INTEGRATED_BUILD_REJECTED\n');process.exitCode=1;}}
