import { STEM_NATURE, type HeavenlyStem } from "../domain/stems.js";
import { tenGod } from "../domain/tenGods.js";
import { areStemCombinationPartners } from "../domain/stemCombinations.js";
import { validateM3Evidence, type M3EvidenceResult, type M3InputEnvelope, type M3StemLocation, type M3EvidenceRecord } from "./structuralEvidenceV1.js";
import { M3_ROOT_POLICY_ID, validateM3RootPresence, type M3RootPresenceResult } from "./rootPresenceV1.js";

export { areStemCombinationPartners, stemCombinationPartner, STEM_COMBINATION_PAIRS } from "../domain/stemCombinations.js";
export const M3_SUPPORT_POLICY_ID = "M3-RESOURCE-ADJACENT-COMBINATION-HOLD-V01" as const;
export const M3_SUPPORT_VERSION = "0.1.0" as const;
export const M3_SUPPORT_SCHEMA = "m3-resource-support-v1" as const;
const BASE_TEXT = "TXT-ZIPING-ZHENQUAN-DONGLI-STEM-COMBINATION-BASE";
const XU_COMMENTARY = "TXT-ZIPING-ZHENQUAN-NCC-XU-STEM-COMBINATION-COMMENTARY";
const IMPLEMENTATION = "IMPL-M3-RESOURCE-ADJACENT-COMBINATION-HOLD-V01";
const PAIR_RULE = "M3-RULE-RESOURCE-FIVE-COMBINATION-PARTNERS-001";
const HOLD_RULE = "M3-RULE-RESOURCE-ADJACENT-COMBINATION-HOLD-001";
const SCOPE_RULE = "M3-RULE-RESOURCE-COMBINATION-SCOPE-001";
const ROLES = ["year", "month", "day", "hour"] as const;
const ROLE_NAMES = { year: "연간", month: "월간", day: "일간", hour: "시간" } as const;
const GOD_NAMES = { 正印: "정인", 偏印: "편인" } as const;
const isResource = (value: unknown): value is "正印" | "偏印" => value === "正印" || value === "偏印";
function check(value: unknown, code: string): asserts value { if (!value) throw new RangeError(code); }
function dense<T>(value: readonly T[], code = "M3_SUPPORT_DENSE_ARRAY_REQUIRED"): readonly T[] {
  check(Array.isArray(value) && Array.from({ length: value.length }, (_, i) => Object.hasOwn(value, i)).every(Boolean), code); return value;
}
function record(value: unknown): Record<string, unknown> { check(value !== null && typeof value === "object" && !Array.isArray(value), "M3_SUPPORT_PLAIN_RECORD_REQUIRED"); return value as Record<string, unknown>; }
const frozenTrees = new WeakSet<object>();
function frozenTree(value: unknown): boolean {
  if (value === null || typeof value !== "object") return typeof value !== "function";
  if (frozenTrees.has(value)) return true;
  if (!Object.isFrozen(value) || (Array.isArray(value) && !Array.from({ length: value.length }, (_, i) => Object.hasOwn(value, i)).every(Boolean)) || !Object.values(value).every(frozenTree)) return false;
  frozenTrees.add(value); return true;
}
function freeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || frozenTree(value)) return value;
  if (Array.isArray(value)) { dense(value); value.forEach(freeze); } else Object.values(value).forEach(freeze);
  Object.freeze(value); frozenTrees.add(value); return value;
}
function equal(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (left === null || right === null || typeof left !== "object" || typeof right !== "object" || Array.isArray(left) !== Array.isArray(right)) return false;
  if (Array.isArray(left)) {
    if (!Array.isArray(right) || left.length !== right.length) return false;
    for (let i = 0; i < left.length; i++) if (!Object.hasOwn(left, i) || !Object.hasOwn(right, i) || !equal(left[i], right[i])) return false;
  }
  const a = Object.keys(left).sort(), b = Object.keys(right).sort();
  return a.length === b.length && a.every((key, i) => key === b[i] && equal((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key]));
}
const unique = (values: readonly string[]) => [...new Set(values)];

