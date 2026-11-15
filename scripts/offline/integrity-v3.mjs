/** Extended artifact checks. Original data pins and v1/v2 contracts are unchanged. */
import {readFile,lstat} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {fingerprint} from '../../.kasi-build/schema.js';
import {loadCandidate} from '../kasi/candidate.mjs';
import {loadExisting2027AnnualSolarExtension,ANNUAL_SOLAR_EXTENSION_POLICY_ID} from '../kasi/annual-solar-extension.mjs';
import {check,verifyFileRecords,hashFiles,rejectSymlinkAncestors,BASELINE_PIN,DATA_FILES} from './integrity.mjs';

export const EXTENDED_ARTIFACT_SCHEMA='manseryeok-offline-extended-engine-v3';
export const EXTENDED_ARTIFACT_VERSION='0.3.0';
export const EXTENDED_ATTACHMENT_SCHEMA='manseryeok-private-extended-data-v3';
export const ACCEPTED_BOUNDARY_PIN='f6a0e6dd2b169b4e758f8d1326942556c59f569af714adcb36e73824c6ef02b7';
export const ACCEPTED_ANNUAL_SOLAR_PIN='77da197d925e5a8907990960530a85454cf87a829745ee9b012c6c328c891a0b';
export const ACCEPTED_BOUNDARY_TREE_PIN='47fdc994a0eb7834cf99c63bafb6d23121a1aa490b0370485690eefaa149d5c9';
export const EXTENDED_PROFILES=Object.freeze(['kasi-api-1962-1986-standard-local-v1','kasi-api-1989-2027-solar-local-v1']);
export const BOUNDARY_FILES=Object.freeze(['attempts.ndjson','collection-receipt.json','manifest.json','raw/c3f44cf293a31acd600cae4ebf65063f7cdac55ab0adceba7e05ed36c5660dc0.body','receipts/ec924b8eb697f3d47e826da6dce51d60bbb1cc7bb4464a1dbc1abc24ed86f557.json'].sort());
export const EXTENDED_DATA_FILES=Object.freeze([...DATA_FILES.map(path=>'base/'+path),...BOUNDARY_FILES.map(path=>'boundary/'+path)].sort());
export const EXTENDED_DATA_RIGHTS=Object.freeze({apiOnlyInternalUse:'VERIFIED_ALLOWED_WITH_CONDITIONS',wholeAttachmentDistribution:'UNRESOLVED',distribution:'PRIVATE_NO_REDISTRIBUTION',auditId:'KASI-DATA-RIGHTS-DISTRIBUTION-AUDIT-V01'});

export async function verifyExtendedArtifact(directory){
 const root=resolve(directory),m=JSON.parse(await readFile(join(root,'artifact-manifest.json'),'utf8'));
 check(m.schemaVersion===EXTENDED_ARTIFACT_SCHEMA&&m.artifactVersion===EXTENDED_ARTIFACT_VERSION,'EXTENDED_ARTIFACT_CONTRACT');
 check(/^[a-f0-9]{40}$/.test(m.sourceRevision??'')&&m.sourceState?.revisionMeaning==='BASE_COMMIT_PLUS_ACTUAL_INPUT_HASHES'&&typeof m.sourceState.workingTreeDirty==='boolean'&&/^[a-f0-9]{64}$/.test(m.sourceState.workingTreeStatusSha256??''),'EXTENDED_SOURCE_IDENTITY_CONTRACT');
 check(m.containsCalendarData===false&&m.baselineManifestContentSha256===BASELINE_PIN&&m.boundarySupplementContentSha256===ACCEPTED_BOUNDARY_PIN&&m.annualSolarContentSha256===ACCEPTED_ANNUAL_SOLAR_PIN,'EXTENDED_ARTIFACT_DATA_PINS');
 check(m.releaseStatus==='NOT_APPROVED_FOR_PUBLIC_RELEASE'&&m.rightsStatus==='DATA_DISTRIBUTION_UNRESOLVED_PRIVATE_ONLY','EXTENDED_ARTIFACT_RIGHTS');
 check(m.runtime?.nodeMajor===22&&m.runtime.externalDependencies===0&&m.runtime.npmInstallRequired===false&&m.runtime.gitRequired===false&&m.runtime.networkRequired===false,'EXTENDED_RUNTIME_CONTRACT');
 check(m.vendor?.bundle?.version==='5.11.2'&&m.vendor.bundle.path==='vendor/fast-xml-parser.cjs'&&m.vendor.bundle.sha256==='fbddba1ab4b8874fa6010da7f4f65b52b8e6dcb927b07964e2e16d62fd990647','EXTENDED_VENDOR_CONTRACT');
 check(Array.isArray(m.vendor.packages)&&m.vendor.packages.length===8&&m.vendor.packages.every(p=>p.license==='MIT'),'EXTENDED_VENDOR_NOTICES');
 const files=await verifyFileRecords(root,m.files,'artifact-manifest.json');
 check(files.some(f=>f.path===m.vendor.bundle.path&&f.sha256===m.vendor.bundle.sha256),'EXTENDED_VENDOR_FILE');
 for(const p of m.vendor.packages)check(files.some(f=>f.path===p.licensePath&&f.sha256===p.licenseSha256),'EXTENDED_VENDOR_LICENSE_FILE');
 check(JSON.stringify(m.extendedProfiles)===JSON.stringify(EXTENDED_PROFILES),'EXTENDED_PROFILE_SET');
 return m;
}

