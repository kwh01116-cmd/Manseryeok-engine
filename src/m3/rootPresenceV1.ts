import { HEAVENLY_STEMS, STEM_NATURE, type HeavenlyStem } from "../domain/stems.js";
import { EARTHLY_BRANCHES, type EarthlyBranch } from "../domain/branches.js";
import { HIDDEN_STEM_POLICY_V1, hiddenStemsForBranch } from "../domain/hiddenStems.js";
import { validateM3Evidence, type M3EvidenceResult, type M3InputEnvelope, type M3StemLocation, type M3EvidenceRecord } from "./structuralEvidenceV1.js";
import type { ChartPillarRole } from "../chartFacts/chartFactsV1.js";

export const M3_ROOT_POLICY_ID = "M3-ROOT-PRESENCE-HIDDEN-SAME-ELEMENT-V01" as const;
export const M3_ROOT_VERSION = "0.1.0" as const;
export const M3_ROOT_SCHEMA = "m3-root-presence-v1" as const;
export const M3_ROOT_RULE_ID = "M3-RULE-ROOT-PRESENCE-SAME-ELEMENT-001" as const;
const BASE_TEXT = "TXT-ZIPING-ZHENQUAN-NCC-BASE-ROOT-CONTEXT";
const XU_COMMENTARY = "TXT-ZIPING-ZHENQUAN-NCC-XU-ROOT-COMMENTARY";
const IMPLEMENTATION = "IMPL-M3-ROOT-PRESENCE-V01";
const ROLES = ["year", "month", "day", "hour"] as const;
const ROLE_NAMES = { year: "연주 천간", month: "월주 천간", day: "일간", hour: "시주 천간" } as const;
const BRANCH_ROLE_NAMES = { year: "연지", month: "월지", day: "일지", hour: "시지" } as const;
const TEN_GOD_NAMES: Readonly<Record<string, string>> = { 正印: "정인", 偏印: "편인", 比肩: "비견", 劫財: "겁재", 正官: "정관", 七殺: "편관", 食神: "식신", 傷官: "상관", 正財: "정재", 偏財: "편재" };
export type RootPresence = "PRESENT_UNDER_POLICY" | "ABSENT_UNDER_POLICY";
export type RootMatchType = "EXACT_STEM" | "SAME_ELEMENT_DIFFERENT_STEM";
function check(value: unknown, code: string): asserts value { if (!value) throw new RangeError(code); }
function dense<T>(value: readonly T[], code: string): readonly T[] {
  check(Array.isArray(value) && Array.from({ length: value.length }, (_, i) => Object.hasOwn(value, i)).every(Boolean), code);
  return value;
}
function record(value: unknown): Record<string, unknown> { check(value !== null && typeof value === "object" && !Array.isArray(value), "ROOT_PLAIN_RECORD_REQUIRED"); return value as Record<string, unknown>; }
function freeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  if (Array.isArray(value)) { dense(value, "ROOT_DENSE_ARRAY_REQUIRED"); value.forEach(freeze); }
  else Object.values(value).forEach(freeze);
  return Object.freeze(value);
}
function equal(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (left === null || right === null || typeof left !== "object" || typeof right !== "object" || Array.isArray(left) !== Array.isArray(right)) return false;
  if (Array.isArray(left)) {
    if (!Array.isArray(right) || left.length !== right.length) return false;
    for (let i = 0; i < left.length; i++) if (!Object.hasOwn(left, i) || !Object.hasOwn(right, i) || !equal(left[i], right[i])) return false;
  }
  const a = Object.keys(left).sort(), b = Object.keys(right).sort();
  return a.length === b.length && a.every((k, i) => k === b[i] && equal((left as Record<string, unknown>)[k], (right as Record<string, unknown>)[k]));
}
const unique = (values: readonly string[]) => [...new Set(values)];
function explicitPolicy(id: unknown) { check(id === M3_ROOT_POLICY_ID, "EXPLICIT_SUPPORTED_ROOT_POLICY_REQUIRED"); }

