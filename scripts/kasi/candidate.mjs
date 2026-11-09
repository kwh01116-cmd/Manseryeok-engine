/** Read-only pinned candidate loader. No acquisition, fixture, or fallback dependencies. */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fingerprint, sha } from '../../.kasi-build/schema.js';
import { gregorianDayNumber as day, gregorianDateFromDayNumber as civil, monthKey } from '../../dist/calendar/koreanLunisolarValidation.js';

export const RESEARCH_VERSION = 'kasi-api-research-v1';
const check = (ok, code) => { if (!ok) throw new Error(code); };
const key = r => monthKey(r.lunarYear, r.lunarMonth, r.leap);
const lunarKey = r => key(r) + ':' + r.lunarDay;

/** A finite observed-date index, not an annual-TXT corpus or Four Pillars resolver. */
export function createResearchIndex(rows) {
  check(Array.isArray(rows) && rows.length > 0, 'INDEX_EMPTY');
  const bySolar = new Map(), byLunar = new Map();
  let previous;
  for (const r of rows) {
    day(r.solarDate);
    check(!bySolar.has(r.solarDate) && !byLunar.has(lunarKey(r)), 'INDEX_DUPLICATE');
    check(!previous || day(r.solarDate) === day(previous.solarDate)+1, 'INDEX_GAP');
    const copy = structuredClone(r);
    bySolar.set(r.solarDate, copy); byLunar.set(lunarKey(r), copy); previous = r;
  }
  const from = rows[0].solarDate, until = civil(day(rows.at(-1).solarDate)+1);
  return Object.freeze({
    from, until,
    fromGregorianDate(date) {
      day(date);
      const value = bySolar.get(date);
      return value ? {status:'OK',value:structuredClone(value)} : {status:'OUT_OF_COVERAGE'};
    },
    fromLunarDate(date) {
      check(date && Number.isInteger(date.lunarYear) && date.lunarYear>0 && Number.isInteger(date.lunarMonth) && date.lunarMonth>=1 && date.lunarMonth<=12 && Number.isInteger(date.lunarDay) && date.lunarDay>=1 && date.lunarDay<=30 && typeof date.leap==='boolean', 'LUNAR_DATE_SHAPE');
      const value = byLunar.get(lunarKey(date));
      return value ? {status:'OK',value:value.solarDate} : {status:'OUT_OF_OBSERVED_COVERAGE'};
    },
  });
}

/** Pin the separately recorded manifest digest before reading a saved candidate. */
export async function loadCandidate(directory, expectedManifestContentSha256) {
  check(/^[a-f0-9]{64}$/.test(expectedManifestContentSha256),'EXPECTED_MANIFEST_SHA_REQUIRED');
  const manifest=JSON.parse(await readFile(join(directory,'manifest.json'),'utf8'));
  check(manifest.schemaVersion==='kasi-private-snapshot-v1' && fingerprint(manifest)===expectedManifestContentSha256,'MANIFEST_DIGEST_CHANGED');
  const values=new Map();
  const names=['candidate.json','comparisons.json','boundary-requirements.json','soljd-audit.json','source-references.json','exceptions.json'];
  check(manifest.derived.length===names.length && new Set(manifest.derived.map(f=>f.path)).size===names.length,'DERIVED_FILE_SET');
  for(const file of manifest.derived) {
    check(names.includes(file.path),'DERIVED_PATH');
    const bytes=await readFile(join(directory,file.path));
    check(sha(bytes)===file.sha256,'DERIVED_FILE_DIGEST_CHANGED');
    const value=JSON.parse(bytes);check(fingerprint(value)===file.contentSha256,'DERIVED_CONTENT_DIGEST_CHANGED');values.set(file.path,value);
  }
  const candidate=values.get('candidate.json');
  check(candidate.schemaVersion===RESEARCH_VERSION && candidate.status==='RESEARCH_ONLY' && candidate.support.engineSupportPromotion===false && candidate.support.g1P2Promotion===false,'CANDIDATE_CONTRACT');
  const index=createResearchIndex(candidate.dates);
  check(index.from===candidate.support.from && index.until===candidate.support.untilExclusive,'CANDIDATE_COVERAGE');
  return {manifest,candidate,index,comparisons:values.get('comparisons.json'),sources:values.get('source-references.json')};
}
