/** Preselected birth cohorts; documentation/market examples are measured separately. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { loadEngineE5, E5_SELECTION } from './e5.mjs';
import { SERVER_REQUEST_LITERAL_BASE } from '../../test/fixtures/server-api-only-request-cases-v1.mjs';

const fixed = [
  ['e1-240-births-v1.txt', '01c18fe2cecfd304afd507fba0247978a6fcbc73f4a79b1ff5fd425d97264f60', 240],
  ['e3-validation-births-v1.txt', '22020a8e23a86afcc215ec7adf419244eca7b08d14e70f975f8cd918f596f320', 36],
  ['e5-holdout-births-v1.txt', 'e8dd9311e176c531531c24566f962bee2c6855c4720b53eec3ae3a60c383f817', 60],
];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const unique = values => [...new Set(values)];
function counts(values) {
  const out = {};
  for (const value of values) out[value] = (out[value] ?? 0) + 1;
  return out;
}
function pointer(value, key) {
  return key.split('/').slice(1).reduce((item, segment) => item?.[segment], value);
}
async function readFixed([file, pin, count]) {
  const raw = (await readFile(new URL('../../test/fixtures/' + file, import.meta.url), 'utf8')).replaceAll('\r\n', '\n');
  assert.equal(hash(raw), pin, file);
  const rows = raw.trimEnd().split('\n').map(line => line.split(' ').slice(0, 2).join(' '));
  assert.equal(rows.length, count);
  for (const row of rows) assert.match(row, /^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}$/);
  return rows;
}
function observedRoutes(result, limit) {
  const positions = new Map(result.observedPositions.map(site => [site.positionRef, site]));
  return result.routes.flatMap(route => route.paths.map(path => ({
    from: route.from, target: route.to, via: route.mediator, status: route.status,
    chain: path.chain.map(ref => positions.get(ref)), concernRefs: path.concernRefs,
  }))).slice(0, limit);
}

function summarize(rows) {
  const rules = rows.flatMap(r => r.rules);
  const relation = id => counts(rows.map(row => row.relations.find(item => item.right === id &&
    item.left === 'EOKBU')?.status));
  const different = (row, tag) => row.rules.some(rule => rule.comparison === tag);
  return {
    births: rows.length, pillars: unique(rows.map(r => r.pillars.join(''))).length,
    dayStems: unique(rows.map(r => r.pillars[2][0])).sort(),
    monthBranches: unique(rows.map(r => r.pillars[1][1])).sort(),
    e1Grade: counts(rows.map(r => r.grade)),
    pattern: counts(rows.map(r => r.patternStatus)),
    previousPattern: counts(rows.map(r => r.previousPatternStatus)),
    patternRules: counts(rules.map(r => r.status)),
    patternRuleTransitions: counts(rules.map(r => r.previousStatus + ' -> ' + r.status)),
    patternPolicyDelta: counts(rules.map(r => r.comparison)),
    patternObservedSeparated: rows.filter(r => different(r, 'OBSERVATIONS_SEPARATED_FROM_EFFICACY')).length,
    patternAdditionalStructure: rows.filter(r => different(r, 'STRUCTURAL_SCOPE_EXPANDED')).length,
    patternRuleScopeRetained: rows.filter(r => r.rules.every(rule =>
      ['POLICY_SCOPE_RETAINED', 'PREVIOUSLY_SATISFIED'].includes(rule.comparison))).length,
    patternNewCompetition: rows.filter(r => r.patternStatus === 'COMPETING_PATHS' &&
      r.previousPatternStatus !== 'COMPETING_RULES').length,
    climate: counts(rows.map(r => r.climateStatus)),
    climateFamily: counts(rows.map(r => r.climateFamily)),
    climateCombination: counts(rows.filter(r => r.climateCandidates.length)
      .map(r => r.pillars[2][0] + r.pillars[1][1])),
    tongguan: counts(rows.map(r => r.tongguanStatus)),
    eokbuClimate: relation('CLIMATE'),
    eokbuTongguan: relation('TONGGUAN'),
    climateTongguan: counts(rows.map(row => row.relations.find(item => item.right === 'TONGGUAN' &&
      item.left === 'CLIMATE').status)),
    climateOpposesEokbu: rows.filter(row => row.relations.some(item =>
      item.balanceDirections?.some(d => d.status === 'OPPOSING_BALANCE_DIRECTION'))).length,
  };
}

export async function runE5Cohort(pack) {
  const batches = await Promise.all(fixed.map(readFixed));
  assert.equal(unique(batches.flat()).length, batches.flat().length, 'Cohort overlaps');
  const engine = await loadEngineE5({ dataDirectory: pack });
  const calculate = input => {
    const [date, time] = input.split(' ');
    const e5 = engine.calculate({ ...SERVER_REQUEST_LITERAL_BASE, date, time }, E5_SELECTION);
    assert.equal(e5.candidates.length, 1, input);
    const { candidateRef, features } = e5.candidates[0];
    for (const { factRefs, result } of Object.values(features)) {
      assert.equal(result.candidateRef, candidateRef, input);
      for (const ref of factRefs) assert.notEqual(pointer(e5, ref), undefined, ref);
    }
    const { patternAssessmentV2, climateAssessmentV2, tongguanAssessment, purposeComparison } = features;
    const p = patternAssessmentV2.result, c = climateAssessmentV2.result, t = tongguanAssessment.result;
    const { assessments, relations } = purposeComparison.result;
    const legacy = e5.e3.e2.candidates[0].features;
    return {
      input, pillars: legacy.chart.result.pillars.map(item => item.stem + item.branch),
      grade: legacy.strength.result.grade,
      eokbuStatus: assessments.EOKBU.status, eokbuCandidates: assessments.EOKBU.candidates.map(item => item.element),
      patternStatus: p.status, previousPatternStatus: p.previousStatus,
      patternTypes: assessments.PATTERN.candidates.map(item => item.patternType),
      rules: p.rules.map(({ ruleId, patternType, previousStatus, status, comparison }) =>
        ({ ruleId, patternType, previousStatus, status, comparison })),
      climateStatus: c.status, climateFamily: c.familyId ?? c.conditionFamily ?? c.family ?? 'NOT_SET',
      climateCandidates: assessments.CLIMATE.candidates.map(item => item.element), climateHolds: c.unresolvedConditions,
      tongguanStatus: t.status, tongguanCandidates: assessments.TONGGUAN.candidates.map(item => item.element),
      tongguanPaths: observedRoutes(t, 4), relations,
    };
  };
  const names = ['e1Grid', 'e3Separate', 'e5Holdout'];
  return Object.fromEntries(batches.map((births, index) => {
    const rows = births.map(calculate);
    return [names[index], { ...summarize(rows), rows }];
  }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [pack, output] = process.argv.slice(2);
  assert.ok(pack && output, 'usage: node scripts/engine/e5-cohort.mjs DATA_PACK OUTPUT_JSON');
  const result = await runE5Cohort(pack);
  const text = JSON.stringify(result, null, 2) + '\n';
  await writeFile(output, text, { flag: 'wx' });
  console.log(JSON.stringify({ sha256: hash(text), ...Object.fromEntries(Object.entries(result)
    .map(([key, { rows, ...counts }]) => [key, counts])) }));
}
