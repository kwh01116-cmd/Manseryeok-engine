/** Consumer evidence/claim composition only. No birth calculation or new divination rule. */
import { HEAVENLY_STEMS, FIVE_ELEMENTS, STEM_NATURE, type HeavenlyStem } from "../domain/stems.js";
import { EARTHLY_BRANCHES } from "../domain/branches.js";
import { TEN_GODS } from "../domain/tenGods.js";

export const CONSUMER_REPORT_PROFILE_ID = "SAJU-CONSUMER-EVIDENCE-REPORT-V01" as const;
export const CONSUMER_REPORT_VERSION = "0.1.0" as const;
export const REPORT_SCHEMA = "saju-consumer-report-evidence-v1" as const;
export const REPORT_INPUT_SCHEMA = "saju-consumer-report-input-v1" as const;
export const REPORT_STATES = ["SUPPORTED", "LIMITED", "HOLD", "UNSUPPORTED", "NEEDS_DATA", "POLICY_UNRESOLVED"] as const;
export type ReportState = typeof REPORT_STATES[number];
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type RecordValue = { [key: string]: Json };
export type EvidenceLayer = "CALCULATION_FACT" | "TRADITIONAL_CLASSIFICATION" | "POLICY_ASSESSMENT";
export interface EvidenceNode {
  id: string; candidateId: string | null; layer: EvidenceLayer; status: ReportState;
  upstreamPath: string; upstreamFactRefs: string[]; policyId: string; policyVersion: string | null;
  sourceRefs: string[]; ruleRefs: string[]; value: RecordValue;
}
/** Values refer to existing judgments, not independently recomputed astrological facts. */
export interface CandidateProjection {
  id: string; ordinal: number;
  refs: { chart: string; day: string; pillars: string; pattern: string; seasonal: string; root: string;
    m5: string; relations: string; strength: string; gongmang: string; luck: string };
}
export interface ReportProjection {
  schemaVersion: typeof REPORT_INPUT_SCHEMA; contextId: string; calculationStatus: string;
  inputContext: RecordValue;
  provenance: { upstreamSchema: string; upstreamProfileId: string; upstreamProfileVersion: string;
    dataVersion: string; dataFingerprint: string; sourceDigest: string; validationScope: string;
    policies: { id: string; version: string | null }[]; rules: { id: string; version: string | null }[];
    sourceRefs: { id: string; kind: string; title: string | null; url: string | null; verification: string | null }[] };
  candidates: CandidateProjection[]; evidence: EvidenceNode[];
  temporalRef: string;
  blockers: { code: string; status: ReportState; requiredInformation: string | null }[];
}
export interface InterpretationClaim {
  claimId: string; candidateId: string | null; status: ReportState;
  kind: "FACT_READING" | "STRUCTURAL_READING" | "POLICY_READING" | "LIMITATION" | "REFLECTION_QUESTION";
  factRefs: string[]; policyId: string; policyVersion: string;
  evidenceLayers: EvidenceLayer[]; inputPolicyRefs: { id: string; version: string | null }[]; sourceRefs: string[];
  scope: string; uncertainty: string[]; text: string; detailRefs: string[]; templateId: string;
}
export interface NarrativeSection {
  id: string; chapter: number; title: string; status: ReportState; claimIds: string[];
  accessHypothesis: "FREE_PREVIEW" | "PAID_PRODUCT_CANDIDATE"; notImplementedTopics: string[];
}
export interface ConsumerReport {
  schemaVersion: typeof REPORT_SCHEMA; profile: { id: typeof CONSUMER_REPORT_PROFILE_ID; version: typeof CONSUMER_REPORT_VERSION };
  contextId: string; inputContext: RecordValue; calculationStatus: string;
  calculationFacts: EvidenceNode[]; traditionalClassifications: EvidenceNode[]; policyAssessments: EvidenceNode[];
  candidateContexts: CandidateProjection[]; interpretationClaims: InterpretationClaim[];
  narrativeSections: NarrativeSection[]; unsupportedOrHeldClaims: { topic: string; status: ReportState; reason: string; sprint: string }[];
  eligibility: { status: "FULLY_PROVIDABLE" | "LIMITED_PROVIDABLE" | "NEEDS_ADDITIONAL_INFORMATION" | "NOT_PROVIDABLE";
    fullPaidReport: false; paymentGate: "NO_GO_PROTOTYPE_NOT_FOR_SALE"; reasons: string[];
    chapters: { chapter: number; status: ReportState }[]; requiredInformation: string[] };
  provenance: ReportProjection["provenance"];
  limitations: string[];
}

// Projection value contract (adapter-owned, all values from the same issued server result):
// chart:{pillars:[{role,stem,branch,hangul}],boundarySide,activeSince:{koreanName,displayedDateTime}}
// day:{stem,element,polarity}; pillars:{items:[existing M2 pillars]}
// pattern:{status,primaryPattern,candidateTypes,unresolvedTypes,main:{stem,tenGod},exposures:[{stem,role,type}]}
// seasonal:{status,alternatives:[{id,season,seasonalState}],reason}; root:{presence,locations:[{role,branch,hiddenStem,matchType}],surfaceSupport:[{role,stem,tenGod,presence}]}
// m5:{status,reasonCodes,candidateElements:[element],fireLocations:[{role,stem,locationKind}],execution}
// relations:{pairs:[{kind,leftRole,rightRole,leftBranch,rightBranch}],triads:[existing membership]}
// strength:{pathStatuses:[string],resolvedWeakPaths:number}; gongmang:{voidBranches:[branch],matches:[{role,branch}]}
// luck:{status,requested,firstNominalStart,selectedPillar,firstPillars:[string],seyun:[{yearLabel,pillar}],reasons:[string]}
// global temporal:{monthlyStatus,year,completeIntervals,missingIntervals,queryPillars:[string],queryStatus,rows:[{ordinal,pillar,status,start,end}]}

