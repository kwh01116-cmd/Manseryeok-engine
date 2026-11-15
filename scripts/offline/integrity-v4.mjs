/** Data-free server engine plus a separately accepted, server-internal API-only pack. */
import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {check,verifyFileRecords} from './integrity.mjs';
import {loadServerApiOnlyDataPack} from '../server-data/load.mjs';
import {SERVER_API_ONLY_ACCEPTED_PIN,SERVER_API_ONLY_RIGHTS,SERVER_API_ONLY_FILES} from '../server-data/constants.mjs';
export const SERVER_ARTIFACT_SCHEMA='manseryeok-offline-server-api-only-engine-v4';
export const SERVER_ARTIFACT_VERSION='0.4.0';
export const SERVER_ARTIFACT_DATA_FILES=Object.freeze(['manifest.json',...SERVER_API_ONLY_FILES].sort());
export async function verifyServerOfflineArtifact(directory){
 const root=resolve(directory),m=JSON.parse(await readFile(join(root,'artifact-manifest.json'),'utf8'));
 check(m.schemaVersion===SERVER_ARTIFACT_SCHEMA&&m.artifactVersion===SERVER_ARTIFACT_VERSION,'SERVER_ARTIFACT_CONTRACT');
 check(/^[a-f0-9]{40}$/.test(m.sourceRevision??'')&&m.sourceState?.revisionMeaning==='BASE_COMMIT_PLUS_ACTUAL_INPUT_HASHES'&&typeof m.sourceState.workingTreeDirty==='boolean'&&/^[a-f0-9]{64}$/.test(m.sourceState.workingTreeStatusSha256??''),'SERVER_ARTIFACT_SOURCE_IDENTITY');
 check(m.containsCalendarData===false&&m.acceptedServerDataPackContentSha256===SERVER_API_ONLY_ACCEPTED_PIN,'SERVER_ARTIFACT_DATA_PIN');
 check(m.releaseStatus==='NOT_APPROVED_FOR_PUBLIC_RELEASE'&&m.rightsStatus==='SERVER_INTERNAL_API_ONLY_CONDITIONAL_USE_CUSTOMER_DATA_DISTRIBUTION_UNRESOLVED','SERVER_ARTIFACT_RIGHTS');
 check(m.runtime?.nodeMajor===22&&m.runtime.externalDependencies===0&&m.runtime.npmInstallRequired===false&&m.runtime.gitRequired===false&&m.runtime.networkRequired===false,'SERVER_ARTIFACT_RUNTIME');
 check(m.vendor?.bundle?.version==='5.11.2'&&m.vendor.bundle.path==='vendor/fast-xml-parser.cjs'&&m.vendor.bundle.sha256==='fbddba1ab4b8874fa6010da7f4f65b52b8e6dcb927b07964e2e16d62fd990647','SERVER_ARTIFACT_VENDOR');
 check(Array.isArray(m.vendor.packages)&&m.vendor.packages.length===8&&m.vendor.packages.every(p=>p.license==='MIT'),'SERVER_ARTIFACT_VENDOR_NOTICES');
 const files=await verifyFileRecords(root,m.files,'artifact-manifest.json');check(files.some(f=>f.path===m.vendor.bundle.path&&f.sha256===m.vendor.bundle.sha256),'SERVER_ARTIFACT_VENDOR_FILE');
 for(const p of m.vendor.packages)check(files.some(f=>f.path===p.licensePath&&f.sha256===p.licenseSha256),'SERVER_ARTIFACT_LICENSE_FILE');
 check(files.some(f=>f.path==='scripts/server/engine.mjs')&&files.some(f=>f.path==='scripts/server-data/load.mjs')&&files.every(f=>!/(?:^|\/)(?:\.private|node_modules)\/|(?:collector|research|Fixtures)\.(?:m?js)$/.test(f.path)),'SERVER_ARTIFACT_FIXED_CLOSURE');
 return m;
}
export async function verifyServerOfflineDataPack(directory){const loaded=await loadServerApiOnlyDataPack({directory});check(loaded.manifest.rights.apiOnlyInternalUse===SERVER_API_ONLY_RIGHTS.apiOnlyInternalUse,'SERVER_PACK_RIGHTS');return loaded.manifest;}
