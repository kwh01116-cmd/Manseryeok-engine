import { MONTH_BRANCH_BY_JIE, type MonthBoundaryJie } from "../calendar/monthPillar.js";
import { hiddenStemsForBranch, HIDDEN_STEM_POLICY_V1, HIDDEN_STEM_RULE } from "../domain/hiddenStems.js";
import { areStemCombinationPartners } from "../domain/stemCombinations.js";
import { fiveElementRelation, type TenGod } from "../domain/tenGods.js";
import type { ChartPillarRole } from "../chartFacts/chartFactsV1.js";
import { M3_EVIDENCE_PROFILE_ID, M3_EVIDENCE_VERSION, validateM3EvidenceInputContext, type M3EvidenceResult, type M3InputEnvelope, type M3InputRule, type M3InputSource, type M3StemLocation, type M3EvidenceRecord } from "../m3/structuralEvidenceV1.js";

export const M4_PATTERN_PROFILE_ID = "M4-ZHENGGUAN-MONTH-STRUCTURE-V01" as const;
export const M4_PATTERN_VERSION = "0.1.0" as const;
export const M4_PATTERN_SCHEMA = "m4-zhengguan-month-structure-v1" as const;
const MONTH = "M4-RULE-MONTH-OFFICER-CANDIDATE-001", EXPOSURE = "M4-RULE-EXACT-MONTH-MEMBER-EXPOSURE-001";
const COMPETITION = "M4-RULE-COMPETING-MONTH-MEMBERS-001", STRUCTURE = "M4-RULE-ZHENGGUAN-CONDITION-STRUCTURE-001";
const EFFECT = "M4-RULE-ZHENGGUAN-EFFECT-DEFERRAL-001", COMPATIBILITY = "M4-RULE-WU-MEMBER-COMPATIBILITY-001";
const YONGSHEN = "M4-ZPZQ-ORIGINAL-YONGSHEN-NCC", CHENGBAI = "M4-ZPZQ-ORIGINAL-CHENGBAI-NCC", BIANHUA = "M4-ZPZQ-ORIGINAL-BIANHUA-NCC";
const ZHENGGUAN = "M4-ZPZQ-ORIGINAL-ZHENGGUAN-NCC", XU = "M4-ZPZQ-XU-COMMENTARY-NCC", DONGLI = "M4-ZPZQ-DONGLI-CACHED-TRANSCRIPTION", PROJECT = "M4-PROJECT-ZHENGGUAN-STRUCTURE-V01";
const ROLES = ["year", "month", "day", "hour"] as const;
const ROLE_KO = { year: "연", month: "월", day: "일", hour: "시" } as const;
function check(ok: unknown, code: string): asserts ok { if (!ok) throw new RangeError(code); }
function dense<T>(value: readonly T[]): readonly T[] { check(Array.isArray(value) && Array.from({ length: value.length }, (_, i) => Object.hasOwn(value, i)).every(Boolean), "M4_DENSE_ARRAY_REQUIRED"); return value; }
const unique = (values: readonly string[]) => [...new Set(values)];
const frozen = new WeakSet<object>();
function freeze<T>(value: T): T { if (value === null || typeof value !== "object" || frozen.has(value)) return value; if (Array.isArray(value)) dense(value); Object.values(value).forEach(freeze); Object.freeze(value); frozen.add(value); return value; }
function copy<T>(value: T): T { if (value === null || typeof value !== "object") return value; const result = Array.isArray(value) ? dense(value).map(copy) : Object.fromEntries(Object.entries(value).map(([k, v]) => [k, copy(v)])); return result as T; }
function equal(a: unknown, b: unknown): boolean { if (a === b) return true; if (a === null || b === null || typeof a !== "object" || typeof b !== "object" || Array.isArray(a) !== Array.isArray(b)) return false; if (Array.isArray(a)) { if (!Array.isArray(b) || a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (!Object.hasOwn(a, i) || !Object.hasOwn(b, i) || !equal(a[i], b[i])) return false; } const ka = Object.keys(a).sort(), kb = Object.keys(b).sort(); return ka.length === kb.length && ka.every((k, i) => k === kb[i] && equal((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])); }
function denseTree(value: unknown): void { if (value === null || typeof value !== "object") return; if (Array.isArray(value)) dense(value); Object.values(value).forEach(denseTree); }

const source = (id: string, title: string, url: string, use: string, kind = "CLASSICAL_BASE_TEXT_WEB_TRANSCRIPTION") => ({ id, kind, title, url, use, accessedOn: "2026-11-13", nativeRuleVersion: null, verification: "DIRECT_WEB_TRANSCRIPTION_NOT_SCAN_OR_CRITICAL_EDITION", editionVerification: "UNVERIFIED", rightsReview: "UNVERIFIED" });
const rule = (id: string, sourceIds: readonly string[], meaning: string, testCaseIds: readonly string[]) => ({ id, runtimeVersion: M4_PATTERN_VERSION, sourceRuleVersion: null, kind: "PROJECT_SELECTED_STRUCTURAL_RULE_WITH_SEPARATE_TEXTUAL_CONTEXT", policyIds: [M4_PATTERN_PROFILE_ID], sourceIds: [...sourceIds, PROJECT], testCaseRefs: testCaseIds.map(id => "test/fixtures/m4-zhengguan-structure-cases.mjs#" + id), meaning });
export const M4_PATTERN_METADATA = freeze({
  id: M4_PATTERN_PROFILE_ID, version: M4_PATTERN_VERSION, schemaVersion: M4_PATTERN_SCHEMA, kind: "EXPLICIT_LOCAL_RESEARCH_MONTH_OFFICER_STRUCTURE",
  dependencies: [{ kind: "m2Profile", id: "m2-basic-classification-local-v1", version: "1" }, { kind: "structuralM3", id: M3_EVIDENCE_PROFILE_ID, version: M3_EVIDENCE_VERSION }, { kind: "hiddenStems", id: HIDDEN_STEM_POLICY_V1, version: HIDDEN_STEM_RULE.version }],
  candidateDefinition: "MAIN_QI_OFFICER_OR_EXACTLY_EXPOSED_OTHER_OFFICER_WITH_WU_OTHER_COMPATIBILITY_DEFERRED",
  competitionDefinition: "OTHER_MONTH_MEMBER_EXACT_EXPOSURE_AT_YEAR_MONTH_HOUR_NOT_DAY_MASTER_ONLY_AND_NOT_AN_EXCLUSIVE_PATTERN_DECISION",
  patternBasisMeaning: "MONTH_ORDER_GEJU_CRITERION_NOT_HELPFULNESS_OR_M5_YONGSHEN", mainQiMeaning: "NAMED_EXISTING_MEMBERSHIP_NOT_COMMANDING_DAYS_OR_STRENGTH",
  elementRelationOperandMeaning: "EXISTING_FIVE_ELEMENT_HELPER_FROM_LOCATION_ELEMENT_TO_LOCATION_ELEMENT_ENUM_NAMES_DO_NOT_REASSIGN_THE_NATAL_DAY_MASTER",
  sourceCompatibility: "SELECTED_M2_HIDDEN_TABLE_AND_TEXTUAL_PATTERN_CONTEXT_NOT_A_COMPLETE_SINGLE_SCHOOL", releaseGate: "M4_FULL_EFFECT_AND_COMMERCIAL_RELEASE_BLOCKED_UNCHANGED",
  rules: [
    rule(MONTH, [YONGSHEN, ZHENGGUAN], "MONTH_ORDER_STRUCTURAL_CANDIDATE_ONLY", ["main-officer-hidden-without-visible-officer", "visible-officer-outside-month-no-candidate", "seven-killings-month-is-not-officer"]),
    rule(EXPOSURE, [BIANHUA], "EXACT_VISIBLE_CHARACTER_LINK_NOT_FORCE_OR_TRANSFORMATION", ["other-officer-exact-year-exposure-selected", "other-officer-not-exposed-not-selected", "other-officer-same-element-wrong-stem-not-exposure", "other-officer-multiple-exact-exposure-positions"]),
    rule(COMPETITION, [BIANHUA, XU], "PRESERVE_COMPETING_MONTH_MEMBERS_WITHOUT_EXCLUSIVE_SELECTION", ["other-officer-resource-month-member-competition", "other-officer-main-wealth-competition", "day-master-only-month-member-is-not-competition", "non-day-repeated-month-member-is-competition"]),
    rule(STRUCTURE, [CHENGBAI, ZHENGGUAN, XU], "OBSERVE_POSITIONS_AND_DIRECTIONS_NOT_SUCCESS_FAILURE_OR_RESCUE", ["wealth-resource-adjacent-year-month", "wealth-resource-separated-year-hour-and-adjacent-month", "visible-hurting-officer-with-month-officer", "main-officer-and-visible-seven-killings", "overlapping-si-shen-and-yin-hai-relations"]),
    rule(EFFECT, [CHENGBAI, ZHENGGUAN, XU], "EXPLICIT_MATERIAL_EFFECT_DEFERRAL", ["visible-officer-in-five-combination", "literature-jin-original-commentary-scope-dispute", "repeated-you-officer-members-keep-position"]),
    rule(COMPATIBILITY, [BIANHUA], "WU_OTHER_HIDDEN_OFFICER_TABLE_COMPATIBILITY_NOT_SELECTED", ["wu-other-officer-exposed-source-compatibility-review", "wu-other-officer-unexposed-source-compatibility-review"]),
  ],
  sources: [
    source(YONGSHEN, "子平真詮評注 第8節 論用神：原文", "https://ncc.com.tw/fate/paleo/bg/bg_032.htm", "MONTH_ORDER_PATTERN_CRITERION_DISTINCT_FROM_M5_HELPFULNESS"),
    source(CHENGBAI, "子平真詮評注 第9節 論用神成敗救應：原文", "https://ncc.com.tw/fate/paleo/bg/bg_033.htm", "FORMATION_BREAK_RESCUE_CONDITION_CONTEXT_NOT_COMPLETE_EXECUTABLE_EFFICACY"),
    source(BIANHUA, "子平真詮評注 第10節 論用神變化：原文", "https://ncc.com.tw/fate/paleo/bg/bg_033.htm", "MONTH_HIDDEN_MEMBER_EXPOSURE_AND_COEXISTING_PATTERN_CONTEXT"),
    source(ZHENGGUAN, "子平真詮評注 第31節 論正官：原文", "https://ncc.com.tw/fate/paleo/bg/bg_034.htm", "OFFICER_WEALTH_RESOURCE_HURTING_OFFICER_KILLING_AND_POSITION_CONTEXT"),
    source(XU, "子平真詮評注：徐樂吾評註", "https://ncc.com.tw/fate/paleo/bg/bg_034.htm", "COMMENTARY_CONDITIONS_AND_DIFFERENCES_NOT_AUTHOR_BASE_TEXT", "CLASSICAL_COMMENTARY_WEB_TRANSCRIPTION"),
    { ...source(DONGLI, "東里書齋 子平真詮 第8/9/10/31節", "https://www.donglishuzhai.net/chapter/3721.html", "TRANSCRIPTION_VARIANTS_AND_EDITOR_NOTES_NOT_AN_INDEPENDENT_SCHOOL", "CACHED_TRANSCRIPTION_COMPARISON"), verification: "SEARCH_TOOL_TRANSCRIPTION_CACHE_DIRECT_ORIGIN_TIMEOUT_OR_502", companionUrls: ["https://www.donglishuzhai.net/chapter/3722.html", "https://www.donglishuzhai.net/chapter/3723.html", "https://www.donglishuzhai.net/chapter/3744.html"] },
    { id: PROJECT, kind: "PROJECT_IMPLEMENTATION_DEFINITION", version: M4_PATTERN_VERSION, implementationRef: "src/m4/zhengguanStructureV1.ts", policyRef: "docs/research/M4_ZHENGGUAN_STRUCTURE_POLICY_V01.md", use: "NARROW_SELECTION_EXACT_EXPOSURE_COMPETITION_AND_EFFECT_DEFERRAL_NOT_UNIVERSAL_PATTERN_THEORY" },
  ],
  excluded: ["GE_CHENG_EFFICACY", "GE_BAI_EFFICACY", "JIU_YING_EFFICACY", "PATTERN_QUALITY", "COMMANDING_DAY_RULE", "STRENGTH_UPGRADE", "ROOT_FORCE", "HELPFUL_YONGSHEN", "COMBINATION_TRANSFORMATION", "FORTUNE", "PREDICTION"],
});

interface Context { readonly evidence: M3EvidenceResult; readonly m2Facts: M3InputEnvelope; }
interface References { readonly inputFactRefs: readonly string[]; readonly inputEvidenceRefs: readonly string[]; readonly inputMemberRefs: readonly string[]; readonly locationRefs: readonly string[]; readonly pillarRefs: readonly string[]; readonly ruleRefs: readonly string[]; readonly policyRefs: readonly string[]; readonly sourceRefs: readonly string[]; readonly calculationSourceRefs: readonly string[]; }
type EvidenceCandidate = M3EvidenceResult["candidates"][number];
function validateContext({ evidence, m2Facts }: Context): void {
  validateM3EvidenceInputContext(evidence, m2Facts); denseTree(m2Facts);
  check(evidence.policy.id === M3_EVIDENCE_PROFILE_ID && evidence.policy.version === M3_EVIDENCE_VERSION && m2Facts.policyBundle.id === "m2-basic-classification-local-v1" && m2Facts.policyBundle.version === "1" && m2Facts.policyBundle.policies.hiddenStems?.id === HIDDEN_STEM_POLICY_V1 && m2Facts.policyBundle.policies.hiddenStems.runtimeVersion === HIDDEN_STEM_RULE.version, "M4_DEPENDENCY_PROFILE_MISMATCH");
  check(m2Facts.rules.find(r => r.id === HIDDEN_STEM_RULE.ruleId)?.runtimeVersion === HIDDEN_STEM_RULE.version, "M4_HIDDEN_RULE_VERSION_MISMATCH");
  dense(evidence.candidates); check(evidence.candidates.length === m2Facts.candidates.length && evidence.candidates.length > 0 && evidence.candidates.length <= 2, "M4_CANDIDATE_COUNT_MISMATCH");
  const rules = new Set(evidence.rules.map(r => r.id)), sources = new Set(evidence.sources.map(s => s.id));
  check(!M4_PATTERN_METADATA.rules.some(r => rules.has(r.id)) && !M4_PATTERN_METADATA.sources.some(s => sources.has(s.id)), "M4_UPSTREAM_REGISTRY_COLLISION");
  evidence.candidates.forEach((candidate, i) => {
    const native = m2Facts.candidates[i]!; check(candidate.candidateRef === `chart.candidates[${i}]` && native.id === candidate.candidateRef && candidate.candidateIndex === i && native.candidateIndex === i && native.dayMaster === candidate.dayMaster, "M4_CROSS_CANDIDATE_CONTEXT");
    const month = candidate.monthContext; check(Object.hasOwn(MONTH_BRANCH_BY_JIE, month.activeSince.term) && MONTH_BRANCH_BY_JIE[month.activeSince.term as MonthBoundaryJie] === month.monthPillar.branch, "M4_MONTH_JIE_BRANCH_MISMATCH");
    const locations = [...Object.values(candidate.directionalGroups).flat(), candidate.visibleDayMaster], seen = new Set(locations.map(l => l.locationId)); check(seen.size === locations.length && locations.filter(l => l.locationKind === "VISIBLE_STEM").length === 4, "M4_DUPLICATE_OR_MISSING_LOCATION");
    const factIds = new Set(native.facts.map(f => f.id));
    for (const location of locations) {
      check(location.candidateRef === candidate.candidateRef && location.pillarRef === candidate.candidateRef + "." + location.pillarRole && location.inputFactRefs.length > 0 && location.inputFactRefs.every(id => factIds.has(id)), "M4_FOREIGN_LOCATION_OR_FACT");
      check(location.ruleRefs.length > 0 && location.ruleRefs.every(id => rules.has(id)) && location.sourceRefs.every(id => sources.has(id)) && location.calculationSourceRefs.length > 0 && location.calculationSourceRefs.every(id => sources.has(id)), "M4_MISSING_LOCATION_RULE_OR_SOURCE");
    }
    ROLES.forEach((role, p) => { const pillar = native.pillars[p]!; check(pillar.role === role, "M4_FOUR_POSITIONED_PILLARS_REQUIRED"); const expected = hiddenStemsForBranch(pillar.branch, HIDDEN_STEM_POLICY_V1), actual = locations.filter(l => l.locationKind === "HIDDEN_STEM" && l.pillarRole === role).sort((a, b) => a.index! - b.index!); check(actual.length === expected.length && pillar.branchTenGods.members.length === expected.length && actual.every((l, j) => l.stem === expected[j]!.stem && l.index === j && l.position === expected[j]!.position && pillar.branchTenGods.members[j]!.stem === l.stem), "M4_COMPLETE_SELECTED_HIDDEN_MEMBERS_REQUIRED"); });
  });
}
function refs(candidate: EvidenceCandidate, locations: readonly M3StemLocation[], records: readonly M3EvidenceRecord[], ownRules: readonly string[]): References {
  const ruleSources = M4_PATTERN_METADATA.rules.filter(r => ownRules.includes(r.id)).flatMap(r => r.sourceIds);
  return { inputFactRefs: unique([...locations.flatMap(l => l.inputFactRefs), ...records.flatMap(r => r.inputFactRefs)]), inputEvidenceRefs: unique(records.map(r => r.id)), inputMemberRefs: unique([...locations.flatMap(l => l.inputMemberRef ? [l.inputMemberRef] : []), ...records.flatMap(r => r.inputMemberRefs)]), locationRefs: unique(locations.map(l => l.locationId)), pillarRefs: unique([...locations.map(l => l.pillarRef), ...records.flatMap(r => r.pillarRefs)]), ruleRefs: unique([...ownRules, ...locations.flatMap(l => l.ruleRefs), ...records.flatMap(r => r.ruleRefs)]), policyRefs: unique([M4_PATTERN_PROFILE_ID, ...locations.flatMap(l => l.policyRefs), ...records.flatMap(r => r.policyRefs)]), sourceRefs: unique([...ruleSources, ...locations.flatMap(l => l.sourceRefs), ...records.flatMap(r => r.sourceRefs)]), calculationSourceRefs: unique([...locations.flatMap(l => l.calculationSourceRefs), ...records.flatMap(r => r.calculationSourceRefs)]) };
}
const contexts = new WeakMap<object, Context>();

/** Structural same-process continuity; external API/edition authentication belongs to the local adapter. */
export function deriveM4ZhengguanStructure(evidence: M3EvidenceResult, options?: { readonly profileId: string; readonly m2Facts: M3InputEnvelope }) {
  check(options?.profileId === M4_PATTERN_PROFILE_ID, "EXPLICIT_SUPPORTED_M4_PATTERN_PROFILE_REQUIRED");
  const context = { evidence, m2Facts: options.m2Facts }; validateContext(context);
  const candidates = evidence.candidates.map((candidate, candidateIndex) => {
    const native = context.m2Facts.candidates[candidateIndex]!, month = candidate.monthContext, candidateRef = candidate.candidateRef;
    const locations = [...Object.values(candidate.directionalGroups).flat(), candidate.visibleDayMaster].sort((a, b) => ROLES.indexOf(a.pillarRole) - ROLES.indexOf(b.pillarRole) || (a.locationKind === "VISIBLE_STEM" ? -1 : b.locationKind === "VISIBLE_STEM" ? 1 : a.index! - b.index!));
    const visible = locations.filter(l => l.locationKind === "VISIBLE_STEM"), hidden = locations.filter(l => l.locationKind === "HIDDEN_STEM");
    const monthRecord = candidate.evidence.find(r => r.kind === "MONTH_CONTEXT")!;
    const monthLocations = month.hiddenMembers, officerMembers = monthLocations.filter(l => l.tenGod === "正官");
    const memberExposures = candidate.hiddenVisibleLinks.filter(l => l.hidden.pillarRole === "month");
    const exactExposures = memberExposures.filter(l => l.hidden.tenGod === "正官");
    const otherMemberExposures = memberExposures.filter(l => l.hidden.tenGod !== "正官" && l.visible.pillarRole !== "day");
    const dayMasterOnlyMatches = memberExposures.filter(l => l.hidden.tenGod !== "正官" && l.visible.pillarRole === "day" && !otherMemberExposures.some(other => other.hidden.locationId === l.hidden.locationId));
    const main = officerMembers.some(l => l.position === "MAIN_QI"), compatibility = month.monthPillar.branch === "午" && officerMembers.some(l => l.position === "OTHER");
    const status = compatibility ? "SOURCE_OR_POLICY_UNRESOLVED" as const : main || exactExposures.length > 0 ? "STRUCTURAL_CANDIDATE" as const : "NOT_A_CANDIDATE_UNDER_POLICY" as const;
    const basis = compatibility ? "OTHER_MONTH_MEMBER_COMPATIBILITY_REVIEW" as const : main ? "MAIN_QI_ZHENGGUAN" as const : exactExposures.length ? "OTHER_ZHENGGUAN_EXACTLY_EXPOSED" as const : officerMembers.length ? "OTHER_ZHENGGUAN_NOT_EXPOSED" as const : "NO_MONTH_ZHENGGUAN" as const;
    const reasonCodes = [compatibility ? "WU_BRANCH_HIDDEN_TABLE_COMPATIBILITY_NOT_SELECTED" : main ? "MONTH_MAIN_QI_OFFICER_OBSERVED" : exactExposures.length ? "EXACT_OTHER_OFFICER_EXPOSURE_OBSERVED" : officerMembers.length ? "UNEXPOSED_OTHER_MONTH_SELECTION_NOT_SELECTED" : "NO_OFFICER_IN_SELECTED_MONTH_MEMBERS"];
    const assessmentRefs = refs(candidate, [...monthLocations, ...exactExposures.map(l => l.visible)], [monthRecord], [MONTH, EXPOSURE, ...(compatibility ? [COMPATIBILITY] : [])]);
    const candidateAssessment = { id: candidateRef + "#m4-candidate-assessment", status, basis, reasonCodes, ...assessmentRefs };
    const officerVisible = visible.filter(l => l.tenGod === "正官"), officerHidden = hidden.filter(l => l.tenGod === "正官"), officers = [...officerVisible, ...officerHidden];
    const group = (gods: readonly TenGod[]) => ({ visible: visible.filter(l => l.tenGod !== null && gods.includes(l.tenGod)), hidden: hidden.filter(l => l.tenGod !== null && gods.includes(l.tenGod)) });
    const groups = { wealth: group(["正財", "偏財"]), resource: group(["正印", "偏印"]), hurtingOfficer: group(["傷官"]), sevenKillings: group(["七殺"]) };
    const all = (g: { readonly visible: readonly M3StemLocation[]; readonly hidden: readonly M3StemLocation[] }) => [...g.visible, ...g.hidden];
    const wealth = all(groups.wealth), resource = all(groups.resource), hurting = all(groups.hurtingOfficer), killings = all(groups.sevenKillings);
    const competitionExposures = status === "STRUCTURAL_CANDIDATE" ? otherMemberExposures : [];
    const competition = { status: competitionExposures.length ? "COMPETING_CONDITIONS_PRESENT" as const : "NO_COMPETING_MONTH_EXPOSURE_UNDER_POLICY" as const, exposures: competitionExposures, selectionEffect: competitionExposures.length ? "SOURCE_OR_POLICY_UNRESOLVED" as const : "NOT_EVALUATED" as const };
    const structuralLinks: ({ readonly id: string; readonly candidateRef: string; readonly kind: string; readonly from: M3StemLocation; readonly to: M3StemLocation; readonly relation: ReturnType<typeof fiveElementRelation>; readonly relationBasis: "FROM_LOCATION_TO_LOCATION"; readonly positionRelation: { readonly distance: number; readonly adjacent: boolean; readonly samePillar: boolean; readonly intermediateRoles: readonly ChartPillarRole[]; readonly fromKind: M3StemLocation["locationKind"]; readonly toKind: M3StemLocation["locationKind"] }; readonly effectStatus: "NOT_EVALUATED" } & References)[] = [];
    const link = (kind: string, from: M3StemLocation, to: M3StemLocation) => { const a = ROLES.indexOf(from.pillarRole), b = ROLES.indexOf(to.pillarRole), distance = Math.abs(a - b); structuralLinks.push({ id: candidateRef + `#m4-link[${structuralLinks.length}]`, candidateRef, kind, from, to, relation: fiveElementRelation(from.element, to.element), relationBasis: "FROM_LOCATION_TO_LOCATION", positionRelation: { distance, adjacent: distance === 1, samePillar: a === b, intermediateRoles: ROLES.slice(Math.min(a, b) + 1, Math.max(a, b)), fromKind: from.locationKind, toKind: to.locationKind }, effectStatus: "NOT_EVALUATED", ...refs(candidate, [from, to], [monthRecord], [STRUCTURE]) }); };
    for (const w of wealth) for (const o of officers) link("WEALTH_GENERATES_OFFICER", w, o);
    for (const o of officers) for (const r of resource) link("OFFICER_GENERATES_RESOURCE", o, r);
    for (const r of resource) link("RESOURCE_GENERATES_DAY_MASTER", r, candidate.visibleDayMaster);
    for (const h of hurting) for (const o of officers) link("HURTING_OFFICER_CONTROLS_OFFICER", h, o);
    for (const w of wealth) for (const r of resource) link("WEALTH_RESOURCE_POSITION", w, r);
    const surfaceCombinations = visible.flatMap((left, i) => visible.slice(i + 1).filter(right => areStemCombinationPartners(left.stem, right.stem)).map(right => ({ id: candidateRef + `#m4-five-combination[${left.pillarRole}:${right.pillarRole}]`, candidateRef, left, right, includesOfficer: left.tenGod === "正官" || right.tenGod === "正官", adjacent: Math.abs(ROLES.indexOf(left.pillarRole) - ROLES.indexOf(right.pillarRole)) === 1, effectStatus: "NOT_EVALUATED" as const, ...refs(candidate, [left, right], [monthRecord], [STRUCTURE, EFFECT]) })));
    const pairFacts = native.facts.filter(f => f.kind === "BRANCH_RELATION"), triadFacts = native.facts.filter(f => f.kind === "TRIAD_MEMBERSHIP");
    const relations = { pairs: native.branchRelations.map((p, i) => ({ ...copy(p), id: candidateRef + `#m4-branch-pair[${i}]`, candidateRef, effectStatus: "NOT_EVALUATED" as const, ...refs(candidate, locations.filter(l => l.pillarRole === p.leftPillarRole || l.pillarRole === p.rightPillarRole), candidate.evidence.filter(e => e.inputFactRefs.includes(pairFacts[i]!.id)), [STRUCTURE, EFFECT]) })), triads: native.triadMemberships.map((t, i) => ({ ...copy(t), id: candidateRef + `#m4-triad[${i}]`, candidateRef, effectStatus: "NOT_EVALUATED" as const, ...refs(candidate, locations.filter(l => t.members.some(m => m.pillarRoles.includes(l.pillarRole))), candidate.evidence.filter(e => e.inputFactRefs.includes(triadFacts[i]!.id)), [STRUCTURE, EFFECT]) })) };
    const conditions: ({ readonly id: string; readonly candidateRef: string; readonly kind: string; readonly status: "OBSERVED" | "NOT_OBSERVED"; readonly effectStatus: "NOT_EVALUATED" } & References)[] = [];
    const addCondition = (kind: string, observed: boolean, used: readonly M3StemLocation[], usedRules: readonly string[] = [STRUCTURE, EFFECT], records: readonly M3EvidenceRecord[] = [monthRecord]) => { const condition = { id: candidateRef + `#m4-condition[${conditions.length}]`, candidateRef, kind, status: observed ? "OBSERVED" as const : "NOT_OBSERVED" as const, effectStatus: "NOT_EVALUATED" as const, ...refs(candidate, used, records, usedRules) }; conditions.push(condition); return condition.id; };
    // Existing directional evidence also records the complete search scope when a group is empty.
    const directionalRecords = (relations: readonly string[]): readonly M3EvidenceRecord[] => [monthRecord, ...candidate.evidence.filter(e => e.kind === "DIRECTIONAL_GROUP" && e.value !== null && typeof e.value === "object" && "relation" in e.value && typeof e.value.relation === "string" && relations.includes(e.value.relation))];
    const exposureRecords = [monthRecord, ...candidate.evidence.filter(e => e.kind === "HIDDEN_VISIBLE_LINKS")];
    addCondition("WEALTH_GENERATES_OFFICER", wealth.length > 0 && officers.length > 0, [...wealth, ...officers], [STRUCTURE, EFFECT], directionalRecords(["DAY_MASTER_CONTROLS", "TARGET_CONTROLS_DAY_MASTER"]));
    addCondition("OFFICER_RESOURCE_DAY_MASTER_CHAIN", resource.length > 0 && officers.length > 0, [...officers, ...resource, candidate.visibleDayMaster], [STRUCTURE, EFFECT], directionalRecords(["TARGET_GENERATES_DAY_MASTER", "TARGET_CONTROLS_DAY_MASTER"]));
    addCondition("HURTING_OFFICER_CONTROLS_OFFICER", hurting.length > 0 && officers.length > 0, [...hurting, ...officers], [STRUCTURE, EFFECT], directionalRecords(["DAY_MASTER_GENERATES", "TARGET_CONTROLS_DAY_MASTER"]));
    addCondition("OFFICER_SEVEN_KILLINGS_COEXISTENCE", killings.length > 0 && officers.length > 0, [...killings, ...officers], [STRUCTURE, EFFECT], directionalRecords(["TARGET_CONTROLS_DAY_MASTER"]));
    addCondition("OFFICER_FIVE_COMBINATION", surfaceCombinations.some(p => p.includesOfficer), surfaceCombinations.filter(p => p.includesOfficer).flatMap(p => [p.left, p.right]), [STRUCTURE, EFFECT], exposureRecords);
    addCondition("WEALTH_RESOURCE_POSITION_REVIEW", wealth.length > 0 && resource.length > 0, [...wealth, ...resource], [STRUCTURE, EFFECT], directionalRecords(["DAY_MASTER_CONTROLS", "TARGET_GENERATES_DAY_MASTER"]));
    addCondition("NATAL_BRANCH_RELATION_REVIEW", relations.pairs.length > 0 || relations.triads.some(t => t.distinctMemberCount >= 2), locations, [STRUCTURE, EFFECT], candidate.evidence.filter(e => ["MONTH_CONTEXT", "RELATION_SCOPE", "BRANCH_RELATION_CONTEXT", "TRIAD_MEMBERSHIP_CONTEXT"].includes(e.kind)));
    addCondition("MONTH_MEMBER_SELECTION_COMPETITION", competitionExposures.length > 0, competitionExposures.flatMap(l => [l.hidden, l.visible]), [COMPETITION, EFFECT], exposureRecords);
    const formationObserved = conditions.filter(c => ["WEALTH_GENERATES_OFFICER", "OFFICER_RESOURCE_DAY_MASTER_CHAIN"].includes(c.kind) && c.status === "OBSERVED");
    const formationAssessment = { status: status !== "STRUCTURAL_CANDIDATE" ? "NOT_APPLICABLE_UNDER_POLICY" as const : formationObserved.length ? "FORMATION_CONDITIONS_OBSERVED" as const : "BASE_STRUCTURE_ONLY" as const, conditionRefs: status === "STRUCTURAL_CANDIDATE" ? formationObserved.map(c => c.id) : [] };
    const requiredPolicies = status !== "STRUCTURAL_CANDIDATE" ? compatibility ? ["MONTH_HIDDEN_TABLE_COMPATIBILITY_SELECTION"] : officerMembers.length ? ["UNEXPOSED_OTHER_MONTH_SELECTION"] : [] : ["PATTERN_EFFICACY_AND_RELATIVE_STRENGTH", ...(competitionExposures.length ? ["MONTH_ORDER_TRANSFORMATION_SELECTION"] : []), ...(wealth.length || resource.length ? ["WEALTH_RESOURCE_TRANSMISSION_AND_POSITION_EFFICACY"] : []), ...(hurting.length ? ["HURTING_OFFICER_AND_RESCUE_EFFICACY"] : []), ...(killings.length ? ["OFFICER_KILLINGS_SELECTION_EFFICACY"] : []), ...(surfaceCombinations.length ? ["STEM_COMBINATION_EFFICACY"] : []), ...(relations.pairs.length || relations.triads.some(t => t.distinctMemberCount >= 2) ? ["BRANCH_INTERACTION_EFFICACY"] : [])];
    return { candidateRef, candidateIndex, dayMaster: candidate.dayMaster, pillars: copy(native.pillars), monthContext: month,
      patternBasis: { kind: "MONTH_ORDER_GEJU_CRITERION" as const, tenGod: "正官" as const, memberRefs: officerMembers.map(m => m.inputMemberRef!), helpfulnessAssessment: "NOT_PERFORMED" as const },
      monthBasis: { officerMembers, memberExposures, exactExposures, otherMemberExposures, dayMasterOnlyMatches }, officerPresence: { status: officers.length ? "PRESENT" as const : "ABSENT" as const, visible: officerVisible, hidden: officerHidden },
      candidateAssessment, competition, groups, conditions, structuralLinks, surfaceCombinations, relations, formationAssessment,
      effects: { status: compatibility ? "SOURCE_OR_POLICY_UNRESOLVED" as const : status === "STRUCTURAL_CANDIDATE" ? "EFFECT_POLICY_REQUIRED" as const : "NOT_APPLICABLE_UNDER_POLICY" as const, geCheng: "NOT_IMPLEMENTED" as const, geBai: "NOT_IMPLEMENTED" as const, jiuYing: "NOT_IMPLEMENTED" as const, requiredPolicies },
    };
  });
  const result = freeze({ schemaVersion: M4_PATTERN_SCHEMA, status: "STRUCTURAL_ANALYSIS_ONLY" as const, profile: M4_PATTERN_METADATA, upstreamPolicyBundle: evidence.upstreamPolicyBundle, upstreamFinalStrength: evidence.finalStrength, candidates, rules: [...evidence.rules, ...M4_PATTERN_METADATA.rules], sources: [...evidence.sources, ...M4_PATTERN_METADATA.sources],
    validation: { level: "SAME_PROCESS_STRUCTURAL_REFERENCE_AND_VALUE_CONSISTENCY", externalAuthentication: "NOT_PERFORMED_BY_PURE_MODULE", editionVerification: "UNVERIFIED", rightsReview: "UNVERIFIED", predictiveValidity: "NOT_CLAIMED", g0Receipt: null, g1P2Promotion: false, m3FinalGate: "BLOCKED_UNCHANGED", m4FinalEffectGate: "BLOCKED_UNCHANGED" } });
  contexts.set(result, context); return result;
}
export type M4ZhengguanStructureResult = ReturnType<typeof deriveM4ZhengguanStructure>;
export function validateM4ZhengguanStructure(value: M4ZhengguanStructureResult, expected: Partial<Context> = {}): true { const context = contexts.get(value); check(context && Object.isFrozen(value), "M4_ISSUED_IMMUTABLE_RESULT_REQUIRED"); for (const key of ["evidence", "m2Facts"] as const) if (expected[key] !== undefined) check(expected[key] === context[key], "M4_OTHER_EXECUTION_CONTEXT"); validateContext(context); return true; }

function locationsText(values: readonly M3StemLocation[]): string { const selected = values.slice(0, 3).map(l => ROLE_KO[l.pillarRole] + (l.locationKind === "VISIBLE_STEM" ? "간 " : "지 장간 ") + l.stem); return selected.length ? selected.join("·") + (values.length > 3 ? ` 외 ${values.length - 3}곳` : "") : "없음"; }
function relationText(candidate: M4ZhengguanStructureResult["candidates"][number]): string {
  const names = { LIUHE: "육합", LIUCHONG: "충", LIUHAI: "해", LIUPO: "파", XING: "형" } as const, elements = { WOOD: "목", FIRE: "화", EARTH: "토", METAL: "금", WATER: "수" } as const;
  const pairs = new Map<string, { text: string; kinds: string[] }>();
  for (const pair of candidate.relations.pairs) { const key = pair.leftPillarIndex + ":" + pair.rightPillarIndex, group = pairs.get(key) ?? { text: `${ROLE_KO[pair.leftPillarRole]}지 ${pair.leftBranch}–${ROLE_KO[pair.rightPillarRole]}지 ${pair.rightBranch}`, kinds: [] }; group.kinds.push(names[pair.kind]); pairs.set(key, group); }
  const texts = [...pairs.values()].slice(0, 2).map(p => p.text + "의 " + unique(p.kinds).join("·")); if (pairs.size > 2) texts.push(`그 밖의 ${pairs.size - 2}개 지지 쌍`);
  const triads = candidate.relations.triads.filter(t => t.distinctMemberCount >= 2); if (triads.length) { const t = triads[0]!; texts.push(`${elements[t.namedElement]} ${t.family === "SANHE" ? "삼합" : "삼회"} ${t.distinctMemberCount === 3 ? "세 구성원" : "부분 구성원"}: ${t.members.filter(m => m.pillarRoles.length).map(m => m.pillarRoles.map(role => ROLE_KO[role]).join("·") + "지 " + m.branch).join(" / ")}${t.missingBranches.length ? `, ${t.missingBranches.join("·")} 미포함` : ""}${triads.length > 1 ? ` 외 ${triads.length - 1}개 구성` : ""}`); }
  return texts.length ? texts.join("; ") : "선택한 기존 규칙의 지지 쌍·복수 구성원 관계 없음";
}
function reportContent(result: M4ZhengguanStructureResult) {
  validateM4ZhengguanStructure(result);
  const candidates = result.candidates.map(candidate => {
    const assessment = candidate.candidateAssessment, month = candidate.monthContext, m = candidate.monthBasis.officerMembers, groups = candidate.groups;
    const all = (g: { readonly visible: readonly M3StemLocation[]; readonly hidden: readonly M3StemLocation[] }) => [...g.visible, ...g.hidden];
    let summary: string;
    if (assessment.basis === "MAIN_QI_ZHENGGUAN") summary = `월지 ${month.monthPillar.branch}의 본기로 표시된 ${m[0]!.stem}은 일간 ${candidate.dayMaster}을 기준으로 정관입니다. 선택한 정책에서 월령 기반 정관격 구조 후보로 검토합니다. 본기 표시는 실제 사령·강도의 확정이 아닙니다.`;
    else if (assessment.basis === "OTHER_ZHENGGUAN_EXACTLY_EXPOSED") summary = `월지 ${month.monthPillar.branch}의 기타 장간 ${m[0]!.stem}이 정관이며, ${locationsText(candidate.monthBasis.exactExposures.map(l => l.visible))}에 같은 천간이 드러납니다. 선택한 정확 투출 조건에 따라 정관격 구조 후보로 검토합니다.`;
    else if (assessment.basis === "OTHER_MONTH_MEMBER_COMPATIBILITY_REVIEW") summary = `월지 午의 기존 장간표에는 기타 장간 己 정관이 있습니다. 이 구성과 문헌의 사정지 설명을 함께 적용할 정책이 선택되지 않아 후보 판단을 보류합니다. 정관의 존재와 투출 사실은 유지합니다.`;
    else if (assessment.basis === "OTHER_ZHENGGUAN_NOT_EXPOSED") summary = `월지 ${month.monthPillar.branch}의 기타 장간 ${m[0]!.stem}은 정관이지만 같은 천간이 표면에 드러나지 않습니다. 이번 좁은 정책에서는 정관격 후보로 선택하지 않으며, 숨은 정관을 삭제하지 않습니다.`;
    else summary = `월지 ${month.monthPillar.branch}의 선택 장간에는 정관이 없습니다. ${candidate.officerPresence.status === "PRESENT" ? `원국 다른 위치의 정관은 ${locationsText([...candidate.officerPresence.visible, ...candidate.officerPresence.hidden])}에 있지만` : "현재 원국에서 정관 위치도 확인되지 않으며"}, 현재 월령 취격 정책의 정관격 후보는 아닙니다.`;
    const exposure = `월령 정관의 정확 표면 투출: ${locationsText(candidate.monthBasis.exactExposures.map(l => l.visible))}. ${candidate.competition.status === "COMPETING_CONDITIONS_PRESENT" ? `다른 월령 장간도 ${locationsText(candidate.competition.exposures.map(l => l.visible))}에 드러나 단독 취격의 선택·변화는 미정입니다. 정관 후보를 지우지는 않습니다.` : "이번 정책의 비일간 월령 장간 노출 경쟁은 선택되지 않았습니다."}`;
    const observed = (kind: string) => candidate.conditions.some(condition => condition.kind === kind && condition.status === "OBSERVED");
    const wealthDirection = observed("WEALTH_GENERATES_OFFICER") ? "재→관의 오행 생조 방향이 실제 위치에서 관측됩니다." : "재→관 연결은 관측되지 않았습니다.";
    const resourceDirection = observed("OFFICER_RESOURCE_DAY_MASTER_CHAIN") ? "관→인→일간의 오행 생조 방향이 실제 위치에서 관측됩니다." : "관→인→일간 연결은 관측되지 않았습니다.";
    const support = `재성은 표면 ${locationsText(groups.wealth.visible)}, 장간 ${locationsText(groups.wealth.hidden)}이고, 인성은 표면 ${locationsText(groups.resource.visible)}, 장간 ${locationsText(groups.resource.hidden)}입니다. ${wealthDirection} ${resourceDirection} 관측은 존재와 방향에 한정하며 전달의 충분함이나 자동 성격·구응을 확정하지 않습니다.`;
    const adverse = `상관은 표면 ${locationsText(groups.hurtingOfficer.visible)}, 장간 ${locationsText(groups.hurtingOfficer.hidden)}입니다. 칠살은 표면 ${locationsText(groups.sevenKillings.visible)}, 장간 ${locationsText(groups.sevenKillings.hidden)}입니다. ${candidate.officerPresence.status === "PRESENT" && (all(groups.hurtingOfficer).length || all(groups.sevenKillings).length) ? "정관과의 병존·극 방향을 검토할 구조이며 실제 파격이나 혼살 실패로 단정하지 않습니다." : "이 존재 목록을 성패의 확정으로 바꾸지 않습니다."}`;
    const wr = candidate.structuralLinks.filter(l => l.kind === "WEALTH_RESOURCE_POSITION" && l.from.locationKind === "VISIBLE_STEM" && l.to.locationKind === "VISIBLE_STEM");
    const position = wr.slice(0, 2).map(l => `${ROLE_KO[l.from.pillarRole]}간 ${l.from.stem}–${ROLE_KO[l.to.pillarRole]}간 ${l.to.stem} ${l.positionRelation.adjacent ? "인접" : l.positionRelation.samePillar ? "같은 기둥" : "격위"}`).join("; ");
    const officerPairs = candidate.surfaceCombinations.filter(p => p.includesOfficer), pairText = officerPairs.map(p => `${ROLE_KO[p.left.pillarRole]}간 ${p.left.stem}–${ROLE_KO[p.right.pillarRole]}간 ${p.right.stem}`).join("; ") || "없음";
    const interactions = `${position ? `재·인의 표면 위치: ${position}. ` : ""}정관이 참여하는 표면 오합 짝: ${pairText}. 지지 관계 검토: ${relationText(candidate)}. 표시 순서는 효력의 우선순위가 아니며 모든 위치·겹침은 JSON에 보존합니다.`;
    const scope = `${candidate.formationAssessment.status === "FORMATION_CONDITIONS_OBSERVED" ? "재성 또는 인성과 정관 사이에서 성립 관련 구조 조건이 관측됐습니다. " : ""}${candidate.effects.status === "NOT_APPLICABLE_UNDER_POLICY" ? "이번 정책에서 후보를 선택하지 않았으므로 최종 성패를 적용하지 않습니다." : "실제 成格·破格·救應 판단에는 강약·생조 전달·관계 작용 등의 별도 효력 정책이 필요합니다."} 월령의 격국 기준 요소는 M5의 도움이 되는 용신 추천과 다릅니다.`;
    const parts = [
      ["KO_M4_MONTH_CANDIDATE", summary, [], true],
      ["KO_M4_EXPOSURE_COMPETITION", exposure, ["MONTH_MEMBER_SELECTION_COMPETITION"], true],
      ["KO_M4_WEALTH_RESOURCE_STRUCTURE", support, ["WEALTH_GENERATES_OFFICER", "OFFICER_RESOURCE_DAY_MASTER_CHAIN"], false],
      ["KO_M4_HURTING_OFFICER_KILLINGS", adverse, ["HURTING_OFFICER_CONTROLS_OFFICER", "OFFICER_SEVEN_KILLINGS_COEXISTENCE"], false],
      ["KO_M4_INTERACTION_POSITIONS", interactions, ["OFFICER_FIVE_COMBINATION", "NATAL_BRANCH_RELATION_REVIEW", "WEALTH_RESOURCE_POSITION_REVIEW"], false],
      ["KO_M4_EFFECT_SCOPE", scope, candidate.conditions.map(c => c.kind), true],
    ] as const;
    const selectConditions = (kinds: readonly string[]) => candidate.conditions.filter(c => kinds.includes(c.kind));
    const items = parts.map(([templateId, text, kinds, usesAssessment], i) => {
      const selected = selectConditions(kinds), inputs: readonly References[] = [...(usesAssessment ? [assessment] : []), ...selected];
      const combined = { inputFactRefs: unique(inputs.flatMap(r => r.inputFactRefs)), inputEvidenceRefs: unique(inputs.flatMap(r => r.inputEvidenceRefs)), inputMemberRefs: unique(inputs.flatMap(r => r.inputMemberRefs)), locationRefs: unique(inputs.flatMap(r => r.locationRefs)), ruleRefs: unique(inputs.flatMap(r => r.ruleRefs)), policyRefs: unique(inputs.flatMap(r => r.policyRefs)), sourceRefs: unique(inputs.flatMap(r => r.sourceRefs)), calculationSourceRefs: unique(inputs.flatMap(r => r.calculationSourceRefs)) };
      return { id: candidate.candidateRef + `#m4-report[${i}]`, candidateRef: candidate.candidateRef, templateId, templateVersion: M4_PATTERN_VERSION, assessmentRefs: usesAssessment ? [assessment.id] : [], conditionRefs: selected.map(c => c.id), ...combined, text };
    });
    return { candidateRef: candidate.candidateRef, candidateIndex: candidate.candidateIndex, pillars: candidate.pillars.map(p => p.stem + p.branch).join("·"), items };
  });
  return { schemaVersion: "ko-m4-zhengguan-structure-report-v1", templateVersion: M4_PATTERN_VERSION, profileId: M4_PATTERN_PROFILE_ID, title: "정관격 구조 분석 — 로컬 연구 v0.1", candidates, scopeNote: "정관의 존재, 월령 기반 구조 후보, 성패 관련 조건의 관측과 실제 성패 효력은 별개입니다. 이번 결과는 成格·破格·救應·격국 품질·신강약·도움이 되는 용신·길흉·사건 예측이나 상용 출시를 확정하지 않습니다. 기존 원국 후보와 분 정밀도 경계를 유지하며 판본·권리·외부 예측 타당성은 인증하지 않았습니다." };
}
const reports = new WeakMap<object, M4ZhengguanStructureResult>();
export function explainM4ZhengguanStructure(result: M4ZhengguanStructureResult) { const report = freeze(reportContent(result)); reports.set(report, result); return report; }
export type M4ZhengguanStructureReport = ReturnType<typeof explainM4ZhengguanStructure>;
export function validateM4ZhengguanExplanation(report: unknown, result: M4ZhengguanStructureResult): true { if (report !== null && typeof report === "object" && reports.get(report) === result) { validateM4ZhengguanStructure(result); return true; } check(equal(report, reportContent(result)), "M4_REPORT_CONTENT_OR_REFERENCES_CHANGED"); return true; }
export function renderM4ZhengguanText(report: M4ZhengguanStructureReport): string { const result = reports.get(report); check(result, "M4_ISSUED_REPORT_REQUIRED"); validateM4ZhengguanExplanation(report, result); return [report.title, `선택 정책: ${report.profileId} / ${report.templateVersion}`, ...report.candidates.flatMap(c => [`\n후보 ${c.candidateIndex + 1}: ${c.pillars}`, ...c.items.map(i => i.text)]), "\n" + report.scopeNote, ""].join("\n"); }