export async function verifyExtendedDataSources({candidateDirectory,boundaryDirectory}){
 for(const [directory,files]of [[candidateDirectory,DATA_FILES],[boundaryDirectory,BOUNDARY_FILES]])for(const path of files){const file=join(directory,path);await rejectSymlinkAncestors(dirname(file));const info=await lstat(file);check(info.isFile()&&!info.isSymbolicLink(),'EXTENDED_SOURCE_PLAIN_FILE_REQUIRED');}
 const candidate=await loadCandidate(candidateDirectory,BASELINE_PIN);
 const boundaryRecords=await hashFiles(boundaryDirectory,BOUNDARY_FILES);
 check(fingerprint(boundaryRecords)===ACCEPTED_BOUNDARY_TREE_PIN,'EXTENDED_BOUNDARY_TREE_PIN_MISMATCH');
 const annual=await loadExisting2027AnnualSolarExtension({directory:boundaryDirectory,expectedAnnualSha256:ACCEPTED_ANNUAL_SOLAR_PIN,expectedSupplementSha256:ACCEPTED_BOUNDARY_PIN,expectedBaseManifestSha256:BASELINE_PIN,policyId:ANNUAL_SOLAR_EXTENSION_POLICY_ID});
 return {candidate,annual,boundaryRecords};
}

export async function verifyExtendedAttachment(directory){
 const root=resolve(directory),m=JSON.parse(await readFile(join(root,'attachment.json'),'utf8'));
 check(m.schemaVersion===EXTENDED_ATTACHMENT_SCHEMA&&m.version==='0.3.0','EXTENDED_ATTACHMENT_CONTRACT');
 check(m.baseManifestContentSha256===BASELINE_PIN&&m.boundarySupplementContentSha256===ACCEPTED_BOUNDARY_PIN&&m.annualSolarContentSha256===ACCEPTED_ANNUAL_SOLAR_PIN&&m.boundarySourceTreeSha256===ACCEPTED_BOUNDARY_TREE_PIN,'EXTENDED_ATTACHMENT_INDEPENDENT_PINS');
 check(m.rights&&JSON.stringify(Object.keys(m.rights).sort())===JSON.stringify(Object.keys(EXTENDED_DATA_RIGHTS).sort())&&Object.entries(EXTENDED_DATA_RIGHTS).every(([key,value])=>m.rights[key]===value)&&m.optInRequired===true,'EXTENDED_ATTACHMENT_RIGHTS');
 check(JSON.stringify(m.files?.map(row=>row.path))===JSON.stringify(EXTENDED_DATA_FILES),'EXTENDED_ATTACHMENT_FILE_SET');
 await verifyFileRecords(root,m.files,'attachment.json');
 await verifyExtendedDataSources({candidateDirectory:join(root,'base'),boundaryDirectory:join(root,'boundary')});
 return m;
}
