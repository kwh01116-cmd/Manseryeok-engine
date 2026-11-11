import { HEAVENLY_STEMS, STEM_NATURE, type FiveElement, type HeavenlyStem } from "../domain/stems.js";
import { EARTHLY_BRANCHES, type EarthlyBranch } from "../domain/branches.js";
import { MONTH_BOUNDARY_JIE, MONTH_BRANCH_BY_JIE, type MonthBoundaryJie } from "../calendar/monthPillar.js";
import { isGregorianMinute } from "../calendar/solarTermTimeline.js";
import { SOLAR_TERM_DEFINITIONS } from "../calendar/solarTerms.js";

export const M3_SEASONAL_POLICY_ID = "M3-SEASONAL-FOUR-SEASONS-EARTH-MONTHS-DEFERRED-V01" as const;
export const M3_SEASONAL_VERSION = "0.1.0" as const;
export const M3_SEASONAL_SCHEMA = "m3-seasonal-state-v1" as const;
export const M3_SEASONAL_RULE_ID = "M3-SEASONAL-FOUR-SEASONS-001" as const;
export const M3_SEASONAL_SCOPE_RULE_ID = "M3-SEASONAL-EARTH-MONTHS-DEFERRED-001" as const;
export const M3_SEASONAL_LIMIT_RULE_ID = "M3-SEASONAL-NOT-FINAL-STRENGTH-001" as const;

export type SeasonalState = "WANG" | "XIANG" | "XIU" | "QIU" | "SI";
export type FourSeason = "SPRING" | "SUMMER" | "AUTUMN" | "WINTER";
const WIKISOURCE = "TXT-SANMING-TONGHUI-V2-WIKISOURCE-SEASONAL";
const SHIDIAN = "TXT-SANMING-TONGHUI-SHIDIAN-SEASONAL";
const ZIPING = "TXT-ZIPING-ZHENQUAN-DONGLI-SEASONAL-LIMIT";
const IMPLEMENTATION = "IMPL-M3-SEASONAL-STATE-V1";
const LITERATURE_REFS = [WIKISOURCE, SHIDIAN, ZIPING] as const;
const RULE_REFS = [M3_SEASONAL_RULE_ID, M3_SEASONAL_SCOPE_RULE_ID, M3_SEASONAL_LIMIT_RULE_ID] as const;
const ELEMENTS = ["WOOD", "FIRE", "EARTH", "METAL", "WATER"] as const;
const ELEMENT_NAMES: Readonly<Record<FiveElement, string>> = { WOOD: "목", FIRE: "화", EARTH: "토", METAL: "금", WATER: "수" };
const ELEMENT_TOPICS: Readonly<Record<FiveElement, string>> = { WOOD: "목은", FIRE: "화는", EARTH: "토는", METAL: "금은", WATER: "수는" };
const SEASON_NAMES: Readonly<Record<FourSeason, string>> = { SPRING: "봄", SUMMER: "여름", AUTUMN: "가을", WINTER: "겨울" };
const STATE_NAMES: Readonly<Record<SeasonalState, { readonly korean: string; readonly hanja: string }>> = {
  WANG: { korean: "왕", hanja: "旺" }, XIANG: { korean: "상", hanja: "相" }, XIU: { korean: "휴", hanja: "休" },
  QIU: { korean: "수", hanja: "囚" }, SI: { korean: "사", hanja: "死" },
};

// The twenty transcribed/adopted cells are explicit data, not results derived from a relation helper.
const TABLE: Readonly<Record<FourSeason, Readonly<Record<FiveElement, SeasonalState>>>> = {
  SPRING: { WOOD: "WANG", FIRE: "XIANG", EARTH: "SI", METAL: "QIU", WATER: "XIU" },
  SUMMER: { WOOD: "XIU", FIRE: "WANG", EARTH: "XIANG", METAL: "SI", WATER: "QIU" },
  AUTUMN: { WOOD: "SI", FIRE: "QIU", EARTH: "XIU", METAL: "WANG", WATER: "XIANG" },
  WINTER: { WOOD: "XIANG", FIRE: "SI", EARTH: "QIU", METAL: "XIU", WATER: "WANG" },
};
const MONTH_SEASON: Readonly<Record<EarthlyBranch, FourSeason | null>> = {
  寅: "SPRING", 卯: "SPRING", 辰: null, 巳: "SUMMER", 午: "SUMMER", 未: null,
  申: "AUTUMN", 酉: "AUTUMN", 戌: null, 亥: "WINTER", 子: "WINTER", 丑: null,
};