export const M3_SUPPORT_POLICY_METADATA = freeze({
  id: M3_SUPPORT_POLICY_ID, version: M3_SUPPORT_VERSION, schemaVersion: M3_SUPPORT_SCHEMA,
  kind: "SELECTED_SURFACE_RESOURCE_ADJACENT_COMBINATION_ADOPTION_HOLD",
  rootPolicyId: M3_ROOT_POLICY_ID,
  targets: "NON_DAY_NATAL_VISIBLE_ZHENGYIN_AND_PIANYIN_POSITIONS_ONLY",
  roleOrder: ROLES, adjacency: "CONSECUTIVE_NATAL_YEAR_MONTH_DAY_HOUR_POSITIONS",
  pairs: ["甲己", "乙庚", "丙辛", "丁壬", "戊癸"],
  scope: "UNIQUE_ADJACENT_OTHER_STEM_PARTNER_WITH_NO_SHARED_PARTNER_COMPETITION",
  priority: "REMOTE_MULTIPLE_OR_COMPETING_INTERACTION_BEFORE_ROOTED_EXCEPTION_BEFORE_UNROOTED_HOLD",
  reachability: "A_VALID_RESOURCE_CANNOT_PAIR_WITH_ITS_DAY_MASTER; SINGLE_ADJACENT_APPLICATION_IS_YEAR_MONTH_ONLY",
  decisionMeaning: "AUTOMATIC_SUPPORT_ADOPTION_RESTRICTION_FROM_THIS_ONE_REASON_NOT_TOTAL_EFFICACY",
  rules: [
    { id: PAIR_RULE, runtimeVersion: M3_SUPPORT_VERSION, sourceRuleVersion: null, kind: "FIVE_PAIR_MEMBERSHIP_NOT_TRANSFORMATION", policyIds: [M3_SUPPORT_POLICY_ID], sourceIds: [BASE_TEXT, XU_COMMENTARY, IMPLEMENTATION] },
    { id: HOLD_RULE, runtimeVersion: M3_SUPPORT_VERSION, sourceRuleVersion: null, kind: "PROJECT_NARROWED_RESOURCE_ADOPTION_HOLD_WITH_ROOT_EXCEPTION", policyIds: [M3_SUPPORT_POLICY_ID, M3_ROOT_POLICY_ID], sourceIds: [BASE_TEXT, XU_COMMENTARY, IMPLEMENTATION] },
    { id: SCOPE_RULE, runtimeVersion: M3_SUPPORT_VERSION, sourceRuleVersion: null, kind: "PROJECT_POSITION_AND_COMPETITION_DECISION_PRIORITY", policyIds: [M3_SUPPORT_POLICY_ID], sourceIds: [BASE_TEXT, XU_COMMENTARY, IMPLEMENTATION] },
  ],
  sources: [
    { id: BASE_TEXT, kind: "CLASSICAL_BASE_TEXT_WEB_TRANSCRIPTION", title: "子平真詮：論十干配合性情；論十干合而不合", url: "https://ncc.com.tw/fate/paleo/bg/bg_032.htm", companionUrls: ["https://www.donglishuzhai.net/chapter/3717.html", "https://www.donglishuzhai.net/chapter/3718.html"], accessedOn: "2026-11-12", nativeRuleVersion: null,
      verification: "NCC_DIRECT_TRANSCRIPTION_READ_DONGLI_SEARCH_BODY_READ_DIRECT_FETCH_FAILED_NOT_SCAN_OR_CRITICAL_EDITION", rightsReview: "UNVERIFIED", use: "RESOURCE_COMBINATION_AND_SEPARATION_CONTEXT_NOT_UNIVERSAL_UNROOTED_RESOURCE_INVALIDATION" },
    { id: XU_COMMENTARY, kind: "CLASSICAL_COMMENTARY_WEB_TRANSCRIPTION", title: "子平真詮評註：徐樂吾評註", section: "論十干配合性情；論十干合而不合", url: "https://ncc.com.tw/fate/paleo/bg/bg_032.htm", accessedOn: "2026-11-12", nativeRuleVersion: null,
      verification: "DIRECT_WEB_COMMENTARY_TRANSCRIPTION_NOT_AUTHOR_BASE_TEXT_OR_SCAN", rightsReview: "UNVERIFIED", use: "ROOTED_COMBINATION_RETAINS_EFFECT_EXCEPTION_CONTEXT_NOT_A_QUANTIFIED_SUPPORT_RULE" },
    { id: IMPLEMENTATION, kind: "PROJECT_IMPLEMENTATION_DEFINITION", implementationRef: "src/m3/resourceSupportV1.ts", version: M3_SUPPORT_VERSION,
      use: "BOTH_RESOURCE_TEN_GODS_ALL_PARTNERS_FIXED_POSITION_ADJACENCY_SHARED_PARTNER_COMPETITION_AND_OWNER_A_TO_E_DECISION_TABLE" },
  ],
  excluded: ["HIDDEN_RESOURCE_DECISION", "LUCK_STEMS", "TRANSFORMATION", "RESOURCE_DELETION", "ROOT_FORCE_OR_DAMAGE", "TOTAL_SUPPORT_EFFICACY", "WEIGHTS", "SCORES", "FINAL_STRENGTH", "GEJU", "YONGSHEN", "FORTUNE", "PREDICTION"],
  unchangedGate: "docs/research/M3_STRENGTH_GO_NOGO_DECISION_SPEC_20261018.md",
});

