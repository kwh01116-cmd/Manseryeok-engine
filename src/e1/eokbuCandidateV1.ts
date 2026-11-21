import { FIVE_ELEMENTS, type FiveElement } from "../domain/stems.js";
import { fiveElementRelation, type ElementRelation } from "../domain/tenGods.js";
import { validateM3EvidenceInputContext, type M3EvidenceResult, type M3InputEnvelope } from "../m3/structuralEvidenceV1.js";
import { validateM4InnerPatterns, type M4InnerPatternsResult } from "../m4/innerPatternsV1.js";
import { validateM5LimitedPurpose, type M5LimitedPurposeResult } from "../m5/limitedPurposeV1.js";
import { isIssuedProductStrength, type ProductStrengthAssessment } from "./productStrengthV1.js";

export const EOKBU_POLICY_ID = "M5-EOKBU-CAUSE-CANDIDATE-V01" as const;
export const EOKBU_VERSION = "0.1.0" as const;
const SOURCE_PROJECT = "docs/research/M5_EOKBU_CANDIDATE_POLICY_V01.md";
const SOURCE_MARKET = "https://doc.8-codes.com/docs/origin/yongsin/";
const SOURCE_COMPARISON = "docs/research/OSS_ENGINE_AUDIT_20261114.md";

type Family = ProductStrengthAssessment["weightedComponents"][number]["family"];
type Grade = ProductStrengthAssessment["grade"];
type Component = ProductStrengthAssessment["weightedComponents"][number];
const FAMILIES = ["PEER", "RESOURCE", "OUTPUT", "WEALTH", "OFFICER"] as const;
const DIRECTIONS: Readonly<Record<Family, ElementRelation>> = {
  PEER:"SAME", RESOURCE:"TARGET_GENERATES_DAY_MASTER", OUTPUT:"DAY_MASTER_GENERATES",
  WEALTH:"DAY_MASTER_CONTROLS", OFFICER:"TARGET_CONTROLS_DAY_MASTER",
};
const ROUTES: Readonly<Record<Family, readonly Family[]>> = {
  PEER:["OUTPUT","OFFICER","WEALTH"], RESOURCE:["WEALTH","OUTPUT"], OUTPUT:["RESOURCE","PEER"],
  WEALTH:["PEER","RESOURCE"], OFFICER:["RESOURCE","PEER"],
};
const MECHANISM: Readonly<Record<Family,string>> = {
  PEER:"비겁과 같은 오행이 식상을 생하는 경로, 관성이 비겁을 극하는 경로, 일간이 재성을 극하는 경로를 차례로 검토한다.",
  RESOURCE:"재성이 인성을 극하는 경로를 먼저, 일간이 식상을 생하는 경로를 다음으로 검토한다.",
  OUTPUT:"식상을 극하면서 일간을 생하는 인성을 먼저, 동류인 비겁을 다음으로 검토한다.",
  WEALTH:"재성을 극할 수 있는 동류 비겁을 먼저, 일간을 생하는 인성을 다음으로 검토한다.",
  OFFICER:"관성이 인성을 생하고 인성이 일간을 생하는 방향을 먼저, 동류 비겁을 다음으로 검토한다.",
};
const LIMITATIONS = ["CONSTRUCTED_WEIGHTS_AND_ROUTE_ORDER", "NO_ROOT_FORCE_OR_SUPPORT_TRANSMISSION",
  "NO_RELATION_EFFECT_OR_TRANSFORMATION", "NO_FINAL_USEFUL_GOD_OR_FAVORABLE_RANK",
  "NO_PREDICTIVE_VALIDITY_ASSESSMENT"] as const;
type ClockHold = "ORIGINAL_SILI_CLOCK_DEPENDENCY_NOT_EXTENDED";
interface EokbuContext {
  readonly evidence: M3EvidenceResult;
  readonly m2Facts: M3InputEnvelope;
  readonly innerPatterns?: M4InnerPatternsResult;
  readonly climate?: M5LimitedPurposeResult;
  readonly climateUnavailableReason?: ClockHold;
}
interface Options {
  readonly profileId: string;
  readonly context?: EokbuContext;
}
function requireValue(ok:unknown, code:string):asserts ok {
  if (!ok) throw new RangeError(code);
}
function freeze<T>(value:T):T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
const unique = <T>(values:readonly T[]) => [...new Set(values)];
export const EOKBU_METADATA = freeze({
  id:EOKBU_POLICY_ID, version:EOKBU_VERSION, authority:"PROJECT_POLICY", purpose:"EOKBU",
  coCauseToleranceUnits:500, diagnosticTolerances:[400,600], totalUnits:10000, routes:ROUTES,
  sources:[
    {ref:SOURCE_PROJECT, use:"LOCAL_CAUSE_TIE_LOCATION_AND_RANK_RULES"},
    {ref:SOURCE_MARKET, use:"PUBLISHED_DIRECTION_FAMILIES_ONLY_INTERNAL_RANK_UNKNOWN"},
    {ref:SOURCE_COMPARISON, use:"SEPARATE_OSS_RANKING_COMPARISON_NOT_ADOPTED"},
  ], limitations:LIMITATIONS,
});

