import { M4_PATTERN_PROFILE_ID, M4_PATTERN_VERSION, validateM4ZhengguanStructure, type M4ZhengguanStructureResult } from "./zhengguanStructureV1.js";
import type { M3EvidenceResult, M3StemLocation, M3InputRule, M3InputSource } from "../m3/structuralEvidenceV1.js";

export const M4_POSITION_PROFILE_ID = "M4-ZHENGGUAN-WEALTH-RESOURCE-POSITION-REVIEW-V01" as const;
export const M4_POSITION_VERSION = "0.1.0" as const;
const PROJECT = "M4-C0-PROJECT-WEALTH-RESOURCE-POSITION-V01", COMBINATIONS = "M4-C0-ZPZQ-COMBINATION-CONTEXT-NCC";
const PRECONDITION = "M4-C1-RULE-VISIBLE-PAIR-PRECONDITION-001", POSITION = "M4-C1-RULE-WEALTH-RESOURCE-POSITION-001", LIMITS = "M4-C1-RULE-POSITION-EFFECT-SEPARATION-001";
const ORIGINAL = "M4-ZPZQ-ORIGINAL-ZHENGGUAN-NCC", COMMENTARY = "M4-ZPZQ-XU-COMMENTARY-NCC", CHENGBAI = "M4-ZPZQ-ORIGINAL-CHENGBAI-NCC";
const ROLES = ["year", "month", "day", "hour"] as const, ROLE_KO = { year: "연", month: "월", day: "일", hour: "시" } as const;
function check(ok: unknown, code: string): asserts ok { if (!ok) throw new RangeError(code); }
const unique = (values: readonly string[]) => [...new Set(values)];
const frozen = new WeakSet<object>();
function dense(value: unknown): void { if (value === null || typeof value !== "object") return; if (Array.isArray(value)) for (let i = 0; i < value.length; i++) check(Object.hasOwn(value, i), "M4_POSITION_DENSE_ARRAY_REQUIRED"); Object.values(value).forEach(dense); }
function freeze<T>(value: T): T { if (value === null || typeof value !== "object" || frozen.has(value)) return value; if (Array.isArray(value)) for (let i = 0; i < value.length; i++) check(Object.hasOwn(value, i), "M4_POSITION_DENSE_ARRAY_REQUIRED"); Object.values(value).forEach(freeze); Object.freeze(value); frozen.add(value); return value; }
const ownRule = (id: string, sources: readonly string[], cases: readonly string[]) => ({ id, runtimeVersion: M4_POSITION_VERSION, sourceRuleVersion: null, kind: "PROJECT_POSITION_REVIEW_NOT_EFFECTIVE_NONINTERFERENCE", policyIds: [M4_POSITION_PROFILE_ID], sourceIds: [...sources, PROJECT], testCaseRefs: cases.map(id => "test/fixtures/m4-wealth-resource-position-cases.mjs#" + id) });
export const M4_POSITION_METADATA = freeze({
  id: M4_POSITION_PROFILE_ID, version: M4_POSITION_VERSION, kind: "EXPLICIT_LOCAL_RESEARCH_OFFICER_WEALTH_RESOURCE_POSITION_REVIEW",
  dependencies: [{ id: M4_PATTERN_PROFILE_ID, version: M4_PATTERN_VERSION }],
  positionOrder: ROLES, scope: "NATAL_VISIBLE_WEALTH_AND_RESOURCE_AT_YEAR_MONTH_HOUR_WITH_ALL_INTERVENING_VISIBLE_LOCATIONS",
  hiddenPresenceMeaning: "RETAINED_BUT_CANNOT_SUBSTITUTE_FOR_VISIBLE_PAIR_PRECONDITION", finalEfficacyGo: "NO_GO", positionClassificationGo: "GO_UNDER_SELECTED_POLICY",
  dayMasterMeaning: "INTERVENING_SELF_LOCATION_WITH_NATIVE_NULL_TEN_GOD_NOT_AN_ADDED_SUPPORT_TARGET",
  officerBetweenMeaning: "PROJECT_GEOMETRY_FROM_WEALTH_PATTERN_COMMENTARY_NOT_AN_OFFICER_PATTERN_EFFICACY_THEOREM",
  rules: [
    ownRule(PRECONDITION, [ORIGINAL], ["api-20260108-wealth-visible-resource-hidden-only", "synthetic-both-groups-hidden-only", "api-20030103-officer-candidate-with-neither-category"]),
    ownRule(POSITION, [ORIGINAL, COMMENTARY, CHENGBAI], ["literature-xue-day-master-only-between", "synthetic-adjacent-wealth-year-resource-month", "synthetic-officer-and-day-between", "synthetic-multiple-wealth-mixed-contexts"]),
    ownRule(LIMITS, [ORIGINAL, COMMENTARY, COMBINATIONS], ["literature-jin-repeated-ding-is-not-day-only", "synthetic-adjacent-with-seven-killings-overlay", "synthetic-wu-other-compatibility-priority"]),
  ],
  sources: [
    { id: COMBINATIONS, kind: "CLASSICAL_BASE_AND_COMMENTARY_WEB_TRANSCRIPTION", title: "子平真詮評註 論十干配合性情·論十干合而不合", url: "https://ncc.com.tw/fate/paleo/bg/bg_032.htm", accessedOn: "2026-11-13", verification: "DIRECT_WEB_TRANSCRIPTION_NOT_CRITICAL_EDITION_OR_SCAN", use: "POSITION_COMBINATION_AND_ROOT_EXCEPTION_LIMITS_NOT_AUTOMATIC_REMOVAL", nativeRuleVersion: null, editionVerification: "UNVERIFIED", rightsReview: "UNVERIFIED" },
    { id: PROJECT, kind: "PROJECT_IMPLEMENTATION_DEFINITION", version: M4_POSITION_VERSION, implementationRef: "src/m4/wealthResourcePositionV1.ts", policyRef: "docs/research/M4_C0_WEALTH_RESOURCE_POSITION_POLICY_V01.md", use: "NARROW_VISIBLE_PAIR_PRECONDITIONS_AND_GEOMETRY_NOT_TRANSMISSION_OR_PATTERN_SUCCESS" },
  ],
  excluded: ["EFFECTIVE_NONINTERFERENCE", "EFFECTIVE_RESOURCE_DESTRUCTION", "SUPPORT_TRANSMISSION", "ROOT_FORCE", "FINAL_STRENGTH", "GE_CHENG", "GE_BAI", "JIU_YING", "M5_HELPFUL_YONGSHEN", "TRANSFORMATION", "FORTUNE", "PREDICTION"],
});

