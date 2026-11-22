import { EARTHLY_BRANCHES, type EarthlyBranch } from "../domain/branches.js";
import { HIDDEN_STEM_POLICY_V1, hiddenStemsForBranch } from "../domain/hiddenStems.js";
import { areStemCombinationPartners } from "../domain/stemCombinations.js";
import { HEAVENLY_STEMS, STEM_NATURE, type FiveElement, type HeavenlyStem } from "../domain/stems.js";
import { validateSeasonalState, type FourSeason, type SeasonalStateResult } from "../m3/seasonalStateV1.js";
import { validateSeasonalSiliState, type SeasonalSiliStateResult } from "../m3/seasonalStateV2.js";
import { validateM3EvidenceInputContext, type M3EvidenceResult, type M3InputEnvelope, type M3StemLocation } from "../m3/structuralEvidenceV1.js";

export const CLIMATE_V2_POLICY_ID = "E5-CLIMATE-CANDIDATES-V02";
export const CLIMATE_V2_VERSION = "0.2.0";

const ORIGINAL = "E5-CLIMATE-ZPZQ-SHEN-CH14";
const COMMENTARY = "E5-CLIMATE-ZPZQ-XU-CH14";
const QIONGTONG = "E5-CLIMATE-QIONGTONG-WOOD-METAL";
const PROJECT = "E5-CLIMATE-PROJECT-V02";
const zipingUrl = "https://ncc.com.tw/fate/paleo/bg/bg_033.htm";

export const CLIMATE_V2_SOURCES = Object.freeze([
  Object.freeze({ id: ORIGINAL, kind: "CLASSICAL_TEXT_TRANSCRIPTION", author: "沈孝瞻", section: "十四、論用神配氣候得失", url: zipingUrl }),
  Object.freeze({ id: COMMENTARY, kind: "LATER_COMMENTARY_TRANSCRIPTION", author: "徐樂吾", section: "十四、論用神配氣候得失", url: zipingUrl }),
  Object.freeze({ id: QIONGTONG, kind: "OTHER_TRADITIONAL_SYSTEM_TRANSCRIPTION", title: "窮通寶鑑", sections: "三夏甲木、三冬庚金", url: "https://www.ncc.com.tw/fate/paleo/bg/bg_11.htm" }),
  Object.freeze({ id: PROJECT, kind: "PROJECT_POLICY", version: CLIMATE_V2_VERSION, policyRef: "docs/research/ENGINE_E5_CLIMATE_POLICY_V02.md" }),
]);

type Family = "WINTER_WOOD" | "SUMMER_JIA" | "WINTER_GENG";
type Coverage = "EXECUTABLE" | "OBSERVATION_ONLY" | "NO_RULE";
type ClimateQuality = "WINTER_WOOD_COLD" | "SUMMER_HEAT_AND_DRYNESS" | "WINTER_METAL_COLD_AND_WATER" | "LATE_SUMMER_JIA_CONTEXT";
interface Rule {
  family: Family;
  quality: ClimateQuality;
  coverage: Exclude<Coverage, "NO_RULE">;
  expectedSeason: FourSeason;
  targetElement: FiveElement;
  targetStem: HeavenlyStem | null;
  counterElement: FiveElement;
  triggerElement: FiveElement | null;
  triggerMissing: string;
  triggerRemote: string;
  sourceRefs: readonly string[];
}
const WINTER_WOOD: Rule = { family: "WINTER_WOOD", quality: "WINTER_WOOD_COLD", coverage: "EXECUTABLE", expectedSeason: "WINTER",
  targetElement: "FIRE", targetStem: null, counterElement: "WATER", triggerElement: null, triggerMissing: "", triggerRemote: "",
  sourceRefs: [ORIGINAL, COMMENTARY, PROJECT] };