function checkedSiblings(strength:ProductStrengthAssessment, context:EokbuContext | undefined) {
  if (!context) return {climate:undefined, pattern:undefined};
  const {m2Facts,evidence,innerPatterns,climate,climateUnavailableReason} = context;
  requireValue(climateUnavailableReason === undefined ||
    (!climate && climateUnavailableReason === "ORIGINAL_SILI_CLOCK_DEPENDENCY_NOT_EXTENDED"), "E1_CLIMATE_CONTEXT_CONFLICT");
  validateM3EvidenceInputContext(evidence,m2Facts);
  const index = m2Facts.candidates.findIndex(c => c.id === strength.candidateRef);
  const parent = m2Facts.candidates[index];
  requireValue(parent && parent.pillars.length === 4 && strength.inputFacts.every((p,i) =>
    p.role === parent.pillars[i]?.role && p.stem === parent.pillars[i]?.stem && p.branch === parent.pillars[i]?.branch &&
    p.factRef === `facts.candidates[${index}].pillars[${i}]`), "E1_EOKBU_FOREIGN_CHART_CONTEXT");
  if (innerPatterns) validateM4InnerPatterns(innerPatterns,{evidence,m2Facts});
  if (climate) validateM5LimitedPurpose(climate,{evidence,m2Facts});
  return {climate:climate?.candidates[index], pattern:innerPatterns?.candidates[index]};
}

function familyElement(day:FiveElement, family:Family):FiveElement {
  const element = FIVE_ELEMENTS.find(e => fiveElementRelation(day,e) === DIRECTIONS[family]);
  requireValue(element, "E1_ELEMENT_FAMILY_NOT_FOUND");
  return element;
}
function placement(strength:ProductStrengthAssessment, family:Family) {
  const members = strength.weightedComponents.filter(c => c.family === family);
  const surface = members.filter(c => c.kind === "SURFACE");
  const hidden = members.filter(c => c.kind === "HIDDEN");
  const anchored = surface.length > 0 || hidden.some(c => c.position === "MAIN_QI");
  const presence = anchored ? "SURFACE_OR_MAIN" : hidden.length ? "OTHER_HIDDEN_ONLY" : "ABSENT";
  const rootLinks = surface.flatMap(s => hidden.map(h => ({
    visibleRef:s.factRef, hiddenRef:h.factRef,
    match:s.stem === h.stem ? "EXACT_STEM" as const : "SAME_ELEMENT_OTHER_STEM" as const,
  })));
  const location = (c:Component) => ({pillar:c.role, kind:c.kind, stem:c.stem, position:c.position,
    factRef:c.factRef, sourceFactId:c.sourceFactId});
  return {family, element:familyElement(strength.dayMaster.element,family), presence, roleUnits:strength.roleUnits[family],
    surface:surface.map(location), hidden:hidden.map(location), rootLinks};
}
type Placement = ReturnType<typeof placement>;
type RouteEvidence = Pick<Placement, "family" | "presence">;

/** Decision-table primitive. Its intermediate nominations carry no chart provenance or issued result. */
export function eokbuCauseRoutes(grade:Grade, roleUnits:Readonly<Record<Family,number>>, locations:readonly RouteEvidence[],
  toleranceUnits = EOKBU_METADATA.coCauseToleranceUnits) {
  const relevant:readonly Family[] = grade === "STRONG" ? ["PEER","RESOURCE"] : grade === "WEAK" ? ["OUTPUT","WEALTH","OFFICER"] : [];
  const highest = Math.max(0,...relevant.map(f => roleUnits[f]));
  const causes = relevant.filter(f => roleUnits[f] > 0 && highest - roleUnits[f] <= toleranceUnits);
  return causes.map(family => {
    const route = ROUTES[family];
    const presence = (f:Family) => locations.find(p => p.family === f)?.presence;
    const anchored = route.find(f => presence(f) === "SURFACE_OR_MAIN");
    const nominated = anchored ?? route.find(f => presence(f) === "OTHER_HIDDEN_ONLY") ?? null;
    return {family, units:roleUnits[family], gapFromLargestUnits:highest-roleUnits[family], ruleRef:"E1-EOKBU-CAUSE-"+family,
      reviewedInOrder:route, nominatedFamily:nominated, reason:MECHANISM[family],
      selectionBasis:anchored ? "SURFACE_OR_MAIN_FIRST_OBSERVED" : nominated ? "OTHER_HIDDEN_ONLY_FALLBACK" : "NO_OBSERVED_ROUTE"};
  });
}

