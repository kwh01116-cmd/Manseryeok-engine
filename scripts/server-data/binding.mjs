/** Fixed-content continuity only. No filesystem, response parsing, network, or G0 authority. */
import {fingerprint} from '../../.kasi-build/schema.js';
import {SERVER_API_ONLY_PACK_SCHEMA,SERVER_API_ONLY_PACK_VERSION,SERVER_API_ONLY_PACK_ID,SERVER_API_ONLY_ACCEPTED_PIN,SERVER_API_ONLY_BASE_PIN,SERVER_API_ONLY_BOUNDARY_PIN,SERVER_API_ONLY_ANNUAL_PIN} from './constants.mjs';
const issued=new WeakMap();
function acceptedContent(value){
  if(!value||!Object.isFrozen(value)||!Object.isFrozen(value.manifest)||!Object.isFrozen(value.candidate)||!Object.isFrozen(value.sources)||!Object.isFrozen(value.annualSolarExtension)||!Object.isFrozen(value.apiOnlyIdentity))throw new Error('API_ONLY_FROZEN_LOADER_OBJECT_REQUIRED');
  const manifest=value.manifest;
  if(manifest.schemaVersion!==SERVER_API_ONLY_PACK_SCHEMA||manifest.version!==SERVER_API_ONLY_PACK_VERSION||manifest.id!==SERVER_API_ONLY_PACK_ID||fingerprint(manifest)!==SERVER_API_ONLY_ACCEPTED_PIN)throw new Error('API_ONLY_BINDING_FIXED_MANIFEST_REQUIRED');
  const identity={id:'kasi-server-api-only-'+SERVER_API_ONLY_ACCEPTED_PIN.slice(0,16),version:SERVER_API_ONLY_PACK_VERSION,manifestContentSha256:SERVER_API_ONLY_ACCEPTED_PIN,upstreamBaseManifestSha256:SERVER_API_ONLY_BASE_PIN,upstreamBoundarySupplementSha256:SERVER_API_ONLY_BOUNDARY_PIN,upstreamAnnualSolarSha256:SERVER_API_ONLY_ANNUAL_PIN,rightsReview:'VERIFIED_ALLOWED_WITH_CONDITIONS',validationLevel:'FIXED_API_WHITELIST_RAW_SHA_ROW_LINEAGE_NORMALIZATION_RECHECKED',sourceKind:'KASI_API_ONLY_SERVER_DERIVED',g0Receipt:null,g1P2Promotion:false};
  if(fingerprint(value.apiOnlyIdentity)!==fingerprint(identity))throw new Error('API_ONLY_BINDING_IDENTITY_CHANGED');
  if(fingerprint(value.candidate)!==manifest.projections?.candidateContentSha256||fingerprint(value.sources)!==manifest.projections?.sourceContentSha256)throw new Error('API_ONLY_BINDING_PROJECTION_CHANGED');
  const annual=value.annualSolarExtension;
  if(annual.contentSha256!==SERVER_API_ONLY_ANNUAL_PIN||fingerprint(annual.content)!==SERVER_API_ONLY_ANNUAL_PIN||annual.baseManifestSha256!==SERVER_API_ONLY_BASE_PIN||annual.boundarySupplementSha256!==SERVER_API_ONLY_BOUNDARY_PIN||annual.schemaVersion!==annual.content.schemaVersion||annual.version!==annual.content.version||fingerprint(annual.policy)!==fingerprint(annual.content.policy))throw new Error('API_ONLY_BINDING_ANNUAL_CHANGED');
}
export function bindServerApiOnlyLoaded(value){
  acceptedContent(value);
  if(issued.has(value))throw new Error('API_ONLY_LOADER_ALREADY_BOUND');
  issued.set(value,{manifest:value.manifest,candidate:value.candidate,sources:value.sources,annualSolarExtension:value.annualSolarExtension,identity:value.apiOnlyIdentity});return value;
}
export function verifyServerApiOnlyLoaded(value){
  const receipt=issued.get(value);
  if(!receipt||!Object.isFrozen(value)||receipt.manifest!==value.manifest||receipt.candidate!==value.candidate||receipt.sources!==value.sources||receipt.annualSolarExtension!==value.annualSolarExtension||receipt.identity!==value.apiOnlyIdentity)throw new Error('ISSUED_API_ONLY_LOADER_REQUIRED');
  acceptedContent(value);
  return receipt.identity;
}