const SUMMER_JIA: Rule = { family: "SUMMER_JIA", quality: "SUMMER_HEAT_AND_DRYNESS", coverage: "EXECUTABLE", expectedSeason: "SUMMER",
  targetElement: "WATER", targetStem: "癸", counterElement: "EARTH", triggerElement: "FIRE",
  triggerMissing: "EXPOSED_FIRE_NOT_OBSERVED", triggerRemote: "EXPOSED_FIRE_TOO_REMOTE", sourceRefs: [ORIGINAL, COMMENTARY, QIONGTONG, PROJECT] };
const WINTER_GENG: Rule = { family: "WINTER_GENG", quality: "WINTER_METAL_COLD_AND_WATER", coverage: "EXECUTABLE", expectedSeason: "WINTER",
  targetElement: "FIRE", targetStem: "丙", counterElement: "WATER", triggerElement: "WATER",
  triggerMissing: "EXPOSED_WATER_CONTEXT_NOT_OBSERVED", triggerRemote: "EXPOSED_WATER_CONTEXT_TOO_REMOTE", sourceRefs: [ORIGINAL, COMMENTARY, QIONGTONG, PROJECT] };

function ruleFor(day: HeavenlyStem, month: EarthlyBranch): Rule | undefined {
  if ((day === "甲" || day === "乙") && (month === "亥" || month === "子")) return WINTER_WOOD;
  if (day === "甲" && (month === "巳" || month === "午")) return SUMMER_JIA;
  if (day === "甲" && month === "未") return { ...SUMMER_JIA, quality: "LATE_SUMMER_JIA_CONTEXT",
    coverage: "OBSERVATION_ONLY", targetElement: "FIRE", targetStem: "丁", counterElement: "WATER", triggerElement: null };
  if (day === "庚" && month === "子") return WINTER_GENG;
  if (day === "庚" && (month === "亥" || month === "丑")) return { ...WINTER_GENG, coverage: "OBSERVATION_ONLY" };
  return undefined;
}

export function climateCoverageV2() {
  return HEAVENLY_STEMS.flatMap(day => EARTHLY_BRANCHES.map(month => {
    const rule = ruleFor(day, month);
    return { day, month, coverage: rule?.coverage ?? "NO_RULE" as const, family: rule?.family ?? null };
  }));
}