function check(value: unknown, code: string): asserts value { if (!value) throw new RangeError(code); }
function jsonRecord(value: unknown): Record<string, unknown> {
  check(value !== null && typeof value === "object" && !Array.isArray(value), "SEASONAL_PLAIN_RECORD_REQUIRED");
  const proto = Object.getPrototypeOf(value);
  check(proto === Object.prototype || proto === null, "SEASONAL_PLAIN_RECORD_REQUIRED");
  return value as Record<string, unknown>;
}
const frozenData = new WeakSet<object>();
function freezeCopy<T>(value: T): T {
  if (value === null || typeof value !== "object") { check(typeof value !== "function", "SEASONAL_DATA_ONLY_REQUIRED"); return value; }
  if (frozenData.has(value)) return value;
  const record = Array.isArray(value) ? value : jsonRecord(value);
  const copy = Array.isArray(record) ? record.map(freezeCopy) : Object.fromEntries(Object.entries(record).map(([k, v]) => [k, freezeCopy(v)]));
  Object.freeze(copy); frozenData.add(copy); return copy as T;
}
function same(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (left === null || right === null || typeof left !== "object" || typeof right !== "object" || Array.isArray(left) !== Array.isArray(right)) return false;
  const a = Object.keys(left).sort(), b = Object.keys(right).sort();
  return a.length === b.length && a.every((k, i) => k === b[i] && same((left as Record<string, unknown>)[k], (right as Record<string, unknown>)[k]));
}
function references(value: unknown): readonly string[] {
  check(Array.isArray(value) && value.length > 0 && Array.from(value).every(v => typeof v === "string" && v.trim().length > 0) && new Set(value).size === value.length, "SEASONAL_NONEMPTY_UNIQUE_REFERENCES_REQUIRED");
  return value;
}

export const M3_SEASONAL_POLICY_METADATA = freezeCopy({
  id: M3_SEASONAL_POLICY_ID, version: M3_SEASONAL_VERSION, schemaVersion: M3_SEASONAL_SCHEMA,
  kind: "SELECTED_TRADITIONAL_SEASONAL_CLASSIFICATION", scope: "EIGHT_JIE_MONTH_BRANCHES_FOUR_EARTH_MONTHS_DEFERRED",
  monthInput: "EXISTING_CANDIDATE_SAJU_MONTH_BRANCH_NOT_GREGORIAN_OR_LUNAR_MONTH_NUMBER",
  monthSeasons: MONTH_SEASON, elementStates: TABLE, stateLabels: STATE_NAMES,
  rules: [
    { id: M3_SEASONAL_RULE_ID, runtimeVersion: M3_SEASONAL_VERSION, sourceRuleVersion: null, kind: "ENCODED_TRANSCRIBED_CLASSIFICATION", sourceIds: [WIKISOURCE, SHIDIAN], policyIds: [M3_SEASONAL_POLICY_ID] },
    { id: M3_SEASONAL_SCOPE_RULE_ID, runtimeVersion: M3_SEASONAL_VERSION, sourceRuleVersion: null, kind: "PROJECT_SUPPORTED_MONTH_SCOPE", sourceIds: [IMPLEMENTATION], policyIds: [M3_SEASONAL_POLICY_ID] },
    { id: M3_SEASONAL_LIMIT_RULE_ID, runtimeVersion: M3_SEASONAL_VERSION, sourceRuleVersion: null, kind: "INTERPRETATION_SCOPE_LIMIT_NOT_GLOBAL_STRENGTH", sourceIds: [ZIPING, IMPLEMENTATION], policyIds: [M3_SEASONAL_POLICY_ID] },
  ],
  sources: [
    { id: WIKISOURCE, kind: "CLASSICAL_TEXT_TRANSCRIPTION", title: "三命通會 卷二", section: "論五行旺相休囚死並寄生十二宮；論地支", url: "https://zh.wikisource.org/zh-hant/三命通會/卷二", revisionId: "2292392", revisionLastEdited: "2023-05-28T01:06", accessedOn: "2026-11-11", verification: "WEB_TRANSCRIPTION_BODY_READ_NOT_SCAN_OR_CRITICAL_EDITION", use: "TWENTY_SEASON_ELEMENT_CELLS_AND_MONTH_CONTEXT", nativeRuleVersion: null },
    { id: SHIDIAN, kind: "CLASSICAL_TEXT_TRANSCRIPTION", title: "三命通會", section: "論五行旺相休囚死並寄生十二宮", url: "https://www.shidianguji.com/zh/book/SK1610/chapter/1kf5v6ol1tqg5", accessedOn: "2026-11-11", verification: "WEB_TRANSCRIPTION_BODY_READ_NOT_INDEPENDENT_SCHOOL_OR_SCAN", nativeRuleVersion: null, variant: { location: "SUMMER_WATER", displayed: "水因", adopted: "水囚", adoptionBasis: "WIKISOURCE_TRANSCRIPTION_AND_EXPLICIT_POLICY_NOT_SILENT_REPAIR" } },
    { id: ZIPING, kind: "CLASSICAL_TEXT_TRANSCRIPTION", title: "子平真詮", section: "論十干得時不旺失時不弱", url: "https://www.donglishuzhai.net/chapter/3719.html", accessedOn: "2026-11-11", verification: "PRIMARY_PAGE_BODY_SEARCH_CACHE_READ_LIVE_ORIGIN_UNAVAILABLE", displayedLastUpdated: "2021-02-06 19:40:46", editorialNote: "據中州本", use: "LIMIT_SEASONAL_STATE_NOT_TOTAL_STRENGTH", nativeRuleVersion: null },
    { id: IMPLEMENTATION, kind: "PROJECT_IMPLEMENTATION_DEFINITION", implementationRef: "src/m3/seasonalStateV1.ts", use: "EIGHT_MONTH_SCOPE_FOUR_EARTH_MONTHS_DEFERRED_STATUS_AND_REFERENCE_CONTRACT", version: M3_SEASONAL_VERSION },
  ],
  excluded: ["FINAL_STRENGTH", "STRENGTH_SCORE", "WEIGHTS", "DE_LING_BINARY_LABEL", "COMMANDING_QI_DAYS", "EFFECTIVE_ROOT", "RELATION_EFFECT", "TRANSFORMATION", "GEJU", "YONGSHEN", "FORTUNE", "PREDICTION"],
  unchangedGate: "docs/research/M3_STRENGTH_GO_NOGO_DECISION_SPEC_20261018.md",
});

