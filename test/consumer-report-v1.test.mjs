import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONSUMER_REPORT_PROFILE_ID, REPORT_SCHEMA, REPORT_STATES,
  buildConsumerReport, validateReportProjection, validateConsumerReport,
  buildReportSections, renderConsumerReport,
} from '../dist/report/consumerReportV1.js';
import {makeConsumerProjection, CONSUMER_UNIT_EXPECTATIONS} from './fixtures/consumer-report-projection-v1.mjs';

const build = value => buildConsumerReport(value, {profileId: CONSUMER_REPORT_PROFILE_ID});
const byRef = (p, candidate, key) => p.evidence.find(e => e.id === p.candidates[candidate].refs[key]);
const claim = (report, template) => report.interpretationClaims.find(c => c.templateId === template);
const jsonClone = value => JSON.parse(JSON.stringify(value));
const rejects = mutate => {const p = makeConsumerProjection();mutate(p);assert.throws(() => build(p), Error);};
const flatten = view => view.sections.flatMap(s => s.blocks.map(b => ({id: b.claimId, candidate: b.candidateId, state: b.status, text: b.text, facts: b.factRefs})));

test('consumer composition separates facts, traditional classifications, assessments and six chapters without claiming a full paid report', () => {
  const p = makeConsumerProjection(), before = structuredClone(p), report = build(p);
  assert.equal(report.schemaVersion, REPORT_SCHEMA);
  assert.ok(report.calculationFacts.length && report.traditionalClassifications.length && report.policyAssessments.length);
  assert.deepEqual(report.narrativeSections.map(s => s.chapter), [1, 2, 3, 4, 5, 6]);
  assert.equal(report.eligibility.status, 'LIMITED_PROVIDABLE');
  assert.equal(report.eligibility.fullPaidReport, false);
  assert.equal(report.eligibility.paymentGate, 'NO_GO_PROTOTYPE_NOT_FOR_SALE');
  for (const chapter of [3, 4]) assert.equal(report.narrativeSections[chapter - 1].status, 'HOLD');
  assert.ok(report.unsupportedOrHeldClaims.some(r => r.topic.includes('PERSONALITY') && r.status === 'HOLD'));
  assert.equal(validateConsumerReport(report, {projection: p}), true);
  assert.deepEqual(p, before);
  assert.equal(Object.isFrozen(p), false, 'building a report must not freeze caller-owned projection');
  assert.equal(Object.isFrozen(p.evidence[0].value), false);
  assert.equal(Object.isFrozen(report), true);
  assert.equal(Object.isFrozen(report.interpretationClaims), true);
  assert.ok(report.limitations.includes('PURE_PROJECTION_DOES_NOT_AUTHENTICATE_API_OR_G0'));
});

test('same winter day with a different hour yields candidate versus observed-fire HOLD rather than a date-variable substitution', () => {
  const candidate = build(makeConsumerProjection()), hold = build(makeConsumerProjection({variant: 'winter-fire-hold'}));
  const expected = CONSUMER_UNIT_EXPECTATIONS;
  assert.equal(candidate.candidateContexts.length, 1);
  assert.equal(hold.candidateContexts.length, 1);
  const c = claim(candidate, 'm5'), h = claim(hold, 'm5');
  assert.equal(c.status, 'LIMITED');assert.equal(h.status, 'HOLD');
  assert.match(c.text, /화.*온기|온기.*화/);
  assert.match(h.text, /화.*확인|화의 존재/);assert.match(h.text, /보류/);
  assert.match(h.text, /충분.*판단.*않|충분성.*보류/);
  assert.notEqual(claim(candidate, 'lead').text, claim(hold, 'lead').text);
  assert.notEqual(claim(candidate, 'conclusion').text, claim(hold, 'conclusion').text);
  assert.match(claim(candidate, 'lead').text, /겨울.*甲/);
  assert.match(claim(hold, 'lead').text, /시.*장간.*丁/);
  assert.equal(expected.winterCandidate.fullPaidReport, false);
  assert.equal(expected.presentFireHold.fullPaidReport, false);
  for (const report of [candidate, hold]) assert.equal(report.eligibility.fullPaidReport, false);
});