export const M3_ROOT_POLICY_METADATA = freeze({
  id: M3_ROOT_POLICY_ID, version: M3_ROOT_VERSION, schemaVersion: M3_ROOT_SCHEMA,
  kind: "SELECTED_HIDDEN_STEM_SAME_ELEMENT_ROOT_PRESENCE", hiddenStemPolicyId: HIDDEN_STEM_POLICY_V1,
  scope: "FOUR_NATAL_VISIBLE_TARGET_STEMS_AND_FOUR_NATAL_BRANCHES_BEFORE_EFFECTS",
  criterion: "AT_LEAST_ONE_ACTUAL_SELECTED_HIDDEN_MEMBER_OF_THE_TARGET_ELEMENT",
  matchTypes: ["EXACT_STEM", "SAME_ELEMENT_DIFFERENT_STEM"],
  positions: "EXISTING_MAIN_QI_AND_OTHER_ARE_MEMBERSHIP_ATTRIBUTES_NOT_ROOT_STRENGTH",
  supportTargets: "NON_DAY_VISIBLE_RESOURCE_AND_PEER_STEMS_WITH_THEIR_OWN_ROOT_RESULTS",
  rules: [{ id: M3_ROOT_RULE_ID, runtimeVersion: M3_ROOT_VERSION, sourceRuleVersion: null,
    kind: "PROJECT_SELECTED_ROOT_PRESENCE_DEFINITION_WITH_COMMENTARY_CONTEXT", policyIds: [M3_ROOT_POLICY_ID],
    sourceIds: [BASE_TEXT, XU_COMMENTARY, IMPLEMENTATION] }],
  sources: [
    { id: BASE_TEXT, kind: "CLASSICAL_BASE_TEXT_WEB_TRANSCRIPTION", title: "子平真詮評註：原文", section: "論十干十二支；論陰陽生死；論十干得時不旺失時不弱",
      url: "https://ncc.com.tw/fate/paleo/bg/bg_03.htm", companionUrl: "https://ncc.com.tw/fate/paleo/bg/bg_032.htm", accessedOn: "2026-11-12", nativeRuleVersion: null,
      use: "ROOT_CONTEXT_AND_ORIGINAL_TEXT_DISTINCTIONS_NOT_A_UNIFIED_UNIVERSAL_ROOT_DEFINITION", verification: "WEB_TRANSCRIPTION_NOT_SCAN_OR_CRITICAL_EDITION", rightsReview: "UNVERIFIED",
      variant: "NCC_BASE_JIA_HAI_ZI_YIN_MAO_VERSUS_OTHER_TRANSCRIPTION_HAI_YIN_MAO_NOT_SILENTLY_RECONCILED; SELECTED_HIDDEN_TABLE_HAS_NO_WOOD_IN_ZI" },
    { id: XU_COMMENTARY, kind: "CLASSICAL_COMMENTARY_WEB_TRANSCRIPTION", title: "子平真詮評註：徐樂吾評註", section: "論十干十二支；論陰陽生死；論十干得時不旺失時不弱",
      url: "https://ncc.com.tw/fate/paleo/bg/bg_03.htm", companionUrl: "https://ncc.com.tw/fate/paleo/bg/bg_032.htm", accessedOn: "2026-11-12", nativeRuleVersion: null,
      use: "SHARED_ELEMENT_ROOT_EXAMPLES_VISIBLE_YEAR_MONTH_HOUR_SCOPE_AND_YIN_GROWTH_STAGE_LIMIT", verification: "WEB_COMMENTARY_TRANSCRIPTION_NOT_AUTHOR_BASE_TEXT_OR_SCAN", rightsReview: "UNVERIFIED" },
    { id: IMPLEMENTATION, kind: "PROJECT_IMPLEMENTATION_DEFINITION", implementationRef: "src/m3/rootPresenceV1.ts", version: M3_ROOT_VERSION,
      use: "SELECTED_SAME_ELEMENT_PRESENCE_ALL_FOUR_VISIBLE_POSITIONS_AND_SUPPORT_LINKS_NOT_ROOT_EFFICACY" },
  ],
  excluded: ["ROOT_STRENGTH", "ROOT_EFFICACY", "ROOT_DAMAGE", "SUPPORT_TRANSMISSION", "WEIGHTS", "SCORES", "DE_DI", "DE_SHI", "FINAL_STRENGTH", "RELATION_EFFECT", "TRANSFORMATION", "GEJU", "YONGSHEN", "FORTUNE", "PREDICTION"],
  unchangedGate: "docs/research/M3_STRENGTH_GO_NOGO_DECISION_SPEC_20261018.md",
});

