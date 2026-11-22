import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { CLIMATE_V2_POLICY_ID, CLIMATE_V2_VERSION, CLIMATE_V2_SOURCES, climateCoverageV2, evaluateClimateV2 } from '../dist/e5/climateV2.js';
import { resolveSeasonalState, M3_SEASONAL_POLICY_ID } from '../dist/m3/seasonalStateV1.js';
import { resolveSeasonalSiliState, M3_SEASONAL_SILI_POLICY_ID } from '../dist/m3/seasonalStateV2.js';
import { deriveM3Evidence, M3_EVIDENCE_PROFILE_ID } from '../dist/m3/structuralEvidenceV1.js';
import { HEAVENLY_STEMS } from '../dist/domain/stems.js';
import { EARTHLY_BRANCHES } from '../dist/domain/branches.js';
import { MONTH_BRANCH_BY_JIE } from '../dist/calendar/monthPillar.js';
import { structuralM2Unit } from './fixtures/m3-structural-unit-input.mjs';
import { CLIMATE_CASES } from './fixtures/e5-climate-cases-v1.mjs';

const SELECTION = {policyId: CLIMATE_V2_POLICY_ID, policyVersion: CLIMATE_V2_VERSION};
const pinnedFixture = '66c89b59ed8e6ee3a65923e1f9ba033245b9c8ea22e4cc83a4668f49192f8069';
function state(pillars, monthTerms, options = {}) {
  const facts = structuralM2Unit(pillars, {monthTerms});
  return fromFacts(facts, options);
}
function fromFacts(facts, {sili = false, birthDateTime, nextSili = null} = {}) {
  const evidence = deriveM3Evidence(facts, {policyId: M3_EVIDENCE_PROFILE_ID});
  const candidates = evidence.candidates.map(c => {
    const month = c.evidence.find(e => e.kind === 'MONTH_CONTEXT');
    const base = {candidateRef: c.candidateRef, dayMaster: c.dayMaster, monthBranch: c.monthContext.monthPillar.branch,
      evidenceRefs: [month.id], inputFactRefs: month.inputFactRefs, pillarRefs: [c.candidateRef + '.day', c.candidateRef + '.month'],
      calculationSourceRefs: month.calculationSourceRefs, appliedJie: c.monthContext.activeSince};
    const judgment = sili ? resolveSeasonalSiliState({base, birthDateTime, monthCondition: 'BETWEEN_PUBLISHED_BOUNDARIES', nextSili},
      {policyId: M3_SEASONAL_SILI_POLICY_ID}) : resolveSeasonalState(base, {policyId: M3_SEASONAL_POLICY_ID});
    return {candidateRef: c.candidateRef, candidateIndex: c.candidateIndex, judgment};
  });
  return {facts, evidence, seasonal: {policy: candidates[0].judgment.policy, candidates}};
}
function run(s, index = 0, options = {}) {
  return evaluateClimateV2(options.facts ?? s.facts, options.evidence ?? s.evidence, index,
    options.seasonal ?? s.seasonal, options.selection ?? SELECTION);
}
const first = id => CLIMATE_CASES.find(row => row[0] === id);
const evaluate = id => {
  const [, pillars, term] = first(id);
  return run(state([pillars], [term]));
};