type RootTarget = M3RootPresenceResult["candidates"][number]["targets"][number];
type Refs = Pick<RootTarget, "inputEvidenceRefs" | "inputFactRefs" | "inputMemberRefs" | "pillarRefs" | "ruleRefs" | "policyRefs" | "sourceRefs" | "calculationSourceRefs">;
function refsFrom(locations: readonly M3StemLocation[], records: readonly M3EvidenceRecord[], roots: readonly RootTarget[] = []): Refs {
  return {
    inputEvidenceRefs: unique([...records.map(e => e.id), ...roots.flatMap(r => r.inputEvidenceRefs)]),
    inputFactRefs: unique([...locations.flatMap(l => l.inputFactRefs), ...roots.flatMap(r => r.inputFactRefs)]),
    inputMemberRefs: unique([...locations.flatMap(l => l.inputMemberRef ? [l.inputMemberRef] : []), ...roots.flatMap(r => r.inputMemberRefs)]),
    pillarRefs: unique([...locations.map(l => l.pillarRef), ...roots.flatMap(r => r.pillarRefs)]),
    ruleRefs: unique([...M3_SUPPORT_POLICY_METADATA.rules.map(r => r.id), ...locations.flatMap(l => l.ruleRefs), ...records.flatMap(r => r.ruleRefs), ...roots.flatMap(r => r.ruleRefs)]),
    policyRefs: unique([M3_SUPPORT_POLICY_ID, M3_ROOT_POLICY_ID, ...locations.flatMap(l => l.policyRefs), ...records.flatMap(r => r.policyRefs), ...roots.flatMap(r => r.policyRefs)]),
    sourceRefs: unique([BASE_TEXT, XU_COMMENTARY, IMPLEMENTATION, ...locations.flatMap(l => l.sourceRefs), ...records.flatMap(r => r.sourceRefs), ...roots.flatMap(r => r.sourceRefs)]),
    calculationSourceRefs: unique([...locations.flatMap(l => l.calculationSourceRefs), ...records.flatMap(r => r.calculationSourceRefs), ...roots.flatMap(r => r.calculationSourceRefs)]),
  };
}

