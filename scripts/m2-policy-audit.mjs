/** Report-only audit of four existing finite policies; never a source/rights certification. */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HIDDEN_STEM_POLICY_V1, HIDDEN_STEM_RULE } from '../dist/domain/hiddenStems.js';
import { TWELVE_GROWTH_POLICY_V1, TWELVE_GROWTH_RULE } from '../dist/domain/twelveGrowthStages.js';
import { BRANCH_RELATIONS_POLICY_V1, BRANCH_RELATION_RULES } from '../dist/domain/branchRelations.js';
import { TRIAD_MEMBERSHIP_POLICY_V1, TRIAD_RULES, TRIAD_DEFINITIONS, collectFourPillarTriadMemberships } from '../dist/domain/triadMemberships.js';

const ROOT = new URL('../', import.meta.url);
const DOCS = ['M2_HIDDEN_STEM_SOURCE_GATE.md', 'M2_TWELVE_GROWTH_POLICY_V1.md',
  'M2_RAW_BRANCH_RELATIONS_SOURCE_GATE.md', 'M2_TRIAD_MEMBERSHIP_SOURCE_GATE.md'].map(x => 'docs/research/' + x);
const TESTS = ['m2-hidden-stems', 'm2-twelve-growth-stages', 'm2-branch-relations', 'm2-triad-memberships'].map(x => 'test/' + x + '.test.mjs');
const EVIDENCE_LINKS = new Map([
  HIDDEN_STEM_POLICY_V1, TWELVE_GROWTH_POLICY_V1, BRANCH_RELATIONS_POLICY_V1, TRIAD_MEMBERSHIP_POLICY_V1,
].map((policyId, index) => [policyId, { document: DOCS[index], test: TESTS[index] }]));
const CONTRIBUTIONS = {
  'CLASSIC-YUANHAI-ZIPING-DIZHI-CANGDUN-GE': 'CLASSICAL_MEMBER_LIST',
  'MODERN-BAZIINSIGHT-HIDDEN-STEMS-2026': 'MODERN_MAIN_QI_ORDER',
  'MODERN-CLARIFYHK-12GROWTH-YANG-FWD-YIN-REV-2026': 'MODERN_STAGE_DIRECTION',
  'MODERN-MINGYUNHUB-12GROWTH-ANCHORS-2026': 'MODERN_STAGE_ANCHORS',
  'CLASSIC-YUANHAI-ZIPING-LIUHE': 'CLASSICAL_PAIR_LIST',
  'CLASSIC-YUANHAI-ZIPING-XIANGCHONG': 'CLASSICAL_PAIR_LIST',
  'CLASSIC-YUANHAI-ZIPING-XIANGCHUAN': 'CLASSICAL_PAIR_LIST',
  'MODERN-CLARIFYHK-LIUPO-LIUREN-COMPARISON-2026': 'MODERN_PAIR_COMPARISON',
  'CLASSIC-YUANHAI-ZIPING-XIANGXING': 'CLASSICAL_DIRECTIONAL_PAIR_LIST',
  'CLASSIC-YUANHAI-ZIPING-LUN-SHIERZHI-SANHE': 'CLASSICAL_THREE_MEMBER_LIST',
  'MODERN-CLARIFYHK-FOUR-SEASONAL-SANHUI-2026': 'MODERN_SEASONAL_MEMBER_LIST',
  'MODERN-CLARIFYHK-SANHE-PARTIAL-MEMBER-CATEGORIES-2026': 'MODERN_PARTIAL_MEMBER_LABELS',
};
const fail = code => { throw new Error('M2 policy audit: ' + code); };
const exactKeys = (value, keys) => {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype ||
      Object.keys(value).sort().join('|') !== [...keys].sort().join('|')) fail('INVALID_FIELDS');
};
const uniqueMap = (rows, key) => {
  if (!Array.isArray(rows) || rows.some(r => !r || typeof r[key] !== 'string')) fail('INVALID_ROWS');
  const map = new Map(rows.map(r => [r[key], r]));
  if (map.size !== rows.length) fail('DUPLICATE_ID');
  return map;
};
const sameSet = (actual, expected) => {
  if (!Array.isArray(actual) || !actual.every(x => typeof x === 'string') ||
      new Set(actual).size !== actual.length || actual.length !== expected.length) return false;
  const sortedExpected = [...expected].sort();
  return [...actual].sort().every((value, index) => value === sortedExpected[index]);
};