test('E5 climate 120 cells retain a literal partition and separate the textual authorities', () => {
  const cells = climateCoverageV2();
  assert.equal(cells.length, 120);
  assert.equal(new Set(cells.map(row => row.day + row.month)).size, 120);
  assert.deepEqual(cells.filter(row => row.coverage === 'EXECUTABLE').map(row => row.day + row.month).sort(),
    ['甲子','甲巳','甲午','甲亥','乙子','乙亥','庚子'].sort());
  assert.deepEqual(cells.filter(row => row.coverage === 'OBSERVATION_ONLY').map(row => row.day + row.month).sort(),
    ['甲未','庚丑','庚亥'].sort());
  assert.equal(cells.filter(row => row.coverage === 'NO_RULE').length, 110);
  for (const cell of cells) {
    const stemIndex = HEAVENLY_STEMS.indexOf(cell.day), monthIndex = EARTHLY_BRANCHES.indexOf(cell.month);
    const term = Object.entries(MONTH_BRANCH_BY_JIE).find(([, branch]) => branch === cell.month)[0];
    const pillarSet = ['丙寅', (monthIndex % 2 ? '丁' : '丙') + cell.month,
      cell.day + (stemIndex % 2 ? '丑' : '子'), '乙卯'];
    const chart = run(state([pillarSet], [term]));
    assert.equal(chart.coverage, cell.coverage, cell.day + cell.month);
    if (cell.coverage !== 'EXECUTABLE') assert.deepEqual(chart.candidates, []);
  }
  assert.deepEqual(CLIMATE_V2_SOURCES.map(source => source.kind),
    ['CLASSICAL_TEXT_TRANSCRIPTION','LATER_COMMENTARY_TRANSCRIPTION','OTHER_TRADITIONAL_SYSTEM_TRANSCRIPTION','PROJECT_POLICY']);
});