/** Checks consumed original facts against issued immutable locations, without rerunning M1, M2, M3 or root derivation. */
function validateContext(evidence: M3EvidenceResult, root: M3RootPresenceResult, m2Facts: M3InputEnvelope): void {
  validateM3Evidence(evidence); validateM3RootPresence(root, { evidence, m2Facts });
  check(root.policy.id === M3_ROOT_POLICY_ID, "M3_SUPPORT_EXPLICIT_ROOT_DEPENDENCY_REQUIRED");
  check(m2Facts?.schemaVersion === "kasi-local-chart-facts-v1" && m2Facts.status === "READY" && equal(m2Facts.policyBundle, evidence.upstreamPolicyBundle), "M3_SUPPORT_ORIGINAL_M2_CONTEXT_REQUIRED");
  for (const kind of ["rules", "sources"] as const) {
    dense<unknown>(m2Facts[kind]); check(new Set(m2Facts[kind].map(item => item.id)).size === m2Facts[kind].length, "M3_SUPPORT_DUPLICATE_REGISTRY_REFERENCE");
    check(m2Facts[kind].length === evidence[kind].length - evidence.policy[kind].length, "M3_SUPPORT_UPSTREAM_REGISTRY_CHANGED");
    for (const item of m2Facts[kind]) check(equal(item, evidence[kind].find(known => known.id === item.id)), "M3_SUPPORT_UPSTREAM_REGISTRY_CHANGED");
    check(!root[kind].some(item => M3_SUPPORT_POLICY_METADATA[kind].some(own => own.id === item.id)), "M3_SUPPORT_UPSTREAM_REGISTRY_COLLISION");
  }
  dense(m2Facts.candidates); check(m2Facts.candidates.length === evidence.candidates.length && root.candidates.length === evidence.candidates.length, "M3_SUPPORT_CANDIDATE_CONTEXT_MISMATCH");
  evidence.candidates.forEach((candidate, index) => {
    const original = m2Facts.candidates[index]!, roots = root.candidates[index]!;
    check(original?.id === candidate.candidateRef && roots.candidateRef === candidate.candidateRef && original.candidateIndex === index && roots.candidateIndex === index && original.dayMaster === candidate.dayMaster, "M3_SUPPORT_CANDIDATE_CONTEXT_MISMATCH");
    dense(original.pillars); dense(original.facts); check(original.pillars.length === 4 && roots.targets.length === 4, "M3_SUPPORT_FOUR_VALID_PILLARS_REQUIRED");
    const facts = new Map(original.facts.map(fact => [fact.id, fact])); check(facts.size === original.facts.length, "M3_SUPPORT_DUPLICATE_INPUT_FACT");
    for (const fact of original.facts) {
      check(fact?.candidateRef === candidate.candidateRef && fact.id.startsWith(candidate.candidateRef + "#"), "M3_SUPPORT_FOREIGN_INPUT_FACT");
      for (const key of ["inputFactRefs", "ruleRefs", "policyRefs", "sourceRefs", "calculationSourceRefs", "pillarRefs"] as const) {
        if (key === "inputFactRefs") continue;
        dense(fact[key]);
        // Both native day-derived facts list the day-master role and the target day role.
        // Their repeated day pillar is distinct from a duplicate support/partner graph edge.
        const dayRolePair = key === "pillarRefs" && [candidate.candidateRef + "#day-hidden-stems", candidate.candidateRef + "#day-twelve-growth"].includes(fact.id) && fact[key].length === 2 && fact[key].every(ref => ref === candidate.candidateRef + ".day");
        check(dayRolePair || new Set(fact[key]).size === fact[key].length, "M3_SUPPORT_DUPLICATE_FACT_REFERENCE");
      }
      check(fact.ruleRefs.every(ref => evidence.rules.some(rule => rule.id === ref)) && fact.sourceRefs.every(ref => evidence.sources.some(source => source.id === ref)) && fact.calculationSourceRefs.every(ref => evidence.sources.some(source => source.id === ref)), "M3_SUPPORT_MISSING_RULE_OR_SOURCE");
    }
    roots.targets.forEach((target, roleIndex) => {
      const role = ROLES[roleIndex]!, location = target.target, native = original.pillars[roleIndex]!, branch = target.branches[roleIndex]!;
      check(native.role === role && native.factRef === `preview.candidates[${index}].${role}` && location.pillarRole === role && location.locationKind === "VISIBLE_STEM" && location.locationId === candidate.candidateRef + "." + role + ".stem" && location.candidateRef === candidate.candidateRef && location.stem === native.stem && branch.branch === native.branch, "M3_SUPPORT_VISIBLE_POSITION_CONTEXT_MISMATCH");
      const god = role === "day" ? null : tenGod(candidate.dayMaster, native.stem);
      check(native.visibleTenGod === god && location.tenGod === god && equal(STEM_NATURE[location.stem], { element: location.element, polarity: location.polarity }), "M3_SUPPORT_RESOURCE_CLASSIFICATION_MISMATCH");
      const nf = facts.get(location.inputFactRef), nv = record(nf?.value);
      check(nf?.kind === "PILLAR_NATURE" && nv.stem === location.stem && nv.role === role && nv.branch === branch.branch && equal(nv.stemNature, STEM_NATURE[location.stem]), "M3_SUPPORT_VISIBLE_FACT_CHANGED");
      for (const ref of location.inputFactRefs) {
        const fact = facts.get(ref); check(fact && fact.candidateRef === candidate.candidateRef, "M3_SUPPORT_MISSING_VISIBLE_FACT");
        if (fact.kind === "VISIBLE_TEN_GOD") { const value = record(fact.value); check(value.role === role && value.stem === location.stem && value.dayMaster === candidate.dayMaster && value.tenGod === god, "M3_SUPPORT_RESOURCE_FACT_CHANGED"); }
      }
      for (const key of ["ruleRefs", "policyRefs", "sourceRefs", "calculationSourceRefs"] as const) check(equal(unique(location.inputFactRefs.flatMap(ref => facts.get(ref)![key])), location[key]), "M3_SUPPORT_VISIBLE_PROVENANCE_CHANGED");
      const hiddenLocations = Object.values(candidate.directionalGroups).flat().filter(l => l.locationKind === "HIDDEN_STEM" && l.pillarRole === role).sort((a, b) => a.index! - b.index!);
      const hf = facts.get(candidate.candidateRef + "#" + role + "-hidden-stems"), hv = record(hf?.value);
      const members = hv.members as unknown[]; dense(members); dense(native.branchTenGods.members);
      check(hf?.kind === "HIDDEN_STEMS" && hv.branch === branch.branch && hv.role === role && hv.dayMaster === candidate.dayMaster && members.length === hiddenLocations.length && native.branchTenGods.members.length === hiddenLocations.length && native.branchTenGods.policyId === m2Facts.policyBundle.policies.hiddenStems?.id && native.branchTenGods.dayMaster === candidate.dayMaster && native.branchTenGods.branch === branch.branch, "M3_SUPPORT_ROOT_INPUT_CHANGED");
      hiddenLocations.forEach((member, memberIndex) => {
        const current = record(members[memberIndex]), nativeMember = native.branchTenGods.members[memberIndex]!;
        check(current.id === member.inputMemberRef && current.candidateRef === candidate.candidateRef && current.pillarRef === member.pillarRef && current.stem === member.stem && current.index === member.index && current.position === member.position && current.tenGod === member.tenGod && current.memberRef === member.memberRef && current.m2FactRef === member.m2FactRef && nativeMember.stem === member.stem && nativeMember.index === member.index && nativeMember.position === member.position && nativeMember.tenGod === member.tenGod, "M3_SUPPORT_ROOT_MEMBER_CHANGED");
        for (const key of ["ruleRefs", "policyRefs", "sourceRefs", "calculationSourceRefs"] as const) {
          check(equal(hf[key], member[key]), "M3_SUPPORT_ROOT_PROVENANCE_CHANGED");
          // Existing member records carry a subset of their parent fact's rule/source references,
          // and do not carry calculationSourceRefs. Preserve that native contract.
          if (key !== "calculationSourceRefs") {
            const refs = current[key] as unknown[]; dense(refs);
            check(refs.every(ref => typeof ref === "string" && hf[key].includes(ref)) && new Set(refs).size === refs.length, "M3_SUPPORT_ROOT_MEMBER_PROVENANCE_CHANGED");
          }
        }
      });
    });
  });
}