test('a conditional seasonal boundary keeps one natal parent while an actual Jie boundary keeps two separately owned parents', () => {
  const seasonalInput = makeConsumerProjection({variant: 'seasonal-alternatives'}), natalInput = makeConsumerProjection({variant: 'two-natal-parents'});
  const seasonal = build(seasonalInput), natal = build(natalInput);
  assert.equal(seasonal.candidateContexts.length, CONSUMER_UNIT_EXPECTATIONS.seasonalBoundary.natalParents);
  assert.equal(byRef(seasonalInput, 0, 'seasonal').value.alternatives.length, 2);
  assert.match(claim(seasonal, 'season-root').text, /원국은 하나.*계절 판단만/);
  assert.match(claim(seasonal, 'season-root').text, /봄.*수\(囚\).*토왕.*상\(相\)/);
  assert.equal(natal.candidateContexts.length, CONSUMER_UNIT_EXPECTATIONS.parentBoundary.natalParents);
  assert.deepEqual(natal.candidateContexts.map(c => natalInput.evidence.find(e => e.id === c.refs.pattern).value.primaryPattern), [null, '正官']);
  assert.ok(claim(natal, 'parent-boundary'));
  const all = new Map([...natal.calculationFacts, ...natal.traditionalClassifications, ...natal.policyAssessments].map(e => [e.id, e]));
  for (const c of natal.interpretationClaims) for (const id of c.factRefs) {
    const owner = all.get(id)?.candidateId;
    assert.ok(owner === null || owner === c.candidateId, 'claim must not borrow another parent\'s evidence');
  }
});

test('report, dialogue, preview and detailed views retain the same claim meaning and never add a narrator prediction', () => {
  const report = build(makeConsumerProjection());
  const plain = buildReportSections(report, {audience: 'full', voice: 'report'}), dialogue = buildReportSections(report, {audience: 'full', voice: 'dialogue'}), preview = buildReportSections(report, {audience: 'preview', voice: 'report'});
  assert.deepEqual(flatten(plain), flatten(dialogue));
  assert.ok(dialogue.sections.flatMap(s => s.blocks).every(b => b.speaker === 'REPORT_GUIDE'));
  assert.ok(plain.sections.flatMap(s => s.blocks).every(b => b.speaker === null));
  const fullClaims = new Map(report.interpretationClaims.map(c => [c.claimId, c]));
  for (const block of flatten(preview)) {assert.equal(block.text, fullClaims.get(block.id).text);assert.deepEqual(block.facts, fullClaims.get(block.id).factRefs);}
  assert.ok(flatten(preview).length < flatten(plain).length);
  assert.ok(preview.sections.every(s => s.chapter === 1 || s.chapter === 2));
  const text = renderConsumerReport(report), detailed = renderConsumerReport(report, {detail: true});
  assert.ok(detailed.startsWith(text));
  for (const c of report.interpretationClaims) assert.ok(text.includes(c.text), c.templateId);
  assert.equal(text.includes(report.contextId), false, 'internal context hashes belong in detail rather than the basic narrative');
  assert.equal(text.includes('UNIT-SOURCE'), false);
  assert.ok(detailed.includes(report.contextId));
});

test('held birth inputs yield differentiated eligibility, no natal fiction and no fully-providable sale promise', () => {
  const expected = {
    'unknown-time': ['NEEDS_BIRTH_TIME', 'NEEDS_ADDITIONAL_INFORMATION', /출생 시각.*알려지지/],
    'dst-gap': ['NONEXISTENT_TIME', 'NOT_PROVIDABLE', /건너뛴 시간/],
    'dst-fold': ['AMBIGUOUS_TIME', 'NEEDS_ADDITIONAL_INFORMATION', /두 번.*어느 시간/],
    'needs-data': ['NEEDS_DATA', 'NOT_PROVIDABLE', /자료.*확보되지/],
    'policy-unresolved': ['POLICY_UNRESOLVED', 'NOT_PROVIDABLE', /지원 프로필/],
    unsupported: ['OUT_OF_PROFILE_COVERAGE', 'NOT_PROVIDABLE', /지원 프로필/],
  };
  for (const [variant, [status, eligibility, words]] of Object.entries(expected)) {
    const p = makeConsumerProjection({variant}), result = build(p), text = renderConsumerReport(result);
    assert.equal(result.calculationStatus, status);
    assert.equal(result.eligibility.status, eligibility);
    assert.equal(result.eligibility.fullPaidReport, false);
    assert.equal(result.candidateContexts.length, 0);
    assert.ok(result.interpretationClaims.every(c => c.candidateId === null));
    assert.match(text, words);
    assert.equal(result.interpretationClaims.some(c => c.templateId === 'pillars'), false);
  }
});