type SeasonalJudgment = SeasonalSiliStateResult | SeasonalStateResult;
interface SeasonalEnvelope {
  readonly policy: { readonly id: string; readonly version: string };
  readonly candidates: readonly { readonly candidateRef: string; readonly candidateIndex: number; readonly judgment: SeasonalJudgment }[];
}
interface Position {
  readonly locationId: string;
  readonly pillarRole: M3StemLocation["pillarRole"];
  readonly stem: HeavenlyStem;
  readonly element: FiveElement;
  readonly locationKind: M3StemLocation["locationKind"];
  readonly position: M3StemLocation["position"];
  readonly memberRef: string | null;
  readonly factRefs: readonly string[];
}
interface Condition {
  readonly code: string;
  readonly locationRefs: readonly string[];
  readonly factRefs: readonly string[];
}
const ROLES = ["year", "month", "day", "hour"] as const;
const LIMITATIONS = ["NATAL_SCOPE", "ACTUAL_TEMPERATURE_AND_MOISTURE_UNASSESSED", "EFFECT_AND_SUFFICIENCY_UNASSESSED", "NO_FINAL_YONGSHIN"] as const;
const unique = (refs: readonly string[]) => [...new Set(refs)];
const distance = (left: Position["pillarRole"], right: Position["pillarRole"]) => Math.abs(ROLES.indexOf(left) - ROLES.indexOf(right));
function check(condition: unknown, code: string): asserts condition {
  if (!condition) throw new RangeError(code);
}
function condition(code: string, positions: readonly Position[], extraFactRefs: readonly string[] = []): Condition {
  return { code, locationRefs: positions.map(item => item.locationId), factRefs: unique([...positions.flatMap(item => item.factRefs), ...extraFactRefs]) };
}
function asPosition(item: M3StemLocation): Position {
  return { locationId: item.locationId, pillarRole: item.pillarRole, stem: item.stem, element: item.element,
    locationKind: item.locationKind, position: item.position, memberRef: item.inputMemberRef, factRefs: item.inputFactRefs };
}
function sortLocations(a: M3StemLocation, b: M3StemLocation) {
  return ROLES.indexOf(a.pillarRole) - ROLES.indexOf(b.pillarRole) || (a.index ?? -1) - (b.index ?? -1);
}
function sameList(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}
function seasonFor(seasonal: SeasonalEnvelope, evidence: M3EvidenceResult, index: number) {
  const parent = evidence.candidates[index]!, entry = seasonal?.candidates[index];
  check(seasonal?.candidates.length === evidence.candidates.length && entry?.candidateRef === parent.candidateRef &&
    entry.candidateIndex === index, "E5_CLIMATE_FOREIGN_SEASONAL_PARENT");
  const judgment = entry.judgment;
  if ("alternatives" in judgment) validateSeasonalSiliState(judgment);
  else validateSeasonalState(judgment);
  const month = parent.evidence.find(item => item.kind === "MONTH_CONTEXT")!;
  const active = parent.monthContext.activeSince;
  const issued = judgment.appliedJie;
  check(judgment.candidateRef === parent.candidateRef && judgment.dayMaster === parent.dayMaster &&
    judgment.monthBranch === parent.monthContext.monthPillar.branch && judgment.policy.id === seasonal.policy.id &&
    judgment.policy.version === seasonal.policy.version && issued.term === active.term && issued.displayedDateTime === active.displayedDateTime &&
    sameList(issued.sourceIds, active.sourceIds) && sameList(judgment.inputEvidenceRefs, [month.id]) &&
    sameList(judgment.inputFactRefs, month.inputFactRefs), "E5_CLIMATE_FOREIGN_SEASONAL_FACTS");
  return judgment;
}

type DecisionStatus = "CANDIDATE" | "EXISTING_EFFECT_UNRESOLVED" | "COMPETING" | "HOLD" |
  "OUT_OF_SCOPE" | "OBSERVATION_ONLY" | "NEEDS_DATA";
interface Decision {
  status: DecisionStatus;
  reasonCode: string;
}

function choose(
  rule: Rule | undefined,
  judgment: SeasonalJudgment,
  target: readonly Position[],
  trigger: readonly Position[],
  alternatives: readonly Position[],
  opposing: readonly Condition[],
): Decision {
  if (!rule) return { status: "OUT_OF_SCOPE", reasonCode: "NO_RULE_FOR_STEM_MONTH" };
  if (judgment.status === "NEEDS_DATA") return { status: "NEEDS_DATA", reasonCode: "SEASONAL_CONTEXT_NEEDS_DATA" };
  if (rule.coverage === "OBSERVATION_ONLY") return { status: "OBSERVATION_ONLY", reasonCode: "DOCUMENTARY_CONTEXT_ONLY" };
  if (judgment.status !== "RESOLVED_UNDER_POLICY" || judgment.season !== rule.expectedSeason) {
    return { status: "HOLD", reasonCode: "SEASONAL_CONDITION_UNRESOLVED" };
  }
  if (opposing.length) return { status: "COMPETING", reasonCode: opposing[0]!.code };
  if (target.length) return { status: "EXISTING_EFFECT_UNRESOLVED", reasonCode: "TARGET_ALREADY_OBSERVED" };
  if (rule.triggerElement && !trigger.some(item => distance(item.pillarRole, "month") <= 1)) {
    return { status: "HOLD", reasonCode: trigger.length ? rule.triggerRemote : rule.triggerMissing };
  }
  if (alternatives.length) return { status: "HOLD", reasonCode: rule.family === "SUMMER_JIA" ? "OTHER_WATER_STEM_UNRESOLVED" : "OTHER_FIRE_STEM_UNRESOLVED" };
  return { status: "CANDIDATE", reasonCode: rule.targetElement === "FIRE" ? "WARMTH_UNOBSERVED" : "COOLING_STEM_UNOBSERVED" };
}