const ROLES = ["year", "month", "day", "hour"] as const;
const ROLE: Record<string, string> = { year: "연", month: "월", day: "일", hour: "시" };
const ELEMENT: Record<string, string> = { WOOD: "목(木)", FIRE: "화(火)", EARTH: "토(土)", METAL: "금(金)", WATER: "수(水)" };
const GOD: Record<string, string> = { 比肩: "비견", 劫財: "겁재", 食神: "식신", 傷官: "상관", 偏財: "편재", 正財: "정재", 七殺: "칠살", 正官: "정관", 偏印: "편인", 正印: "정인" };
const SEASON: Record<string, string> = { SPRING: "봄", SUMMER: "여름", AUTUMN: "가을", WINTER: "겨울", EARTH: "토왕", EARTH_DOMINANT: "토왕" };
const STATE: Record<string, string> = { WANG: "왕(旺)", XIANG: "상(相)", XIU: "휴(休)", QIU: "수(囚)", SI: "사(死)", 旺: "왕(旺)", 相: "상(相)", 休: "휴(休)", 囚: "수(囚)", 死: "사(死)" };
const RELATION: Record<string, string> = { LIUHE: "합", LIUCHONG: "충", XING: "형", LIUHAI: "해", LIUPO: "파" };
const contexts = new WeakMap<object, ReportProjection>();
function check(ok: unknown, code: string): asserts ok { if (!ok) throw new RangeError(code); }
function jsonTree(value: unknown, seen = new Set<object>()): void {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") { check(Number.isFinite(value), "REPORT_FINITE_NUMBER"); return; }
  check(typeof value === "object", "REPORT_JSON_DATA_REQUIRED");
  const object = value as object; check(!seen.has(object), "REPORT_ACYCLIC_DATA_REQUIRED"); seen.add(object);
  if (Array.isArray(value)) {
    check(Object.keys(value).length === value.length && Array.from({ length: value.length }, (_, i) => Object.hasOwn(value, i)).every(Boolean), "REPORT_DENSE_ARRAY_REQUIRED");
  } else check([Object.prototype, null].includes(Object.getPrototypeOf(value)), "REPORT_PLAIN_OBJECT_REQUIRED");
  for (const key of Reflect.ownKeys(object)) {
    if (Array.isArray(value) && key === "length") continue;
    const d = Object.getOwnPropertyDescriptor(object, key)!;
    check(typeof key === "string" && d.enumerable && "value" in d, "REPORT_DATA_PROPERTIES_ONLY"); jsonTree(d.value, seen);
  }
  seen.delete(object);
}
function freeze<T>(value: T): T { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
function canonical(value: unknown): string { if (value === null || typeof value !== "object") return JSON.stringify(value); if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]"; return "{" + Object.keys(value).sort().map(k => JSON.stringify(k) + ":" + canonical((value as Record<string, unknown>)[k])).join(",") + "}"; }
const list = (value: Json | undefined): RecordValue[] => { check(Array.isArray(value), "REPORT_LIST_VALUE_REQUIRED"); return value as RecordValue[]; };
const strings = (value: Json | undefined): string[] => { check(Array.isArray(value) && value.every(v => typeof v === "string"), "REPORT_STRING_LIST_REQUIRED"); return value as string[]; };
const str = (value: Json | undefined): string => { check(typeof value === "string", "REPORT_STRING_VALUE_REQUIRED"); return value; };
const unique = <T>(values: T[]) => [...new Set(values)];
const god = (value: Json | undefined) => GOD[str(value)] ?? str(value);
const role = (value: Json | undefined) => ROLE[str(value)] ?? str(value);

export function validateReportProjection(input: ReportProjection): true {
  jsonTree(input); check(input.schemaVersion === REPORT_INPUT_SCHEMA && /^[a-f0-9]{64}$/.test(input.contextId), "REPORT_INPUT_CONTEXT_REQUIRED");
  check(/^[a-f0-9]{64}$/.test(input.provenance.sourceDigest) && input.provenance.dataFingerprint.length > 0, "REPORT_PROVENANCE_REQUIRED");
  const sources = new Set(input.provenance.sourceRefs.map(r => r.id)), rules = new Set(input.provenance.rules.map(r => r.id));
  check(sources.size === input.provenance.sourceRefs.length && rules.size === input.provenance.rules.length, "REPORT_DUPLICATE_REGISTRY");
  check(unique(input.provenance.policies.map(p => p.id + "@" + p.version)).length === input.provenance.policies.length, "REPORT_DUPLICATE_POLICY_REGISTRY");
  const nodes = new Map(input.evidence.map(n => [n.id, n])); check(nodes.size === input.evidence.length, "REPORT_DUPLICATE_EVIDENCE");
  const candidates = new Set(input.candidates.map(c => c.id)); check(candidates.size === input.candidates.length, "REPORT_DUPLICATE_CANDIDATE");
  for (const n of nodes.values()) {
    check(n.id.startsWith(input.contextId) && (n.candidateId === null || candidates.has(n.candidateId)), "REPORT_EVIDENCE_CONTEXT_MISMATCH");
    check(["CALCULATION_FACT", "TRADITIONAL_CLASSIFICATION", "POLICY_ASSESSMENT"].includes(n.layer) && (REPORT_STATES as readonly string[]).includes(n.status), "REPORT_EVIDENCE_KIND_OR_STATE");
    check(n.upstreamPath.length > 0 && n.policyId.length > 0 && input.provenance.policies.some(p => p.id === n.policyId && p.version === n.policyVersion), "REPORT_POLICY_REFERENCE_MISSING");
    if (n.candidateId !== null) check(n.upstreamFactRefs.length > 0 && n.sourceRefs.length > 0 && n.ruleRefs.length > 0, "REPORT_PARENT_EVIDENCE_REFERENCES_REQUIRED");
    check(unique(n.upstreamFactRefs).length === n.upstreamFactRefs.length, "REPORT_DUPLICATE_UPSTREAM_FACT_REFERENCE");
    check(unique(n.sourceRefs).length === n.sourceRefs.length && n.sourceRefs.every(s => sources.has(s)), "REPORT_SOURCE_REFERENCE_MISSING");
    check(unique(n.ruleRefs).length === n.ruleRefs.length && n.ruleRefs.every(r => rules.has(r)), "REPORT_RULE_REFERENCE_MISSING");
  }
  check(nodes.get(input.temporalRef)?.candidateId === null, "REPORT_TEMPORAL_REFERENCE_REQUIRED");
  check((input.calculationStatus === "CALCULATED_UNDER_SELECTED_POLICIES") === (input.candidates.length > 0), "REPORT_CALCULATION_CANDIDATE_STATE");
  input.candidates.forEach((c, i) => {
    check(c.ordinal === i + 1 && Object.keys(c.refs).length === 11, "REPORT_CANDIDATE_REFERENCE_SET");
    for (const id of Object.values(c.refs)) check(nodes.get(id)?.candidateId === c.id, "REPORT_CROSS_CANDIDATE_REFERENCE");
    check(unique(Object.values(c.refs)).length === 11, "REPORT_DUPLICATE_CANDIDATE_REFERENCE");
    const chart = nodes.get(c.refs.chart)!.value, day = nodes.get(c.refs.day)!.value;
    const pillars = list(chart.pillars); check(pillars.length === 4 && pillars.every((p, n) => p.role === ROLES[n] && (HEAVENLY_STEMS as readonly Json[]).includes(p.stem!) && (EARTHLY_BRANCHES as readonly Json[]).includes(p.branch!)), "REPORT_FOUR_PILLARS_REQUIRED");
    check(day.stem === pillars[2]!.stem && (FIVE_ELEMENTS as readonly Json[]).includes(day.element!) && STEM_NATURE[day.stem as HeavenlyStem].element === day.element, "REPORT_DAY_MASTER_CONTEXT_MISMATCH");
    const detail = list(nodes.get(c.refs.pillars)!.value.items); check(detail.length === 4 && detail.every((p, n) => p.role === pillars[n]!.role && p.stem === pillars[n]!.stem && p.branch === pillars[n]!.branch), "REPORT_PILLAR_DETAILS_CONTEXT_MISMATCH");
    const pattern = nodes.get(c.refs.pattern)!.value;
    check(pattern.primaryPattern === null || (TEN_GODS as readonly Json[]).filter(t => t !== "比肩" && t !== "劫財").includes(pattern.primaryPattern!), "REPORT_PATTERN_CLASSIFICATION_REQUIRED");
    const monthMembers = list((detail[1]!.branchTenGods as RecordValue).members), main = pattern.main as RecordValue;
    check(monthMembers.some(m => m.position === "MAIN_QI" && m.stem === main.stem && m.tenGod === main.tenGod), "REPORT_MONTH_MAIN_CONTEXT_MISMATCH");
    check(pattern.primaryPattern === null || pattern.primaryPattern === main.tenGod, "REPORT_PRIMARY_PATTERN_CONTEXT_MISMATCH");
    for (const exposure of [...list(pattern.exposures), ...list(pattern.competingExposures ?? [])]) check(exposure.role !== "day" && detail.some(p => p.role === exposure.role && p.stem === exposure.stem && p.visibleTenGod === exposure.type) && monthMembers.some(m => m.stem === exposure.stem && m.tenGod === exposure.type), "REPORT_EXACT_EXPOSURE_CONTEXT_MISMATCH");
    const root = nodes.get(c.refs.root)!.value;
    check(["PRESENT_UNDER_POLICY", "ABSENT_UNDER_POLICY"].includes(str(root.presence)), "REPORT_ROOT_PRESENCE_REQUIRED");
    check((root.presence === "PRESENT_UNDER_POLICY") === (list(root.locations).length > 0), "REPORT_ROOT_LOCATION_PRESENCE_MISMATCH");
    for (const l of list(root.locations)) {
      const p = detail.find(p => p.role === l.role && p.branch === l.branch);
      check(p && list((p.branchTenGods as RecordValue).members).some(m => m.stem === l.hiddenStem), "REPORT_ROOT_MEMBER_CONTEXT_MISMATCH");
      check((HEAVENLY_STEMS as readonly Json[]).includes(l.hiddenStem!) && STEM_NATURE[l.hiddenStem as HeavenlyStem].element === day.element && l.matchType === (l.hiddenStem === day.stem ? "EXACT_STEM" : "SAME_ELEMENT_DIFFERENT_STEM"), "REPORT_ROOT_MATCH_CONTEXT_MISMATCH");
    }
    const m5 = nodes.get(c.refs.m5)!.value;
    check(m5.status !== "CANDIDATE_UNDER_POLICY" || (canonical(m5.candidateElements) === '["FIRE"]' && m5.execution === "EXECUTED_EXISTING_LIMITED_POLICY"), "REPORT_M5_EXECUTION_REQUIRED");
    if (m5.status === "CANDIDATE_UNDER_POLICY") {
      check(["甲", "乙"].includes(str(day.stem)) && ["亥", "子"].includes(str(pillars[1]!.branch)) && list(m5.fireLocations).length === 0, "REPORT_M5_CANDIDATE_CONTRADICTION");
      const actualFire = detail.some(p => STEM_NATURE[p.stem as HeavenlyStem].element === "FIRE" || list((p.branchTenGods as RecordValue).members).some(m => STEM_NATURE[m.stem as HeavenlyStem].element === "FIRE"));
      check(!actualFire, "REPORT_M5_CANDIDATE_CONTRADICTION");
    } else check(strings(m5.candidateElements).length === 0, "REPORT_HELD_M5_HAS_NO_ADOPTED_CANDIDATE");
  });
  return true;
}

function compose(input: ReportProjection): ConsumerReport {
  validateReportProjection(input);
  const projection: ReportProjection = structuredClone(input), byId = new Map(projection.evidence.map(n => [n.id, n]));
  const claims: InterpretationClaim[] = [], sections: NarrativeSection[] = ["나의 사주를 이해하기", "나를 설명하는 명식의 구조", "성향과 행동의 해석", "관계·일·재물의 해석 관점", "시간의 흐름", "종합 리포트"].map((title, i) => ({ id: projection.contextId + "/chapter/" + (i + 1), chapter: i + 1, title, status: (i === 2 || i === 3 ? "HOLD" : "LIMITED") as ReportState, claimIds: [], accessHypothesis: i === 0 ? "FREE_PREVIEW" : "PAID_PRODUCT_CANDIDATE", notImplementedTopics: i === 2 ? ["PERSONALITY", "BEHAVIOR"] : i === 3 ? ["RELATIONSHIP", "CAREER", "WEALTH_ATTITUDE"] : [] }));
  const add = (chapter: number, key: string, text: string, refs: string[], candidateId: string | null, status: ReportState = "LIMITED", kind: InterpretationClaim["kind"] = "STRUCTURAL_READING", uncertainty: string[] = []) => {
    check(refs.length > 0 && unique(refs).length === refs.length, "REPORT_CLAIM_EVIDENCE_REQUIRED");
    for (const id of refs) check(byId.has(id) && (byId.get(id)!.candidateId === null || byId.get(id)!.candidateId === candidateId), "REPORT_CLAIM_CROSS_CANDIDATE");
    const id = projection.contextId + "/" + (candidateId ?? "common") + "/" + key;
    const inputPolicyRefs = unique(refs.map(r => byId.get(r)!.policyId + "@" + byId.get(r)!.policyVersion)).map(key => { const n = refs.map(r => byId.get(r)!).find(n => n.policyId + "@" + n.policyVersion === key)!; return { id: n.policyId, version: n.policyVersion }; });
    const claim: InterpretationClaim = { claimId: id, candidateId, status, kind, factRefs: refs, policyId: CONSUMER_REPORT_PROFILE_ID, policyVersion: CONSUMER_REPORT_VERSION,
      evidenceLayers: unique(refs.map(r => byId.get(r)!.layer)), inputPolicyRefs, sourceRefs: unique(refs.flatMap(r => byId.get(r)!.sourceRefs)),
      scope: "EXISTING_FACTS_AND_SELECTED_CLASSIFICATIONS_READ_TOGETHER_NOT_PERSONAL_TRAIT_OR_EVENT", uncertainty: unique([...uncertainty, ...refs.filter(r => byId.get(r)!.status !== "SUPPORTED").map(r => byId.get(r)!.status), ...(kind === "STRUCTURAL_READING" || kind === "POLICY_READING" ? ["ACTUAL_EFFICACY_NOT_EVALUATED"] : [])]), text, detailRefs: refs.map(r => byId.get(r)!.upstreamPath), templateId: key };
    claims.push(claim); sections[chapter - 1]!.claimIds.push(id); return claim;
  };
  const global = projection.temporalRef;
  if (!projection.candidates.length) {
    const status = projection.calculationStatus;
    const message = status === "NONEXISTENT_TIME" ? "입력한 시각은 서머타임 시작으로 건너뛴 시간입니다. 이 시각의 사주를 정상 명식으로 만들 수 없습니다." : status === "AMBIGUOUS_TIME" ? "입력한 시각은 시계가 되돌아가 두 번 존재합니다. 어느 시간 대응인지 확인하기 전에는 한 명식으로 정할 수 없습니다." : status === "NEEDS_BIRTH_TIME" ? "출생 시각이 알려지지 않아 네 기둥 리포트를 아직 만들 수 없습니다. 임의의 자정이나 정오를 넣어 이야기를 만들지 않습니다." : status === "NEEDS_DATA" ? "이 입력에 필요한 달력 자료가 확보되지 않아 명식을 만들지 못했습니다. 자료 부족은 사주의 특징이나 부정적인 판단이 아닙니다." : "선택한 시계·출생 범위에서 이 입력의 명식을 제공할 수 없습니다. 지원 프로필을 확인해야 합니다.";
    add(1, "input-hold", message, [global], null, status === "NEEDS_DATA" ? "NEEDS_DATA" : status === "POLICY_UNRESOLVED" ? "POLICY_UNRESOLVED" : "HOLD", "LIMITATION");
  }
  for (const c of projection.candidates) {
    const v = (key: keyof CandidateProjection["refs"]) => byId.get(c.refs[key])!.value;
    const chart = v("chart"), day = v("day"), pattern = v("pattern"), season = v("seasonal"), root = v("root"), m5 = v("m5");
    const pillars = list(chart.pillars), details = list(v("pillars").items), main = pattern.main as RecordValue;
    const prefix = projection.candidates.length > 1 ? `후보 ${c.ordinal}: ` : "";
    const exposures = list(pattern.exposures), alternatives = list(season.alternatives), fire = list(m5.fireLocations);
    const primary = pattern.primaryPattern, others = strings(pattern.candidateTypes).filter(t => t !== primary);
    const competition = /COMPETING|UNRESOLVED/.test(str(pattern.status)), competing = list(pattern.competingExposures ?? []);
    let lead: string;
    if (m5.status === "CANDIDATE_UNDER_POLICY") lead = `이 명식은 겨울의 ${day.stem} 일간을 읽을 때, 원국에서 화가 보이지 않는다는 점이 먼저 눈에 들어옵니다. 선택한 온기 검토 규칙은 ${ELEMENT.FIRE}를 검토 후보로 남깁니다.`;
    else if (m5.execution === "EXECUTED_EXISTING_LIMITED_POLICY" && strings(m5.reasonCodes).some(r => /FIRE_PRESENT|PRESENT_FIRE|WARMING.*PRESENT/.test(r)) || m5.execution === "EXECUTED_EXISTING_LIMITED_POLICY" && fire.length > 0 && ["甲", "乙"].includes(str(day.stem)) && ["亥", "子"].includes(str(pillars[1]!.branch))) lead = `겨울의 ${day.stem} 일간이지만, ${fire.map(f => `${role(f.role)}${f.locationKind === "VISIBLE_STEM" ? "간" : "지 장간"} ${f.stem}`).join("·")}에서 화가 확인됩니다. 같은 겨울 목이라도 '화가 보이지 않는다'는 후보 조건과는 다릅니다. 지금은 도움 요소의 충분성을 보류합니다.`;
    else if (primary !== null) lead = `이 명식은 ${god(primary)} 분류가 월령의 중심에서 확인됩니다. ${exposures.some(e => e.type === primary) ? "그 기준이 표면 천간에도 같은 글자로 드러나, 월령 안의 구성과 겉으로 보이는 배치를 연결해 읽을 수 있습니다." : "월령 안에 있는 기준과 표면에 드러난 천간을 구분해 읽는 것이 출발점입니다."}${competition || others.length ? " 다른 장간의 투출이나 경쟁 조건도 있어 단독 선정은 보류합니다." : ""}`;
    else lead = `이 명식은 월령의 중심이 ${god(main.tenGod)}입니다. 현재 여덟 내격에 억지로 넣기보다, 월령의 구성과 겉으로 드러난 십성을 나누어 읽겠습니다.`;
    add(1, "lead", prefix + lead, [c.refs.day, c.refs.pattern, c.refs.m5, c.refs.pillars], c.id);
    add(1, "pillars", prefix + pillars.map(p => `${role(p.role)}주 ${p.stem}${p.branch}${p.hangul ? "(" + p.hangul + ")" : ""}`).join(" · ") + `입니다. 일간은 태어난 날의 천간으로, 이 명식의 ${day.stem}에 해당합니다. 오행은 ${ELEMENT[str(day.element)]}이며, 이 일간을 기준으로 다른 천간의 관계인 십성을 분류합니다.`, [c.refs.chart, c.refs.day], c.id, "SUPPORTED", "FACT_READING");
    const active = chart.activeSince as RecordValue | null;
    add(1, "month-context", `월령은 사주에서 출생 계절의 기준이 되는 월 구간입니다. 이 후보의 월지는 ${pillars[1]!.branch}이며${active?.koreanName ? ", " + active.koreanName + "의 발표 시각 " + str(active.displayedDateTime).replace("T", " ") + "을 적용했습니다" : " 기존 절입 계산에 연결됩니다"}.`, [c.refs.chart, c.refs.pattern], c.id, "SUPPORTED", "FACT_READING");
    const primaryExposure = exposures.filter(e => e.type === primary);
    const structure = primary === null ? `월령 본기는 ${god(main.tenGod)}입니다. 따라서 여덟 내격의 대표 후보를 정하지 않습니다.` : `월지 ${pillars[1]!.branch}의 중심 장간은 ${main.stem}입니다. 일간 기준 분류는 ${god(primary)}입니다. ${primaryExposure.length ? primaryExposure.map(e => `${role(e.role)}간 ${e.stem}`).join("·") + "에서도 정확히 같은 천간이 드러납니다. 이것이 이 후보를 검토하는 연결 근거입니다." : "표면에서의 정확한 투출과 월령 안의 존재는 같은 조건이 아닙니다."}`;
    add(2, "pattern", prefix + structure + (others.length ? ` 함께 검토하는 분류는 ${others.map(t => GOD[t] ?? t).join("·")}입니다.` : "") + (competition ? ` ${competing.length ? competing.map(e => `${role(e.role)}간 ${e.stem}의 ${god(e.type)} 투출`).join("·") + "도 겹쳐" : "기존 선정 규칙의 경쟁·미정 조건 때문에"} 단독 격 선정은 보류합니다. 여덟 내격 밖의 분류를 새 격 후보로 추가하지는 않습니다.` : ""), [c.refs.pattern, c.refs.pillars], c.id);
    const visible = details.filter(p => p.role !== "day").map(p => `${role(p.role)}간 ${p.stem}의 ${god(p.visibleTenGod)}`);
    const visibleGods = details.filter(p => p.role !== "day").map(p => p.visibleTenGod);
    const hidden: RecordValue[] = details.flatMap(p => list((p.branchTenGods as RecordValue).members).map((m): RecordValue => ({ role: p.role!, ...m })));
    const hiddenOnly = unique(hidden.filter(h => !visibleGods.includes(h.tenGod!)).map(h => god(h.tenGod)));
    add(2, "visible-hidden", `일간을 제외한 연·월·시의 표면 천간 분류: ${visible.join("·")}입니다. 지장간은 각 지지 안의 천간 구성입니다. ${hiddenOnly.length ? "이 세 표면 위치에 없는 " + hiddenOnly.join("·") + "도 지장간에는 확인됩니다. 따라서 '세 표면 천간에 없다'와 '원국 전체에 없다'를 구분합니다." : "지장간의 위치는 표면 천간과 따로 보존합니다."}`, [c.refs.pillars], c.id, "LIMITED", "FACT_READING");
    const seasonal = alternatives.length ? alternatives.map(a => `${SEASON[str(a.season)] ?? a.season} 표의 ${STATE[str(a.seasonalState)] ?? a.seasonalState}`).join(" / ") : "계절 분류 보류";
    const locations = list(root.locations), positionNames = unique(locations.map(l => `${role(l.role)}지 ${l.branch}의 ${l.hiddenStem}`));
    add(2, "season-root", `${seasonal}${alternatives.length > 1 ? "의 두 조건부 결과입니다. 원국은 하나이며 계절 판단만 갈립니다" : "입니다"}. ${root.presence === "PRESENT_UNDER_POLICY" ? positionNames.join("·") + "에서 일간과 같은 오행의 장간 근이 확인됩니다." : "네 지지의 선택 장간에서 일간과 같은 오행의 근은 확인되지 않습니다."} 계절상의 분류와 장간 근의 유무는 따로 기록한 항목입니다.`, [c.refs.seasonal, c.refs.root, c.refs.strength], c.id);
    if (Number(v("strength").resolvedWeakPaths) > 0) add(2, "limited-strength", `기존의 매우 좁은 종합 규칙에서는 ${v("strength").resolvedWeakPaths}개 조건부 경로가 신약으로 분류됐습니다. 이 결과는 해당 규칙의 적용 범위에 한정되며 일반적인 상대 강약 판단으로 확대하지 않습니다.`, [c.refs.strength, c.refs.root, c.refs.seasonal], c.id, "LIMITED", "POLICY_READING");
    const pairs = list(v("relations").pairs);
    if (pairs.length) add(2, "relations", `${pairs.slice(0, 3).map(p => `${role(p.leftRole)}지 ${p.leftBranch} ↔ ${role(p.rightRole)}지 ${p.rightBranch}: ${RELATION[str(p.kind)] ?? p.kind}`).join(" · ")} 관계가 관측됩니다.${pairs.length > 3 ? " 나머지 위치 관계도 상세 근거에 보존했습니다." : ""} 구성 관계의 존재를 실제 손상이나 격의 파괴로 확정하지는 않습니다.`, [c.refs.relations], c.id);
    const warming = m5.status === "CANDIDATE_UNDER_POLICY" ? "목적별 판단에서는 화를 겨울 목의 온기 검토 후보로 제공합니다. 원국 표면과 선택 장간 전체에서 화가 확인되지 않는다는 제한된 조건에 따른 결과입니다." : m5.execution !== "EXECUTED_EXISTING_LIMITED_POLICY" ? "이 출생 시계 범위에서는 기존 M5의 의존 정책을 확대하지 않았습니다. 목적별 도움 요소는 정책 범위 미확정으로 보류합니다." : strings(m5.reasonCodes).some(r => /NEEDS_DATA|SEASONAL_CONDITION|REQUIRES_REVIEW/.test(r)) ? "계절 문맥의 자료 또는 적용 조건이 닫히지 않아 목적별 도움 요소를 보류합니다. 입력 범위 밖이나 도움 요소 부재라는 결론과는 다릅니다." : fire.length && ["甲", "乙"].includes(str(day.stem)) && ["亥", "子"].includes(str(pillars[1]!.branch)) ? "목적별 판단은 보류입니다. 화의 존재가 확인돼 자동 후보 채택을 멈췄으며, 화가 충분하다거나 지나치다는 판단은 하지 않습니다." : `일간 ${day.stem}·월지 ${pillars[1]!.branch}: 현재 겨울 甲·乙의 亥·子월 규칙 범위 밖이므로 목적별 도움 요소를 보류합니다.`;
    add(2, "m5", warming, [c.refs.m5, c.refs.pillars, c.refs.seasonal], c.id, m5.status === "CANDIDATE_UNDER_POLICY" ? "LIMITED" : byId.get(c.refs.m5)!.status, "POLICY_READING");
    const luck = v("luck");
    let luckText = luck.requested ? luck.status === "POLICY_UNRESOLVED" ? "요청한 대운·세운은 이 출생 시계 범위에서 적용 정책을 정하지 않아 보류합니다." : "명시한 추가 입력과 정책으로 대운·세운의 시간축을 계산했습니다." : "대운·세운은 요청하지 않았습니다. 대운 방향에는 명시한 성별값과 정책이 필요하며 현재 시각도 임의로 정하지 않습니다.";
    if (luck.firstNominalStart) luckText = `선택한 달력 투영에서 첫 명목 교운일은 ${str(luck.firstNominalStart).replace("T", " ")}입니다. ${luck.selectedPillar ? "조회 시점에 선택된 대운은 " + luck.selectedPillar + "입니다." : ""}`;
    if (Array.isArray(luck.firstPillars) && luck.firstPillars.length) luckText += ` 대운 순서의 앞부분은 ${strings(luck.firstPillars).join(" → ")}입니다.`;
    if (Array.isArray(luck.seyun) && luck.seyun.length) luckText += " 세운은 " + list(luck.seyun).map(s => s.kind === "AT_MINUTE" ? `조회 분 ${str(s.queryMinute).replace("T", " ")} 기준 ${s.pillar}` : `연도 라벨 ${s.yearLabel}년 ${s.pillar}`).join(" / ") + "로 계산됩니다. 연도 라벨과 입춘 전후 시각 조회는 서로 다른 조건입니다.";
    add(5, "luck", luckText, [c.refs.luck], c.id, byId.get(c.refs.luck)!.status, "FACT_READING");
    add(6, "conclusion", `${prefix}${m5.status === "CANDIDATE_UNDER_POLICY" ? "겨울 목의 온기 후보" : primary !== null ? god(primary) + "의 월령 구조" : god(main.tenGod) + " 본기의 별도 범위"}${competition || others.length ? "와 다른 월령 장간 투출의 경쟁·보류" : ""}, ${root.presence === "PRESENT_UNDER_POLICY" ? "구성상 근의 위치" : "선택 정책에서 근이 확인되지 않은 상태"}가 이 명식에서 연결해 읽을 핵심입니다. 확인된 구조와 아직 판단하지 못한 실제 효력을 나누어 남겼습니다.`, [c.refs.pattern, c.refs.root, c.refs.m5], c.id);
    const question = m5.status === "CANDIDATE_UNDER_POLICY" ? "온기 검토 후보와 최종 용신은 무엇이 다른가요? 이 리포트가 실제로 확인한 범위만 내 말로 설명해 보세요." : fire.length && ["甲", "乙"].includes(str(day.stem)) ? `화가 확인된 위치(${fire.map(f => role(f.role)).join("·")})를 표에서 찾아보세요. '있다'는 사실과 '충분하다'는 판단을 구분할 수 있나요?` : others.length || competition ? `월령에서 ${[str(primary ?? main.tenGod), ...others].map(t => GOD[t] ?? t).join("·")} 분류와 다른 장간의 투출을 함께 검토하는 이유는 무엇인가요? 하나만 선택하면 어떤 위치 근거가 빠질까요?` : `월령 ${pillars[1]!.branch}의 분류와 장간 근의 유무는 어떤 차이가 있나요? ${root.presence === "PRESENT_UNDER_POLICY" ? "확인된 근의 위치(" + positionNames.join("·") + ")" : "선택 장간에서 근을 찾지 못한 상태"}만으로 전체 강약을 정하고 있지는 않은지 돌아보세요.`;
    add(6, "question", question, [c.refs.pattern, c.refs.root, c.refs.m5], c.id, "LIMITED", "REFLECTION_QUESTION");
  }
  if (projection.candidates.length > 1) add(1, "parent-boundary", "절입 발표 분과 겹쳐 두 원국 후보를 각각 제시합니다. 한 후보의 월령·근거를 다른 후보의 빈칸에 채우지 않으며, 어느 쪽이 더 그럴듯한지 확률을 붙이지 않습니다.", [global], null, "LIMITED", "LIMITATION");
  const time = byId.get(global)!.value;
  if (projection.candidates.length) {
    add(3, "personality-held", "성향·행동을 이 명식에서 개인별로 판단하는 정책은 아직 없습니다. 위 구조를 성격의 정답으로 바꾸는 장은 제공을 보류합니다.", [global], null, "HOLD", "LIMITATION");
    add(4, "topics-held", "관계·일·재물의 개인별 결론은 해당 해석 정책과 검토 사례가 마련될 때까지 보류합니다. 재성 같은 분류 이름만으로 수입·직업·선택 태도를 판단할 수는 없습니다.", [global], null, "HOLD", "LIMITATION");
    let text = time.monthlyStatus === "NOT_REQUESTED" ? "월운은 아직 요청하지 않았습니다. 달력의 매월 1일과 달리 절입 시각을 기준으로 월간지가 바뀝니다." : typeof time.year === "number" ? `${time.year}년 월운은 ${time.completeIntervals}/12구간의 경계가 확인됩니다.${Number(time.missingIntervals) ? " 나머지 구간은 자료 부족으로 남깁니다." : ""}` : "요청한 월운 조회의 계산 상태를 제공합니다.";
    if (Array.isArray(time.queryPillars) && time.queryPillars.length) text += ` 조회 ${time.queryMinute ? str(time.queryMinute).replace("T", " ") + "의 " : ""}월간지는 ${strings(time.queryPillars).join(" / ")}${time.queryStatus === "AMBIGUOUS" ? "의 조건부 대안" : ""}입니다.`;
    add(5, "monthly", text + " 시간 구간과 간지는 계산하지만 그때 일어날 사건을 예측하지 않습니다.", [global], null, byId.get(global)!.status, "FACT_READING");
    const luckStates = projection.candidates.map(c => byId.get(c.refs.luck)!);
    const noLuck = luckStates.every(n => n.value.requested === false), noMonthly = time.monthlyStatus === "NOT_REQUESTED";
    if (noLuck && noMonthly) sections[4]!.status = "HOLD";
    else if (luckStates.every(n => n.value.requested === false || n.status === "POLICY_UNRESOLVED") && (noMonthly || byId.get(global)!.status === "POLICY_UNRESOLVED")) sections[4]!.status = "POLICY_UNRESOLVED";
  }
  const incomplete = [
    { topic: "PERSONALITY_AND_BEHAVIOR", status: "HOLD" as const, reason: "No accepted personal-trait interpretation policy", sprint: "7" },
    { topic: "RELATIONSHIP_CAREER_WEALTH", status: "HOLD" as const, reason: "Classifications are not a topic efficacy or prediction rule", sprint: "7" },
    { topic: "FULL_STRENGTH_PATTERN_EFFECTS_FINAL_YONGSHEN", status: "UNSUPPORTED" as const, reason: "Existing limited assessments retain their original scope", sprint: "7" },
  ];
  const additional = ["AMBIGUOUS_TIME", "NEEDS_BIRTH_TIME"].includes(projection.calculationStatus);
  const eligibility: ConsumerReport["eligibility"] = { status: projection.candidates.length ? "LIMITED_PROVIDABLE" : additional ? "NEEDS_ADDITIONAL_INFORMATION" : "NOT_PROVIDABLE", fullPaidReport: false, paymentGate: "NO_GO_PROTOTYPE_NOT_FOR_SALE",
    reasons: ["PERSONAL_TRAIT_AND_TOPIC_CHAPTERS_HAVE_NO_ACCEPTED_POLICY", "PURCHASE_VALUE_NOT_VALIDATED", ...projection.blockers.map(b => b.code), ...(projection.candidates.length > 1 ? ["NATAL_BOUNDARY_ALTERNATIVES_RETAINED"] : [])],
    chapters: sections.map(s => ({ chapter: s.chapter, status: projection.candidates.length ? s.status : "HOLD" })), requiredInformation: unique([...projection.blockers.map(b => b.requiredInformation).filter((v): v is string => v !== null), ...(projection.candidates.length && projection.candidates.every(c => byId.get(c.refs.luck)!.value.requested === false) ? ["OPTIONAL_DAYUN_REQUIRES_EXPLICIT_TRADITIONAL_SEX_AND_POLICY", "OPTIONAL_TIME_AXIS_REQUIRES_EXPLICIT_YEAR_OR_QUERY"] : [])]) };
  const report: ConsumerReport = { schemaVersion: REPORT_SCHEMA, profile: { id: CONSUMER_REPORT_PROFILE_ID, version: CONSUMER_REPORT_VERSION }, contextId: projection.contextId, inputContext: projection.inputContext, calculationStatus: projection.calculationStatus,
    calculationFacts: projection.evidence.filter(e => e.layer === "CALCULATION_FACT"), traditionalClassifications: projection.evidence.filter(e => e.layer === "TRADITIONAL_CLASSIFICATION"), policyAssessments: projection.evidence.filter(e => e.layer === "POLICY_ASSESSMENT"),
    candidateContexts: projection.candidates, interpretationClaims: claims, narrativeSections: sections, unsupportedOrHeldClaims: incomplete, eligibility, provenance: projection.provenance,
    limitations: ["CONSUMER_STRUCTURAL_READING_PROTOTYPE_NOT_PERSONAL_PREDICTION", "PURE_PROJECTION_DOES_NOT_AUTHENTICATE_API_OR_G0", "HOLD_IS_NOT_BALANCED_STRONG_WEAK_OR_ABSENCE", "HASH_IS_NOT_ENCRYPTION_OR_ANONYMIZATION", "NOT_FOR_PAID_PUBLIC_RELEASE"] };
  return report;
}

export function buildConsumerReport(projection: ReportProjection, { profileId }: { profileId: string }): ConsumerReport {
  check(profileId === CONSUMER_REPORT_PROFILE_ID, "EXPLICIT_CONSUMER_REPORT_PROFILE_REQUIRED");
  const copy = structuredCloneAfterValidation(projection), report = freeze(compose(copy)); contexts.set(report, copy); return report;
}
function structuredCloneAfterValidation(input: ReportProjection): ReportProjection { validateReportProjection(input); return structuredClone(input); }
export function validateConsumerReport(report: ConsumerReport, { projection }: { projection?: ReportProjection } = {}): true {
  jsonTree(report); const input = projection ?? contexts.get(report); check(input, "REPORT_INPUT_CONTEXT_REQUIRED_FOR_VALIDATION");
  check(canonical(report) === canonical(compose(input)), "REPORT_CLAIM_OR_REFERENCE_OR_POLICY_TAMPERED"); return true;
}
export function buildReportSections(report: ConsumerReport, { audience = "full", voice = "report" }: { audience?: "preview" | "full"; voice?: "report" | "dialogue" } = {}) {
  validateConsumerReport(report); check(["preview", "full"].includes(audience) && ["report", "dialogue"].includes(voice), "REPORT_VIEW_OPTIONS");
  const claims = new Map(report.interpretationClaims.map(c => [c.claimId, c]));
  const selected = report.narrativeSections.filter(s => audience === "full" || s.chapter === 1 || s.chapter === 2);
  return freeze({ schemaVersion: "saju-consumer-report-sections-v1", contextId: report.contextId, audience, voice, eligibility: report.eligibility,
    sections: selected.map(s => ({ ...s, blocks: s.claimIds.filter(id => audience === "full" || s.chapter === 1 || ["pattern"].includes(claims.get(id)!.templateId)).map(id => { const c = claims.get(id)!; return { claimId: id, candidateId: c.candidateId, status: c.status, kind: c.kind, text: c.text, factRefs: c.factRefs, speaker: voice === "dialogue" ? "REPORT_GUIDE" : null }; }) })) });
}
export function renderConsumerReport(report: ConsumerReport, { audience = "full", voice = "report", detail = false }: { audience?: "preview" | "full"; voice?: "report" | "dialogue"; detail?: boolean } = {}): string {
  const view = buildReportSections(report, { audience, voice });
  const lead = report.interpretationClaims.filter(c => c.templateId === "lead" || c.templateId === "input-hold");
  const lines = [...lead.map(c => c.text), "", "나의 사주 해석 리포트 — 제품 시제품", `제공 범위: ${report.eligibility.status === "LIMITED_PROVIDABLE" ? "구조 연결 설명을 제한적으로 제공" : report.eligibility.status === "NEEDS_ADDITIONAL_INFORMATION" ? "추가 출생정보 확인 필요" : "현재 입력으로 제공 불가"} · 전체 유료 리포트 제공은 아직 보장하지 않습니다.`];
  const context = report.inputContext;
  if (context.gregorianDate || context.date) lines.push(`확인할 입력: ${context.calendar === "KOREAN_LUNAR" ? "음력 입력의 양력 환산" : "양력"} ${context.gregorianDate ?? context.date} ${context.time ?? "시각 미상"}`);
  if (context.calendar === "KOREAN_LUNAR" && context.lunarDate) { const l = context.lunarDate as RecordValue; lines.push(`원래 음력 입력: ${l.lunarYear}년 ${l.lunarMonth}월 ${l.lunarDay}일 ${l.leap ? "윤달" : "평달"}`); }
  if (context.recordedCivilMinute && context.standardReferenceMinute && context.recordedCivilMinute !== context.standardReferenceMinute) lines.push(`기록 민간시 ${str(context.recordedCivilMinute).replace("T", " ")} → 선택한 표준시 참조 ${str(context.standardReferenceMinute).replace("T", " ")}`);
  if (context.originalClockStatus === "AMBIGUOUS_TIME") lines.push("입력 분은 두 번 존재하는 시각입니다. 명시한 오프셋 조건으로 계산했으며 원래의 두 시간 대응은 보존합니다.");
  for (const s of view.sections) { lines.push("", `${s.chapter}. ${s.title}`); for (const b of s.blocks) if (b.claimId && !lead.some(c => c.claimId === b.claimId)) lines.push((voice === "dialogue" ? "안내자: " : "") + b.text); if (!s.blocks.length) lines.push("이 입력에서는 이 장을 생성하지 않았습니다."); }
  lines.push("", "이 시제품은 계산 사실·전통 분류·선택 정책을 구분해 읽는 설명입니다. 전체 강약·격국 성패·최종 용신·개인 사건은 확정하지 않았습니다.");
  if (detail) lines.push("", "상세 근거 — 정책·문장·사실 연결", JSON.stringify(report, null, 2));
  return lines.join("\n") + "\n";
}