export interface SeasonalAppliedJie {
  readonly term: MonthBoundaryJie;
  readonly displayedDateTime: string;
  readonly timeBasis: "KST";
  readonly sourcePrecision: "MINUTE";
  readonly sourceIds: readonly string[];
  readonly koreanName?: string;
}
export interface SeasonalStateInput {
  readonly candidateRef: string;
  readonly dayMaster: HeavenlyStem;
  readonly monthBranch: EarthlyBranch;
  readonly evidenceRefs: readonly string[];
  readonly inputFactRefs: readonly string[];
  readonly pillarRefs: readonly string[];
  readonly calculationSourceRefs: readonly string[];
  readonly appliedJie: SeasonalAppliedJie;
}
const INPUT_KEYS = ["candidateRef", "dayMaster", "monthBranch", "evidenceRefs", "inputFactRefs", "pillarRefs", "calculationSourceRefs", "appliedJie"];
function checkedInput(input: SeasonalStateInput): SeasonalStateInput {
  const value = jsonRecord(input);
  check(Object.keys(value).length === INPUT_KEYS.length && INPUT_KEYS.every(key => Object.hasOwn(value, key)), "SEASONAL_MINIMAL_INPUT_CONTRACT_REQUIRED");
  const ref = value.candidateRef;
  check(typeof ref === "string" && /^chart\.candidates\[(?:0|1)\]$/.test(ref), "SEASONAL_CANDIDATE_REFERENCE_REQUIRED");
  check(HEAVENLY_STEMS.some(s => s === value.dayMaster), "SEASONAL_KNOWN_DAY_STEM_REQUIRED");
  check(EARTHLY_BRANCHES.some(b => b === value.monthBranch), "SEASONAL_KNOWN_MONTH_BRANCH_REQUIRED");
  const evidenceRefs = references(value.evidenceRefs), factRefs = references(value.inputFactRefs), pillars = references(value.pillarRefs), calculation = references(value.calculationSourceRefs);
  check(evidenceRefs.every(id => id.startsWith(ref + "#m3-evidence[") && /^\d+\]$/.test(id.slice((ref + "#m3-evidence[").length))), "SEASONAL_CROSS_CANDIDATE_EVIDENCE_REFERENCE");
  check(evidenceRefs.includes(ref + "#m3-evidence[0]"), "SEASONAL_MONTH_CONTEXT_EVIDENCE_REQUIRED");
  const allowedFacts = ["summary", "day-master", "month-nature", "month-hidden-stems"].map(s => ref + "#" + s);
  check(factRefs.every(id => allowedFacts.includes(id)) && allowedFacts.slice(0, 3).every(id => factRefs.includes(id)), "SEASONAL_MISSING_OR_FOREIGN_INPUT_FACT");
  check(pillars.every(id => ["year", "month", "day", "hour"].some(role => id === ref + "." + role)) && pillars.includes(ref + ".day") && pillars.includes(ref + ".month"), "SEASONAL_MISSING_OR_FOREIGN_PILLAR_REFERENCE");
  check(calculation.every(id => !LITERATURE_REFS.some(literature => literature === id) && id !== IMPLEMENTATION), "SEASONAL_CLASSICAL_AND_CALCULATION_SOURCE_MIXED");
  const active = jsonRecord(value.appliedJie);
  check(Object.keys(active).every(k => ["term", "displayedDateTime", "timeBasis", "sourcePrecision", "sourceIds", "koreanName"].includes(k)), "SEASONAL_APPLIED_JIE_SHAPE_REQUIRED");
  check(typeof active.term === "string" && (MONTH_BOUNDARY_JIE as readonly string[]).includes(active.term) && typeof active.displayedDateTime === "string" && isGregorianMinute(active.displayedDateTime) && active.timeBasis === "KST" && active.sourcePrecision === "MINUTE", "SEASONAL_APPLIED_JIE_REQUIRED");
  check(MONTH_BRANCH_BY_JIE[active.term as MonthBoundaryJie] === value.monthBranch, "SEASONAL_MONTH_AND_APPLIED_JIE_MISMATCH");
  check(references(active.sourceIds).every(id => calculation.includes(id)), "SEASONAL_MISSING_APPLIED_JIE_CALCULATION_SOURCE");
  if (Object.hasOwn(active, "koreanName")) check(active.koreanName === SOLAR_TERM_DEFINITIONS[active.term as MonthBoundaryJie].koreanName, "SEASONAL_APPLIED_JIE_NAME_MISMATCH");
  return freezeCopy(input);
}