export type M4PositionDecision = "NOT_APPLICABLE_TO_PATTERN" | "SOURCE_OR_POLICY_UNRESOLVED" | "SURFACE_BOTH_NOT_PRESENT" | "MULTIPLE_PAIR_CONTEXT_REVIEW_REQUIRED" | "ADJACENT_CONTROL_REVIEW_CONTEXT" | "DAY_MASTER_SEPARATED_CONTEXT" | "OFFICER_INTERVENING_CONTEXT" | "OTHER_SEPARATION_OUT_OF_SELECTED_SCOPE";
export type M4PositionExposure = "BOTH_ABSENT" | "WEALTH_ABSENT" | "RESOURCE_ABSENT" | "BOTH_VISIBLE" | "WEALTH_ONLY_VISIBLE" | "RESOURCE_ONLY_VISIBLE" | "BOTH_HIDDEN_ONLY";
export type M4PairGeometry = "ADJACENT" | "DAY_MASTER_ONLY_BETWEEN" | "OFFICER_AND_DAY_MASTER_BETWEEN" | "OTHER_STEM_AND_DAY_MASTER_BETWEEN";
type Parent = M4ZhengguanStructureResult["candidates"][number];
type Refs = Pick<Parent["candidateAssessment"], "inputFactRefs" | "inputEvidenceRefs" | "inputMemberRefs" | "locationRefs" | "pillarRefs" | "ruleRefs" | "policyRefs" | "sourceRefs" | "calculationSourceRefs">;
export interface M4PositionPair extends Refs {
  readonly id: string; readonly candidateRef: string; readonly wealth: M3StemLocation; readonly resource: M3StemLocation;
  readonly geometry: M4PairGeometry; readonly intermediateLocations: readonly M3StemLocation[]; readonly patternLinkRef: string;
  readonly relation: Parent["structuralLinks"][number]["relation"]; readonly effectStatus: "NOT_EVALUATED";
}
export interface M4PositionCandidate extends Refs {
  readonly candidateRef: string; readonly candidateIndex: number; readonly pillars: readonly string[];
  readonly upstreamCandidateStatus: Parent["candidateAssessment"]["status"]; readonly exposureState: M4PositionExposure;
  readonly exposure: { readonly wealth: Parent["groups"]["wealth"]; readonly resource: Parent["groups"]["resource"] };
  readonly decision: Refs & { readonly id: string; readonly status: M4PositionDecision; readonly reasonCodes: readonly string[]; readonly patternAssessmentRef: string; readonly patternConditionRefs: readonly string[]; readonly pairRefs: readonly string[] };
  readonly pairs: readonly M4PositionPair[]; readonly relatedConditions: Parent["conditions"]; readonly relatedCombinations: Parent["surfaceCombinations"];
  readonly relatedTenGodGroups: Pick<Parent["groups"], "hurtingOfficer" | "sevenKillings">;
  readonly relatedBranchRelations: Parent["relations"]; readonly requiredPolicies: readonly string[];
  readonly effects: { readonly status: "NOT_EVALUATED"; readonly geCheng: "NOT_IMPLEMENTED"; readonly geBai: "NOT_IMPLEMENTED"; readonly jiuYing: "NOT_IMPLEMENTED" };
}
export interface M4PositionResult {
  readonly schemaVersion: "m4-wealth-resource-position-review-v1"; readonly status: "LIMITED_POSITION_REVIEW_ONLY";
  readonly profile: typeof M4_POSITION_METADATA; readonly upstreamPatternProfile: { readonly id: string; readonly version: string };
  readonly candidates: readonly M4PositionCandidate[]; readonly rules: readonly M3InputRule[]; readonly sources: readonly M3InputSource[];
  readonly validation: { readonly scope: string; readonly g0Receipt: null; readonly g1P2Promotion: false; readonly m3FinalStrength: "NOT_IMPLEMENTED"; readonly m4FullEffectGate: "BLOCKED_UNCHANGED"; readonly predictiveValidity: "NOT_CLAIMED" };
}
interface Context { readonly pattern: M4ZhengguanStructureResult; readonly evidence: M3EvidenceResult; }
const contexts = new WeakMap<object, Context>();
function validateContext(context: Context): void {
  check(context.pattern && context.evidence, "M4_POSITION_ISSUED_PARENT_REQUIRED");
  validateM4ZhengguanStructure(context.pattern, { evidence: context.evidence });
  check(context.pattern.profile.id === M4_PATTERN_PROFILE_ID && context.pattern.profile.version === M4_PATTERN_VERSION, "M4_POSITION_PARENT_POLICY_MISMATCH");
  check(context.pattern.candidates.length === context.evidence.candidates.length, "M4_POSITION_CANDIDATE_COUNT_MISMATCH");
  const ids = new Set(context.pattern.sources.map(s => s.id));
  check(M4_POSITION_METADATA.sources.every(s => !ids.has(s.id)), "M4_POSITION_SOURCE_REGISTRY_COLLISION");
  check(M4_POSITION_METADATA.rules.every(r => !context.pattern.rules.some(p => p.id === r.id)), "M4_POSITION_RULE_REGISTRY_COLLISION");
}
function references(parent: Parent, locations: readonly M3StemLocation[], entries: readonly Refs[] = []): Refs {
  const used = [parent.candidateAssessment, ...entries];
  return {
    inputFactRefs: unique([...used.flatMap(v => v.inputFactRefs), ...locations.flatMap(v => v.inputFactRefs)]),
    inputEvidenceRefs: unique(used.flatMap(v => v.inputEvidenceRefs)), inputMemberRefs: unique([...used.flatMap(v => v.inputMemberRefs), ...locations.flatMap(v => v.inputMemberRef ? [v.inputMemberRef] : [])]),
    locationRefs: unique([...used.flatMap(v => v.locationRefs), ...locations.map(v => v.locationId)]), pillarRefs: unique([...used.flatMap(v => v.pillarRefs), ...locations.map(v => v.pillarRef)]),
    ruleRefs: unique([...M4_POSITION_METADATA.rules.map(r => r.id), ...used.flatMap(v => v.ruleRefs), ...locations.flatMap(v => v.ruleRefs)]),
    policyRefs: unique([M4_POSITION_PROFILE_ID, ...used.flatMap(v => v.policyRefs), ...locations.flatMap(v => v.policyRefs)]),
    sourceRefs: unique([...M4_POSITION_METADATA.rules.flatMap(r => r.sourceIds), ...used.flatMap(v => v.sourceRefs), ...locations.flatMap(v => v.sourceRefs)]),
    calculationSourceRefs: unique([...used.flatMap(v => v.calculationSourceRefs), ...locations.flatMap(v => v.calculationSourceRefs)]),
  };
}

