/** Explicit private 1950–2026 acceptance check; never runs inside public npm tests. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { inventory, loadCandidate } from './research.mjs';
import { fingerprint, sha } from '../../.kasi-build/schema.js';

const args=process.argv.slice(2);
assert.equal(args.length,3,'input-directory first-snapshot second-snapshot required');
const [input,first,second]=args.map(p=>resolve(p));
const metadata=JSON.parse(await readFile(join(first,'run-metadata.json'),'utf8'));
const a=await loadCandidate(first,metadata.manifestContentSha256);
const b=await loadCandidate(second,metadata.manifestContentSha256);
assert.equal(fingerprint(a.manifest),fingerprint(b.manifest));
assert.equal(fingerprint(await inventory(input)),a.manifest.inputTreeSha256);
assert.equal(sha(await readFile(join(input,'export.json'))),'7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851');
const {candidate:c,index,manifest:m,comparisons:p}=a;
assert.deepEqual(m.counts,{years:77,solar:1848,lunar:28124,raw:1001,pages:1001});
assert.equal(m.apiRequests,0);assert.equal(m.sourceChanged,false);
assert.equal(m.rawLinkage.solJdRows,28124);assert.deepEqual(m.rawLinkage.unreferencedRaw,[]);
assert.equal(c.audit.uniqueDates,28124);assert.equal(c.audit.yearJoins,76);
assert.equal(c.audit.lunarGroups,953);assert.equal(c.audit.observedDay1,952);
assert.equal(c.audit.partialMonths.length,2);assert.equal(c.audit.nullMonthGanji,816);
assert.equal(c.audit.nullMonthGanjiGroups,28);assert.equal(c.audit.regularMonthNulls,0);
assert.equal(c.audit.missingSunLongitude,1392);assert.equal(c.audit.published2400.length,1);
const held=c.events.find(e=>e.time==='24:00');
assert.equal(held.date,'1950-01-20');assert.equal(held.term,'대한');
assert.equal(held.timeStatus,'TIME_NOTATION_REVIEW_REQUIRED');assert.equal(held.computationalCivilDateTime,null);
assert.ok(c.events.every(e=>e.utcInstant===null && e.historicalCivilTime==='NOT_RESOLVED'));
assert.equal(c.dates[0].lunarYear,1949);assert.equal(c.dates[0].lunarMonth,11);assert.equal(c.dates[0].lunarDay,13);
assert.equal(c.dates.at(-1).lunarYear,2026);assert.equal(c.dates.at(-1).lunarMonth,11);assert.equal(c.dates.at(-1).lunarDay,23);
assert.equal(index.fromGregorianDate('1949-12-31').status,'OUT_OF_COVERAGE');
assert.equal(index.fromGregorianDate('2027-01-01').status,'OUT_OF_COVERAGE');
assert.equal(index.fromLunarDate({...c.dates[0],lunarDay:1}).status,'OUT_OF_OBSERVED_COVERAGE');
assert.equal(index.fromLunarDate({...c.dates.at(-1),lunarDay:24}).status,'OUT_OF_OBSERVED_COVERAGE');
const refs=new Map(JSON.parse(await readFile(join(first,'source-references.json'),'utf8')).map(r=>[r.id,r]));
for(const row of c.dates) {
  const source=refs.get(row.sourceRef);assert.equal(source.serviceId,'15012679');assert.equal(source.operation,'getLunCalInfo');
  assert.equal(index.fromLunarDate(index.fromGregorianDate(row.solarDate).value).value,row.solarDate);
}
for(const row of c.events) {const source=refs.get(row.sourceRef);assert.equal(source.serviceId,'15012690');assert.equal(source.operation,'get24DivisionsInfo');}
assert.equal(p.solar.length,25);assert.ok(p.solar.every(r=>r.status==='MATCH'));
assert.equal(p.dayPillar.MATCH,28124);assert.equal(p.dayPillar.MISMATCH,0);
assert.equal(p.lunar[0].counts.MATCH,702);assert.equal(p.lunar[1].counts.MATCH,708);
console.log(JSON.stringify({status:'PRIVATE_DATA_ACCEPTANCE_PASS',testedHead:metadata.head,codeTreeSha256:m.codeTreeSha256,buildTreeSha256:m.buildTreeSha256,manifestContentSha256:metadata.manifestContentSha256,inputTreeUnchanged:true,identicalSnapshots:true,roundTrips:28124,apiRequests:0},null,2));