function rankSensitivity(strength:ProductStrengthAssessment, placements:readonly Placement[], leaders:readonly Family[]) {
  const applicable = !strength.specialReview && strength.grade !== "BORDERLINE";
  const probes = applicable ? EOKBU_METADATA.diagnosticTolerances.map(toleranceUnits => {
    const routes = eokbuCauseRoutes(strength.grade,strength.roleUnits,placements,toleranceUnits);
    const nominated = unique(routes.flatMap(c => c.nominatedFamily ? [c.nominatedFamily] : []));
    return {toleranceUnits, causeFamilies:routes.map(c => c.family), leadingFamilies:nominated,
      changesLeaderSet:nominated.length !== leaders.length || nominated.some(f=>!leaders.includes(f))};
  }) : [];
  const status = !applicable ? "NOT_APPLICABLE" : probes.some(p=>p.changesLeaderSet) ? "SENSITIVE_TO_POLICY" : "STABLE_IN_PROBES";
  return {dimension:"CAUSE_TOLERANCE_ONLY_FIXED_GRADE_AND_PLACEMENTS",status,probes};
}

function structuralDirections(pattern:NonNullable<ReturnType<typeof checkedSiblings>["pattern"]>, candidates:readonly Placement[]) {
  return pattern.patterns.filter(p=>p.assessment.status === "STRUCTURAL_CANDIDATE").flatMap(p=>
    p.monthMembers.flatMap(member=>candidates.map(candidate=>{
      const relation = fiveElementRelation(candidate.element,member.element);
      const potentialCounterDirection = relation === "DAY_MASTER_CONTROLS" ? "EOKBU_CONTROLS_PATTERN" :
        relation === "TARGET_CONTROLS_DAY_MASTER" ? "PATTERN_CONTROLS_EOKBU" : null;
      return {candidateFamily:candidate.family, candidateElement:candidate.element, patternType:p.patternType,
        basis:p.assessment.basis, monthStem:member.stem, patternElement:member.element, patternMemberRef:member.locationId,
        patternAssessmentRef:p.assessment.id, relation, operandOrder:"EOKBU_ELEMENT_TO_PATTERN_ELEMENT",
        potentialCounterDirection, actualEffect:"NOT_EVALUATED"};
    })));
}

function compareClimate(strength:ProductStrengthAssessment, climate:ReturnType<typeof checkedSiblings>["climate"],
  clock:ClockHold|undefined, leaders:readonly Family[], alternatives:readonly Placement[]) {
  const common = {purpose:"CLIMATE", decisionRef:climate?.decisionId ?? null, upstreamStatus:climate?.status ?? null,
    sourceRefs:climate?.sourceRefs ?? [], climateElements:climate?.candidateElements.map(c => c.element) ?? [],
    reasonCodes:climate?.reasonCodes ?? (clock ? [clock] : []), changesEokbuRank:false};
  if (!climate) return {...common,status:clock ? "CLOCK_POLICY_UNAVAILABLE" : "NOT_EVALUATED"};
  if (climate.status === "HOLD") return {...common,status:"CLIMATE_ON_HOLD"};
  if (!leaders.length) return {...common,status:"EOKBU_ON_HOLD"};
  const e = climate.candidateElements[0]?.element;
  requireValue(e && climate.candidateElements.length === 1, "E1_CLIMATE_POLICY_SHAPE");
  const relation = fiveElementRelation(strength.dayMaster.element,e);
  const reinforces = relation === "SAME" || relation === "TARGET_GENERATES_DAY_MASTER";
  const family = FAMILIES.find(f => DIRECTIONS[f] === relation)!;
  const status = (strength.grade === "STRONG") === reinforces ? "OPPOSING_BALANCE_DIRECTION" :
    leaders.includes(family) ? "SHARED_CANDIDATE" : alternatives.some(p => p.family === family && p.presence !== "ABSENT")
      ? "CLIMATE_MATCHES_OBSERVED_ALTERNATIVE" : "DIFFERENT_CANDIDATE_SAME_BALANCE_DIRECTION";
  return {...common,status, climateFamily:family, climateRelationToDayMaster:relation};
}