/** Classifies the selected visible-pair precondition and position context; never effective 財印無礙. */
export function deriveM4WealthResourcePosition(pattern: M4ZhengguanStructureResult, options: { readonly profileId: string; readonly evidence: M3EvidenceResult }): M4PositionResult {
  check(options?.profileId === M4_POSITION_PROFILE_ID, "M4_POSITION_EXPLICIT_PROFILE_REQUIRED");
  const context = { pattern, evidence: options.evidence }; validateContext(context);
  const candidates = pattern.candidates.map((parent, candidateIndex): M4PositionCandidate => {
    const native = context.evidence.candidates[candidateIndex]!;
    check(parent.candidateRef === native.candidateRef && candidateIndex === parent.candidateIndex, "M4_POSITION_CROSS_CANDIDATE");
    const surfaces = [...Object.values(native.directionalGroups).flat().filter(l => l.locationKind === "VISIBLE_STEM"), native.visibleDayMaster].sort((a, b) => ROLES.indexOf(a.pillarRole) - ROLES.indexOf(b.pillarRole));
    check(surfaces.length === 4 && new Set(surfaces.map(l => l.pillarRole)).size === 4, "M4_POSITION_FOUR_SURFACES_REQUIRED");
    const { wealth, resource } = parent.groups;
    const hasWealth = wealth.visible.length + wealth.hidden.length > 0, hasResource = resource.visible.length + resource.hidden.length > 0;
    const exposureState: M4PositionExposure = !hasWealth && !hasResource ? "BOTH_ABSENT" : !hasWealth ? "WEALTH_ABSENT" : !hasResource ? "RESOURCE_ABSENT" : wealth.visible.length && resource.visible.length ? "BOTH_VISIBLE" : wealth.visible.length ? "WEALTH_ONLY_VISIBLE" : resource.visible.length ? "RESOURCE_ONLY_VISIBLE" : "BOTH_HIDDEN_ONLY";
    const pairs: M4PositionPair[] = [], pairIds = new Set<string>();
    for (const w of wealth.visible) for (const r of resource.visible) {
      check(w.pillarRole !== "day" && r.pillarRole !== "day" && w.locationKind === "VISIBLE_STEM" && r.locationKind === "VISIBLE_STEM", "M4_POSITION_VISIBLE_NON_DAY_TARGETS_REQUIRED");
      const matches = parent.structuralLinks.filter(l => l.kind === "WEALTH_RESOURCE_POSITION" && l.from.locationId === w.locationId && l.to.locationId === r.locationId);
      check(matches.length === 1, "M4_POSITION_UNIQUE_PARENT_LINK_REQUIRED"); const link = matches[0]!;
      const intermediateLocations = link.positionRelation.intermediateRoles.map(role => { const location = surfaces.find(v => v.pillarRole === role); check(location, "M4_POSITION_INTERVENING_LOCATION_MISSING"); return location; });
      const geometry: M4PairGeometry = link.positionRelation.adjacent ? "ADJACENT" : intermediateLocations.length === 1 && intermediateLocations[0]!.pillarRole === "day" ? "DAY_MASTER_ONLY_BETWEEN" : intermediateLocations.some(l => l.tenGod === "正官") ? "OFFICER_AND_DAY_MASTER_BETWEEN" : "OTHER_STEM_AND_DAY_MASTER_BETWEEN";
      check(geometry === "ADJACENT" || intermediateLocations.some(l => l.pillarRole === "day"), "M4_POSITION_UNREACHABLE_SURFACE_GEOMETRY");
      const key = w.locationId + "|" + r.locationId; check(!pairIds.has(key), "M4_POSITION_DUPLICATE_PAIR"); pairIds.add(key);
      pairs.push({ id: parent.candidateRef + `#m4-c1-pair[${pairs.length}]`, candidateRef: parent.candidateRef, wealth: w, resource: r, geometry, intermediateLocations, patternLinkRef: link.id, relation: link.relation, effectStatus: "NOT_EVALUATED", ...references(parent, [w, r, ...intermediateLocations], [link]) });
    }
    let status: M4PositionDecision;
    if (parent.candidateAssessment.status === "NOT_A_CANDIDATE_UNDER_POLICY") status = "NOT_APPLICABLE_TO_PATTERN";
    else if (parent.candidateAssessment.status === "SOURCE_OR_POLICY_UNRESOLVED") status = "SOURCE_OR_POLICY_UNRESOLVED";
    else if (!pairs.length) status = "SURFACE_BOTH_NOT_PRESENT";
    else if (pairs.length > 1) status = "MULTIPLE_PAIR_CONTEXT_REVIEW_REQUIRED";
    else status = ({ ADJACENT: "ADJACENT_CONTROL_REVIEW_CONTEXT", DAY_MASTER_ONLY_BETWEEN: "DAY_MASTER_SEPARATED_CONTEXT", OFFICER_AND_DAY_MASTER_BETWEEN: "OFFICER_INTERVENING_CONTEXT", OTHER_STEM_AND_DAY_MASTER_BETWEEN: "OTHER_SEPARATION_OUT_OF_SELECTED_SCOPE" } as const)[pairs[0]!.geometry];
    const relatedConditions = parent.conditions;
    const relatedCombinations = parent.surfaceCombinations;
    const reasons = [status, exposureState, ...(parent.competition.status === "COMPETING_CONDITIONS_PRESENT" ? ["MONTH_SELECTION_COMPETITION_PRESERVED"] : []), ...relatedConditions.filter(c => c.status === "OBSERVED" && ["HURTING_OFFICER_CONTROLS_OFFICER", "OFFICER_SEVEN_KILLINGS_COEXISTENCE", "NATAL_BRANCH_RELATION_REVIEW"].includes(c.kind)).map(c => c.kind), ...(relatedCombinations.length ? ["SURFACE_COMBINATION_EFFECT_UNEVALUATED"] : [])];
    const usedLocations = [...wealth.visible, ...wealth.hidden, ...resource.visible, ...resource.hidden, ...pairs.flatMap(p => p.intermediateLocations)];
    const refs = references(parent, usedLocations, [...parent.conditions, ...pairs]);
    const requiredPolicies = status === "NOT_APPLICABLE_TO_PATTERN" ? [] : status === "SOURCE_OR_POLICY_UNRESOLVED" ? ["UPSTREAM_MONTH_PATTERN_SELECTION_COMPATIBILITY"] : ["NATAL_AND_OFFICER_RELATIVE_STRENGTH", "WEALTH_RESOURCE_TRANSMISSION_AND_ROOT_EFFICACY", ...(relatedCombinations.length ? ["STEM_COMBINATION_COMPETITION_AND_REMOVAL_EFFICACY"] : []), ...(parent.conditions.some(c => c.status === "OBSERVED" && ["HURTING_OFFICER_CONTROLS_OFFICER", "OFFICER_SEVEN_KILLINGS_COEXISTENCE"].includes(c.kind)) ? ["HURTING_OFFICER_KILLINGS_AND_RESCUE_EFFICACY"] : []), ...(parent.relations.pairs.length || parent.relations.triads.some(t => t.distinctMemberCount >= 2) ? ["BRANCH_INTERACTION_AND_ROOT_DAMAGE_EFFICACY"] : []), ...(parent.competition.status === "COMPETING_CONDITIONS_PRESENT" ? ["MONTH_ORDER_PATTERN_TRANSFORMATION_SELECTION"] : [])];
    return { candidateRef: parent.candidateRef, candidateIndex, pillars: parent.pillars.map(p => p.stem + p.branch), upstreamCandidateStatus: parent.candidateAssessment.status,
      exposureState, exposure: { wealth, resource }, pairs,
      decision: { id: parent.candidateRef + "#m4-c1-decision", status, reasonCodes: reasons, patternAssessmentRef: parent.candidateAssessment.id, patternConditionRefs: parent.conditions.map(c => c.id), pairRefs: pairs.map(p => p.id), ...refs },
      relatedConditions, relatedCombinations, relatedTenGodGroups: { hurtingOfficer: parent.groups.hurtingOfficer, sevenKillings: parent.groups.sevenKillings }, relatedBranchRelations: parent.relations, requiredPolicies,
      effects: { status: "NOT_EVALUATED", geCheng: "NOT_IMPLEMENTED", geBai: "NOT_IMPLEMENTED", jiuYing: "NOT_IMPLEMENTED" }, ...refs,
    };
  });
  const result: M4PositionResult = freeze({ schemaVersion: "m4-wealth-resource-position-review-v1", status: "LIMITED_POSITION_REVIEW_ONLY", profile: M4_POSITION_METADATA,
    upstreamPatternProfile: { id: pattern.profile.id, version: pattern.profile.version }, candidates, rules: [...pattern.rules, ...M4_POSITION_METADATA.rules], sources: [...pattern.sources, ...M4_POSITION_METADATA.sources],
    validation: { scope: "SAME_PROCESS_POSITION_PRECONDITION_NOT_EXTERNAL_AUTHENTICATION_OR_EFFECT_EFFICACY", g0Receipt: null, g1P2Promotion: false, m3FinalStrength: "NOT_IMPLEMENTED", m4FullEffectGate: "BLOCKED_UNCHANGED", predictiveValidity: "NOT_CLAIMED" } });
  contexts.set(result, context); return result;
}
export function validateM4WealthResourcePosition(value: M4PositionResult, expected: Partial<Context> = {}): true {
  const context = contexts.get(value); check(context && Object.isFrozen(value), "M4_POSITION_ISSUED_RESULT_REQUIRED");
  for (const key of ["pattern", "evidence"] as const) if (expected[key] !== undefined) check(expected[key] === context[key], "M4_POSITION_OTHER_EXECUTION_CONTEXT");
  validateContext(context); return true;
}

