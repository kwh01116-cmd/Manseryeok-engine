/** API-only server data is a separately accepted derivation, not a G0 receipt. */
export const SERVER_API_ONLY_PACK_SCHEMA='manseryeok-server-api-only-data-pack-v1';
export const SERVER_API_ONLY_CALENDAR_SCHEMA='manseryeok-server-api-only-calendar-v1';
export const SERVER_API_ONLY_PACK_VERSION='1.0.0';
export const SERVER_API_ONLY_PACK_ID='KASI-SERVER-API-ONLY-1950-2027-V01';
export const SERVER_API_ONLY_BASE_PIN='8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf';
export const SERVER_API_ONLY_EXPORT_PIN='7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851';
export const SERVER_API_ONLY_BOUNDARY_PIN='f6a0e6dd2b169b4e758f8d1326942556c59f569af714adcb36e73824c6ef02b7';
export const SERVER_API_ONLY_ANNUAL_PIN='77da197d925e5a8907990960530a85454cf87a829745ee9b012c6c328c891a0b';
// This value is recorded only after review of a real pack, never read from its manifest.
export const SERVER_API_ONLY_ACCEPTED_PIN='a2bfbf35aff7bb8b11aef277a7be8d5ea5204c786a9142649bec23d27dfd289a';
export const SERVER_API_ONLY_FILES=Object.freeze(['calendar.json','sources.json','raw-responses.ndjson','NOTICE.txt']);
export const SERVER_API_ONLY_RIGHTS=Object.freeze({
  auditId:'KASI-DATA-RIGHTS-DISTRIBUTION-AUDIT-V01',
  apiOnlyInternalUse:'VERIFIED_ALLOWED_WITH_CONDITIONS',
  distribution:'SERVER_INTERNAL_ONLY_NO_CUSTOMER_DATA_FILE_DISTRIBUTION',
  publicFileDistribution:'UNRESOLVED',
  officialCertification:false,
});
export const SERVER_API_ONLY_NOTICE=[
  'Manseryeok-engine API-only server data pack v1',
  'Source provider: Korea Astronomy and Space Science Institute (KASI / 한국천문연구원).',
  '15012679 getLunCalInfo: https://www.data.go.kr/data/15012679/openapi.do',
  '15012690 get24DivisionsInfo: https://www.data.go.kr/data/15012690/openapi.do',
  'Source responses were captured previously; no API request is made by this pack.',
  'Official catalog permission and source scope: docs/research/KASI_DATA_RIGHTS_DISTRIBUTION_AUDIT_V01.md (2026-11-15).',
  'This derived pack is for server-internal use with provenance and notices retained.',
  'It is not a KASI certification, a G0 receipt, a public-release approval, or a new historical-clock policy.',
  'No annual TXT, KASA publication, OSS calendar table, comparison fixture, exception patch, credential, or acquisition log is included.',
  'Calendar data availability does not extend the separately selected birth/clock policy.',
].join('\n')+'\n';