const issued = new WeakSet<object>();
/** A pure policy lookup with structural reference checks; it does not authenticate an API response or external input. */
export function resolveSeasonalState(input: SeasonalStateInput, { policyId }: { readonly policyId: string } = { policyId: "" }) {
  check(policyId === M3_SEASONAL_POLICY_ID, "EXPLICIT_SUPPORTED_SEASONAL_POLICY_REQUIRED");
  const original = checkedInput(input), dayMasterElement = STEM_NATURE[original.dayMaster].element;
  const season = MONTH_SEASON[original.monthBranch];
  const elementStates = season === null ? null : TABLE[season];
  const result = freezeCopy({
    schemaVersion: M3_SEASONAL_SCHEMA, resolverVersion: M3_SEASONAL_VERSION,
    id: original.candidateRef + "#m3-seasonal-state", candidateRef: original.candidateRef,
    status: season === null ? "POLICY_UNRESOLVED" as const : "RESOLVED_UNDER_POLICY" as const,
    reason: season === null ? "EARTH_MONTH_POLICY_NOT_SELECTED" as const : null,
    input: original, dayMaster: original.dayMaster, dayMasterElement, monthBranch: original.monthBranch,
    appliedJie: original.appliedJie, season, elementStates,
    seasonalState: elementStates === null ? null : elementStates[dayMasterElement],
    policy: M3_SEASONAL_POLICY_METADATA, policyRefs: [M3_SEASONAL_POLICY_ID], ruleRefs: RULE_REFS,
    inputEvidenceRefs: original.evidenceRefs, inputFactRefs: original.inputFactRefs, pillarRefs: original.pillarRefs,
    sourceRefs: [...LITERATURE_REFS, IMPLEMENTATION], literatureSourceRefs: LITERATURE_REFS, implementationSourceRefs: [IMPLEMENTATION], calculationSourceRefs: original.calculationSourceRefs,
    scope: "TRADITIONAL_MONTH_BRANCH_SEASONAL_CLASSIFICATION_ONLY",
    finalStrength: { status: "NOT_IMPLEMENTED", releaseGate: "M3_FINAL_BLOCKED_UNCHANGED" },
    unresolved: ["COMMANDING_QI_DAYS", "EFFECTIVE_ROOT", "RELATION_EFFECT", "FINAL_STRENGTH"],
    validation: { level: "REFERENCE_SHAPE_AND_INPUT_VALUE_CONSISTENCY_ONLY", inputAuthentication: "NOT_PERFORMED_BY_PURE_MODULE", predictiveValidity: "NOT_CLAIMED", editionOrRightsApproval: false, g0Receipt: null, g1P2Promotion: false },
  });
  issued.add(result);
  return result;
}
export type SeasonalStateResult = ReturnType<typeof resolveSeasonalState>;
export function validateSeasonalState(value: SeasonalStateResult): true {
  check(value !== null && typeof value === "object" && issued.has(value) && Object.isFrozen(value), "ISSUED_IMMUTABLE_SEASONAL_STATE_REQUIRED");
  return true;
}