export type ResourceSupportDecision = "NO_HOLD_BY_THIS_RULE" | "OUT_OF_SCOPE_INTERACTION" | "SUPPORT_HELD_UNDER_SELECTED_RULE" | "ROOTED_COMBINATION_EFFECT_UNRESOLVED";
interface SupportContext { readonly evidence: M3EvidenceResult; readonly root: M3RootPresenceResult; readonly m2Facts: M3InputEnvelope; readonly mutableInputSnapshot: string | null; }
const contexts = new WeakMap<object, SupportContext>();

/** Consumes the already issued root result in the same M3/M2 execution; no calendar or rule-table derivation is repeated. */
export function deriveM3ResourceSupport(evidence: M3EvidenceResult,
  { policyId, root, m2Facts }: { readonly policyId: string; readonly root: M3RootPresenceResult; readonly m2Facts: M3InputEnvelope }) {
  check(policyId === M3_SUPPORT_POLICY_ID, "EXPLICIT_SUPPORTED_M3_SUPPORT_POLICY_REQUIRED"); validateContext(evidence, root, m2Facts);
  const candidates = root.candidates.map((candidate, candidateIndex) => {
    const structural = evidence.candidates[candidateIndex]!, visible = candidate.targets.map(target => target.target);
    const resourceTargets = candidate.targets.filter(target => target.target.pillarRole !== "day" && isResource(target.target.tenGod));
    const partnersFor = (target: RootTarget) => visible.filter(location => location.locationId !== target.target.locationId && areStemCombinationPartners(target.target.stem, location.stem));
    const resources = resourceTargets.map(target => {
      const location = target.target, ownPartners = partnersFor(target);
      check(!ownPartners.some(partner => partner.pillarRole === "day"), "M3_SUPPORT_RESOURCE_DAY_PAIR_IMPOSSIBLE");
      const combinationPartners = ownPartners.map(partner => {
        const roleDistance = Math.abs(ROLES.indexOf(location.pillarRole) - ROLES.indexOf(partner.pillarRole));
        const competing = resourceTargets.filter(other => other.target.locationId !== location.locationId && partnersFor(other).some(value => value.locationId === partner.locationId));
        return { id: target.id + "#resource-combination[" + partner.pillarRole + "]", candidateRef: candidate.candidateRef, partner,
          roleDistance, adjacent: roleDistance === 1, competingResourceLocationRefs: competing.map(other => other.target.locationId),
          ...refsFrom([location, partner, ...competing.map(other => other.target)], structural.evidence.filter(item => item.kind === "DIRECTIONAL_GROUP" && item.pillarRefs.some(ref => [location.pillarRef, partner.pillarRef].includes(ref))), [target]) };
      });
      const rootPresent = target.chartRootPresence === "PRESENT_UNDER_POLICY";
      const reasons: string[] = [rootPresent ? "RESOURCE_ROOT_PRESENT_UNDER_SELECTED_POLICY" : "RESOURCE_ROOT_ABSENT_UNDER_SELECTED_POLICY"];
      if (!combinationPartners.length) reasons.push("NO_VISIBLE_COMBINATION_PARTNER");
      if (combinationPartners.some(partner => !partner.adjacent)) reasons.push("REMOTE_OR_SEPARATED_PARTNER");
      if (combinationPartners.length > 1) reasons.push("MULTIPLE_VISIBLE_COMBINATION_PARTNERS");
      if (combinationPartners.some(partner => partner.competingResourceLocationRefs.length)) reasons.push("COMPETING_SURFACE_RESOURCES");
      if (combinationPartners.length === 1 && combinationPartners[0]!.adjacent) reasons.push("UNIQUE_ADJACENT_OTHER_STEM_PARTNER");
      if (rootPresent && combinationPartners.length) reasons.push("ROOTED_EXCEPTION_EFFECT_NOT_EVALUATED");
      const outside = combinationPartners.some(partner => !partner.adjacent || partner.competingResourceLocationRefs.length > 0) || combinationPartners.length > 1;
      const selectedRuleDecision: ResourceSupportDecision = !combinationPartners.length ? "NO_HOLD_BY_THIS_RULE" : outside ? "OUT_OF_SCOPE_INTERACTION" : rootPresent ? "ROOTED_COMBINATION_EFFECT_UNRESOLVED" : "SUPPORT_HELD_UNDER_SELECTED_RULE";
      return { id: candidate.candidateRef + "#m3-resource-support[" + location.pillarRole + "]", candidateRef: candidate.candidateRef,
        resource: location, resourcePresence: { tenGod: location.tenGod!, scope: "SURFACE_NON_DAY" as const }, rootTargetRef: target.id, rootPresence: target.chartRootPresence,
        combinationPartners, selectedRuleDecision, decisionReasons: reasons,
        automaticSupportAdoption: selectedRuleDecision === "SUPPORT_HELD_UNDER_SELECTED_RULE" ? "HELD_BY_SELECTED_RULE" : selectedRuleDecision === "NO_HOLD_BY_THIS_RULE" ? "NOT_HELD_BY_THIS_RULE_ONLY" : "NOT_DECIDED_BY_THIS_RULE",
        rootJudgmentRefs: [target.id], rootMatchRefs: target.branches.flatMap(branch => branch.matches.map(match => match.id)),
        ...refsFrom([location, ...ownPartners], structural.evidence.filter(item => item.kind === "DIRECTIONAL_GROUP" || item.kind === "HIDDEN_VISIBLE_LINKS"), [target]),
        totalSupportEfficacy: "NOT_EVALUATED" as const, finalStrength: "NOT_IMPLEMENTED" as const };
    });
    return { id: candidate.candidateRef + "#m3-resource-support", candidateRef: candidate.candidateRef, candidateIndex, dayMaster: candidate.dayMaster,
      resourcePresence: resources.length ? "PRESENT" as const : "NO_SURFACE_RESOURCE_TARGET" as const,
      selectedRuleDecision: resources.length ? "ASSESSED_PER_RESOURCE" as const : "NOT_APPLICABLE" as const,
      decisionReasons: resources.length ? [] : ["NO_SURFACE_RESOURCE_TARGETS"], resources,
      rootJudgmentRefs: resources.map(resource => resource.rootTargetRef), rootMatchRefs: unique(resources.flatMap(resource => resource.rootMatchRefs)),
      ...refsFrom(visible, structural.evidence.filter(item => item.kind === "DIRECTIONAL_GROUP" || item.kind === "HIDDEN_VISIBLE_LINKS"), resourceTargets),
      totalSupportEfficacy: "NOT_EVALUATED" as const, finalStrength: "NOT_IMPLEMENTED" as const };
  });
  const result = freeze({ schemaVersion: M3_SUPPORT_SCHEMA, resolverVersion: M3_SUPPORT_VERSION, status: "RESOLVED_UNDER_POLICY" as const,
    policy: M3_SUPPORT_POLICY_METADATA, candidates, rules: [...root.rules, ...M3_SUPPORT_POLICY_METADATA.rules], sources: [...root.sources, ...M3_SUPPORT_POLICY_METADATA.sources],
    totalSupportEfficacy: "NOT_EVALUATED" as const, finalStrength: { status: "NOT_IMPLEMENTED", releaseGate: "M3_FINAL_BLOCKED_UNCHANGED" },
    validation: { level: "ISSUED_SAME_EXECUTION_M3_ROOT_AND_CONSUMED_ORIGINAL_M2_CONSISTENCY", inputAuthentication: "NOT_PERFORMED_BY_PURE_MODULE", editionOrRightsApproval: false, predictiveValidity: "NOT_CLAIMED", upstreamRuleVersions: "PRESERVED_INCLUDING_NULL", g0Receipt: null, g1P2Promotion: false } });
  contexts.set(result, { evidence, root, m2Facts, mutableInputSnapshot: frozenTree(m2Facts) ? null : JSON.stringify(m2Facts) }); return result;
}
export type M3ResourceSupportResult = ReturnType<typeof deriveM3ResourceSupport>;
export function validateM3ResourceSupport(result: M3ResourceSupportResult,
  context: { readonly evidence?: M3EvidenceResult; readonly root?: M3RootPresenceResult; readonly m2Facts?: M3InputEnvelope } = {}): true {
  const issued = result !== null && typeof result === "object" ? contexts.get(result) : undefined;
  check(issued && Object.isFrozen(result), "ISSUED_IMMUTABLE_M3_RESOURCE_SUPPORT_REQUIRED");
  if (context.evidence !== undefined) check(context.evidence === issued.evidence, "M3_SUPPORT_OTHER_EVIDENCE_CONTEXT");
  if (context.root !== undefined) check(context.root === issued.root, "M3_SUPPORT_OTHER_ROOT_CONTEXT");
  if (context.m2Facts !== undefined) check(context.m2Facts === issued.m2Facts, "M3_SUPPORT_OTHER_M2_CONTEXT");
  validateM3Evidence(issued.evidence); validateM3RootPresence(issued.root, { evidence: issued.evidence, m2Facts: issued.m2Facts });
  if (issued.mutableInputSnapshot !== null) check(JSON.stringify(issued.m2Facts) === issued.mutableInputSnapshot, "M3_SUPPORT_ORIGINAL_M2_CHANGED_AFTER_ISSUANCE");
  return true;
}

