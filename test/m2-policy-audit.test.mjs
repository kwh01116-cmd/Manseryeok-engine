import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { auditM2Policies, loadM2AuditInputs, observeM2Policies } from '../scripts/m2-policy-audit.mjs';

const inputs = await loadM2AuditInputs();
const fixture = () => structuredClone({ ...inputs, observed: observeM2Policies() });
const rejectMutation = change => {
  const input = fixture();
  change(input);
  assert.throws(() => auditM2Policies(input), /^Error: M2 policy audit: /);
};

test('M2 audit reports bounded catalogue consistency without certifying editions, rights or tests', () => {
  const report = auditM2Policies(inputs);
  assert.equal(report.status, 'CATALOG_CONSISTENT_EVIDENCE_OPEN');
  assert.equal(report.scope, 'FOUR_EXISTING_FINITE_POLICIES');
  assert.deepEqual([report.policies, report.rules, report.sources], [4, 9, 12]);
  assert.deepEqual([report.classicalSources, report.modernSources], [6, 6]);
  assert.deepEqual([report.criticalEditionsVerified, report.rightsReviewsVerified], [0, 0]);
  assert.equal(report.testLinks, 8);
  assert.equal(report.testsExecutedByAudit, false);
  assert.equal(report.interpretationPromotion, false);
  assert.equal(report.compositionAndUpstreamRuleRecords, 'OUTSIDE_THIS_AUDIT');
});

test('conditional partial-Sanhe provenance cannot disappear behind complete-member metadata', () => {
  const id = 'MODERN-CLARIFYHK-SANHE-PARTIAL-MEMBER-CATEGORIES-2026';
  const observed = observeM2Policies();
  assert.deepEqual(observed[3].conditionalSourceIds, [id]);
  assert.ok(observed[3].rules.every(rule => !rule.sourceIds.includes(id)));
  rejectMutation(x => { x.catalog.policies[3].conditionalSourceIds = []; });
  rejectMutation(x => { x.catalog.sources = x.catalog.sources.filter(s => s.sourceId !== id); });
  rejectMutation(x => { x.observed[3].conditionalSourceIds = []; });
});

test('source identity set comparison accepts reordered distinct IDs without changing the audit', () => {
  const input = fixture(), expected = auditM2Policies(input);
  input.catalog.policies[0].rules[0].sourceIds.reverse();
  assert.deepEqual(auditM2Policies(input), expected);
});

test('source identity set comparison rejects a delimiter-joined claim masquerading as two IDs', () => {
  const input = fixture(), claim = input.catalog.policies[0].rules[0];
  assert.equal(claim.sourceIds.length, 2);
  claim.sourceIds = [[...claim.sourceIds].sort().join('|')];
  assert.equal(claim.sourceIds.length, 1);
  assert.throws(() => auditM2Policies(input), /M2 policy audit: RUNTIME_METADATA_MISMATCH/);
});

test('source identity set comparison rejects duplicates, omissions and wrong same-sized claims', () => {
  for (const change of [
    ids => [ids[0], ids[0]],
    ids => [...ids, ids[0]],
    ids => [ids[0]],
    ids => [ids[0], ids[1] + '|UNREVIEWED'],
  ]) {
    const input = fixture(), claim = input.catalog.policies[0].rules[0];
    claim.sourceIds = change(claim.sourceIds);
    assert.throws(() => auditM2Policies(input), /M2 policy audit: RUNTIME_METADATA_MISMATCH/);
  }
});

test('missing, extra and duplicate policy, rule or source records are rejected', () => {
  for (const change of [
    x => { x.catalog.policies.pop(); },
    x => { x.catalog.policies.push(structuredClone(x.catalog.policies[0])); },
    x => { x.catalog.policies[0].policyId = 'UNREVIEWED_POLICY'; },
    x => { x.catalog.policies[2].rules.pop(); },
    x => { x.catalog.policies[2].rules.push(structuredClone(x.catalog.policies[2].rules[0])); },
    x => { x.catalog.sources.push({ ...x.catalog.sources[0], sourceId: 'UNUSED_SOURCE' }); },
    x => { x.catalog.sources.push(structuredClone(x.catalog.sources[0])); },
    x => { x.catalog.policies[0].rules[0].sourceIds.push(x.catalog.sources[0].sourceId); },
    x => { x.catalog.scope = 'ALL_M2'; },
    x => { x.catalog.unreviewedField = true; },
    x => { x.catalog.policies[0].rules[0].unreviewedField = true; },
  ]) rejectMutation(change);
});

test('missing native versions stay null and runtime metadata drift fails the audit', () => {
  const report = auditM2Policies(inputs);
  assert.deepEqual(report.runtimeRuleVersionsMissing, [
    'M2-RULE-BRANCH-LIUCHONG-001', 'M2-RULE-BRANCH-LIUHAI-001', 'M2-RULE-BRANCH-LIUHE-001',
    'M2-RULE-BRANCH-LIUPO-001', 'M2-RULE-BRANCH-XING-001',
    'M2-RULE-TRIAD-SANHE-MEMBERS-001', 'M2-RULE-TRIAD-SANHUI-MEMBERS-001',
  ]);
  for (const change of [
    x => { x.catalog.policies[2].rules[0].runtimeVersion = '1.0.0'; },
    x => { x.catalog.policies[0].rules[0].runtimeVersion = null; },
    x => { x.observed[0].rules[0].version = '2.0.0'; },
    x => { x.observed[0].rules[0].meaning = 'STRENGTH'; },
    x => { x.observed[0].rules[0].policyId = 'DIFFERENT_SCHOOL'; },
    x => { x.observed[0].rules[0].sourceIds = [x.catalog.sources[2].sourceId]; },
    x => { x.catalog.policies[0].codeability = 'EXACT'; },
    x => { x.catalog.policies[0].disputeStatus = 'NONE'; },
  ]) rejectMutation(change);
});