export function deriveEokbuCandidate(strength:ProductStrengthAssessment, options:Options) {
  requireValue(options?.profileId === EOKBU_POLICY_ID, "EXPLICIT_E1_EOKBU_POLICY_REQUIRED");
  requireValue(isIssuedProductStrength(strength), "ISSUED_E1_PRODUCT_STRENGTH_REQUIRED");
  const {climate, pattern} = checkedSiblings(strength,options.context);
  const placements = FAMILIES.map(family => placement(strength,family));
  const causes = strength.specialReview ? [] : eokbuCauseRoutes(strength.grade,strength.roleUnits,placements);
  const leaders = unique(causes.flatMap(c => c.nominatedFamily ? [c.nominatedFamily] : []));
  const reviewed = unique(causes.flatMap(c => c.reviewedInOrder));
  const candidates = leaders.map(f => placements.find(p => p.family === f)!);
  const alternatives = reviewed.filter(f => !leaders.includes(f)).map(f => placements.find(p => p.family === f)!);
  const holdReasons = strength.specialReview ? ["SPECIAL_STRUCTURE_REVIEW"] : strength.grade === "BORDERLINE" ?
    ["BORDERLINE_STRENGTH"] : !leaders.length ? ["NO_OBSERVED_ROUTE"] : [];
  const status = candidates.length === 0 ? "HOLD" as const : candidates.length === 1 ?
    "SINGLE_CANDIDATE" as const : "COMPETING_CANDIDATES" as const;
  const primary = candidates.length === 1 ? candidates[0]! : null;
  const opposingEvidence = candidates.flatMap(p => placements.filter(other => other.presence !== "ABSENT" &&
    (fiveElementRelation(p.element,other.element) === "TARGET_CONTROLS_DAY_MASTER" ||
      (causes.some(c => c.family === other.family) && fiveElementRelation(p.element,other.element) === "DAY_MASTER_GENERATES")))
    .map(other => ({candidateFamily:p.family, otherFamily:other.family, relation:fiveElementRelation(p.element,other.element),
      refs:[...other.surface,...other.hidden].map(l => l.factRef), effect:"NOT_EVALUATED"})));
  const patternHandoff = pattern ? {
    policyId:options.context!.innerPatterns!.profile.id, policyVersion:options.context!.innerPatterns!.profile.version,
    selectionRef:pattern.selection.id, primaryPattern:pattern.selection.primaryPattern,
    candidateTypes:pattern.selection.candidateTypes, unresolvedTypes:pattern.selection.unresolvedTypes, status:pattern.selection.status,
    competingExposures:pattern.monthBasis.competingExposures.map(x => ({hiddenRef:x.hidden.locationId,visibleRef:x.visible.locationId})),
    peerMain:pattern.selection.primaryPattern === null, directions:structuralDirections(pattern,candidates),
    formationEffect:"NOT_EVALUATED", usedForRanking:false,
  } : null;
  return freeze({schemaVersion:"engine-e1-eokbu-candidate-v1", policyId:EOKBU_POLICY_ID, policyVersion:EOKBU_VERSION, purpose:"EOKBU",
    policyAuthority:"PROJECT_POLICY", candidateRef:strength.candidateRef,
    strengthPolicy:{id:strength.policyId,version:strength.policyVersion}, inputGrade:strength.grade, status, primary, candidates,
    alternatives, causes, holdReasons, specialReview:strength.specialReview, strengthSensitivity:strength.sensitivity.status,
    candidateSensitivity:rankSensitivity(strength,placements,leaders),
    placements, opposingEvidence, relationEffects:"NOT_EVALUATED", competingConditions:strength.competingConditions,
    climateComparison:compareClimate(strength,climate,options.context?.climateUnavailableReason,leaders,alternatives),
    patternHandoff, purposeStatus:{patternUsefulness:"NOT_EVALUATED",bridgeUsefulness:"NOT_EVALUATED",finalUsefulGod:"NOT_EVALUATED"},
    decisionTrace:["ISSUED_STRENGTH","SPECIAL_AND_BORDERLINE_GATE","DOMINANT_SIDE_CAUSES","OBSERVED_ROUTE_PRIORITY","RETAIN_SHARED_NOMINATIONS","COMPARE_SEPARATE_PURPOSES"],
    factRefs:strength.factRefs, ruleRefs:["E1-EOKBU-DIRECTION-GATE",
      ...causes.map(c => c.ruleRef), ...holdReasons.map(r=>"E1-EOKBU-HOLD-"+r),
      ...(leaders.length?["E1-EOKBU-LOCATION-PRIORITY","E1-EOKBU-SYNTHESIS"]:[]),"E1-EOKBU-PURPOSE-SEPARATION"],
    sourceRefs:EOKBU_METADATA.sources.map(s => s.ref), limitations:LIMITATIONS});
}
export type EokbuAssessment = ReturnType<typeof deriveEokbuCandidate>;
