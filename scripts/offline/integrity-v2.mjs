/** v2 format checks reuse the v1 path, file-set and accepted data safeguards. */
import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {check,verifyFileRecords,BASELINE_PIN} from './integrity.mjs';
export const INTEGRATED_ARTIFACT_SCHEMA='manseryeok-offline-integrated-engine-v2';
export const INTEGRATED_ARTIFACT_VERSION='0.2.0';
export async function verifyIntegratedArtifact(directory){
  const root=resolve(directory),manifest=JSON.parse(await readFile(join(root,'artifact-manifest.json'),'utf8'));
  check(manifest.schemaVersion===INTEGRATED_ARTIFACT_SCHEMA&&manifest.artifactVersion===INTEGRATED_ARTIFACT_VERSION,'INTEGRATED_ARTIFACT_CONTRACT');
  check(manifest.containsCalendarData===false&&manifest.baselineManifestContentSha256===BASELINE_PIN&&manifest.rightsStatus==='DATA_REDISTRIBUTION_RIGHTS_BLOCKED'&&manifest.releaseStatus==='NOT_APPROVED_FOR_PUBLIC_RELEASE','INTEGRATED_RIGHTS_AND_DATA_CONTRACT');
  check(manifest.runtime?.nodeMajor===22&&manifest.runtime?.externalDependencies===0&&manifest.runtime?.npmInstallRequired===false&&manifest.runtime?.gitRequired===false,'INTEGRATED_RUNTIME_CONTRACT');
  check(manifest.vendor?.bundle?.version==='5.11.2'&&manifest.vendor.bundle.path==='vendor/fast-xml-parser.cjs'&&manifest.vendor.bundle.sha256==='fbddba1ab4b8874fa6010da7f4f65b52b8e6dcb927b07964e2e16d62fd990647','INTEGRATED_VENDOR_CONTRACT');
  check(Array.isArray(manifest.vendor.packages)&&manifest.vendor.packages.length===8&&manifest.vendor.packages.every(p=>p.license==='MIT'&&typeof p.licensePath==='string'),'INTEGRATED_VENDOR_LICENSES_REQUIRED');
  const files=await verifyFileRecords(root,manifest.files,'artifact-manifest.json');
  check(files.find(f=>f.path===manifest.vendor.bundle.path)?.sha256===manifest.vendor.bundle.sha256,'INTEGRATED_VENDOR_FILE_RECORD');
  for(const p of manifest.vendor.packages)check(files.some(f=>f.path===p.licensePath&&f.sha256===p.licenseSha256),'INTEGRATED_VENDOR_LICENSE_FILE_RECORD');
  return manifest;
}