test('each rendered claim closes its evidence-policy-source chain while an old null version stays null', () => {
  const p = makeConsumerProjection(), report = build(p), evidence = new Map([...report.calculationFacts, ...report.traditionalClassifications, ...report.policyAssessments].map(e => [e.id, e]));
  for (const c of report.interpretationClaims) {
    assert.ok(c.factRefs.length > 0);assert.equal(new Set(c.factRefs).size, c.factRefs.length);
    assert.equal(c.policyId, CONSUMER_REPORT_PROFILE_ID);
    assert.ok(c.policyVersion && c.scope);
    assert.ok(REPORT_STATES.includes(c.status));
    assert.equal(c.detailRefs.length, c.factRefs.length);
    for (const id of c.factRefs) {
      const n = evidence.get(id);assert.ok(n);
      assert.ok(n.sourceRefs.every(id => report.provenance.sourceRefs.some(s => s.id === id)));
      assert.ok(n.ruleRefs.every(id => report.provenance.rules.some(r => r.id === id)));
      assert.ok(report.provenance.policies.some(r => r.id === n.policyId && r.version === n.policyVersion));
    }
  }
  assert.ok(report.traditionalClassifications.some(n => n.policyVersion === null));
  assert.deepEqual(report.provenance.rules, [{id: 'UNIT-RULE-EVIDENCE-LINK', version: null}]);
});

test('same projection and policy reproduce structured claims, Korean text and all views without time or random data', () => {
  const p = makeConsumerProjection(), a = build(p), b = build(structuredClone(p));
  assert.deepEqual(a, b);
  for (const voice of ['report', 'dialogue']) for (const audience of ['preview', 'full']) assert.equal(renderConsumerReport(a, {voice, audience}), renderConsumerReport(b, {voice, audience}));
  assert.equal(validateConsumerReport(jsonClone(a), {projection: p}), true, 'serialized shape can be checked only against a supplied projection; it is not a G0 receipt');
  assert.throws(() => renderConsumerReport(jsonClone(a)), /INPUT_CONTEXT/);
  assert.throws(() => buildConsumerReport(p, {profileId: 'HIDDEN_DEFAULT'}));
  assert.throws(() => buildConsumerReport(p, {}));
});

test('missing, cross-candidate, duplicate, policy-conflicting and unresolved source references reject before prose is produced', () => {
  const mutations = [
    p => p.evidence.splice(p.evidence.findIndex(n => n.id === p.candidates[0].refs.day), 1),
    p => p.candidates[0].refs.root = p.candidates[0].refs.pattern,
    p => p.evidence.push(structuredClone(p.evidence[0])),
    p => p.provenance.sourceRefs.push(structuredClone(p.provenance.sourceRefs[0])),
    p => p.provenance.rules.push(structuredClone(p.provenance.rules[0])),
    p => p.provenance.policies.push(structuredClone(p.provenance.policies[0])),
    p => p.evidence[0].sourceRefs = ['FAKE_SOURCE_NOT_REGISTERED'],
    p => p.evidence[0].ruleRefs = ['FAKE_RULE_NOT_REGISTERED'],
    p => p.evidence[0].policyId = 'FAKE_POLICY_NOT_REGISTERED',
    p => p.evidence[0].policyVersion = 'FORGED_VERSION',
    p => byRef(p, 0, 'day').upstreamFactRefs = [],
    p => byRef(p, 0, 'pattern').sourceRefs = [],
    p => byRef(p, 0, 'root').ruleRefs = [],
    p => byRef(p, 0, 'root').upstreamFactRefs.push(byRef(p, 0, 'root').upstreamFactRefs[0]),
    p => p.evidence[0].candidateId = 'OTHER_PARENT',
  ];
  for (const mutate of mutations) rejects(mutate);
  const parents = makeConsumerProjection({variant: 'two-natal-parents'});
  parents.candidates[1].refs.root = parents.candidates[0].refs.root;
  assert.throws(() => build(parents), /CANDIDATE/);
});