/** Unit lookup only: it does not authenticate a chart, an API response or a source edition. */
export function resolveStemBranchRootPresence(
  input: { readonly targetStem: HeavenlyStem; readonly branch: EarthlyBranch; readonly hiddenStemPolicyId: string },
  { policyId }: { readonly policyId: string } = { policyId: "" },
) {
  explicitPolicy(policyId);
  const data = record(input);
  check(Object.keys(data).length === 3 && ["targetStem", "branch", "hiddenStemPolicyId"].every(k => Object.hasOwn(data, k)), "ROOT_MINIMAL_UNIT_INPUT_REQUIRED");
  check(HEAVENLY_STEMS.some(s => s === input.targetStem), "ROOT_KNOWN_TARGET_STEM_REQUIRED");
  check(EARTHLY_BRANCHES.some(b => b === input.branch), "ROOT_KNOWN_BRANCH_REQUIRED");
  check(input.hiddenStemPolicyId === HIDDEN_STEM_POLICY_V1, "ROOT_SUPPORTED_HIDDEN_STEM_POLICY_REQUIRED");
  const targetElement = STEM_NATURE[input.targetStem].element;
  const matches = hiddenStemsForBranch(input.branch, HIDDEN_STEM_POLICY_V1).filter(member => STEM_NATURE[member.stem].element === targetElement)
    .map(member => ({ ...member, element: STEM_NATURE[member.stem].element,
      matchType: member.stem === input.targetStem ? "EXACT_STEM" as const : "SAME_ELEMENT_DIFFERENT_STEM" as const }));
  return freeze({ targetStem: input.targetStem, targetElement, branch: input.branch, hiddenStemPolicyId: HIDDEN_STEM_POLICY_V1,
    policyId: M3_ROOT_POLICY_ID, rootPresence: (matches.length ? "PRESENT_UNDER_POLICY" : "ABSENT_UNDER_POLICY") as RootPresence, matches });
}

const contexts = new WeakMap<object, { evidence: M3EvidenceResult; m2Facts: M3InputEnvelope }>();
function refsFrom(locations: readonly M3StemLocation[], records: readonly M3EvidenceRecord[]) {
  return {
    inputEvidenceRefs: unique(records.map(e => e.id)), inputFactRefs: unique(locations.flatMap(l => l.inputFactRefs)),
    inputMemberRefs: unique(locations.flatMap(l => l.inputMemberRef ? [l.inputMemberRef] : [])),
    pillarRefs: unique(locations.map(l => l.pillarRef)),
    ruleRefs: unique([M3_ROOT_RULE_ID, ...locations.flatMap(l => l.ruleRefs), ...records.flatMap(e => e.ruleRefs)]),
    policyRefs: unique([M3_ROOT_POLICY_ID, ...locations.flatMap(l => l.policyRefs), ...records.flatMap(e => e.policyRefs)]),
    sourceRefs: unique([BASE_TEXT, XU_COMMENTARY, IMPLEMENTATION, ...locations.flatMap(l => l.sourceRefs), ...records.flatMap(e => e.sourceRefs)]),
    calculationSourceRefs: unique([...locations.flatMap(l => l.calculationSourceRefs), ...records.flatMap(e => e.calculationSourceRefs)]),
  };
}

