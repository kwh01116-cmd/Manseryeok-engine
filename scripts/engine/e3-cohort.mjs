/** Replays preselected fictional births. Emits a compact audit, not customer reports. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { loadEngineE3, E3_SELECTION } from './e3.mjs';
import { SERVER_REQUEST_LITERAL_BASE } from '../../test/fixtures/server-api-only-request-cases-v1.mjs';

const parsed = (bytes) => bytes.toString().replaceAll('\r\n', '\n');
const hash = (value) => createHash('sha256').update(value).digest('hex');

async function fixedInputs(file, pin, count) {
  const value = parsed(await readFile(new URL('../../test/fixtures/' + file, import.meta.url)));
  assert.equal(hash(value), pin, file + ' preselected bytes');
  const inputs = value.trimEnd().split('\n').map(row => row.split(' ').slice(0, 2).join(' '));
  assert.equal(inputs.length, count);
  assert.equal(new Set(inputs).size, count);
  for (const input of inputs) assert.match(input, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  return inputs;
}
function countBy(values) {
  const counts = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return counts;
}
function legacyExample(e2, birth, id) {
  const features = e2.candidates[0].features;
  const stars = features.sinsal.result.observations;
  const reviews = features.patternReview.result.reviews;
  return { id, date: birth.date, time: birth.time,
    stars: stars.map(row => [row.starId, row.basis, row.status, row.matchedPositions.map(p => p.position)]),
    reviews: reviews.map(row => [row.ruleId, row.patternType, row.status, row.effect]), oldMatched: true };
}

const [pack, e1Receipt, e2Receipt, output] = process.argv.slice(2);
assert.ok(pack && e1Receipt && e2Receipt && output,
  'usage: node scripts/engine/e3-cohort.mjs DATA_PACK E1_GRID_JSON E2_GRID_JSON OUTPUT_JSON');
const inputs = await fixedInputs('e1-240-births-v1.txt','01c18fe2cecfd304afd507fba0247978a6fcbc73f4a79b1ff5fd425d97264f60',240);
const independent = await fixedInputs('e3-validation-births-v1.txt','22020a8e23a86afcc215ec7adf419244eca7b08d14e70f975f8cd918f596f320',36);
assert.ok(independent.every(key => !inputs.includes(key)));
const old1 = await readFile(e1Receipt), old2 = await readFile(e2Receipt);
assert.equal(hash(old1),'e761fec5f84c92413aa6d7ea193f7ee2034dea7bc2f03a7001eb44afd84690f3');
assert.equal(hash(old2),'e3cb294a6e41392ed5d70659e23f61c42eb1db95f0975711005b413300b4df56');
const e1Rows = JSON.parse(old1).rows, e2Rows = JSON.parse(old2).rows;
const engine = await loadEngineE3({ dataDirectory: pack });
function run(dates, certifyPrevious) {
  const rows = dates.map((key,index) => {
    const [date,time] = key.split(' ');
    const birth = { ...SERVER_REQUEST_LITERAL_BASE, date, time };
    const value = engine.calculate(birth,E3_SELECTION);
    assert.equal(value.candidates.length,1,key);
    const wrapped = value.candidates[0].features.patternRules;
    const { result } = wrapped;
    for (const ref of wrapped.factRefs) {
      assert.notEqual(ref.split('/').slice(1).reduce((item,step) => item?.[step],value),undefined,ref);
    }
    const f = value.e2.candidates[0].features;
    if (certifyPrevious) {
      const expected = e1Rows[index].parents[0], saved = e2Rows[index];
      const s = f.strength.result, e = f.eokbu.result;
      assert.deepEqual(f.chart.result.pillars.map(p => p.stem+p.branch),expected.pillars,key);
      assert.deepEqual([s.grade,s.score.supportUnits/100,s.sensitivity.status,e.status,e.candidates.map(c=>({family:c.family,element:c.element})),e.holdReasons,e.climateComparison.status],
        [expected.grade,expected.score,expected.sensitivity,expected.rank,expected.leaders,expected.held,expected.climate],key);
      assert.deepEqual(legacyExample(value.e2,birth,saved.id),saved,key);
    }
    const coobserved = f.patternReview.result.reviews.filter(r => r.status === 'COOBSERVED_PREREQUISITES')
      .map(r => r.patternType);
    return { date,time,pillars:f.chart.result.pillars.map(p => p.stem + p.branch), coobserved,
      grade:f.strength.result.grade, supportUnits:f.strength.result.score.supportUnits,
      state:result.status, competition:result.competition, sensitivity:result.sensitivity,
      rules:result.rules.map(({ patternType,ruleId,target,status,conditions }) => ({ patternType,ruleId,target,status,
        conditions })) };
  });
  const families = { OFFICER:['正官'], WEALTH:['正財','偏財'], KILLINGS:['七殺'] };
  const summary = Object.fromEntries(Object.entries(families).map(([id,types]) => {
    const local = rows.flatMap(row => row.rules.filter(rule => types.includes(rule.patternType)));
    const observedRows = rows.filter(row => row.coobserved.some(type => types.includes(type)));
    return [id, {
      rowDenominator:local.length,
      applicable:local.filter(rule => rule.status !== 'OUT_OF_SCOPE').length,
      byStatus:countBy(local.map(rule => rule.status)),
      byRule:Object.fromEntries([...new Set(local.map(rule => rule.ruleId))].map(ruleId =>
        [ruleId,countBy(local.filter(rule => rule.ruleId === ruleId).map(rule => rule.status))])),
      coobservedParentCount:observedRows.length,
      coobservedByRuleStatus:countBy(observedRows.flatMap(row => row.rules.filter(rule =>
        row.coobserved.includes(rule.patternType)).map(rule => rule.status))),
    }];
  }));
  return { chartCount:rows.length, chartStates:countBy(rows.map(row => row.state)),
    e2CoobservedCharts:rows.filter(row => row.coobserved.length).length, summary, rows };
}
const result = { grid:run(inputs,true), independent:run(independent,false) };
const bytes = JSON.stringify(result,null,2) + '\n';
await writeFile(output,bytes,{flag:'wx'});
const compact = ({ rows, ...meta }) => meta;
console.log(JSON.stringify({ sha256:hash(bytes), grid:compact(result.grid), independent:compact(result.independent) }));