test('classical membership and modern ordering or labeling retain distinct evidence roles', () => {
  const hidden = inputs.catalog.policies[0].rules[0];
  const sourceRecords = hidden.sourceIds.map(id => inputs.catalog.sources.find(s => s.sourceId === id));
  assert.deepEqual(sourceRecords.map(s => s.contribution), ['CLASSICAL_MEMBER_LIST', 'MODERN_MAIN_QI_ORDER']);
  assert.deepEqual(sourceRecords.map(s => s.evidenceLayer), ['CLASSICAL_BASE_TEXT', 'MODERN_HEURISTIC']);
  rejectMutation(x => { x.catalog.sources[1].evidenceLayer = 'CLASSICAL_BASE_TEXT'; });
  rejectMutation(x => { x.catalog.sources[1].contribution = 'CLASSICAL_MEMBER_LIST'; });
  rejectMutation(x => { x.catalog.policies[1].rules[0].evidenceLayer = 'CLASSICAL_BASE_TEXT'; });
});

test('catalogue edits cannot self-promote unverified editions, reuse rights or interpretation', () => {
  for (const change of [
    x => { x.catalog.sources[0].criticalEdition = 'unreviewed edition assertion'; },
    x => { x.catalog.sources[0].editionVerification = 'VERIFIED'; },
    x => { x.catalog.sources[0].rightsReview = 'CLEARED'; },
    x => { x.catalog.interpretationPromotion = true; },
  ]) rejectMutation(change);
});

test('each source needs its corresponding local research record without arbitrary file reads', () => {
  rejectMutation(x => { delete x.documents[x.catalog.sources[0].localEvidenceDoc]; });
  rejectMutation(x => { x.documents[x.catalog.sources[0].localEvidenceDoc] = 'Source is no longer documented.'; });
  rejectMutation(x => { x.catalog.sources[0].localEvidenceDoc = '../private-fixture.txt'; });
  rejectMutation(x => { x.catalog.sources[0].localEvidenceDoc = x.catalog.sources[2].localEvidenceDoc; });
});

test('positive and adversarial regression links must exist and remain distinct for every policy', () => {
  for (let i = 0; i < inputs.catalog.policies.length; i++) {
    rejectMutation(x => { x.catalog.policies[i].positiveTest = 'nonexistent positive witness'; });
    rejectMutation(x => { x.catalog.policies[i].adversarialTest = 'nonexistent adversarial witness'; });
    rejectMutation(x => { x.catalog.policies[i].adversarialTest = x.catalog.policies[i].positiveTest; });
    rejectMutation(x => { delete x.documents[x.catalog.policies[i].testFile]; });
    rejectMutation(x => { x.catalog.policies[i].testFile = '../private-fixture.txt'; });
  }
});

test('audit order does not change output or mutate catalogue and runtime observations', () => {
  const input = fixture(), before = structuredClone(input), expected = auditM2Policies(input);
  assert.deepEqual(input, before);
  input.catalog.policies.reverse(); input.catalog.sources.reverse(); input.observed.reverse();
  for (const policy of input.catalog.policies) {
    policy.rules.reverse();
    for (const rule of policy.rules) rule.sourceIds.reverse();
  }
  assert.deepEqual(auditM2Policies(input), expected);
  assert.throws(() => { expected.scope = 'ALL_M2'; }, TypeError);
  assert.throws(() => { expected.runtimeRuleVersionsMissing.push('invented'); }, TypeError);
});

test('offline audit CLI exits consistently and never echoes an unsupported argument', () => {
  const cwd = fileURLToPath(new URL('../', import.meta.url));
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (/KASI.*KEY/.test(key)) delete env[key];
  const disableNetwork = `import http from 'node:http'; import https from 'node:https'; import net from 'node:net';
    const blocked = () => { throw new Error('TEST_NETWORK_FORBIDDEN'); };
    http.get = http.request = https.get = https.request = net.connect = net.createConnection = globalThis.fetch = blocked;`;
  const args = ['--import', 'data:text/javascript,' + encodeURIComponent(disableNetwork), 'scripts/m2-policy-audit.mjs'];
  const success = spawnSync(process.execPath, args, { cwd, env, encoding: 'utf8', timeout: 10_000 });
  assert.equal(success.status, 0, success.stderr);
  assert.equal(success.stderr, '');
  assert.deepEqual(JSON.parse(success.stdout), auditM2Policies(inputs));
  const unsupported = spawnSync(process.execPath, [...args, 'PRIVATE_TEST_ONLY_ARGUMENT'], { cwd, env, encoding: 'utf8', timeout: 10_000 });
  assert.equal(unsupported.status, 1);
  assert.equal(unsupported.stdout, '');
  assert.match(unsupported.stderr, /^M2 policy audit failed;/);
  assert.ok(!unsupported.stderr.includes('PRIVATE_TEST_ONLY_ARGUMENT'));
});
