import { areStemCombinationPartners } from "../domain/stemCombinations.js";
import { M3_EVIDENCE_PROFILE_ID, M3_EVIDENCE_VERSION, type M3EvidenceResult, type M3InputEnvelope, type M3InputRule, type M3InputSource, type M3StemLocation } from "./structuralEvidenceV1.js";
import { M3_ROOT_POLICY_ID, M3_ROOT_VERSION, type M3RootPresenceResult } from "./rootPresenceV1.js";
import { M3_SUPPORT_POLICY_ID, M3_SUPPORT_VERSION, validateM3ResourceSupport, type M3ResourceSupportResult } from "./resourceSupportV1.js";
import { M3_SEASONAL_SILI_POLICY_ID, M3_SEASONAL_SILI_VERSION, M3_SEASONAL_SILI_METADATA, validateSeasonalSiliState, type SeasonalSiliStateResult } from "./seasonalStateV2.js";

export const M3_SYNTHESIS_PROFILE_ID = "M3-LIMITED-ABSENT-ROOT-RESOURCE-SYNTHESIS-V01" as const;
export const M3_SYNTHESIS_VERSION = "0.1.0" as const;
export const M3_SYNTHESIS_SCHEMA = "m3-limited-synthesis-v1" as const;
const ASSUMPTION = "M3-RULE-CLOSED-ABSENT-ROOT-RESOURCE-WEAK-001";
const SCOPE = "M3-RULE-LIMITED-SYNTHESIS-SCOPE-001";
const DEFERRAL = "M3-RULE-MATERIAL-EFFECT-DEFERRAL-001";
const TEXT = "TXT-ZIPING-ZHENQUAN-NCC-SEASON-ROOT-COMMENTARY";
const CONFLICT_TEXT = "TXT-ZIPING-ZHENQUAN-NCC-RESOURCE-COUNTEREXAMPLE";
const IMPL = "IMPL-M3-LIMITED-ABSENCE-SYNTHESIS-V01";
const ROLES = ["year", "month", "day", "hour"] as const;
const ADVERSE = ["DAY_MASTER_GENERATES", "DAY_MASTER_CONTROLS", "TARGET_CONTROLS_DAY_MASTER"] as const;
const DECLINING = new Set(["XIU", "QIU", "SI"]);
const ROLE_KO = { year: "연", month: "월", day: "일", hour: "시" } as const;
const STATE_KO = { WANG: "왕(旺)", XIANG: "상(相)", XIU: "휴(休)", QIU: "수(囚)", SI: "사(死)" } as const;