/** Consumes an issued structural result plus its original M2 facts; the adapter separately authenticates their same execution. */
export function deriveM3RootPresence(evidence: M3EvidenceResult,
  { policyId, m2Facts }: { readonly policyId: string; readonly m2Facts: M3InputEnvelope }) {
  explicitPolicy(policyId); validateM3Evidence(evidence);
  check(!evidence.rules.some(rule => M3_ROOT_POLICY_METADATA.rules.some(own => own.id === rule.id)) && !evidence.sources.some(source => M3_ROOT_POLICY_METADATA.sources.some(own => own.id === source.id)), "ROOT_UPSTREAM_REGISTRY_COLLISION");
  check(m2Facts?.schemaVersion === "kasi-local-chart-facts-v1" && m2Facts.status === "READY", "ROOT_EXISTING_M2_FACTS_REQUIRED");
  check(m2Facts.policyBundle?.policies?.hiddenStems?.id === HIDDEN_STEM_POLICY_V1 && equal(m2Facts.policyBundle, evidence.upstreamPolicyBundle), "ROOT_M2_POLICY_CONTEXT_MISMATCH");
  dense(m2Facts.candidates, "ROOT_DENSE_CANDIDATES_REQUIRED");
  check(m2Facts.candidates.length === evidence.candidates.length, "ROOT_CANDIDATE_CONTEXT_MISMATCH");
  for (const kind of ["rules", "sources"] as const) {
    dense<unknown>(m2Facts[kind], "ROOT_DENSE_REGISTRY_REQUIRED");
    check(new Set(m2Facts[kind].map(item => item.id)).size === m2Facts[kind].length, "ROOT_DUPLICATE_REGISTRY_REFERENCE");
    check(m2Facts[kind].length === evidence[kind].length - evidence.policy[kind].length, "ROOT_INCOMPLETE_UPSTREAM_REGISTRY");
    for (const item of m2Facts[kind]) check(equal(item, evidence[kind].find(known => known.id === item.id)), "ROOT_REGISTRY_CONTEXT_MISMATCH");
  }
  const candidates = evidence.candidates.map((candidate, candidateIndex) => {
    const original = m2Facts.candidates[candidateIndex]!;
    check(original?.id === candidate.candidateRef && original.candidateIndex === candidateIndex && original.dayMaster === candidate.dayMaster, "ROOT_CANDIDATE_CONTEXT_MISMATCH");
    dense(original.pillars, "ROOT_DENSE_PILLARS_REQUIRED"); dense(original.facts, "ROOT_DENSE_FACTS_REQUIRED");
    check(original.pillars.length === 4, "ROOT_FOUR_VALID_PILLARS_REQUIRED");
    const facts = new Map(original.facts.map(fact => [fact.id, fact]));
    check(facts.size === original.facts.length, "ROOT_DUPLICATE_INPUT_FACT");
    const atoms = Object.values(candidate.directionalGroups).flat();
    const visible = [...atoms.filter(a => a.locationKind === "VISIBLE_STEM"), candidate.visibleDayMaster];
    const hidden = atoms.filter(a => a.locationKind === "HIDDEN_STEM");
    check(visible.length === 4 && new Set(visible.map(a => a.locationId)).size === 4 && new Set(hidden.map(a => a.locationId)).size === hidden.length, "ROOT_DUPLICATE_OR_MISSING_LOCATION");
    const locationEvidence = (location: M3StemLocation) => candidate.evidence.filter(e => e.kind === "HIDDEN_VISIBLE_LINKS" && location.locationKind === "VISIBLE_STEM" || e.kind === "DIRECTIONAL_GROUP" && record(e.value).locations instanceof Array && (record(e.value).locations as M3StemLocation[]).some(l => l.locationId === location.locationId));
    const branchMembers = ROLES.map((role, index) => {
      const pillar = original.pillars[index]!, pillarRef = candidate.candidateRef + "." + role;
      check(pillar?.role === role && pillar.factRef === `preview.candidates[${candidateIndex}].${role}` && HEAVENLY_STEMS.some(s => s === pillar.stem) && EARTHLY_BRANCHES.some(b => b === pillar.branch), "ROOT_PILLAR_CONTEXT_MISMATCH");
      const target = visible.find(l => l.pillarRole === role);
      check(target?.stem === pillar.stem && target.pillarRef === pillarRef && target.candidateRef === candidate.candidateRef && target.tenGod === pillar.visibleTenGod, "ROOT_VISIBLE_LOCATION_CONTEXT_MISMATCH");
      const expected = hiddenStemsForBranch(pillar.branch, HIDDEN_STEM_POLICY_V1), members = hidden.filter(l => l.pillarRole === role).sort((a, b) => a.index! - b.index!);
      dense(pillar.branchTenGods.members, "ROOT_DENSE_HIDDEN_MEMBERS_REQUIRED");
      check(pillar.branchTenGods.policyId === HIDDEN_STEM_POLICY_V1 && pillar.branchTenGods.branch === pillar.branch && members.length === expected.length && pillar.branchTenGods.members.length === expected.length, "ROOT_COMPLETE_HIDDEN_MEMBERS_REQUIRED");
      const fact = facts.get(candidate.candidateRef + "#" + role + "-hidden-stems");
      check(fact?.kind === "HIDDEN_STEMS" && fact.candidateRef === candidate.candidateRef && record(fact.value).branch === pillar.branch && record(fact.value).role === role && record(fact.value).dayMaster === candidate.dayMaster, "ROOT_HIDDEN_FACT_CONTEXT_MISMATCH");
      const factMembers = record(fact.value).members as unknown[]; dense(factMembers, "ROOT_DENSE_HIDDEN_FACT_MEMBERS_REQUIRED");
      check(factMembers.length === expected.length, "ROOT_COMPLETE_HIDDEN_MEMBERS_REQUIRED");
      members.forEach((member, i) => {
        const native = pillar.branchTenGods.members[i]!, known = expected[i]!, value = record(factMembers[i]);
        check(member.stem === known.stem && member.index === known.index && member.position === known.position && native.stem === member.stem && native.position === member.position && native.index === i && native.tenGod === member.tenGod, "ROOT_HIDDEN_MEMBER_CONTEXT_MISMATCH");
        check(member.candidateRef === candidate.candidateRef && member.pillarRef === pillarRef && member.inputFactRef === fact.id && member.inputMemberRef === value.id && value.candidateRef === candidate.candidateRef && value.pillarRef === pillarRef && value.stem === member.stem && value.index === i && value.position === member.position && value.tenGod === member.tenGod && value.memberRef === member.memberRef && value.m2FactRef === member.m2FactRef, "ROOT_MEMBER_REFERENCE_CONTEXT_MISMATCH");
      });
      return { role, pillarRef, branch: pillar.branch, members };
    });
    for (const location of [...visible, ...hidden]) {
      for (const id of location.inputFactRefs) {
        const fact = facts.get(id);
        check(fact?.candidateRef === candidate.candidateRef && location.ruleRefs.every(ref => evidence.rules.some(r => r.id === ref)) && location.sourceRefs.every(ref => evidence.sources.some(s => s.id === ref)), "ROOT_MISSING_OR_FOREIGN_FACT_RULE_SOURCE");
        for (const key of ["ruleRefs", "policyRefs", "sourceRefs", "calculationSourceRefs", "pillarRefs"] as const) {
          dense(fact[key], "ROOT_DENSE_FACT_REFERENCES_REQUIRED");
          // Existing M2 day-hidden fact lists both its day-master role and its branch role.
          // Both legitimately point to the day pillar. This is not a duplicate target/member link.
          const existingDayRolePair = key === "pillarRefs" && fact.id === candidate.candidateRef + "#day-hidden-stems" && fact[key].length === 2 && fact[key].every(ref => ref === candidate.candidateRef + ".day");
          check(existingDayRolePair || new Set(fact[key]).size === fact[key].length, "ROOT_DUPLICATE_FACT_REFERENCE");
        }
        check(fact.ruleRefs.length > 0 && fact.calculationSourceRefs.length > 0 && fact.ruleRefs.every(ref => location.ruleRefs.includes(ref)) && fact.policyRefs.every(ref => location.policyRefs.includes(ref)) && fact.sourceRefs.every(ref => location.sourceRefs.includes(ref)) && fact.calculationSourceRefs.every(ref => location.calculationSourceRefs.includes(ref)), "ROOT_FACT_REFERENCE_CONTEXT_MISMATCH");
        check(fact.pillarRefs.every(ref => ROLES.some(role => ref === candidate.candidateRef + "." + role)), "ROOT_FOREIGN_PILLAR_REFERENCE");
        if (fact.kind === "VISIBLE_TEN_GOD") check(record(fact.value).stem === location.stem && record(fact.value).dayMaster === candidate.dayMaster && record(fact.value).tenGod === location.tenGod && record(fact.value).role === location.pillarRole, "ROOT_TEN_GOD_FACT_CONTEXT_MISMATCH");
      }
      for (const key of ["ruleRefs", "policyRefs", "sourceRefs", "calculationSourceRefs"] as const) {
        check(equal(unique(location.inputFactRefs.flatMap(id => facts.get(id)![key])), location[key]), "ROOT_ORIGINAL_FACT_PROVENANCE_CHANGED");
      }
      const fact = facts.get(location.inputFactRef)!;
      if (location.locationKind === "VISIBLE_STEM") check(record(fact.value).stem === location.stem && record(fact.value).role === location.pillarRole, "ROOT_VISIBLE_FACT_CONTEXT_MISMATCH");
    }
    const related = (pillarRef: string) => candidate.evidence.filter(e => ["BRANCH_RELATION_CONTEXT", "TRIAD_MEMBERSHIP_CONTEXT"].includes(e.kind) && e.pillarRefs.includes(pillarRef));
    const targets = ROLES.map(role => {
      const target = visible.find(l => l.pillarRole === role)!, id = candidate.candidateRef + "#m3-root-target[" + role + "]";
      const branches = branchMembers.map(branch => {
        const branchId = id + "#branch[" + branch.role + "]", relationRecords = related(branch.pillarRef);
        const matches = branch.members.filter(h => h.element === target.element).map(hiddenMember => ({
          id: branchId + "#member[" + hiddenMember.index + "]", candidateRef: candidate.candidateRef,
          targetLocationRef: target.locationId, hidden: hiddenMember,
          matchType: (hiddenMember.stem === target.stem ? "EXACT_STEM" : "SAME_ELEMENT_DIFFERENT_STEM") as RootMatchType,
          samePillar: target.pillarRole === hiddenMember.pillarRole, isMonthBranch: hiddenMember.pillarRole === "month",
          relationEvidenceRefs: relationRecords.map(e => e.id), relationEffect: "NOT_EVALUATED" as const,
          ...refsFrom([target, hiddenMember], [...locationEvidence(target), ...locationEvidence(hiddenMember), ...relationRecords]),
        }));
        return { id: branchId, candidateRef: candidate.candidateRef, pillarRole: branch.role, pillarRef: branch.pillarRef, branch: branch.branch,
          rootPresence: (matches.length ? "PRESENT_UNDER_POLICY" : "ABSENT_UNDER_POLICY") as RootPresence, matches,
          examinedMemberRefs: branch.members.map(h => h.inputMemberRef!), relationEvidenceRefs: relationRecords.map(e => e.id),
          ...refsFrom([target, ...branch.members], [...locationEvidence(target), ...branch.members.flatMap(locationEvidence), ...relationRecords]) };
      });
      return { id, candidateRef: candidate.candidateRef, target, chartRootPresence: (branches.some(b => b.rootPresence === "PRESENT_UNDER_POLICY") ? "PRESENT_UNDER_POLICY" : "ABSENT_UNDER_POLICY") as RootPresence,
        branches, rootEfficacy: "NOT_EVALUATED" as const, rootStrength: "NOT_EVALUATED" as const,
        ...refsFrom([target, ...hidden], [...locationEvidence(target), ...hidden.flatMap(locationEvidence)]) };
    });
    const supportStems = targets.filter(t => t.target.pillarRole !== "day" && ["正印", "偏印", "比肩", "劫財"].includes(t.target.tenGod!)).map(target => ({
      id: candidate.candidateRef + "#m3-root-support[" + target.target.pillarRole + "]", candidateRef: candidate.candidateRef,
      targetRef: target.id, location: target.target, tenGod: target.target.tenGod!,
      supportKind: (["正印", "偏印"].includes(target.target.tenGod!) ? "RESOURCE" : "PEER") as "RESOURCE" | "PEER",
      chartRootPresence: target.chartRootPresence, supportTransmission: "NOT_EVALUATED" as const,
      ...refsFrom([target.target], locationEvidence(target.target)),
    }));
    return { candidateRef: candidate.candidateRef, candidateIndex, dayMaster: candidate.dayMaster,
      dayMasterTargetRef: targets[2]!.id, targets, supportStems,
      relatedRelationEvidenceRefs: candidate.evidence.filter(e => ["BRANCH_RELATION_CONTEXT", "TRIAD_MEMBERSHIP_CONTEXT"].includes(e.kind)).map(e => e.id),
      ...refsFrom([...visible, ...hidden], candidate.evidence),
    };
  });
  const result = freeze({ schemaVersion: M3_ROOT_SCHEMA, resolverVersion: M3_ROOT_VERSION, status: "RESOLVED_UNDER_POLICY" as const,
    policy: M3_ROOT_POLICY_METADATA, candidates,
    rules: [...evidence.rules, ...M3_ROOT_POLICY_METADATA.rules], sources: [...evidence.sources, ...M3_ROOT_POLICY_METADATA.sources],
    rootEfficacy: "NOT_EVALUATED" as const, rootStrength: "NOT_EVALUATED" as const,
    finalStrength: { status: "NOT_IMPLEMENTED", releaseGate: "M3_FINAL_BLOCKED_UNCHANGED" },
    validation: { level: "ISSUED_STRUCTURAL_M3_AND_ORIGINAL_M2_LOCATION_REFERENCE_CONSISTENCY", inputAuthentication: "NOT_PERFORMED_BY_PURE_MODULE", editionOrRightsApproval: false, predictiveValidity: "NOT_CLAIMED", upstreamRuleVersions: "PRESERVED_INCLUDING_NULL", g0Receipt: null, g1P2Promotion: false },
  });
  contexts.set(result, { evidence, m2Facts }); return result;
}
export type M3RootPresenceResult = ReturnType<typeof deriveM3RootPresence>;
export function validateM3RootPresence(result: M3RootPresenceResult,
  context: { readonly evidence?: M3EvidenceResult; readonly m2Facts?: M3InputEnvelope } = {}): true {
  const issued = result !== null && typeof result === "object" ? contexts.get(result) : undefined;
  check(issued && Object.isFrozen(result), "ISSUED_IMMUTABLE_ROOT_PRESENCE_REQUIRED");
  if (context.evidence !== undefined) check(context.evidence === issued.evidence, "ROOT_OTHER_EVIDENCE_CONTEXT");
  if (context.m2Facts !== undefined) check(context.m2Facts === issued.m2Facts, "ROOT_OTHER_M2_CONTEXT");
  validateM3Evidence(issued.evidence); return true;
}