test('E5 climate adheres to 20 pre-fixed observations, positive, inactive and competing cases', () => {
  const fixture = readFileSync(new URL('./fixtures/e5-climate-cases-v1.mjs', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  assert.equal(createHash('sha256').update(fixture).digest('hex'), pinnedFixture);
  assert.equal(CLIMATE_CASES.length, 20);
  for (const [id, pillars, term, status, candidate, reason] of CLIMATE_CASES) {
    const s = state([pillars], [term]);
    const r = run(s);
    assert.equal(r.status, status, id);
    assert.equal(r.reasonCode, reason, id);
    assert.deepEqual(r.candidates.map(item => [item.element,item.stem]), candidate ? [candidate] : [], id);
    assert.ok(r.unresolvedConditions.includes('EFFECT_AND_SUFFICIENCY_UNASSESSED'), id);
    const knownFacts = new Set(s.facts.candidates[0].facts.map(fact => fact.id));
    for (const entry of [r, ...r.observedPositions, ...r.supportingEvidence, ...r.opposingEvidence]) {
      assert.ok(entry.factRefs.every(ref => knownFacts.has(ref)), id);
    }
    assert.ok(r.sourceRefs.every(ref => CLIMATE_V2_SOURCES.some(source => source.id === ref)), id);
  }
});

test('E5 separates hidden exact 癸, alternative 壬, distant 丙/丁 and visible competition', () => {
  const hidden = evaluate('summer-jia-hidden-rain');
  assert.deepEqual(hidden.targetLocations.map(row => [row.pillarRole, row.locationKind, row.position, row.stem]),
    [['day','HIDDEN_STEM','OTHER','癸']]);
  const other = evaluate('summer-jia-alternative-water');
  assert.equal(other.targetLocations.length, 0);
  assert.deepEqual(other.alternativeStemLocations.map(row => row.stem), ['壬']);
  const remote = evaluate('winter-geng-distant-heat');
  assert.deepEqual(remote.targetLocations.map(row => [row.pillarRole,row.stem]), [['hour','丙']]);
  assert.deepEqual(remote.opposingEvidence, []);
  const near = evaluate('winter-geng-competing');
  assert.ok(near.opposingEvidence.some(record => record.code === 'NEARBY_SURFACE_CONTROL'));
  assert.ok(near.unresolvedConditions.includes('ACTUAL_TEMPERATURE_AND_MOISTURE_UNASSESSED'));
  const contextual = evaluate('winter-geng-commentary-context');
  assert.ok(contextual.opposingEvidence.some(record => record.code === 'COMPLETE_WATER_MEMBERSHIP_EFFECT_UNRESOLVED'));
  const remoteSummer = run(state([['辛巳','甲午','甲寅','丙寅']],['MANGZHONG']));
  assert.equal(remoteSummer.status, 'HOLD');
  assert.equal(remoteSummer.reasonCode, 'EXPOSED_FIRE_TOO_REMOTE');
  assert.ok(remoteSummer.supportingEvidence.some(record => record.code === 'EXPOSED_TRIGGER_OBSERVED'));
  const remoteWinter = run(state([['甲申','甲子','庚申','壬子']],['DAXUE']));
  assert.equal(remoteWinter.status, 'HOLD');
  assert.equal(remoteWinter.reasonCode, 'EXPOSED_WATER_CONTEXT_TOO_REMOTE');
  assert.ok(remoteWinter.supportingEvidence.some(record => record.code === 'EXPOSED_TRIGGER_OBSERVED'));
});

test('E5 preserves two seasonal alternatives beneath one natal parent and data shortage separately', () => {
  const [, pillars, term] = first('summer-jia-wei-review');
  const boundary = {sili: true, birthDateTime: '2026-07-18T01:20', nextSili: {term: 'LIQIU', displayedDateTime: '2026-08-05T01:20',
    timeBasis: 'KST', sourcePrecision: 'MINUTE', sourceIds: ['STRUCTURAL_SEASONAL_ENDING_REFERENCE']}};
  const r = run(state([pillars], [term], boundary));
  assert.equal(r.status, 'OBSERVATION_ONLY');
  assert.equal(r.candidateRef, 'chart.candidates[0]');
  assert.deepEqual(r.seasonal.alternativeConditions.map(item => [item.season,item.parentCandidateRef,item.matchesExpectedSeason]),
    [['SUMMER','chart.candidates[0]',true],['EARTH_DOMINANT','chart.candidates[0]',false]]);
  const missing = run(state([pillars], [term], {...boundary, nextSili: null}));
  assert.equal(missing.status, 'NEEDS_DATA');
  assert.equal(missing.coverage, 'OBSERVATION_ONLY');
  assert.deepEqual(missing.targetLocations.map(location => [location.pillarRole, location.stem]), [['month','丁'],['hour','丁']]);
  assert.deepEqual(missing.candidates, []);
});

test('E5 rejects unissued evidence, foreign parent, absent members and wrong policy', () => {
  const [, p, term] = first('summer-jia-si-unobserved');
  const single = state([p], [term]);
  const foreign = state([[p[0],p[1],'乙丑',p[3]]], [term]);
  assert.throws(() => run(single, 0, {selection: {...SELECTION, policyVersion: '0.1.0'}}), /E5_CLIMATE_POLICY_REQUIRED/);
  assert.throws(() => run(single, 0, {facts: structuredClone(single.facts)}), /M3_ORIGINAL_INPUT_CONTEXT_REQUIRED/);
  assert.throws(() => run(single, 0, {evidence: structuredClone(single.evidence)}), /ISSUED_IMMUTABLE_M3_EVIDENCE_REQUIRED/);
  assert.throws(() => run(single, 0, {seasonal: structuredClone(single.seasonal)}), /ISSUED_.*SEASONAL|SEASONAL_ISSUED/);
  assert.throws(() => run(single, 0, {seasonal: foreign.seasonal}), /E5_CLIMATE_FOREIGN_SEASONAL/);
  assert.throws(() => run(single, 1), /E5_CLIMATE_UNKNOWN_PARENT/);
  const two = state([p,p], [term,term]);
  assert.equal(run(two, 0).candidateRef, 'chart.candidates[0]');
  assert.equal(run(two, 1).candidateRef, 'chart.candidates[1]');
  const mixed = {...two.seasonal, candidates: [two.seasonal.candidates[1],two.seasonal.candidates[0]]};
  assert.throws(() => run(two, 0, {seasonal: mixed}), /E5_CLIMATE_FOREIGN_SEASONAL_PARENT/);
  const tampered = structuralM2Unit([p], {monthTerms: [term]});
  tampered.candidates[0].pillars[0].branchTenGods.members.pop();
  tampered.candidates[0].facts.find(f => f.kind === 'HIDDEN_STEMS' && f.value.role === 'year').value.members.pop();
  assert.throws(() => run(fromFacts(tampered)), /E5_CLIMATE_COMPLETE_SELECTED_MEMBERS_REQUIRED/);
});
