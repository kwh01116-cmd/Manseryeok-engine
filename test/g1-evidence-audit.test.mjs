import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { auditG1EditionEvidence } from '../scripts/g1-evidence-audit.mjs';
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 as solar } from '../dist/calendar/koreaSolarTermFixtures.js';
import { KASI_KOREAN_LUNISOLAR_2025_2027 as lunar } from '../dist/calendar/koreanLunisolarFixtures.js';
const manifest = JSON.parse(readFileSync(new URL('./fixtures/g1-evidence-manifest-2026-2027.json',import.meta.url),'utf8'));
const deep = o=>structuredClone(o);
const inspect = (s=solar,l=lunar,m=manifest)=>auditG1EditionEvidence({solarEvents:s,lunarCorpus:l,manifest:m});
const reject = f=>assert.throws(f,/G1 evidence audit:/);

test('G1-P1 reports 49 solar/37 lunar row consistency without certifying original evidence or rights',()=>{
  assert.deepEqual(inspect(),{
    status:'REPOSITORY_CONSISTENT_ORIGINAL_ROWS_UNVERIFIED',profileId:'KOREAN-LAB-KASI-2026-2027-V1',
    solarRows:49,lunarRows:37,pageCandidatesObserved:3,originalRowsVerified:0,rights:'UNVERIFIED',
  });
  assert.equal(Object.isFrozen(inspect()),true);
});

test('changing fixture minute, source, precision or removing 2027 terminal DAXUE fails',()=>{
  const changed=deep(solar); changed.find(x=>x.term==='LICHUN'&&x.displayedDateTime.startsWith('2027')).displayedDateTime='2027-02-04T10:47';reject(()=>inspect(changed));
  const forged=deep(solar);forged[0].sourceIds=['FORGED-NONEMPTY'];reject(()=>inspect(forged));
  const seconds=deep(solar);seconds[0].sourcePrecision='SECOND';reject(()=>inspect(seconds));
  const missing=deep(solar).filter(x=>x.displayedDateTime!=='2027-12-07T17:38');reject(()=>inspect(missing));
});

test('row-for-row Lichun swap or guard replacement in evidence manifest fails',()=>{
  const m=deep(manifest);let a=m.solarRows.find(x=>x[0]==='LICHUN'&&x[2]===2026);let b=m.solarRows.find(x=>x[0]==='LICHUN'&&x[2]===2027);[a[1],b[1]]=[b[1],a[1]];reject(()=>inspect(solar,lunar,m));
  const m2=deep(manifest);m2.solarRows[0][1]='2025-12-07T06:06';reject(()=>inspect(solar,lunar,m2));
  const m3=deep(manifest);m3.solarRows.push(deep(m3.solarRows[0]));reject(()=>inspect(solar,lunar,m3));
});

test('unknown or cross-year page edition, unverified page digest and forged legal approval fail',()=>{
  const m=deep(manifest);m.pageCandidates[1].candidateEdition='FAKE-V1';reject(()=>inspect(solar,lunar,m));
  const m2=deep(manifest);m2.pageCandidates[1].candidateEdition=m2.pageCandidates[2].candidateEdition;reject(()=>inspect(solar,lunar,m2));
  const m3=deep(manifest);m3.pageCandidates[0].originalDocumentSha256='f'.repeat(64);reject(()=>inspect(solar,lunar,m3));
  const m4=deep(manifest);m4.rights='CLEARED';reject(()=>inspect(solar,lunar,m4));
  const m5=deep(manifest);m5.pageCandidates[0].pageEvidence='ORIGINAL_ROW_VERIFIED';reject(()=>inspect(solar,lunar,m5));
});

test('no original per-row verification can be claimed without external evidence',()=>{
  const m=deep(manifest);m.solarRows[0][3]='ORIGINAL_ROW_VERIFIED';reject(()=>inspect(solar,lunar,m));
  const m2=deep(manifest);m2.lunarRows[0][5]='ORIGINAL_ROW_VERIFIED';reject(()=>inspect(solar,lunar,m2));
  const m3=deep(manifest);m3.sourceId='KR-KASA-WOLRYEOK-2027';reject(()=>inspect(solar,lunar,m3));
});

test('lunar year edition owner is lunarYear, not Gregorian start year',()=>{
  const last2025=manifest.lunarRows.find(r=>r[0]===2025&&r[1]===12);
  const last2026=manifest.lunarRows.find(r=>r[0]===2026&&r[1]===12);
  assert.equal(last2025[3],'2026-01-19');assert.equal(last2025[4],2025);
  assert.equal(last2026[3],'2027-01-08');assert.equal(last2026[4],2026);
  const m=deep(manifest);m.lunarRows.find(r=>r[0]===2025&&r[1]===12)[4]=2026;reject(()=>inspect(solar,lunar,m));
  const m2=deep(manifest);m2.lunarRows.find(r=>r[0]===2026&&r[1]===12)[4]=2027;reject(()=>inspect(solar,lunar,m2));
});

test('leap-six month identity and lunar fixture content/edition pins cannot be changed',()=>{
  assert.deepEqual(manifest.lunarRows.find(r=>r[0]===2025&&r[1]===6&&r[2]===true).slice(0,4),[2025,6,true,'2025-07-25']);
  const l=deep(lunar);l.months.find(r=>r.lunarYear===2025&&r.lunarMonth===6&&r.isLeapMonth).days=30;reject(()=>inspect(solar,l));
  const m=deep(manifest);m.lunarRows.find(r=>r[0]===2025&&r[1]===6&&r[2]===true)[2]=false;reject(()=>inspect(solar,lunar,m));
  const l2=deep(lunar);l2.sourceEditions[2025]='V1.0a/FAKE';reject(()=>inspect(solar,l2));
  const l3=deep(lunar);l3.corpusId='other-corpus';reject(()=>inspect(solar,l3));
});

test('strict version, unexpected field, missing page and bad guard candidate reject',()=>{
  const m=deep(manifest);m.schemaVersion='g1-repository-evidence-v2';reject(()=>inspect(solar,lunar,m));
  const m2=deep(manifest);m2.certified=true;reject(()=>inspect(solar,lunar,m2));
  const m3=deep(manifest);m3.pageCandidates.pop();reject(()=>inspect(solar,lunar,m3));
  const m4=deep(manifest);m4.solarRows[0][2]=2026;reject(()=>inspect(solar,lunar,m4));
});

test('repeated audits do not mutate source records or evidence manifest',()=>{
  const before=JSON.stringify({solar,lunar,manifest});
  for(let i=0;i<3;i++)inspect();
  assert.equal(JSON.stringify({solar,lunar,manifest}),before);
});