function stateText(state: SeasonalState): string { const label = STATE_NAMES[state]; return label.korean + "(" + label.hanja + ")"; }
function explanationContent(result: SeasonalStateResult) {
  validateSeasonalState(result);
  const summary = result.status === "POLICY_UNRESOLVED"
    ? `이 후보의 월지는 ${result.monthBranch}입니다. 현재 정책은 계절말 월의 토왕·사령 범위를 선택하지 않아 계절 상태를 보류합니다. 명식과 나머지 구조적 근거는 유지됩니다.`
    : `선택한 계절 분류 정책에서 ${result.monthBranch}월은 ${SEASON_NAMES[result.season!]} 구간입니다. 일간 ${result.dayMaster}의 오행인 ${ELEMENT_TOPICS[result.dayMasterElement]} ${stateText(result.seasonalState!)}${result.seasonalState === "WANG" || result.seasonalState === "XIANG" ? "으로" : "로"} 분류됩니다.`;
  const item = (suffix: string, templateId: string, text: string) => ({
    id: result.candidateRef + "#m3-seasonal-explanation[" + suffix + "]", candidateRef: result.candidateRef,
    templateId, templateVersion: M3_SEASONAL_VERSION, judgmentRefs: [result.id],
    inputEvidenceRefs: result.inputEvidenceRefs, inputFactRefs: result.inputFactRefs, pillarRefs: result.pillarRefs,
    policyRefs: result.policyRefs, ruleRefs: result.ruleRefs, literatureSourceRefs: result.literatureSourceRefs,
    implementationSourceRefs: result.implementationSourceRefs, calculationSourceRefs: result.calculationSourceRefs, text,
  });
  const items = [item("0", result.status === "POLICY_UNRESOLVED" ? "KO_M3_SEASONAL_EARTH_MONTH_DEFERRED" : "KO_M3_SEASONAL_DAY_MASTER", summary)];
  if (result.elementStates !== null) items.push(item("1", "KO_M3_SEASONAL_FIVE_ELEMENTS", "같은 계절 표의 오행별 분류: " + ELEMENTS.map(element => ELEMENT_NAMES[element] + " " + stateText(result.elementStates![element])).join(" · ") + "."));
  return {
    schemaVersion: "ko-m3-seasonal-state-templates-v1", templateVersion: M3_SEASONAL_VERSION,
    id: result.candidateRef + "#m3-seasonal-explanation", templateId: "KO_M3_SEASONAL_RESULT",
    title: "월령의 계절 분류", candidateRef: result.candidateRef, judgmentRef: result.id, status: result.status,
    text: items.map(value => value.text).join("\n"), evidenceRefs: result.inputEvidenceRefs, inputFactRefs: result.inputFactRefs,
    policyRefs: result.policyRefs, ruleRefs: result.ruleRefs, sourceRefs: [...result.literatureSourceRefs, ...result.implementationSourceRefs],
    calculationSourceRefs: result.calculationSourceRefs,
    scopeNote: "왕·상·휴·수·사는 선택한 전통 정책의 계절 분류 이름입니다. 이 계절 상태는 전체 명식의 신강 판정이 아니며 점수·득령 이진 판정·사령·유효 통근·관계 효력·길흉을 산출하지 않습니다.",
    items,
  };
}
export function explainSeasonalState(result: SeasonalStateResult) { return freezeCopy(explanationContent(result)); }
export function validateSeasonalStateExplanation(explanation: unknown, result: SeasonalStateResult): true {
  validateSeasonalState(result);
  check(same(explanation, explanationContent(result)), "SEASONAL_EXPLANATION_CONTENT_OR_REFERENCES_CHANGED");
  return true;
}
