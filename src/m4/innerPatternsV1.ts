import { MONTH_BRANCH_BY_JIE, type MonthBoundaryJie } from "../calendar/monthPillar.js";
import { hiddenStemsForBranch, HIDDEN_STEM_POLICY_V1, HIDDEN_STEM_RULE } from "../domain/hiddenStems.js";
import { fiveElementRelation, type ElementRelation, type TenGod } from "../domain/tenGods.js";
import { M3_EVIDENCE_PROFILE_ID, M3_EVIDENCE_VERSION, validateM3EvidenceInputContext, type M3EvidenceResult, type M3InputEnvelope, type M3StemLocation, type M3EvidenceRecord } from "../m3/structuralEvidenceV1.js";
import { M4_PATTERN_METADATA } from "./zhengguanStructureV1.js";

export const M4_INNER_PATTERN_PROFILE_ID = "M4-INNER-EIGHT-MONTH-STRUCTURE-V01" as const;
export const M4_INNER_PATTERN_VERSION = "0.1.0" as const;
export const M4_INNER_PATTERN_SCHEMA = "m4-inner-eight-month-structure-v1" as const;
export const M4_INNER_PATTERN_TYPES = ["正官", "七殺", "正財", "偏財", "正印", "偏印", "食神", "傷官"] as const;
export type M4InnerPatternType = typeof M4_INNER_PATTERN_TYPES[number];
const PROJECT = "M4-INNER-PROJECT-POLICY-V01";
const SELECT = "M4-INNER-RULE-MONTH-SELECTION-001", EXPOSE = "M4-INNER-RULE-EXACT-EXPOSURE-001";
const PEER = "M4-INNER-RULE-PEER-MAIN-EXCLUSION-001", COMPAT = "M4-INNER-RULE-WU-OTHER-COMPATIBILITY-001";
const OBSERVE = "M4-INNER-RULE-PATTERN-SPECIFIC-DIRECTIONS-001", EFFECT = "M4-INNER-RULE-EFFECT-DEFERRAL-001";
const YONGSHEN = "M4-ZPZQ-ORIGINAL-YONGSHEN-NCC", BIANHUA = "M4-ZPZQ-ORIGINAL-BIANHUA-NCC";
const ROLES = ["year", "month", "day", "hour"] as const;
const ROLE_KO = {year:"연", month:"월", day:"일", hour:"시"} as const;
const TYPE_KO: Record<M4InnerPatternType, string> = {正官:"정관", 七殺:"칠살", 正財:"정재", 偏財:"편재", 正印:"정인", 偏印:"편인", 食神:"식신", 傷官:"상관"};
const unique = (values: readonly string[]) => [...new Set(values)];
function check(ok: unknown, code: string): asserts ok { if (!ok) throw new RangeError(code); }
function denseTree(value: unknown): void {
  if (value === null || typeof value !== "object") return;
  if (Array.isArray(value)) check(Array.from({length:value.length}, (_, i) => Object.hasOwn(value, i)).every(Boolean), "M4_INNER_DENSE_ARRAY_REQUIRED");
  Object.values(value).forEach(denseTree);
}
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) { denseTree(value); Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
function equal(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object" || Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
  return ka.length === kb.length && ka.every((k, i) => k === kb[i] && equal((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}
function copy<T>(value:T):T { if(value === null || typeof value !== "object") return value; return (Array.isArray(value) ? value.map(copy) : Object.fromEntries(Object.entries(value).map(([key,v]) => [key,copy(v)]))) as T; }
const rule = (id: string, meaning: string, contextSources: readonly string[] = []) => ({
  id, runtimeVersion:M4_INNER_PATTERN_VERSION, sourceRuleVersion:null,
  kind:"PROJECT_POLICY", policyIds:[M4_INNER_PATTERN_PROFILE_ID], sourceIds:[PROJECT, ...contextSources], meaning,
});
export const M4_INNER_PATTERN_METADATA = freeze({
  id:M4_INNER_PATTERN_PROFILE_ID, version:M4_INNER_PATTERN_VERSION, schemaVersion:M4_INNER_PATTERN_SCHEMA,
  kind:"OPT_IN_PROJECT_MONTH_INNER_EIGHT_STRUCTURE", patternTypes:M4_INNER_PATTERN_TYPES,
  dependencies:[{id:M3_EVIDENCE_PROFILE_ID,version:M3_EVIDENCE_VERSION},{id:HIDDEN_STEM_POLICY_V1,version:HIDDEN_STEM_RULE.version}],
  selectionAuthority:"PROJECT_POLICY_NOT_A_COMMON_CLASSICAL_FORMATION_ALGORITHM",
  mainQiMeaning:"EXISTING_NAMED_MAIN_MEMBER_NOT_FORCE_COMMANDING_DAYS_OR_SCORE",
  primaryMeaning:"PROJECT_DISPLAY_ANCHOR_MAIN_QI_ONLY_NOT_EXCLUSIVE_OR_COMPLETED_PATTERN",
  exactExposureMeaning:"EXACT_CHARACTER_AT_YEAR_MONTH_HOUR_DAY_MASTER_MATCH_RETAINED_SEPARATELY",
  peerMainPolicy:"BIJIAN_JIECAI_MAIN_OUT_OF_SCOPE_OTHER_EXPOSURE_RETAINED_WITH_NO_PRIMARY_SELECTION",
  wuOtherPolicy:"CONSERVATIVE_PROJECT_COMPATIBILITY_DEFERRAL_FOR_EXISTING_WU_OTHER_JI_ACROSS_EIGHT_TYPES_PRESERVES_LEGACY_OFFICER_SCOPE",
  observationMeaning:"TEN_GOD_LOCATIONS_AND_EXISTING_FIVE_ELEMENT_DIRECTIONS_ONLY_SUPPORT_OR_ADVERSE_REVIEW_LABELS_DO_NOT_ASSERT_EFFECT",
  relationOperandMeaning:"FROM_LOCATION_ELEMENT_TO_LOCATION_ELEMENT_HELPER_ENUM_DAY_MASTER_NAMES_ARE_OPERAND_LABELS",
  sources:[
    ...M4_PATTERN_METADATA.sources.filter(s => s.id === YONGSHEN || s.id === BIANHUA),
    {id:PROJECT, kind:"PROJECT_IMPLEMENTATION_DEFINITION", version:M4_INNER_PATTERN_VERSION,
      implementationRef:"src/m4/innerPatternsV1.ts", policyRef:"docs/research/M4_INNER_PATTERNS_POLICY_V01.md",
      dependencyRefs:["src/domain/hiddenStems.ts#hiddenStemsForBranch","src/domain/tenGods.ts#fiveElementRelation","src/m3/structuralEvidenceV1.ts"],
      textualContextRef:"docs/research/M4_ZHENGGUAN_STRUCTURE_POLICY_V01.md",
      use:"NEW_PROJECT_SELECTION_AND_OBSERVATIONAL_DIRECTIONS_NOT_TEXTUALLY_VERIFIED_EIGHT_PATTERN_EFFICACY"},
  ],
  rules:[
    rule(SELECT,"MAIN_QI_CANDIDATE_REGARDLESS_SURFACE_WITH_EXPOSED_OTHER_CANDIDATES_PRESERVED",[YONGSHEN]),
    rule(EXPOSE,"OTHER_REQUIRES_EXACT_NON_DAY_CHARACTER_LINK_COMPETITION_NEVER_ERASES_CANDIDATE",[BIANHUA]),
    rule(PEER,"NO_FORCED_EIGHT_TYPE_NO_JIANLU_YANGREN_AND_PEER_MAIN_OTHER_EXPOSURE_SELECTION_UNRESOLVED"),
    rule(COMPAT,"NEW_CONSERVATIVE_PROJECT_SCOPE_WU_OTHER_JI_SELECTION_DEFERRED_EXPOSURE_FACTS_KEPT"),
    rule(OBSERVE,"PATTERN_SPECIFIC_TEN_GOD_AND_FIVE_ELEMENT_POSITION_DIRECTIONS_NOT_FORMATION_CONDITIONS"),
    rule(EFFECT,"NO_FORMATION_BREAK_RESCUE_USEFUL_GOD_STRENGTH_WEIGHTS_OR_PREDICTION"),
  ],
  excluded:["GE_CHENG","GE_BAI","JIU_YING","JIANLU","YANGREN","M5_USEFUL_GOD","STRENGTH_UPGRADE","WEIGHTS","COMBINATION_TRANSFORMATION","PREDICTION"],
});

interface Context { readonly evidence:M3EvidenceResult; readonly m2Facts:M3InputEnvelope; }
interface References {
  readonly inputFactRefs:readonly string[]; readonly inputEvidenceRefs:readonly string[]; readonly inputMemberRefs:readonly string[];
  readonly locationRefs:readonly string[]; readonly pillarRefs:readonly string[]; readonly ruleRefs:readonly string[];
  readonly policyRefs:readonly string[]; readonly sourceRefs:readonly string[]; readonly calculationSourceRefs:readonly string[];
}
type Candidate = M3EvidenceResult["candidates"][number];
function validateContext({evidence,m2Facts}:Context):void {
  validateM3EvidenceInputContext(evidence,m2Facts); denseTree(m2Facts);
  check(evidence.policy.id === M3_EVIDENCE_PROFILE_ID && evidence.policy.version === M3_EVIDENCE_VERSION && m2Facts.policyBundle.id === "m2-basic-classification-local-v1" && m2Facts.policyBundle.version === "1", "M4_INNER_DEPENDENCY_PROFILE_MISMATCH");
  check(m2Facts.policyBundle.policies.hiddenStems?.id === HIDDEN_STEM_POLICY_V1 && m2Facts.rules.find(r => r.id === HIDDEN_STEM_RULE.ruleId)?.runtimeVersion === HIDDEN_STEM_RULE.version, "M4_INNER_HIDDEN_POLICY_VERSION_MISMATCH");
  check(evidence.candidates.length === m2Facts.candidates.length, "M4_INNER_PARENT_COUNT_MISMATCH");
  check(!M4_INNER_PATTERN_METADATA.rules.some(r => evidence.rules.some(up => up.id === r.id)) && !M4_INNER_PATTERN_METADATA.sources.some(s => evidence.sources.some(up => up.id === s.id)), "M4_INNER_REGISTRY_COLLISION");
  evidence.candidates.forEach((c, i) => {
    check(c.candidateRef === `chart.candidates[${i}]` && c.candidateIndex === i && m2Facts.candidates[i]?.id === c.candidateRef, "M4_INNER_CROSS_PARENT");
    check(MONTH_BRANCH_BY_JIE[c.monthContext.activeSince.term as MonthBoundaryJie] === c.monthContext.monthPillar.branch, "M4_INNER_MONTH_JIE_MISMATCH");
    ROLES.forEach((role,p) => {
      const pillar = m2Facts.candidates[i]!.pillars[p]!;
      const expected = hiddenStemsForBranch(pillar.branch,HIDDEN_STEM_POLICY_V1);
      const actual = Object.values(c.directionalGroups).flat().filter(l => l.locationKind === "HIDDEN_STEM" && l.pillarRole === role).sort((a,b) => a.index! - b.index!);
      check(pillar.role === role && actual.length === expected.length && actual.every((l,j) => l.stem === expected[j]!.stem && l.position === expected[j]!.position && l.index === j), "M4_INNER_COMPLETE_SELECTED_MEMBERS_REQUIRED");
    });
  });
}
function references(locations:readonly M3StemLocation[], records:readonly M3EvidenceRecord[], ownRules:readonly string[]):References {
  return {
    inputFactRefs:unique([...locations.flatMap(l => l.inputFactRefs),...records.flatMap(r => r.inputFactRefs)]),
    inputEvidenceRefs:unique(records.map(r => r.id)), inputMemberRefs:unique([...locations.flatMap(l => l.inputMemberRef ? [l.inputMemberRef] : []),...records.flatMap(r => r.inputMemberRefs)]),
    locationRefs:unique(locations.map(l => l.locationId)),pillarRefs:unique([...locations.map(l => l.pillarRef),...records.flatMap(r => r.pillarRefs)]),
    ruleRefs:unique([...ownRules,...locations.flatMap(l => l.ruleRefs),...records.flatMap(r => r.ruleRefs)]),
    policyRefs:unique([M4_INNER_PATTERN_PROFILE_ID,...locations.flatMap(l => l.policyRefs),...records.flatMap(r => r.policyRefs)]),
    sourceRefs:unique([...M4_INNER_PATTERN_METADATA.rules.filter(r => ownRules.includes(r.id)).flatMap(r => r.sourceIds),...locations.flatMap(l => l.sourceRefs),...records.flatMap(r => r.sourceRefs)]),
    calculationSourceRefs:unique([...locations.flatMap(l => l.calculationSourceRefs),...records.flatMap(r => r.calculationSourceRefs)]),
  };
}
const isPattern = (god:TenGod|null):god is M4InnerPatternType => god !== null && (M4_INNER_PATTERN_TYPES as readonly string[]).includes(god);
interface ObservationSpec {
  readonly kind:string; readonly text:string; readonly reviewRole:"SUPPORT_REVIEW"|"ADVERSE_REVIEW"|"CONTROL_REVIEW"|"COEXISTENCE_REVIEW";
  readonly from:readonly TenGod[]|"PATTERN"; readonly to:readonly TenGod[]|"PATTERN"|"DAY_MASTER";
  readonly relation:ElementRelation;
}
// These descriptions name concrete directed observations, never an efficacy rule.
function observationSpecs(type:M4InnerPatternType):readonly ObservationSpec[] {
  const s = (kind:string,text:string,reviewRole:ObservationSpec["reviewRole"],from:ObservationSpec["from"],to:ObservationSpec["to"],relation:ElementRelation = "DAY_MASTER_GENERATES"):ObservationSpec => ({kind,text,reviewRole,from,to,relation});
  switch(type) {
    case "正官": return [
      s("WEALTH_GENERATES_OFFICER","재성→정관의 생 방향","SUPPORT_REVIEW",["正財","偏財"],"PATTERN"),
      s("OFFICER_GENERATES_RESOURCE","정관→인성의 생 방향","SUPPORT_REVIEW","PATTERN",["正印","偏印"]),
      s("HURTING_OFFICER_CONTROLS_OFFICER","상관→정관의 극 방향","ADVERSE_REVIEW",["傷官"],"PATTERN","DAY_MASTER_CONTROLS"),
      s("OFFICER_KILLINGS_COEXISTENCE","정관·칠살의 서로 다른 십성 위치 병존","COEXISTENCE_REVIEW",["七殺"],"PATTERN","SAME"),
    ];
    case "七殺": return [
      s("OUTPUT_CONTROLS_KILLINGS","식상→칠살의 극 방향","CONTROL_REVIEW",["食神","傷官"],"PATTERN","DAY_MASTER_CONTROLS"),
      s("KILLINGS_GENERATE_RESOURCE","칠살→인성의 생 방향","SUPPORT_REVIEW","PATTERN",["正印","偏印"]),
      s("WEALTH_GENERATES_KILLINGS","재성→칠살의 생 방향","COEXISTENCE_REVIEW",["正財","偏財"],"PATTERN"),
    ];
    case "正財": case "偏財": return [
      s("OUTPUT_GENERATES_WEALTH","식상→재성의 생 방향","SUPPORT_REVIEW",["食神","傷官"],"PATTERN"),
      s("PEER_CONTROLS_WEALTH","비겁→재성의 극 방향","ADVERSE_REVIEW",["比肩","劫財"],"PATTERN","DAY_MASTER_CONTROLS"),
      s("WEALTH_CONTROLS_RESOURCE","재성→인성의 극 방향","CONTROL_REVIEW","PATTERN",["正印","偏印"],"DAY_MASTER_CONTROLS"),
    ];
    case "正印": case "偏印": return [
      s("OFFICER_KILLINGS_GENERATE_RESOURCE","관살→인성의 생 방향","SUPPORT_REVIEW",["正官","七殺"],"PATTERN"),
      s("RESOURCE_GENERATES_DAY_MASTER","인성→일간의 생 방향","SUPPORT_REVIEW","PATTERN","DAY_MASTER"),
      s("WEALTH_CONTROLS_RESOURCE","재성→인성의 극 방향","ADVERSE_REVIEW",["正財","偏財"],"PATTERN","DAY_MASTER_CONTROLS"),
      ...(type === "偏印" ? [s("INDIRECT_RESOURCE_CONTROLS_FOOD","편인→식신의 극 방향","ADVERSE_REVIEW","PATTERN",["食神"],"DAY_MASTER_CONTROLS")] : []),
    ];
    case "食神": return [
      s("PEER_GENERATES_FOOD","비겁→식신의 생 방향","SUPPORT_REVIEW",["比肩","劫財"],"PATTERN"),
      s("FOOD_GENERATES_WEALTH","식신→재성의 생 방향","SUPPORT_REVIEW","PATTERN",["正財","偏財"]),
      s("RESOURCE_CONTROLS_FOOD","인성→식신의 극 방향","ADVERSE_REVIEW",["正印","偏印"],"PATTERN","DAY_MASTER_CONTROLS"),
      s("FOOD_CONTROLS_KILLINGS","식신→칠살의 극 방향","CONTROL_REVIEW","PATTERN",["七殺"],"DAY_MASTER_CONTROLS"),
    ];
    case "傷官": return [
      s("PEER_GENERATES_HURTING_OFFICER","비겁→상관의 생 방향","SUPPORT_REVIEW",["比肩","劫財"],"PATTERN"),
      s("HURTING_OFFICER_GENERATES_WEALTH","상관→재성의 생 방향","SUPPORT_REVIEW","PATTERN",["正財","偏財"]),
      s("RESOURCE_CONTROLS_HURTING_OFFICER","인성→상관의 극 방향","CONTROL_REVIEW",["正印","偏印"],"PATTERN","DAY_MASTER_CONTROLS"),
      s("HURTING_OFFICER_CONTROLS_OFFICER_KILLINGS","상관→관살의 극 방향","CONTROL_REVIEW","PATTERN",["正官","七殺"],"DAY_MASTER_CONTROLS"),
    ];
  }
}
const contexts = new WeakMap<object,Context>();

/** Opt-in structural resolver; reuses issued M3 and its original M2, with no M1 work. */
export function deriveM4InnerPatterns(evidence:M3EvidenceResult, options?:{readonly profileId:string;readonly m2Facts:M3InputEnvelope}) {
  check(options?.profileId === M4_INNER_PATTERN_PROFILE_ID,"EXPLICIT_SUPPORTED_M4_INNER_PATTERN_PROFILE_REQUIRED");
  const context = {evidence,m2Facts:options.m2Facts}; validateContext(context);
  const candidates = evidence.candidates.map((candidate:Candidate,i) => {
    const locations = [...Object.values(candidate.directionalGroups).flat(),candidate.visibleDayMaster].sort((a,b) => ROLES.indexOf(a.pillarRole)-ROLES.indexOf(b.pillarRole) || (a.locationKind === "VISIBLE_STEM" ? -1 : b.locationKind === "VISIBLE_STEM" ? 1 : a.index!-b.index!));
    const monthMembers = candidate.monthContext.hiddenMembers, main = candidate.monthContext.principalHiddenMember;
    const monthRecords = candidate.evidence.filter(r => r.kind === "MONTH_CONTEXT" || r.kind === "HIDDEN_VISIBLE_LINKS");
    const directionalRecords = candidate.evidence.filter(r => r.kind === "DIRECTIONAL_GROUP");
    const monthExposures = candidate.hiddenVisibleLinks.filter(l => l.hidden.pillarRole === "month");
    const nonDayExposures = monthExposures.filter(l => l.visible.pillarRole !== "day");
    const competingExposures = nonDayExposures.filter(l => l.hidden.locationId !== main.locationId);
    const patterns = M4_INNER_PATTERN_TYPES.map(patternType => {
      const members = monthMembers.filter(l => l.tenGod === patternType);
      const exactExposures = nonDayExposures.filter(l => l.hidden.tenGod === patternType);
      const mainMember = members.some(l => l.position === "MAIN_QI");
      const compatibility = candidate.monthContext.monthPillar.branch === "午" && members.some(l => l.stem === "己" && l.position === "OTHER");
      const status = compatibility ? "SOURCE_OR_POLICY_UNRESOLVED" as const : mainMember || exactExposures.length ? "STRUCTURAL_CANDIDATE" as const : "NOT_A_CANDIDATE_UNDER_POLICY" as const;
      const basis = compatibility ? "WU_OTHER_MEMBER_COMPATIBILITY_DEFERRED" as const : mainMember ? "MAIN_QI" as const : exactExposures.length ? "EXACT_NON_DAY_EXPOSED_OTHER" as const : members.length ? "OTHER_NOT_EXPOSED" as const : "NO_MONTH_MEMBER" as const;
      const assessment = {id:`${candidate.candidateRef}#m4-inner-${patternType}-assessment`,status,basis,
        ...references([...monthMembers,...exactExposures.map(l => l.visible)],monthRecords,[SELECT,EXPOSE,...(compatibility ? [COMPAT] : [])])};
      const presence = locations.filter(l => l.tenGod === patternType);
      const select = (selector:ObservationSpec["to"]) => selector === "PATTERN" ? presence : selector === "DAY_MASTER" ? [candidate.visibleDayMaster] : locations.filter(l => l.tenGod !== null && selector.includes(l.tenGod));
      const observations = observationSpecs(patternType).map(spec => {
        const from = select(spec.from), to = select(spec.to);
        const links = from.flatMap(a => to.filter(b => a.locationId !== b.locationId && fiveElementRelation(a.element,b.element) === spec.relation).map(b => ({
          id:`${candidate.candidateRef}#m4-inner-${patternType}-${spec.kind}:${a.locationId}:${b.locationId}`,
          from:a,to:b,relation:fiveElementRelation(a.element,b.element),relationBasis:"FROM_LOCATION_TO_LOCATION" as const,effectStatus:"NOT_EVALUATED" as const,
        })));
        const observedLocations = links.flatMap(l => [l.from,l.to]);
        return {id:`${candidate.candidateRef}#m4-inner-${patternType}-${spec.kind}`,kind:spec.kind,description:spec.text,reviewRole:spec.reviewRole,
          status:links.length ? "OBSERVED" as const : "NOT_OBSERVED" as const,links,effectStatus:"NOT_EVALUATED" as const,
          ...references(links.length ? observedLocations : locations,directionalRecords,[OBSERVE,EFFECT])};
      });
      return {patternType,patternNameKo:TYPE_KO[patternType],assessment,monthMembers:members,exactExposures,
        presence:{visible:presence.filter(l => l.locationKind === "VISIBLE_STEM"),hidden:presence.filter(l => l.locationKind === "HIDDEN_STEM")},observations,
        competition:{exposures:nonDayExposures.filter(l => !members.some(m => m.locationId === l.hidden.locationId)),selectionEffect:"NOT_EVALUATED" as const},
        effectStatus:"NOT_EVALUATED" as const};
    });
    const candidateTypes = patterns.filter(p => p.assessment.status === "STRUCTURAL_CANDIDATE").map(p => p.patternType);
    const unresolvedTypes = patterns.filter(p => p.assessment.status === "SOURCE_OR_POLICY_UNRESOLVED").map(p => p.patternType);
    const primaryPattern = isPattern(main.tenGod) ? main.tenGod : null;
    const peerMain = main.tenGod === "比肩" || main.tenGod === "劫財";
    const peerMainAmbiguity = peerMain && nonDayExposures.some(l => l.hidden.position === "OTHER" && isPattern(l.hidden.tenGod));
    const selection = {id:candidate.candidateRef+"#m4-inner-selection",primaryPattern,candidateTypes,unresolvedTypes,
      status:peerMain ? peerMainAmbiguity ? "PEER_MAIN_WITH_EXPOSED_OTHER_UNRESOLVED" as const : "PEER_MAIN_OUT_OF_SCOPE" as const : competingExposures.length ? "MAIN_QI_WITH_COMPETING_EXPOSURES" as const : "MAIN_QI_STRUCTURAL_ANCHOR" as const,
      peerMainAmbiguity,exclusivePatternDecision:"NOT_EVALUATED" as const,
      ...references([...monthMembers,...nonDayExposures.map(l => l.visible)],monthRecords,[SELECT,EXPOSE,PEER,...(unresolvedTypes.length ? [COMPAT] : []),EFFECT])};
    return {candidateRef:candidate.candidateRef,candidateIndex:i,dayMaster:candidate.dayMaster,
      pillars:copy(context.m2Facts.candidates[i]!.pillars),monthContext:candidate.monthContext,patterns,selection,
      monthBasis:{monthMembers,memberExposures:monthExposures,nonDayExposures,competingExposures,
        dayMasterOnlyMatches:monthExposures.filter(l => l.visible.pillarRole === "day" && !nonDayExposures.some(n => n.hidden.locationId === l.hidden.locationId))},
      relations:candidate.relationContext,
      trace:{selectionRef:selection.id,patternAssessmentRefs:patterns.map(p => p.assessment.id),observationRefs:patterns.flatMap(p => p.observations.map(o => o.id)),upstreamEvidenceRefs:candidate.evidence.map(e => e.id)},
      effects:{status:"NOT_EVALUATED" as const,geCheng:"NOT_IMPLEMENTED" as const,geBai:"NOT_IMPLEMENTED" as const,jiuYing:"NOT_IMPLEMENTED" as const,m5:"NOT_IMPLEMENTED" as const},
      exclusions:[...M4_INNER_PATTERN_METADATA.excluded]};
  });
  const result = freeze({schemaVersion:M4_INNER_PATTERN_SCHEMA,status:"STRUCTURAL_ANALYSIS_ONLY" as const,
    profile:M4_INNER_PATTERN_METADATA,upstreamPolicyBundle:evidence.upstreamPolicyBundle,upstreamFinalStrength:evidence.finalStrength,
    candidates,rules:[...evidence.rules,...M4_INNER_PATTERN_METADATA.rules],sources:[...evidence.sources,...M4_INNER_PATTERN_METADATA.sources],
    validation:{level:"SAME_PROCESS_M3_M2_CONTEXT_AND_SELECTED_MEMBER_CONSISTENCY",externalAuthentication:"NOT_PERFORMED_BY_PURE_MODULE",editionVerification:"UNVERIFIED",rightsReview:"UNVERIFIED",predictiveValidity:"NOT_CLAIMED",g1P2Promotion:false,m3FinalGate:"BLOCKED_UNCHANGED",m4FinalEffectGate:"BLOCKED_UNCHANGED"}});
  contexts.set(result,context); return result;
}
export type M4InnerPatternsResult = ReturnType<typeof deriveM4InnerPatterns>;
export function validateM4InnerPatterns(result:M4InnerPatternsResult, expected:Partial<Context> = {}):true {
  const context = contexts.get(result); check(context && Object.isFrozen(result),"M4_INNER_ISSUED_IMMUTABLE_RESULT_REQUIRED");
  for (const key of ["evidence","m2Facts"] as const) if(expected[key] !== undefined) check(expected[key] === context[key],"M4_INNER_FOREIGN_EXECUTION_CONTEXT");
  validateContext(context); return true;
}

function locationsText(locations:readonly M3StemLocation[]):string {
  return locations.map(l => ROLE_KO[l.pillarRole]+(l.locationKind === "VISIBLE_STEM" ? "간 " : "지 장간 ")+l.stem).join("·") || "없음";
}
const reports = new WeakMap<object,M4InnerPatternsResult>();
function reportContent(result:M4InnerPatternsResult) {
  validateM4InnerPatterns(result);
  return {schemaVersion:"m4-inner-eight-korean-explanation-v1",profileId:M4_INNER_PATTERN_PROFILE_ID,templateVersion:M4_INNER_PATTERN_VERSION,
    title:"월령 기반 내격8 구조 관측",candidates:result.candidates.map(c => {
      const selectionText = c.selection.primaryPattern ? `월령 본기 ${c.monthContext.principalHiddenMember.stem}의 ${TYPE_KO[c.selection.primaryPattern]}을 이 프로젝트의 표시 기준으로 둡니다.` : `월령 본기는 ${c.monthContext.principalHiddenMember.tenGod}입니다. 비겁 본기는 내격8 선택 범위 밖이며 건록·양인을 판정하지 않습니다.`;
      const competitionText = c.selection.peerMainAmbiguity ? " 다른 월령 장간의 정확 투출 사실은 보존하지만 비겁 본기와의 선택은 미정입니다." : c.monthBasis.competingExposures.length ? " 다른 월령 장간의 정확 투출도 보존하며 단독 취격을 확정하지 않습니다." : "";
      const items = [{id:c.candidateRef+"#ko-inner-selection",templateId:"KO_M4_INNER_SELECTION",text:selectionText+competitionText,
        assessmentRefs:[c.selection.id],observationRefs:[] as string[],...references([],[],[]),...Object.fromEntries(Object.keys(c.selection).filter(k => k.endsWith("Refs")).map(k => [k,c.selection[k as keyof typeof c.selection]]))}];
      for (const p of c.patterns) {
        const state = p.assessment.status === "STRUCTURAL_CANDIDATE" ? p.assessment.basis === "MAIN_QI" ? "본기 근거 구조 후보" : "OTHER의 연·월·시 정확 투출 근거 구조 후보" : p.assessment.status === "SOURCE_OR_POLICY_UNRESOLVED" ? "午 OTHER 己의 새 프로젝트 호환 정책 보류" : p.assessment.basis === "OTHER_NOT_EXPOSED" ? "월령 장간은 있으나 정확 비일간 투출이 없어 이 정책의 후보 아님" : "월령 장간에 없어 이 정책의 후보 아님";
        items.push({id:c.candidateRef+"#ko-inner-"+p.patternType,templateId:"KO_M4_INNER_PATTERN",text:`${p.patternNameKo}(${p.patternType}): ${state}. 정확 투출 위치: ${locationsText(p.exactExposures.map(l => l.visible))}.`,assessmentRefs:[p.assessment.id],observationRefs:[],...references([],[],[]),...Object.fromEntries(Object.keys(p.assessment).filter(k => k.endsWith("Refs")).map(k => [k,p.assessment[k as keyof typeof p.assessment]]))});
        if(p.assessment.status !== "NOT_A_CANDIDATE_UNDER_POLICY") for(const o of p.observations) items.push({id:c.candidateRef+"#ko-inner-observation-"+p.patternType+o.kind,templateId:"KO_M4_INNER_DIRECTION",text:`${p.patternNameKo}: ${o.description} ${o.status === "OBSERVED" ? "관측. "+locationsText(uniqueLocations(o.links.flatMap(l => [l.from,l.to]))) : "미관측"}. 실제 생조·제어 효력은 평가하지 않습니다.`,assessmentRefs:[],observationRefs:[o.id],...references([],[],[]),...Object.fromEntries(Object.keys(o).filter(k => k.endsWith("Refs")).map(k => [k,o[k as keyof typeof o]]))});
      }
      return {candidateRef:c.candidateRef,candidateIndex:c.candidateIndex,pillars:c.pillars.map(p => p.stem+p.branch).join("·"),items};
    }),scopeNote:"공통 본기·정확 투출 선택은 PROJECT_POLICY입니다. 구조의 지원·방해 검토 표시는 실제 유리·불리나 成格·破格·救應을 뜻하지 않습니다. 실제 효력은 평가하지 않으며 강약·점수·용신을 계산하지 않습니다."};
}
function uniqueLocations(locations:readonly M3StemLocation[]):M3StemLocation[] { return [...new Map(locations.map(l => [l.locationId,l])).values()]; }
export function explainM4InnerPatterns(result:M4InnerPatternsResult) { const report = freeze(reportContent(result)); reports.set(report,result); return report; }
export type M4InnerPatternsReport = ReturnType<typeof explainM4InnerPatterns>;
export function validateM4InnerPatternsExplanation(report:unknown,result:M4InnerPatternsResult):true {
  denseTree(report); check(equal(report,reportContent(result)),"M4_INNER_EXPLANATION_CONTENT_OR_REFERENCES_CHANGED"); return true;
}
export function renderM4InnerPatternsText(report:M4InnerPatternsReport):string {
  const result = reports.get(report); check(result,"M4_INNER_ISSUED_REPORT_REQUIRED"); validateM4InnerPatternsExplanation(report,result);
  return [report.title,`선택 정책: ${report.profileId} / ${report.templateVersion}`,...report.candidates.flatMap(c => [`\n후보 ${c.candidateIndex+1}: ${c.pillars}`,...c.items.map(i => i.text)]),"\n"+report.scopeNote,""].join("\n");
}