const locationText = (l: M3StemLocation) => ROLE_KO[l.pillarRole] + (l.locationKind === "VISIBLE_STEM" ? "간 " : "지 장간 ") + l.stem;
function positionReport(result: M4PositionResult) {
  validateM4WealthResourcePosition(result);
  const candidates = result.candidates.map(c => {
    const exposed = (values: readonly M3StemLocation[]) => values.length ? values.map(locationText).join("·") : "없음";
    const exposure = `표면 재성: ${exposed(c.exposure.wealth.visible)}. 표면 인성: ${exposed(c.exposure.resource.visible)}. 장간 재성: ${exposed(c.exposure.wealth.hidden)}. 장간 인성: ${exposed(c.exposure.resource.hidden)}.`;
    const summaries: Record<M4PositionDecision, string> = {
      NOT_APPLICABLE_TO_PATTERN: "부모 M4가 정관격 구조 후보가 아니므로 이 정관격 위치 규칙은 적용하지 않습니다. 원래 재·인과 위치 자료는 보존합니다.",
      SOURCE_OR_POLICY_UNRESOLVED: "부모 M4의 월령 취격·장간 호환 정책이 미정이므로 이번 위치 규칙으로 그 보류를 해제하지 않습니다.",
      SURFACE_BOTH_NOT_PRESENT: "표면 재·인 양투라는 적용 전제가 충족되지 않습니다. 장간의 존재를 표면 투출로 대신하지 않으며, 장간까지 포함한 명식 전체에 재·인이 없다는 뜻은 아닙니다.",
      MULTIPLE_PAIR_CONTEXT_REVIEW_REQUIRED: "표면 재·인 쌍이 복수이므로 하나를 골라 무간섭으로 판단하지 않습니다. 각 위치형을 모두 보존하고 경쟁·간섭 효력은 별도 검토로 남깁니다.",
      ADJACENT_CONTROL_REVIEW_CONTEXT: "단일 표면 재·인 쌍이 인접해 직접 재극인을 검토할 위치 조건에 해당합니다. 인접성만으로 인성 손상이나 파격을 판정하지 않습니다.",
      DAY_MASTER_SEPARATED_CONTEXT: "단일 표면 재·인 사이에 일간만 있는 분리 문맥입니다. 선택한 원문의 위치 조건은 관측되지만, 이것만으로 실제 무간섭이나 재·인의 병용을 확정하지 않습니다.",
      OFFICER_INTERVENING_CONTEXT: "단일 표면 재·인 사이에 정관과 일간이 함께 있습니다. 관 중간 설명을 위치형으로 옮긴 프로젝트 정의이며 실제 생조 전달·통관의 보장은 아닙니다.",
      OTHER_SEPARATION_OUT_OF_SELECTED_SCOPE: "단일 표면 재·인 사이에 일간 외의 다른 천간도 있어 선택한 일간만의 분리 범위 밖입니다. 격위라는 이유만으로 간섭이 없다고 판단하지 않습니다.",
    };
    const geometryText: Record<M4PairGeometry, string> = { ADJACENT: "인접", DAY_MASTER_ONLY_BETWEEN: "일간만 사이", OFFICER_AND_DAY_MASTER_BETWEEN: "정관과 일간이 사이", OTHER_STEM_AND_DAY_MASTER_BETWEEN: "다른 천간과 일간이 사이" };
    const pairText = c.pairs.map(p => `${locationText(p.wealth)} 재성 → ${locationText(p.resource)} 인성: ${geometryText[p.geometry]}${p.intermediateLocations.length ? ` (${p.intermediateLocations.map(locationText).join("·")})` : ""}`).join("; ") || "표면 양투 위치 쌍 없음";
    const overlays = [c.relatedConditions.some(v => v.kind === "HURTING_OFFICER_CONTROLS_OFFICER" && v.status === "OBSERVED") ? "상관–정관 구성의 상관 위치 " + exposed([...c.relatedTenGodGroups.hurtingOfficer.visible, ...c.relatedTenGodGroups.hurtingOfficer.hidden]) : "", c.relatedConditions.some(v => v.kind === "OFFICER_SEVEN_KILLINGS_COEXISTENCE" && v.status === "OBSERVED") ? "관살 병존의 칠살 위치 " + exposed([...c.relatedTenGodGroups.sevenKillings.visible, ...c.relatedTenGodGroups.sevenKillings.hidden]) : "", c.relatedCombinations.length ? `표면 오합 ${c.relatedCombinations.map(p => locationText(p.left) + "–" + locationText(p.right)).join("; ")}` : "", c.decision.reasonCodes.includes("MONTH_SELECTION_COMPETITION_PRESERVED") ? "다른 월령 장간의 투출 경쟁" : ""].filter(Boolean);
    const policyNames: Record<string, string> = { UPSTREAM_MONTH_PATTERN_SELECTION_COMPATIBILITY: "월령 취격·장간표 호환 선택", NATAL_AND_OFFICER_RELATIVE_STRENGTH: "일간·관성의 상대 강약", WEALTH_RESOURCE_TRANSMISSION_AND_ROOT_EFFICACY: "재·인의 실제 전달과 근 효력", STEM_COMBINATION_COMPETITION_AND_REMOVAL_EFFICACY: "천간합의 경쟁·합거 효력", HURTING_OFFICER_KILLINGS_AND_RESCUE_EFFICACY: "상관·칠살과 구응 효력", BRANCH_INTERACTION_AND_ROOT_DAMAGE_EFFICACY: "지지 관계와 근 손상 효력", MONTH_ORDER_PATTERN_TRANSFORMATION_SELECTION: "월령의 격 변화·선택" };
    const remaining = c.requiredPolicies.map(id => { const name = policyNames[id]; check(name, "M4_POSITION_UNDEFINED_EFFECT_POLICY_DESCRIPTION"); return name; });
    const text = [summaries[c.decision.status], exposure, pairText + ".", ...(overlays.length ? ["함께 남긴 검토 조건: " + overlays.join(" / ") + ". 위치 판정은 이 조건들을 삭제하거나 해결하지 않습니다."] : []), remaining.length ? "실제 효력에 남은 전제: " + remaining.join(", ") + "." : "이 정관격 위치 규칙의 적용 밖이며 실제 효력을 판단하지 않았습니다."];
    return { candidateRef: c.candidateRef, candidateIndex: c.candidateIndex, pillars: c.pillars.join("·"), items: text.map((text, i) => ({ id: c.candidateRef + `#m4-c1-report[${i}]`, candidateRef: c.candidateRef, templateId: ["KO_M4_C1_POSITION_DECISION", "KO_M4_C1_EXPOSURE", "KO_M4_C1_ALL_PAIR_GEOMETRIES", ...(overlays.length ? ["KO_M4_C1_OVERLAPPING_CONDITIONS"] : []), "KO_M4_C1_EFFECT_PRECONDITIONS"][i]!, templateVersion: M4_POSITION_VERSION, decisionRefs: [c.decision.id], pairRefs: c.pairs.map(p => p.id), ...references(contexts.get(result)!.pattern.candidates[c.candidateIndex]!, [], [c]), text })) };
  });
  return { schemaVersion: "ko-m4-wealth-resource-position-report-v1", profileId: M4_POSITION_PROFILE_ID, templateVersion: M4_POSITION_VERSION, title: "정관격 재·인 위치 검토 — 제한적 로컬 연구 v0.1", candidates,
    scopeNote: "이번 판정은 표면 양투의 적용 전제와 위치 검토 문맥에 한정합니다. 거리·인접·관 중간·오합의 존재를 실제 무간섭·파인·생조 전달·成格·破格·救應·신강약·용신·길흉으로 바꾸지 않습니다." };
}
export type M4PositionReport = ReturnType<typeof positionReport>;
const reports = new WeakMap<object, M4PositionResult>();
export function explainM4WealthResourcePosition(result: M4PositionResult): M4PositionReport { const report = freeze(positionReport(result)); reports.set(report, result); return report; }
export function validateM4WealthResourcePositionExplanation(report: unknown, result: M4PositionResult): true {
  validateM4WealthResourcePosition(result); dense(report); check(JSON.stringify(report) === JSON.stringify(positionReport(result)), "M4_POSITION_REPORT_CONTENT_OR_REFERENCES_CHANGED"); return true;
}
export function renderM4WealthResourcePositionText(report: M4PositionReport): string {
  const result = reports.get(report); check(result, "M4_POSITION_ISSUED_REPORT_REQUIRED"); validateM4WealthResourcePositionExplanation(report, result);
  return [report.title, `선택 정책: ${report.profileId} / ${M4_POSITION_VERSION}`, ...report.candidates.flatMap(c => [`\n후보 ${c.candidateIndex + 1}: ${c.pillars}`, ...c.items.map(i => i.text)]), "\n" + report.scopeNote, ""].join("\n");
}