test('sparse lists, hidden/accessor properties, non-JSON data and cycles cannot run caller code or enter report evidence', () => {
  for (const mutate of [p => delete p.evidence[1], p => delete p.candidates[0], p => delete byRef(p, 0, 'seasonal').value.alternatives[0], p => byRef(p, 0, 'day').value.extra = Infinity, p => p.inputContext.unexpected = undefined, p => p.inputContext.cycle = p]) rejects(mutate);
  let getters = 0;
  for (const target of ['root', 'evidence', 'value']) {
    const p = makeConsumerProjection(), value = target === 'root' ? p : target === 'evidence' ? p.evidence[0] : p.evidence[0].value;
    Object.defineProperty(value, 'attack', {get() {getters++;throw Error('CALLER_CODE_EXECUTED');}, enumerable: true});
    assert.throws(() => build(p), /DATA_PROPERTIES/);
  }
  assert.equal(getters, 0);
  rejects(p => Object.defineProperty(p.inputContext, 'hidden', {value: 1, enumerable: false}));
  rejects(p => Object.defineProperty(p.inputContext, Symbol('foreign'), {value: 1, enumerable: true}));
  rejects(p => p.inputContext.invalid = new Date());
});

test('day master, pillar details, root-presence witnesses and claimed M5 execution cannot contradict their own projected evidence', () => {
  for (const mutate of [
    p => byRef(p, 0, 'day').value.stem = '乙',
    p => byRef(p, 0, 'day').value.element = 'FIRE',
    p => byRef(p, 0, 'chart').value.pillars[3].role = 'day',
    p => byRef(p, 0, 'pillars').value.items[2].stem = '丙',
    p => byRef(p, 0, 'root').value.locations = [],
    p => byRef(p, 0, 'root').value.presence = 'ABSENT_UNDER_POLICY',
    p => byRef(p, 0, 'm5').value.execution = 'NOT_EXECUTED_CLOCK_SCOPE_DEPENDENCY',
    p => byRef(p, 0, 'm5').value.candidateElements = [],
    p => byRef(p, 0, 'm5').value.fireLocations = [{role: 'hour', stem: '丁', locationKind: 'HIDDEN_STEM'}],
  ]) rejects(mutate);
  const outside = makeConsumerProjection({variant: 'seasonal-alternatives'}), m5 = byRef(outside, 0, 'm5');
  m5.value.status = 'CANDIDATE_UNDER_POLICY';m5.value.candidateElements = ['FIRE'];m5.status = 'LIMITED';
  assert.throws(() => build(outside));
});

test('altering a claim into final strength, a prediction, a different parent or a sale promise fails deterministic validation', () => {
  const p = makeConsumerProjection(), original = build(p);
  const mutations = [
    r => r.interpretationClaims[0].text = '당신은 반드시 부자가 되고 올해 결혼합니다.',
    r => r.interpretationClaims[0].text = '계절이 왕하고 근이 있으므로 신강으로 확정합니다.',
    r => r.interpretationClaims[0].candidateId = 'FOREIGN_PARENT',
    r => r.interpretationClaims[0].factRefs = [],
    r => r.interpretationClaims[0].factRefs.push(r.interpretationClaims[0].factRefs[0]),
    r => r.interpretationClaims[0].policyVersion = '999',
    r => r.eligibility.fullPaidReport = true,
    r => r.eligibility.status = 'FULLY_PROVIDABLE',
    r => r.narrativeSections[2].status = 'SUPPORTED',
    r => r.policyAssessments[0].status = 'SUPPORTED',
  ];
  for (const mutate of mutations) {const altered = jsonClone(original);mutate(altered);assert.throws(() => validateConsumerReport(altered, {projection: p}), /TAMPERED/);}
  const other = makeConsumerProjection({contextId: '2'.repeat(64)});
  assert.throws(() => validateConsumerReport(original, {projection: other}), /TAMPERED/);
});