function explanationContent(result: M3RootPresenceResult) {
  validateM3RootPresence(result);
  const candidates = result.candidates.map(candidate => {
    const items = candidate.targets.map(target => {
      const matches = target.branches.flatMap(branch => branch.matches.map(match => ({ branch, match })));
      const locations = matches.map(({ branch, match }) => `${BRANCH_ROLE_NAMES[branch.pillarRole]} ${branch.branch}의 ${match.hidden.stem}(${match.matchType === "EXACT_STEM" ? "정확한 천간 일치" : "음양이 다른 동오행"}, ${match.hidden.position === "MAIN_QI" ? "본기" : "기타 장간"})`);
      return { id: candidate.candidateRef + "#m3-root-explanation[target-" + target.target.pillarRole + "]", candidateRef: candidate.candidateRef,
        templateId: "KO_M3_ROOT_TARGET_PRESENCE", templateVersion: M3_ROOT_VERSION, judgmentRefs: [target.id],
        inputEvidenceRefs: target.inputEvidenceRefs, inputFactRefs: target.inputFactRefs, inputMemberRefs: target.inputMemberRefs,
        pillarRefs: target.pillarRefs, ruleRefs: target.ruleRefs, policyRefs: target.policyRefs, sourceRefs: target.sourceRefs, calculationSourceRefs: target.calculationSourceRefs,
        text: `선택한 장간 동오행 정책에서 ${ROLE_NAMES[target.target.pillarRole]} ${target.target.stem}${matches.length ? "의 통근이 다음 위치에서 성립합니다: " + locations.join(" · ") : "의 근은 원국 네 지지의 장간에서 확인되지 않습니다"}.` };
    });
    const supportItems = candidate.supportStems.map(support => ({
      id: candidate.candidateRef + "#m3-root-explanation[support-" + support.location.pillarRole + "]", candidateRef: candidate.candidateRef,
      templateId: "KO_M3_ROOT_VISIBLE_SUPPORT_OWN_ROOT", templateVersion: M3_ROOT_VERSION, judgmentRefs: [support.id, support.targetRef],
      inputEvidenceRefs: support.inputEvidenceRefs, inputFactRefs: support.inputFactRefs, inputMemberRefs: support.inputMemberRefs,
      pillarRefs: support.pillarRefs, ruleRefs: support.ruleRefs, policyRefs: support.policyRefs, sourceRefs: support.sourceRefs, calculationSourceRefs: support.calculationSourceRefs,
      text: `${ROLE_NAMES[support.location.pillarRole]} ${support.location.stem}의 일간 기준 십성은 ${TEN_GOD_NAMES[support.tenGod]}이며 표면 ${support.supportKind === "RESOURCE" ? "인성" : "비겁"}에 해당합니다. 이 천간 자신의 ${support.chartRootPresence === "PRESENT_UNDER_POLICY" ? "동오행 근이 있습니다" : "동오행 근은 확인되지 않습니다"}. 일간의 직접 근과 구분하며 실제 생조 전달 정도는 평가하지 않습니다.` }));
    const relationItem = { id: candidate.candidateRef + "#m3-root-explanation[relations]", candidateRef: candidate.candidateRef,
      templateId: "KO_M3_ROOT_RELATION_CONTEXT", templateVersion: M3_ROOT_VERSION, judgmentRefs: candidate.targets.map(t => t.id),
      inputEvidenceRefs: candidate.relatedRelationEvidenceRefs, inputFactRefs: candidate.inputFactRefs, inputMemberRefs: candidate.inputMemberRefs,
      pillarRefs: candidate.pillarRefs, ruleRefs: candidate.ruleRefs, policyRefs: candidate.policyRefs, sourceRefs: candidate.sourceRefs, calculationSourceRefs: candidate.calculationSourceRefs,
      text: candidate.relatedRelationEvidenceRefs.length ? "이 후보에 기존 M2의 지지 관계·구성원 근거가 있습니다. 관련 위치를 연결했으며, 관계에 따른 근의 손상·활성·변화는 평가하지 않아 근 목록을 삭제하거나 바꾸지 않습니다." : "이 후보에는 기존 M2가 분류한 지지 관계·구성원 근거가 없습니다. 이것만으로 근의 실제 효력이 확정되지는 않습니다." };
    return { candidateRef: candidate.candidateRef, candidateIndex: candidate.candidateIndex, items: [...items, ...supportItems, relationItem] };
  });
  return { schemaVersion: "ko-m3-root-presence-templates-v1", templateVersion: M3_ROOT_VERSION, title: "구성상 통근과 표면 생조 요소의 자체 근",
    status: "RESOLVED_UNDER_POLICY", scopeNote: "통근 성립·불성립은 선택한 장간 동오행 존재 기준의 구성상 판정입니다. 본기·기타·월지 여부를 강도나 점수로 바꾸지 않습니다. 인성·비겁의 자체 근을 일간의 직접 근으로 복사하지 않으며, 근력·실제 효력·생조 전달·종합 신강약·길흉은 판단하지 않습니다. 무근은 신약·무력·종격의 결론이 아닙니다.", candidates };
}
export function explainM3RootPresence(result: M3RootPresenceResult) { return freeze(explanationContent(result)); }
export function validateM3RootPresenceExplanation(explanation: unknown, result: M3RootPresenceResult): true {
  check(equal(explanation, explanationContent(result)), "ROOT_EXPLANATION_CONTENT_OR_REFERENCES_CHANGED"); return true;
}