export function observeM2Policies() {
  // Partial-Sanhe output has a modern source absent from TRIAD_RULES' complete-member metadata.
  const nativeTriadSources = Object.values(TRIAD_RULES).flatMap(r => r.sourceIds);
  const partialSources = [...new Set(TRIAD_DEFINITIONS.flatMap(d =>
    collectFourPillarTriadMemberships([d.members[0], d.members[1], d.members[0], d.members[1]], TRIAD_MEMBERSHIP_POLICY_V1)
      .flatMap(f => f.sourceIds)))].filter(s => !nativeTriadSources.includes(s));
  return [
    { policyId: HIDDEN_STEM_POLICY_V1, rules: [HIDDEN_STEM_RULE], conditionalSourceIds: [] },
    { policyId: TWELVE_GROWTH_POLICY_V1, rules: [TWELVE_GROWTH_RULE], conditionalSourceIds: [] },
    { policyId: BRANCH_RELATIONS_POLICY_V1, rules: Object.values(BRANCH_RELATION_RULES), conditionalSourceIds: [] },
    { policyId: TRIAD_MEMBERSHIP_POLICY_V1, rules: Object.values(TRIAD_RULES), conditionalSourceIds: partialSources },
  ];
}

/** documents contains only local research/test text. A matching title is a link, not an executed test. */
export function auditM2Policies({ catalog, observed = observeM2Policies(), documents }) {
  exactKeys(catalog, ['schemaVersion', 'scope', 'interpretationPromotion', 'sources', 'policies']);
  if (catalog.schemaVersion !== 'm2-policy-catalog-v1' || catalog.scope !== 'FOUR_EXISTING_FINITE_POLICIES' || catalog.interpretationPromotion !== false) fail('CATALOG_SCOPE');
  const policies = uniqueMap(catalog.policies, 'policyId'), runtime = uniqueMap(observed, 'policyId');
  if (!sameSet([...policies.keys()], [...runtime.keys()]) ||
      !sameSet([...runtime.keys()], [...EVIDENCE_LINKS.keys()])) fail('POLICY_SET');
  const sources = uniqueMap(catalog.sources, 'sourceId'), used = new Set(), rulesSeen = new Set(), missingVersions = [];
  for (const observation of observed) {
    const policy = policies.get(observation.policyId);
    const evidence = EVIDENCE_LINKS.get(observation.policyId);
    exactKeys(policy, ['policyId', 'meaning', 'rules', 'conditionalSourceIds', 'testFile', 'positiveTest', 'adversarialTest', 'codeability', 'disputeStatus']);
    if (policy.codeability !== 'CONDITIONAL' || policy.disputeStatus !== 'SCHOOL_DEPENDENT' ||
        !sameSet(policy.conditionalSourceIds, observation.conditionalSourceIds)) fail('POLICY_BOUNDARY');
    const rules = uniqueMap(policy.rules, 'ruleId'), actualRules = uniqueMap(observation.rules, 'ruleId');
    if (!sameSet([...rules.keys()], [...actualRules.keys()])) fail('RULE_SET');
    for (const actual of observation.rules) {
      const claim = rules.get(actual.ruleId);
      exactKeys(claim, ['ruleId', 'runtimeVersion', 'evidenceLayer', 'sourceIds']);
      if (rulesSeen.has(actual.ruleId)) fail('DUPLICATE_RULE'); rulesSeen.add(actual.ruleId);
      if (actual.policyId !== policy.policyId || actual.codeability !== policy.codeability || actual.disputeStatus !== policy.disputeStatus ||
          actual.meaning !== policy.meaning || claim.evidenceLayer !== actual.evidenceLayer ||
          claim.runtimeVersion !== (actual.version ?? null) || !sameSet(claim.sourceIds, actual.sourceIds)) fail('RUNTIME_METADATA_MISMATCH');
      if (actual.version === undefined) missingVersions.push(actual.ruleId);
      for (const id of actual.sourceIds) used.add(id);
    }
    for (const id of observation.conditionalSourceIds) used.add(id);
    for (const id of [...observation.rules.flatMap(r => r.sourceIds), ...observation.conditionalSourceIds]) {
      const source = sources.get(id);
      if (!source || source.localEvidenceDoc !== evidence.document) fail('SOURCE_DOCUMENT_LINK');
    }
    if (policy.testFile !== evidence.test || typeof documents?.[policy.testFile] !== 'string') fail('TEST_FILE_LINK');
    for (const title of [policy.positiveTest, policy.adversarialTest]) {
      if (typeof title !== 'string' || !title || !['"', "'"].some(q => documents[policy.testFile].includes('test(' + q + title + q + ','))) fail('TEST_TITLE_LINK');
    }
    if (policy.positiveTest === policy.adversarialTest) fail('DISTINCT_TEST_EVIDENCE');
  }
  if (!sameSet([...sources.keys()], [...used])) fail('SOURCE_SET');
  for (const source of sources.values()) {
    exactKeys(source, ['sourceId', 'evidenceLayer', 'contribution', 'localEvidenceDoc', 'criticalEdition', 'editionVerification', 'rightsReview']);
    const expectedLayer = source.sourceId.startsWith('CLASSIC-') ? 'CLASSICAL_BASE_TEXT' : 'MODERN_HEURISTIC';
    if (!Object.hasOwn(CONTRIBUTIONS, source.sourceId) || source.evidenceLayer !== expectedLayer ||
        source.contribution !== CONTRIBUTIONS[source.sourceId]) fail('SOURCE_LAYER_OR_ROLE');
    if (source.criticalEdition !== null || source.editionVerification !== 'UNVERIFIED' || source.rightsReview !== 'UNVERIFIED') fail('UNSUPPORTED_EVIDENCE_PROMOTION');
    if (typeof documents?.[source.localEvidenceDoc] !== 'string' || !documents[source.localEvidenceDoc].includes(source.sourceId)) fail('SOURCE_ID_NOT_DOCUMENTED');
  }
  return Object.freeze({
    schemaVersion: 'm2-policy-audit-report-v1', status: 'CATALOG_CONSISTENT_EVIDENCE_OPEN',
    scope: 'FOUR_EXISTING_FINITE_POLICIES', policies: runtime.size, rules: rulesSeen.size, sources: sources.size,
    classicalSources: [...sources.values()].filter(s => s.evidenceLayer === 'CLASSICAL_BASE_TEXT').length,
    modernSources: [...sources.values()].filter(s => s.evidenceLayer === 'MODERN_HEURISTIC').length,
    criticalEditionsVerified: 0, rightsReviewsVerified: 0,
    runtimeRuleVersionsMissing: Object.freeze(missingVersions.sort()),
    testLinks: policies.size * 2, testsExecutedByAudit: false,
    compositionAndUpstreamRuleRecords: 'OUTSIDE_THIS_AUDIT', interpretationPromotion: false,
  });
}

export async function loadM2AuditInputs() {
  const catalog = JSON.parse(await readFile(new URL('docs/research/m2-policy-catalog.json', ROOT), 'utf8'));
  // Read only this fixed list, never file paths supplied by catalogue data.
  const documents = Object.fromEntries(await Promise.all([...DOCS, ...TESTS].map(async file =>
    [file, await readFile(new URL(file, ROOT), 'utf8')])));
  return { catalog, documents };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 2) fail('NO_ARGUMENTS_ALLOWED');
    console.log(JSON.stringify(auditM2Policies(await loadM2AuditInputs()), null, 2));
  } catch {
    console.error('M2 policy audit failed; inspect catalogue, runtime metadata and local evidence links.');
    process.exitCode = 1;
  }
}