function check(value: unknown, code: string): asserts value { if (!value) throw new RangeError(code); }
function dense<T>(value: readonly T[]): readonly T[] {
  check(Array.isArray(value) && Array.from({ length: value.length }, (_, i) => Object.hasOwn(value, i)).every(Boolean), "M3_SYNTHESIS_DENSE_ARRAY_REQUIRED"); return value;
}
const sealed = new WeakSet<object>();
function freeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || sealed.has(value)) return value;
  if (Array.isArray(value)) dense(value);
  Object.values(value).forEach(freeze); Object.freeze(value); sealed.add(value); return value;
}
function equal(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object" || Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) { if (!Array.isArray(b) || a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (!Object.hasOwn(a, i) || !Object.hasOwn(b, i) || !equal(a[i], b[i])) return false; }
  const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
  return ka.length === kb.length && ka.every((k, i) => k === kb[i] && equal((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}
const unique = (values: readonly string[]) => [...new Set(values)];
// Copy only the small additional event-evidence container, never the natal dataset.
function dataSnapshot<T>(value: T): T {
  if (value === null || typeof value === "string" || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) return value;
  check(value !== null && typeof value === "object", "M3_SYNTHESIS_DATA_ONLY_SOURCE_REQUIRED");
  if (Array.isArray(value)) return freeze(dense(value).map(dataSnapshot)) as T;
  const prototype = Object.getPrototypeOf(value);
  check(prototype === Object.prototype || prototype === null, "M3_SYNTHESIS_PLAIN_SOURCE_REQUIRED");
  return freeze(Object.fromEntries(Object.entries(value).map(([key, item]) => [key, dataSnapshot(item)]))) as T;
}
function dataRecord(value: unknown): Readonly<Record<string, unknown>> {
  check(value !== null && typeof value === "object" && !Array.isArray(value), "M3_SYNTHESIS_SOURCE_RECORD_REQUIRED");
  return value as Readonly<Record<string, unknown>>;
}
function registry<T extends { readonly id: string }>(...groups: readonly (readonly T[])[]): T[] {
  const known = new Map<string, T>();
  for (const group of groups) for (const record of dense(group)) {
    check(record && typeof record.id === "string" && record.id.length > 0, "M3_SYNTHESIS_INVALID_REGISTRY");
    const prior = known.get(record.id); check(!prior || equal(prior, record), "M3_SYNTHESIS_REGISTRY_COLLISION"); known.set(record.id, record);
  }
  return [...known.values()];
}

export const M3_SYNTHESIS_METADATA = freeze({
  id: M3_SYNTHESIS_PROFILE_ID, version: M3_SYNTHESIS_VERSION, schemaVersion: M3_SYNTHESIS_SCHEMA,
  kind: "EXPLICIT_LOCAL_RESEARCH_CLOSED_ABSENCE_SYNTHESIS", acceptedConclusions: ["WEAK_UNDER_SELECTED_POLICY"],
  dependencies: [
    { kind: "m2Profile", id: "m2-basic-classification-local-v1", version: "1" },
    { kind: "m3Profile", id: M3_EVIDENCE_PROFILE_ID, version: M3_EVIDENCE_VERSION },
    { kind: "seasonal", id: M3_SEASONAL_SILI_POLICY_ID, version: M3_SEASONAL_SILI_VERSION },
    { kind: "root", id: M3_ROOT_POLICY_ID, version: M3_ROOT_VERSION },
    { kind: "support", id: M3_SUPPORT_POLICY_ID, version: M3_SUPPORT_VERSION },
  ],
  sufficientCondition: ["DECLINING_SEASON", "DAY_ROOT_ABSENT", "ALL_RESOURCE_LOCATIONS_ABSENT", "VISIBLE_PEERS_ALL_UNROOTED", "ADVERSE_DIRECTION_LOCATIONS_PRESENT", "NO_VISIBLE_FIVE_COMBINATION", "NO_RAW_BRANCH_PAIR", "NO_MULTI_MEMBER_TRIAD"],
  additionalAssumption: "IN_THIS_CLOSED_SCOPE_UNROOTED_VISIBLE_PEERS_DO_NOT_REVERSE_DECLINING_SEASON_WITH_NO_ACTUAL_RESOURCE_OR_HIDDEN_PEER_ROOT; PROJECT_GENERALIZATION_NOT_AN_EXACT_CLASSICAL_FORMULA",
  priority: ["REJECT_INVALID_OR_CROSSED_CONTEXT", "NEEDS_DATA", "OUTSIDE_DECLINING_SEASON_SCOPE", "RELATION_EFFECT_REQUIRED", "MIXED_SUPPORT_AND_COUNTERSTRUCTURE", "CLOSED_ABSENCE_RULE"],
  rules: [
    { id: ASSUMPTION, runtimeVersion: M3_SYNTHESIS_VERSION, sourceRuleVersion: null, kind: "PROJECT_CONSERVATIVE_GENERALIZATION_OF_COMMENTARY_NOT_LITERAL_CLASSICAL_THEOREM", policyIds: [M3_SYNTHESIS_PROFILE_ID], sourceIds: [TEXT, IMPL] },
    { id: SCOPE, runtimeVersion: M3_SYNTHESIS_VERSION, sourceRuleVersion: null, kind: "PROJECT_EXPLICIT_WEAK_ONLY_SCOPE_AND_COMPLETENESS", policyIds: [M3_SYNTHESIS_PROFILE_ID], sourceIds: [TEXT, CONFLICT_TEXT, IMPL] },
    { id: DEFERRAL, runtimeVersion: M3_SYNTHESIS_VERSION, sourceRuleVersion: null, kind: "PROJECT_MATERIAL_EFFECT_AND_CONFLICT_PRECEDENCE", policyIds: [M3_SYNTHESIS_PROFILE_ID], sourceIds: [TEXT, CONFLICT_TEXT, IMPL] },
  ],
  sources: [
    { id: TEXT, kind: "CLASSICAL_COMMENTARY_WEB_TRANSCRIPTION", title: "子平真詮評注 卷二：論十幹得時不旺失時不弱", url: "https://ncc.com.tw/fate/paleo/bg/bg_032.htm", accessedOn: "2026-11-12", nativeRuleVersion: null, verification: "DIRECT_TRANSCRIPTION_READ_NOT_SCAN_OR_CRITICAL_EDITION", rightsReview: "UNVERIFIED", use: "SEASON_ALONE_INSUFFICIENT_AND_XU_UNROOTED_VISIBLE_PEER_ILLUSTRATIONS_NOT_EXACT_GENERALIZED_FORMULA" },
    { id: CONFLICT_TEXT, kind: "CLASSICAL_TEXT_AND_COMMENTARY_DISAGREEMENT", title: "子平真詮評注 卷四：論印綬", url: "https://www.ncc.com.tw/fate/paleo/bg/bg_034.htm", accessedOn: "2026-11-12", nativeRuleVersion: null, verification: "DIRECT_TRANSCRIPTION_READ_NOT_SCAN_OR_CRITICAL_EDITION", rightsReview: "UNVERIFIED", use: "REJECT_ROOT_OR_RESOURCE_PRESENCE_AS_SUFFICIENT_EFFECT_NOT_CHART_STRING_EXCEPTION" },
    { id: IMPL, kind: "PROJECT_IMPLEMENTATION_DEFINITION", implementationRef: "src/m3/limitedSynthesisV1.ts", version: M3_SYNTHESIS_VERSION, use: "EXPLICIT_CLOSED_ABSENCE_ASSUMPTION_AND_DEFERRALS_NOT_NEW_FORCE_OR_WEIGHT_SYSTEM" },
  ],
  excluded: ["STRONG_CONCLUSION", "BALANCED_CONCLUSION", "SCORES", "ROOT_FORCE", "SUPPORT_FORCE", "DRAIN_CONTROL_FORCE_COMPARISON", "HIDDEN_STEM_SECRET_COMBINATIONS", "TRANSFORMATION", "FOLLOWING_CONFIGURATION", "GEJU", "YONGSHEN", "FORTUNE", "EVENT_PREDICTION"],
  sourceCompatibility: "SELECTED_MIXED_SOURCE_DEFINITIONS_NOT_A_COMPLETE_SINGLE_SCHOOL", releaseGate: "BLOCKED_UNCHANGED",
});

interface Context {
  readonly evidence: M3EvidenceResult;
  readonly root: M3RootPresenceResult;
  readonly support: M3ResourceSupportResult;
  readonly m2Facts: M3InputEnvelope;
  readonly seasonalJudgments: readonly SeasonalSiliStateResult[];
  readonly seasonalCalculationSources?: readonly (Readonly<Record<string, unknown>> & { readonly id: string })[];
}
function validateContext(context: Context): void {
  const { evidence, root, support, m2Facts, seasonalJudgments } = context;
  validateM3ResourceSupport(support, { evidence, root, m2Facts });
  check(evidence.policy.id === M3_EVIDENCE_PROFILE_ID && evidence.policy.version === M3_EVIDENCE_VERSION && root.policy.id === M3_ROOT_POLICY_ID && root.policy.version === M3_ROOT_VERSION && support.policy.id === M3_SUPPORT_POLICY_ID && support.policy.version === M3_SUPPORT_VERSION, "M3_SYNTHESIS_DEPENDENCY_VERSION_MISMATCH");
  check(m2Facts.policyBundle.id === "m2-basic-classification-local-v1" && m2Facts.policyBundle.version === "1", "M3_SYNTHESIS_M2_BUNDLE_VERSION_MISMATCH");
  dense(seasonalJudgments); check(seasonalJudgments.length === evidence.candidates.length, "M3_SYNTHESIS_SEASONAL_CANDIDATE_COUNT");
  seasonalJudgments.forEach((judgment, i) => {
    validateSeasonalSiliState(judgment);
    const candidate = evidence.candidates[i]!, month = candidate.evidence.find(e => e.kind === "MONTH_CONTEXT")!;
    check(judgment.policy.id === M3_SEASONAL_SILI_POLICY_ID && judgment.policy.version === M3_SEASONAL_SILI_VERSION, "M3_SYNTHESIS_SEASONAL_POLICY_VERSION_MISMATCH");
    check(judgment.candidateRef === candidate.candidateRef && judgment.dayMaster === candidate.dayMaster && judgment.monthBranch === candidate.monthContext.monthPillar.branch && equal(judgment.appliedJie, candidate.monthContext.activeSince), "M3_SYNTHESIS_OTHER_SEASONAL_CANDIDATE");
    const parentSides: Readonly<Record<string, string>> = { DEFINITE: "BETWEEN_PUBLISHED_BOUNDARIES", BEFORE_PUBLISHED_MINUTE: "BEFORE_PUBLISHED_BOUNDARY", AFTER_PUBLISHED_MINUTE: "AFTER_PUBLISHED_BOUNDARY" };
    const side = candidate.monthContext.boundarySide;
    check(typeof side === "string" && judgment.input.monthCondition === parentSides[side], "M3_SYNTHESIS_PARENT_BOUNDARY_CONDITION_CHANGED");
    check(equal(judgment.inputEvidenceRefs, [month.id]) && equal(judgment.inputFactRefs, month.inputFactRefs) && equal(judgment.pillarRefs, [candidate.candidateRef + ".day", candidate.candidateRef + ".month"]), "M3_SYNTHESIS_SEASONAL_REFERENCES_CHANGED");
    dense(judgment.alternatives); check(new Set(judgment.alternatives.map(a => a.id)).size === judgment.alternatives.length, "M3_SYNTHESIS_DUPLICATE_SEASONAL_PATH");
    for (const alternative of judgment.alternatives) check(alternative.parentCandidateRef === candidate.candidateRef, "M3_SYNTHESIS_OTHER_SEASONAL_PARENT");
  });
}

export type LimitedSynthesisStatus = "RESOLVED_UNDER_POLICY" | "DEFERRED_MIXED_EVIDENCE" | "DEFERRED_EFFECT_POLICY_REQUIRED" | "OUTSIDE_POLICY_SCOPE" | "NEEDS_DATA";
function observations(candidate: M3EvidenceResult["candidates"][number], root: M3RootPresenceResult["candidates"][number], support: M3ResourceSupportResult["candidates"][number]) {
  const groups = candidate.directionalGroups;
  const peers = groups.SAME.filter(l => l.locationKind === "VISIBLE_STEM");
  const resources = groups.TARGET_GENERATES_DAY_MASTER;
  const adverse = ADVERSE.flatMap(kind => groups[kind]);
  const visiblePairs = root.targets.flatMap((target, i) => root.targets.slice(i + 1).filter(other => areStemCombinationPartners(target.target.stem, other.target.stem)).map(other => ({ left: target.target, right: other.target })));
  return {
    dayRoot: root.targets[2]!,
    visiblePeers: peers.map(location => ({ location, rootTargetRef: root.targets.find(t => t.target.locationId === location.locationId)!.id, rootPresence: root.targets.find(t => t.target.locationId === location.locationId)!.chartRootPresence })),
    hiddenPeers: groups.SAME.filter(l => l.locationKind === "HIDDEN_STEM"),
    resources: { visible: resources.filter(l => l.locationKind === "VISIBLE_STEM"), hidden: resources.filter(l => l.locationKind === "HIDDEN_STEM"), surfaceDecisions: support.resources },
    directionalGroups: groups,
    adverseLocations: adverse,
    interactions: { visibleFiveCombinations: visiblePairs, rawBranchPairs: candidate.relationContext.pairs, multiMemberTriads: candidate.relationContext.triads.filter(t => t.distinctMemberCount >= 2), effectStatus: "NOT_EVALUATED" },
  };
}
function neededEffects(observed: ReturnType<typeof observations>) {
  return [
    { code: "ROOT_EFFICACY", status: "NOT_EVALUATED", material: observed.dayRoot.chartRootPresence === "PRESENT_UNDER_POLICY", reason: observed.dayRoot.chartRootPresence === "PRESENT_UNDER_POLICY" ? "A_PRESENT_ROOT_CAN_INVALIDATE_THE_ABSENCE_RULE_BUT_ITS_FORCE_IS_NOT_KNOWN" : "NO_DAY_ROOT_EXISTS_UNDER_SELECTED_DEFINITION_SO_ROOT_FORCE_IS_NOT_NEEDED_BY_THIS_RULE" },
    { code: "RESOURCE_SUPPORT_EFFICACY", status: "NOT_EVALUATED", material: observed.resources.visible.length + observed.resources.hidden.length > 0, reason: observed.resources.visible.length + observed.resources.hidden.length > 0 ? "RESOURCE_PRESENCE_IS_NOT_SUFFICIENT_SUPPORT_AND_HELD_IS_NOT_DELETION" : "NO_ACTUAL_RESOURCE_LOCATION_EXISTS_SO_RESOURCE_TRANSMISSION_IS_NOT_REQUIRED_BY_THIS_RULE" },
    { code: "NATAL_INTERACTION_EFFECT", status: "NOT_EVALUATED", material: observed.interactions.visibleFiveCombinations.length + observed.interactions.rawBranchPairs.length + observed.interactions.multiMemberTriads.length > 0, reason: "SURFACE_COMBINATIONS_RAW_PAIRS_OR_MULTI_MEMBER_SETS_ARE_NOT_ACTIVATION_OR_TRANSFORMATION" },
    { code: "DRAIN_CONSUME_CONTROL_EFFICACY", status: "NOT_EVALUATED", material: observed.adverseLocations.length > 0 && (observed.dayRoot.chartRootPresence === "PRESENT_UNDER_POLICY" || observed.resources.visible.length + observed.resources.hidden.length > 0), reason: "MIXED_STRUCTURES_NEED_A_QUALITATIVE_EFFECT_RULE; CLOSED_ABSENCE_RULE_DOES_NOT_COMPARE_FORCE_OR_ASSIGN_ZERO_TO_UNMODELED_EFFECTS" },
  ];
}

/** No calendar or M2 rule derivation: consumes the already-issued complete parent context. */
export function deriveM3LimitedSynthesis(evidence: M3EvidenceResult, options: Omit<Context, "evidence"> & { readonly profileId: string }) {
  check(options.profileId === M3_SYNTHESIS_PROFILE_ID, "EXPLICIT_SUPPORTED_M3_SYNTHESIS_PROFILE_REQUIRED");
  const context: Context = { evidence, root: options.root, support: options.support, m2Facts: options.m2Facts, seasonalJudgments: options.seasonalJudgments, ...(options.seasonalCalculationSources === undefined ? {} : { seasonalCalculationSources: options.seasonalCalculationSources }) };
  validateContext(context);
  const extraSources = options.seasonalCalculationSources ?? [];
  dense(extraSources); check(new Set(extraSources.map(s => s?.id)).size === extraSources.length, "M3_SYNTHESIS_DUPLICATE_CALENDAR_SOURCE");
  const sourceSnapshot = dataSnapshot(extraSources);
  const seasonalIdentities = [...options.seasonalJudgments];
  const calendarSources = sourceSnapshot.map(source => {
    const original = dataRecord(source.original), receipt = dataRecord(source.source), interpreted = dataRecord(source.interpreted);
    const target = options.seasonalJudgments.flatMap(j => j.nextSili ? [j.nextSili] : []).find(event => event.sourceIds.includes(source.id));
    check(typeof source.sourceRef === "string" && source.sourceRef.length > 0 && target && original.kind === "solar" && original.sourceRef === source.sourceRef && original.date + "T" + original.time === target.displayedDateTime && original.termCode === target.term && source.id === "KASI_OPENAPI_RESPONSE:" + source.sourceRef + ":" + original.date + ":" + original.termCode, "M3_SYNTHESIS_UNRELATED_CALENDAR_SOURCE");
    check(receipt.id === source.sourceRef && receipt.evidenceSurface === "KASI_OPENAPI_RESPONSE" && receipt.serviceId === "15012690" && receipt.operation === "get24DivisionsInfo" && typeof receipt.responseSha256 === "string" && /^[a-f0-9]{64}$/.test(receipt.responseSha256) && interpreted.displayedDateTime === target.displayedDateTime && interpreted.sourcePrecision === "MINUTE", "M3_SYNTHESIS_CALENDAR_RECEIPT_MISMATCH");
    const { id, ...evidence } = source;
    return { id, kind: "CALENDAR_API", evidence, rightsReview: "UNVERIFIED", meaning: "CALENDAR_DATA_NOT_M2_RULE_SOURCE" };
  });
  const sources = registry<M3InputSource>(options.support.sources, M3_SEASONAL_SILI_METADATA.sources, calendarSources, M3_SYNTHESIS_METADATA.sources);
  const rules = registry<M3InputRule>(options.support.rules, M3_SEASONAL_SILI_METADATA.rules, M3_SYNTHESIS_METADATA.rules);
  const sourceIds = new Set(sources.map(s => s.id));
  const candidates = evidence.candidates.map((candidate, i) => {
    const roots = options.root.candidates[i]!, support = options.support.candidates[i]!, seasonal = options.seasonalJudgments[i]!;
    check(roots.candidateRef === candidate.candidateRef && support.candidateRef === candidate.candidateRef, "M3_SYNTHESIS_PARENT_CONTEXT_MISMATCH");
    const observed = observations(candidate, roots, support), groupRecords = candidate.evidence.filter(e => e.kind === "DIRECTIONAL_GROUP" || e.kind === "MONTH_CONTEXT" || e.kind === "RELATION_SCOPE" || e.kind === "BRANCH_RELATION_CONTEXT" || e.kind === "TRIAD_MEMBERSHIP_CONTEXT");
    const references = {
      inputEvidenceRefs: unique(groupRecords.map(e => e.id)), inputFactRefs: unique(groupRecords.flatMap(e => e.inputFactRefs)), inputMemberRefs: unique(groupRecords.flatMap(e => e.inputMemberRefs)),
      pillarRefs: ROLES.map(role => candidate.candidateRef + "." + role), rootJudgmentRefs: roots.targets.map(t => t.id), rootMatchRefs: unique(roots.targets.flatMap(t => t.branches.flatMap(b => b.matches.map(m => m.id)))),
      supportJudgmentRefs: support.resources.map(r => r.id), seasonalJudgmentRefs: [seasonal.id],
      ruleRefs: unique([ASSUMPTION, SCOPE, DEFERRAL, ...support.ruleRefs, ...seasonal.ruleRefs]),
      policyRefs: unique([M3_SYNTHESIS_PROFILE_ID, ...support.policyRefs, ...seasonal.policyRefs, ...M3_SYNTHESIS_METADATA.dependencies.map(d => d.id)]),
      sourceRefs: unique([TEXT, CONFLICT_TEXT, IMPL, ...support.sourceRefs, ...seasonal.sourceRefs]), calculationSourceRefs: unique([...support.calculationSourceRefs, ...seasonal.calculationSourceRefs]),
    };
    check(references.sourceRefs.every(id => sourceIds.has(id)) && references.calculationSourceRefs.every(id => sourceIds.has(id)), "M3_SYNTHESIS_UNRESOLVED_SOURCE_REFERENCE");
    const structuralConditions = [
      { id: "DAY_ROOT_ABSENT", satisfied: observed.dayRoot.chartRootPresence === "ABSENT_UNDER_POLICY", evidenceRefs: [observed.dayRoot.id] },
      { id: "ALL_RESOURCE_LOCATIONS_ABSENT", satisfied: observed.resources.visible.length === 0 && observed.resources.hidden.length === 0, evidenceRefs: groupRecords.filter(e => e.kind === "DIRECTIONAL_GROUP").map(e => e.id) },
      { id: "VISIBLE_PEERS_ALL_UNROOTED", satisfied: observed.visiblePeers.every(p => p.rootPresence === "ABSENT_UNDER_POLICY"), evidenceRefs: observed.visiblePeers.map(p => p.rootTargetRef) },
      { id: "ADVERSE_DIRECTION_LOCATIONS_PRESENT", satisfied: observed.adverseLocations.length > 0, evidenceRefs: observed.adverseLocations.map(l => l.locationId) },
      { id: "NO_VISIBLE_FIVE_COMBINATION", satisfied: observed.interactions.visibleFiveCombinations.length === 0, evidenceRefs: ROLES.map(role => candidate.candidateRef + "." + role + ".stem") },
      { id: "NO_RAW_BRANCH_PAIR", satisfied: observed.interactions.rawBranchPairs.length === 0, evidenceRefs: groupRecords.filter(e => e.kind === "BRANCH_RELATION_CONTEXT" || e.kind === "RELATION_SCOPE").map(e => e.id) },
      { id: "NO_MULTI_MEMBER_TRIAD", satisfied: observed.interactions.multiMemberTriads.length === 0, evidenceRefs: groupRecords.filter(e => e.kind === "TRIAD_MEMBERSHIP_CONTEXT" || e.kind === "RELATION_SCOPE").map(e => e.id) },
    ];
    const alternatives = seasonal.alternatives.length ? seasonal.alternatives : [null];
    const paths = alternatives.map((alternative, pathIndex) => {
      const conditions = [{ id: "DECLINING_SEASON", satisfied: alternative === null ? null : DECLINING.has(alternative.seasonalState), evidenceRefs: alternative ? [alternative.id] : [seasonal.id] }, ...structuralConditions];
      const missing = conditions.filter(c => c.satisfied !== true).map(c => c.id);
      const hasSupport = !structuralConditions[0]!.satisfied || !structuralConditions[1]!.satisfied;
      const hasInteraction = structuralConditions.slice(4).some(c => !c.satisfied);
      let status: LimitedSynthesisStatus;
      if (seasonal.status === "NEEDS_DATA") status = "NEEDS_DATA";
      else if (!conditions[0]!.satisfied) status = "OUTSIDE_POLICY_SCOPE";
      else if (hasInteraction) status = "DEFERRED_EFFECT_POLICY_REQUIRED";
      else if (hasSupport && observed.adverseLocations.length) status = "DEFERRED_MIXED_EVIDENCE";
      else if (hasSupport) status = "DEFERRED_EFFECT_POLICY_REQUIRED";
      else if (missing.length) status = "OUTSIDE_POLICY_SCOPE";
      else status = "RESOLVED_UNDER_POLICY";
      return {
        id: candidate.candidateRef + "#m3-limited-synthesis-path[" + pathIndex + "]", parentCandidateRef: candidate.candidateRef, pathIndex,
        parentMonthCondition: candidate.monthContext.boundarySide, seasonalCondition: alternative?.condition ?? "MISSING_REQUIRED_SEASONAL_EVENT", seasonalAlternativeRef: alternative?.id ?? null,
        season: alternative?.season ?? null, seasonalState: alternative?.seasonalState ?? null, status,
        conclusion: status === "RESOLVED_UNDER_POLICY" ? "WEAK_UNDER_SELECTED_POLICY" as const : null,
        appliedRuleIds: status === "RESOLVED_UNDER_POLICY" ? [SCOPE, ASSUMPTION] : [SCOPE, DEFERRAL], conditions,
        supportingEvidence: conditions.filter(c => c.satisfied === true), counterEvidence: conditions.filter(c => c.satisfied === false), unknownEvidence: conditions.filter(c => c.satisfied === null),
        counterEvidenceMeaning: "FAILED_SUFFICIENT_CONDITIONS_AGAINST_WEAK_CONCLUSION_NOT_PROOF_OF_STRONG_FORCE",
        missingSufficientConditions: missing, importantUnresolvedEffects: neededEffects(observed), missingData: seasonal.missingData,
        ...references, seasonalAlternativeRefs: alternative ? [alternative.id] : [],
        meaning: "CONDITIONAL_TRADITIONAL_RESEARCH_CONCLUSION_NOT_FORCE_MEASUREMENT_OR_FULL_M3_RELEASE",
      };
    });
    return {
      id: candidate.candidateRef + "#m3-limited-synthesis", candidateRef: candidate.candidateRef, candidateIndex: i, dayMaster: candidate.dayMaster,
      pillars: roots.targets.map((t, roleIndex) => ({ role: ROLES[roleIndex]!, stem: t.target.stem, branch: t.branches[roleIndex]!.branch })),
      observed, paths, ...references,
      acceptedInferences: ["COMPLETE_STRUCTURAL_ABSENCE_WITH_EXPLICIT_CLOSED_ASSUMPTION_ONLY"],
      rejectedInferences: ["SEASON_ALONE_IS_STRENGTH", "ROOT_PRESENCE_IS_ROOT_FORCE", "NO_HOLD_IS_EFFECTIVE_SUPPORT", "HELD_RESOURCE_IS_DELETED", "DEFERRED_MEANS_BALANCED", "UNMODELED_EFFECT_IS_ZERO"],
    };
  });
  const result = freeze({ schemaVersion: M3_SYNTHESIS_SCHEMA, resolverVersion: M3_SYNTHESIS_VERSION, status: "ASSESSED_UNDER_RESEARCH_POLICY" as const,
    policy: M3_SYNTHESIS_METADATA, candidates, rules, sources,
    validation: { level: "ISSUED_INPUT_COMPLETENESS_AND_SELECTED_RESEARCH_DECISION_TABLE", inputAuthentication: "PURE_MODULE_NOT_EXTERNAL_SOURCE_AUTHENTICATION", traditionalRuleGeneralization: "EXPLICIT_PROJECT_ASSUMPTION_NOT_EXACT_SOURCE_FORMULA", finalStrengthContract: "ORIGINAL_NOT_IMPLEMENTED_UNCHANGED", m3FinalInterpretationGate: "BLOCKED_UNCHANGED", sourceEdition: "UNVERIFIED", rightsReview: "UNVERIFIED", predictiveValidity: "NOT_CLAIMED", g0Receipt: null, g1P2Promotion: false },
  });
  contexts.set(result, { context, seasonalIdentities, sourceSnapshot }); return result;
}
export type M3LimitedSynthesisResult = ReturnType<typeof deriveM3LimitedSynthesis>;
const contexts = new WeakMap<object, { readonly context: Context; readonly seasonalIdentities: readonly SeasonalSiliStateResult[]; readonly sourceSnapshot: readonly (Readonly<Record<string, unknown>> & { readonly id: string })[] }>();
export function validateM3LimitedSynthesis(result: M3LimitedSynthesisResult, expected: Partial<Context> = {}): true {
  const receipt = result !== null && typeof result === "object" ? contexts.get(result) : undefined;
  check(receipt && Object.isFrozen(result), "ISSUED_IMMUTABLE_M3_SYNTHESIS_REQUIRED");
  const { context } = receipt;
  for (const key of ["evidence", "root", "support", "m2Facts", "seasonalJudgments", "seasonalCalculationSources"] as const) if (expected[key] !== undefined) check(expected[key] === context[key], "M3_SYNTHESIS_OTHER_EXECUTION_CONTEXT");
  dense(context.seasonalJudgments);
  check(context.seasonalJudgments.length === receipt.seasonalIdentities.length && context.seasonalJudgments.every((value, i) => value === receipt.seasonalIdentities[i]), "M3_SYNTHESIS_SEASONAL_CONTAINER_CHANGED");
  check(equal(context.seasonalCalculationSources ?? [], receipt.sourceSnapshot), "M3_SYNTHESIS_CALENDAR_CONTAINER_CHANGED");
  validateContext(context); return true;
}

function locationsText(locations: readonly M3StemLocation[]): string {
  if (!locations.length) return "없음";
  const selected = locations.slice(0, 3).map(l => ROLE_KO[l.pillarRole] + (l.locationKind === "VISIBLE_STEM" ? "간 " : "지 장간 ") + l.stem);
  return selected.join("·") + (locations.length > 3 ? ` 외 ${locations.length - 3}곳` : "");
}
function reportContent(result: M3LimitedSynthesisResult) {
  validateM3LimitedSynthesis(result);
  const candidates = result.candidates.map(candidate => {
    const o = candidate.observed;
    const paths = candidate.paths.map(path => {
      const season = path.seasonalState ? STATE_KO[path.seasonalState] : "자료 부족";
      const conditions = path.conditions;
      let conclusion: string;
      switch (path.status) {
        case "RESOLVED_UNDER_POLICY": conclusion = "선택한 폐쇄형 무근·무인 연구 정책에서 신약으로 분류합니다. 휴·수·사 계절 분류와 직접 근·인성의 부재, 관계 제외 조건을 모두 확인한 경우에만 적용하는 프로젝트의 제한적 일반화입니다."; break;
        case "NEEDS_DATA": conclusion = "필요한 계절 경계 자료가 부족해 이 경로의 종합 판단을 보류합니다."; break;
        case "OUTSIDE_POLICY_SCOPE": conclusion = "이 프로필의 좁은 신약 충분조건 적용 범위 밖입니다. 계절이 왕·상이라는 이유로 신강이나 중화로 바꾸지 않습니다."; break;
        case "DEFERRED_MIXED_EVIDENCE": conclusion = "근 또는 인성의 지원 구조와 설기·소모·제어 구조가 함께 있어 판단을 보류합니다. 어느 효과가 결론을 뒤집는지 판단할 규칙이 더 필요합니다."; break;
        case "DEFERRED_EFFECT_POLICY_REQUIRED": conclusion = "합·지지 관계 또는 지원 요소의 실제 효력이 중요한 조건이어서 판단을 보류합니다. 관계를 지우거나 미정 효과를 0으로 처리하지 않습니다."; break;
      }
      const roots = o.dayRoot.branches.flatMap(b => b.matches.map(m => m.hidden));
      const detail = `일간의 계절 상태는 ${season}입니다. 구성상 직접 근은 ${o.dayRoot.chartRootPresence === "PRESENT_UNDER_POLICY" ? `있습니다 (${locationsText(roots)})` : "없습니다"}. 인성은 표면 ${locationsText(o.resources.visible)}, 장간 ${locationsText(o.resources.hidden)}입니다.`;
      const peers = o.visiblePeers.map(p => `${ROLE_KO[p.location.pillarRole]}간 ${p.location.stem}(자체 근 ${p.rootPresence === "PRESENT_UNDER_POLICY" ? "있음" : "없음"})`).join("·") || "없음";
      const adverse = `반대 방향 검토: 설기 ${locationsText(o.directionalGroups.DAY_MASTER_GENERATES)} / 소모 ${locationsText(o.directionalGroups.DAY_MASTER_CONTROLS)} / 제어 ${locationsText(o.directionalGroups.TARGET_CONTROLS_DAY_MASTER)}. 존재와 방향만 확인하며 실제 힘의 크기로 해석하지 않습니다.`;
      const decisionNames = { NO_HOLD_BY_THIS_RULE: "이번 합 규칙의 채택 제한 없음", SUPPORT_HELD_UNDER_SELECTED_RULE: "단일 인접 합·무근으로 독립 생조 자동 채택 유보", ROOTED_COMBINATION_EFFECT_UNRESOLVED: "통근 예외의 실제 효과 미정", OUT_OF_SCOPE_INTERACTION: "원격·복수·경쟁 관계의 범위 밖" } as const;
      const holds = o.resources.surfaceDecisions.map(r => `${ROLE_KO[r.resource.pillarRole]}간 ${r.resource.stem}: ${decisionNames[r.selectedRuleDecision]}`).join("; ");
      const relation = o.interactions.rawBranchPairs.length + o.interactions.multiMemberTriads.length + o.interactions.visibleFiveCombinations.length;
      const effectNames: Readonly<Record<string, string>> = { ROOT_EFFICACY: "구성상 근의 실제 작용", RESOURCE_SUPPORT_EFFICACY: "인성의 실제 생조 작용", NATAL_INTERACTION_EFFECT: "합·지지 관계의 작용", DRAIN_CONSUME_CONTROL_EFFICACY: "지원과 설기·소모·제어 사이의 실제 작용" };
      const reasons = path.importantUnresolvedEffects.filter(e => e.material).map(e => effectNames[e.code]).join(", ") || "이 충분조건에서는 근·인성 자체가 없어 해당 효력의 비교를 요구하지 않음";
      return { id: path.id + "#ko", candidateRef: candidate.candidateRef, pathRef: path.id, templateId: "KO_M3_LIMITED_SYNTHESIS_PATH", templateVersion: M3_SYNTHESIS_VERSION,
        judgmentRefs: [path.id], inputEvidenceRefs: path.inputEvidenceRefs, inputFactRefs: path.inputFactRefs, inputMemberRefs: path.inputMemberRefs, pillarRefs: path.pillarRefs,
        rootJudgmentRefs: path.rootJudgmentRefs, rootMatchRefs: path.rootMatchRefs, supportJudgmentRefs: path.supportJudgmentRefs, seasonalJudgmentRefs: path.seasonalJudgmentRefs, seasonalAlternativeRefs: path.seasonalAlternativeRefs,
        ruleRefs: path.ruleRefs, policyRefs: path.policyRefs, sourceRefs: path.sourceRefs, calculationSourceRefs: path.calculationSourceRefs,
        status: path.status, conclusion: path.conclusion, seasonalCondition: path.seasonalCondition, summary: conclusion,
        text: [conclusion, detail, `표면 비겁: ${peers}. 장간의 동류는 직접 근의 위치에 별도로 보존합니다.`, adverse, ...(holds ? [`표면 인성의 합 제한: ${holds}. 제한 없음과 생조 확정은 다릅니다.`] : []), `관계 검토: ${relation ? "기존 합·충·형·해·파/구성원과 표면 오합을 모두 보존" : "선택 범위의 표면 오합·지지 쌍·복수 구성원 관계 없음"}. 중요한 미정: ${reasons}.`].join("\n"),
        checkedConditionIds: conditions.map(c => c.id), missingSufficientConditions: path.missingSufficientConditions,
      };
    });
    return { candidateRef: candidate.candidateRef, candidateIndex: candidate.candidateIndex, pillars: candidate.pillars.map(p => p.stem + p.branch).join("·"), paths };
  });
  return { schemaVersion: "ko-m3-limited-synthesis-report-v1", templateVersion: M3_SYNTHESIS_VERSION, profileId: M3_SYNTHESIS_PROFILE_ID, title: "명식 분석 리포트 — 제한적 로컬 연구 v0.1", candidates,
    scopeNote: "선택한 전통 정책과 명시적 프로젝트 일반화의 연구 결과입니다. 보류는 중화가 아니며, 신강·중화·근력·생조 전체 효력·격국·용신·길흉·사건 예측과 M3 전체 출시를 확정하지 않습니다. 원자료는 분 정밀도이며 기존 후보와 조건부 경계를 유지합니다." };
}
const reportContexts = new WeakMap<object, M3LimitedSynthesisResult>();
export function explainM3LimitedSynthesis(result: M3LimitedSynthesisResult) { const report = freeze(reportContent(result)); reportContexts.set(report, result); return report; }
export type M3LimitedSynthesisReport = ReturnType<typeof explainM3LimitedSynthesis>;
export function validateM3LimitedSynthesisExplanation(explanation: unknown, result: M3LimitedSynthesisResult): true {
  // An issued deeply immutable report cannot change its text or references.
  // Its original mutable input containers still have to pass validation.
  if (explanation !== null && typeof explanation === "object" && reportContexts.get(explanation) === result) { validateM3LimitedSynthesis(result); return true; }
  check(equal(explanation, reportContent(result)), "M3_SYNTHESIS_REPORT_CONTENT_OR_REFERENCES_CHANGED"); return true;
}
export function renderM3LimitedSynthesisText(report: M3LimitedSynthesisReport): string {
  check(report && report.schemaVersion === "ko-m3-limited-synthesis-report-v1", "M3_SYNTHESIS_REPORT_SCHEMA_REQUIRED");
  const result = reportContexts.get(report); check(result, "M3_SYNTHESIS_ISSUED_REPORT_REQUIRED"); validateM3LimitedSynthesisExplanation(report, result);
  return [report.title, `종합 정책: ${report.profileId} / ${report.templateVersion}`, ...report.candidates.flatMap(c => [`\n후보 ${c.candidateIndex + 1}: ${c.pillars}`, ...c.paths.map((p, i) => `${c.paths.length > 1 ? `조건 경로 ${i + 1} (${p.seasonalCondition})\n` : ""}${p.text}`)]), "\n" + report.scopeNote, ""].join("\n");
}