/** Consume in-process M3/M2 and issued seasonal values for one existing natal parent. */
export function evaluateClimateV2(
  facts: M3InputEnvelope, evidence: M3EvidenceResult, index: number, seasonal: SeasonalEnvelope,
  selection: { readonly policyId: string; readonly policyVersion: string },
) {
  check(selection?.policyId === CLIMATE_V2_POLICY_ID && selection.policyVersion === CLIMATE_V2_VERSION, "E5_CLIMATE_POLICY_REQUIRED");
  validateM3EvidenceInputContext(evidence, facts);
  const natal = facts.candidates[index], parent = evidence.candidates[index];
  check(natal && parent && natal.id === parent.candidateRef && parent.candidateIndex === index, "E5_CLIMATE_UNKNOWN_PARENT");
  const judgment = seasonFor(seasonal, evidence, index);
  const locations = [...Object.values(parent.directionalGroups).flat(), parent.visibleDayMaster].sort(sortLocations);
  for (const [pillarIndex, role] of ROLES.entries()) {
    const pillar = natal.pillars[pillarIndex];
    check(pillar?.role === role, "E5_CLIMATE_FOUR_PILLARS_REQUIRED");
    const expected = hiddenStemsForBranch(pillar.branch, HIDDEN_STEM_POLICY_V1);
    const actual = locations.filter(item => item.pillarRole === role && item.locationKind === "HIDDEN_STEM");
    const visible = locations.filter(item => item.pillarRole === role && item.locationKind === "VISIBLE_STEM");
    check(visible.length === 1 && visible[0]?.stem === pillar.stem &&
      actual.length === expected.length && expected.every((item, i) => item.stem === actual[i]?.stem &&
        item.index === actual[i]?.index && item.position === actual[i]?.position), "E5_CLIMATE_COMPLETE_SELECTED_MEMBERS_REQUIRED");
  }
  const all = locations.map(asPosition);
  const day = parent.dayMaster, month = parent.monthContext.monthPillar.branch, rule = ruleFor(day, month);
  const visible = all.filter(item => item.locationKind === "VISIBLE_STEM" && item.pillarRole !== "day");
  const related = rule ? all.filter(item => item.element === rule.targetElement) : [];
  const target = related.filter(item => !rule?.targetStem || item.stem === rule.targetStem);
  const alternate = related.filter(item => rule?.targetStem && item.stem !== rule.targetStem);
  const trigger = visible.filter(item => item.element === rule?.triggerElement);
  const counter = visible.filter(item => item.element === rule?.counterElement);
  const supporting = [];
  const opposing = [];
  if (target.length) supporting.push(condition("TARGET_STEM_OR_ELEMENT_OBSERVED", target));
  if (alternate.length) supporting.push(condition("OTHER_STEM_OF_TARGET_ELEMENT_OBSERVED", alternate));
  if (trigger.length) supporting.push(condition("EXPOSED_TRIGGER_OBSERVED", trigger));
  const coFactors = rule?.family === "WINTER_GENG" ? all.filter(item => item.stem === "甲" || item.stem === "丁") : [];
  if (coFactors.length) supporting.push(condition("WINTER_GENG_WOOD_FORGING_FIRE_CONTEXT", coFactors));
  const rootTargets = target.filter(item => item.locationKind === "VISIBLE_STEM").map(item => {
    const roots = target.filter(root => root.locationKind === "HIDDEN_STEM" && root.stem === item.stem);
    return { exposed: item, roots };
  });
  for (const { exposed, roots } of rootTargets) {
    if (roots.length) supporting.push(condition("EXPOSED_TARGET_EXACT_HIDDEN_ROOT", [exposed, ...roots]));
  }
  for (const item of target) {
    const controllers = counter.filter(other => distance(item.pillarRole, other.pillarRole) <= 1);
    if (controllers.length) opposing.push(condition("NEARBY_SURFACE_CONTROL", [item, ...controllers]));
    if (item.locationKind === "VISIBLE_STEM") {
      const partners = visible.filter(other => distance(item.pillarRole, other.pillarRole) <= 1 && areStemCombinationPartners(item.stem, other.stem));
      if (partners.length) opposing.push(condition("NEARBY_STEM_COMBINATION_EFFECT_UNRESOLVED", [item, ...partners]));
    } else {
      const clashes = natal.facts.filter(fact => fact.kind === "BRANCH_RELATION" &&
        fact.pillarRefs.includes(parent.candidateRef + "." + item.pillarRole) &&
        (fact.value as { kind?: string }).kind === "LIUCHONG");
      if (clashes.length) opposing.push(condition("TARGET_BRANCH_CLASH_EFFECT_UNRESOLVED", [item], clashes.map(fact => fact.id)));
    }
  }
  if (rule?.family === "WINTER_GENG") {
    const waterGroup = natal.facts.filter(fact => {
      if (fact.kind !== "TRIAD_MEMBERSHIP") return false;
      const value = fact.value as { namedElement?: FiveElement; distinctMemberCount?: number };
      return value.namedElement === "WATER" && value.distinctMemberCount === 3;
    });
    if (waterGroup.length) opposing.push(condition("COMPLETE_WATER_MEMBERSHIP_EFFECT_UNRESOLVED", [], waterGroup.map(fact => fact.id)));
  }
  const decision = choose(rule, judgment, target, trigger, alternate, opposing);
  const alternativeConditions = "alternatives" in judgment
    ? judgment.alternatives.map(item => ({ id: item.id, condition: item.condition, season: item.season,
        parentCandidateRef: item.parentCandidateRef, matchesExpectedSeason: item.season === rule?.expectedSeason }))
    : [];
  const candidate = decision.status === "CANDIDATE" && rule ? [{
    element: rule.targetElement, stem: rule.targetStem, reasonCode: decision.reasonCode, scope: "CLIMATE_REVIEW_ONLY",
  }] : [];
  const factRefs = unique([...judgment.inputFactRefs, ...all.flatMap(item => item.factRefs), ...opposing.flatMap(item => item.factRefs)]);
  return {
    candidateRef: parent.candidateRef, purpose: "CLIMATE" as const, policyId: CLIMATE_V2_POLICY_ID, policyVersion: CLIMATE_V2_VERSION,
    status: decision.status, reasonCode: decision.reasonCode, family: rule?.family ?? null, coverage: rule?.coverage ?? "NO_RULE",
    dayStem: day, monthBranch: month, candidates: candidate,
    seasonal: { policyId: judgment.policy.id, policyVersion: judgment.policy.version, judgmentRef: judgment.id,
      status: judgment.status, season: judgment.season, expectedSeason: rule?.expectedSeason ?? null, alternativeConditions },
    traditionalCondition: rule ? { quality: rule.quality,
      targetElement: rule.targetElement, targetStem: rule.targetStem, observed: target.length > 0 } : null,
    observedPositions: all.filter(item => related.includes(item) || trigger.includes(item) || counter.includes(item) || coFactors.includes(item)),
    targetLocations: target, alternativeStemLocations: alternate, rootTargets,
    supportingEvidence: supporting, opposingEvidence: opposing,
    unresolvedConditions: [...LIMITATIONS, ...(decision.status === "CANDIDATE" ? [] : [decision.reasonCode])],
    sourceRefs: [...(rule?.sourceRefs ?? [PROJECT])], factRefs,
  };
}