function explanationContent(result: M3ResourceSupportResult) {
  validateM3ResourceSupport(result);
  const candidates = result.candidates.map(candidate => {
    const refs = (item: typeof candidate | typeof candidate.resources[number]) => ({ judgmentRefs: [item.id], rootJudgmentRefs: item.rootJudgmentRefs, rootMatchRefs: item.rootMatchRefs,
      inputEvidenceRefs: item.inputEvidenceRefs, inputFactRefs: item.inputFactRefs, inputMemberRefs: item.inputMemberRefs,
      pillarRefs: item.pillarRefs, ruleRefs: item.ruleRefs, policyRefs: item.policyRefs, sourceRefs: item.sourceRefs, calculationSourceRefs: item.calculationSourceRefs });
    const items = candidate.resources.map(resource => {
      check(isResource(resource.resource.tenGod), "M3_SUPPORT_RESOURCE_TEMPLATE_REQUIRED");
      const label = `${ROLE_NAMES[resource.resource.pillarRole]} ${resource.resource.stem}(${GOD_NAMES[resource.resource.tenGod]})`;
      const ownRoot = resource.rootPresence === "PRESENT_UNDER_POLICY" ? "선택한 장간 동오행 정책의 자체 근이 있습니다" : "선택한 장간 동오행 정책의 자체 근은 없습니다";
      const partners = resource.combinationPartners.map(partner => `${ROLE_NAMES[partner.partner.pillarRole]} ${partner.partner.stem}(${partner.adjacent ? "인접" : "격위·원격"}${partner.competingResourceLocationRefs.length ? ", 다른 표면 인성과 같은 상대를 공유" : ""})`).join(" · ");
      let decision: string;
      switch (resource.selectedRuleDecision) {
        case "NO_HOLD_BY_THIS_RULE": decision = "표면 오합 상대가 없어 이번 천간합 규칙에 따른 생조 채택 제한은 없습니다"; break;
        case "SUPPORT_HELD_UNDER_SELECTED_RULE": decision = `유일한 표면 오합 상대 ${partners}와 인접하고 자체 근이 없어, 선택한 규칙에서는 독립적인 생조 요소로 자동 채택하는 것을 유보합니다`; break;
        case "ROOTED_COMBINATION_EFFECT_UNRESOLVED": decision = `유일한 표면 오합 상대 ${partners}와 인접하지만 자체 근의 예외가 있어, 합으로 작용을 없애거나 생조가 충분하다고 확정하지 않습니다`; break;
        case "OUT_OF_SCOPE_INTERACTION": {
          const reasons = [resource.decisionReasons.includes("REMOTE_OR_SEPARATED_PARTNER") ? "격위·원격 상대" : "", resource.decisionReasons.includes("MULTIPLE_VISIBLE_COMBINATION_PARTNERS") ? "복수 오합 상대" : "", resource.decisionReasons.includes("COMPETING_SURFACE_RESOURCES") ? "같은 상대를 향하는 표면 인성의 경쟁" : ""].filter(Boolean);
          decision = `표면 오합 상대는 ${partners}이며, ${reasons.join(" · ")} 조건이 이번 좁은 결정표의 범위 밖입니다${resource.rootPresence === "PRESENT_UNDER_POLICY" ? ". 통근 예외도 함께 보존하며 합의 실제 효력은 평가하지 않습니다" : ""}`; break;
        }
      }
      return { id: resource.id + "#ko", candidateRef: candidate.candidateRef, templateId: "KO_M3_RESOURCE_COMBINATION_DECISION", templateVersion: M3_SUPPORT_VERSION,
        ...refs(resource), text: `${label}은 ${ownRoot}. ${decision}.` };
    });
    if (!items.length) items.push({ id: candidate.id + "#ko", candidateRef: candidate.candidateRef, templateId: "KO_M3_NO_SURFACE_RESOURCE_TARGET", templateVersion: M3_SUPPORT_VERSION,
      ...refs(candidate), text: "연·월·시의 표면 천간에는 이번 규칙의 정인·편인 대상이 없습니다. 장간 인성 자료는 그대로 유지하며, 명식 전체에 인성이 없다는 뜻은 아닙니다." });
    return { candidateRef: candidate.candidateRef, candidateIndex: candidate.candidateIndex, items };
  });
  return { schemaVersion: "ko-m3-resource-support-templates-v1", templateVersion: M3_SUPPORT_VERSION, status: "RESOLVED_UNDER_POLICY", title: "표면 인성의 천간합 생조 채택 제한",
    scopeNote: "이 결과는 선택한 천간합 조건 한 가지에 따른 생조 채택 제한입니다. 인성·통근·계절 자료를 삭제하거나 오행을 바꾸지 않습니다. 제한 없음은 생조 효력 확정이 아니며, 생조 전체 효력·근력·관계 효과는 미평가, 종합 신강약·점수·용신·길흉은 미구현입니다.", candidates };
}
export function explainM3ResourceSupport(result: M3ResourceSupportResult) { return freeze(explanationContent(result)); }
export function validateM3ResourceSupportExplanation(explanation: unknown, result: M3ResourceSupportResult): true {
  validateM3ResourceSupport(result); check(equal(explanation, explanationContent(result)), "M3_SUPPORT_EXPLANATION_CONTENT_OR_REFERENCES_CHANGED"); return true;
}
