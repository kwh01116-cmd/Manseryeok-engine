import { HIDDEN_STEM_POLICY_V1, HIDDEN_STEM_RULE, hiddenStemsForBranch } from "../domain/hiddenStems.js";
import { HEAVENLY_STEMS, STEM_NATURE } from "../domain/stems.js";
import { M3_EVIDENCE_PROFILE_ID, M3_EVIDENCE_VERSION, validateM3EvidenceInputContext, type M3EvidenceResult, type M3InputEnvelope, type M3StemLocation } from "../m3/structuralEvidenceV1.js";
import { M3_SEASONAL_SILI_POLICY_ID, M3_SEASONAL_SILI_VERSION, validateSeasonalSiliState, type SeasonalSiliStateResult } from "../m3/seasonalStateV2.js";
import { validateM4InnerPatterns, type M4InnerPatternsResult } from "../m4/innerPatternsV1.js";

export const M5_LIMITED_PURPOSE_POLICY_ID="M5-WINTER-WOOD-WARMING-CANDIDATE-V01" as const;
export const M5_LIMITED_PURPOSE_VERSION="0.1.0" as const;
export const M5_LIMITED_PURPOSE_SCHEMA="m5-limited-purpose-winter-wood-v1" as const;
const PURPOSE="WINTER_WOOD_WARMING_REVIEW" as const;
const ORIGINAL="M5-ZPZQ-CLIMATE-NCC-ORIGINAL",COMMENTARY="M5-ZPZQ-CLIMATE-NCC-XU",PROJECT="M5-PROJECT-WINTER-WOOD-WARMING-001",OSS="M5-OSS-KOREAN-SAJU-JOHU-COMPARISON";
const SCOPE="M5-RULE-WINTER-WOOD-SCOPE-001",CANDIDATE="M5-RULE-WARMING-REVIEW-CANDIDATE-001",GUARD="M5-RULE-PRESENT-FIRE-ADOPTION-HOLD-001",CONTEXT="M5-RULE-SAME-PARENT-INPUT-001",LIMIT="M5-RULE-PURPOSE-NOT-FINAL-USEFUL-GOD-001";
const ROLES=["year","month","day","hour"] as const;
const ROLE_NAMES={year:"연",month:"월",day:"일",hour:"시"} as const;
const unique=(v:readonly string[])=>[...new Set(v)];
function check(ok:unknown,code:string):asserts ok {if(!ok)throw new RangeError(code);}
function dense(value:unknown):void {if(value===null||typeof value!=="object")return;if(Array.isArray(value))check(Array.from({length:value.length},(_,i)=>Object.hasOwn(value,i)).every(Boolean),"M5_DENSE_ARRAY_REQUIRED");Object.values(value).forEach(dense);}
function freeze<T>(value:T):T {if(value!==null&&typeof value==="object"&&!Object.isFrozen(value)){dense(value);Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function equal(a:unknown,b:unknown):boolean {if(a===b)return true;if(a===null||b===null||typeof a!=="object"||typeof b!=="object"||Array.isArray(a)!==Array.isArray(b))return false;const ka=Object.keys(a).sort(),kb=Object.keys(b).sort();return ka.length===kb.length&&ka.every((k,i)=>k===kb[i]&&equal((a as Record<string,unknown>)[k],(b as Record<string,unknown>)[k]));}
const rule=(id:string,meaning:string,sources:readonly string[])=>({id,runtimeVersion:M5_LIMITED_PURPOSE_VERSION,sourceRuleVersion:null,kind:"PROJECT_POLICY",policyIds:[M5_LIMITED_PURPOSE_POLICY_ID],sourceIds:sources,meaning});
export const M5_LIMITED_PURPOSE_METADATA=freeze({
  id:M5_LIMITED_PURPOSE_POLICY_ID,version:M5_LIMITED_PURPOSE_VERSION,schemaVersion:M5_LIMITED_PURPOSE_SCHEMA,purpose:PURPOSE,
  kind:"OPT_IN_LIMITED_PURPOSE_CANDIDATE_NOT_FINAL_USEFUL_GOD",
  scope:{dayStems:["甲","乙"],monthBranches:["亥","子"],eligibleStemMonthCells:4,totalStemMonthCells:120,calendarBasis:"EXISTING_JIE_MONTH_BRANCH_NOT_SOLAR_OR_LUNAR_MONTH_NUMBER"},
  dependencies:[{id:M3_EVIDENCE_PROFILE_ID,version:M3_EVIDENCE_VERSION},{id:HIDDEN_STEM_POLICY_V1,version:HIDDEN_STEM_RULE.version},{id:M3_SEASONAL_SILI_POLICY_ID,version:M3_SEASONAL_SILI_VERSION}],
  candidateMeaning:"FIRE_ELEMENT_FOR_WARMING_REVIEW_ONLY_NOT_A_PRESCRIPTION_TO_ADD_FIRE_OR_PROOF_OF_COLD",
  presentFireGuard:"ANY_SELECTED_VISIBLE_OR_HIDDEN_FIRE_HOLDS_AUTOMATIC_ADOPTION_SUFFICIENCY_NOT_EVALUATED",
  guardAuthority:"PROJECT_CONSERVATIVE_ADOPTION_GUARD_NOT_A_CLASSICAL_FIRE_EXCESS_OR_USELESSNESS_RULE",
  strengthAndPatternIndependence:"NO_WEIGHTED_SCORE_NO_ROOT_FORCE_NO_M4_PATTERN_SUCCESS_OR_M5_PURPOSE_MERGER",
  sources:[
    {id:ORIGINAL,kind:"CLASSICAL_TEXT_TRANSCRIPTION",title:"子平真詮",author:"沈孝瞻",section:"十四、論用神配氣候得失",url:"https://ncc.com.tw/fate/paleo/bg/bg_033.htm",accessedOn:"2026-11-14",verification:"WEB_TRANSCRIPTION_BODY_READ_NOT_SCAN_OR_CRITICAL_EDITION",nativeRuleVersion:null,rightsReview:"UNVERIFIED",use:"WINTER_WOOD_FIRE_CLIMATE_CONTEXT_NOT_A_COMPLETE_FINAL_USEFUL_GOD_ALGORITHM"},
    {id:COMMENTARY,kind:"LATER_COMMENTARY_TRANSCRIPTION",title:"子平真詮評註",author:"徐樂吾",section:"十四、論用神配氣候得失",url:"https://ncc.com.tw/fate/paleo/bg/bg_033.htm",accessedOn:"2026-11-14",verification:"SAME_PAGE_COMMENTARY_DISTINGUISHED_NOT_INDEPENDENT_SCHOOL_OR_EDITION",nativeRuleVersion:null,rightsReview:"UNVERIFIED",use:"WINTER_WOOD_BING_DING_CONTEXT_AND_CASE_DEPENDENT_USEFULNESS_LIMIT_NOT_ALL_BIOGRAPHICAL_CLAIMS"},
    {id:PROJECT,kind:"PROJECT_IMPLEMENTATION_DEFINITION",version:M5_LIMITED_PURPOSE_VERSION,implementationRef:"src/m5/limitedPurposeV1.ts",policyRef:"docs/research/M5_LIMITED_PURPOSE_POLICY_V01.md",use:"HAI_ZI_ONLY_SCOPE_COMPLETE_MEMBER_ABSENCE_AND_PRESENT_FIRE_ADOPTION_HOLD_NO_STRENGTH_EFFECT"},
    {id:OSS,kind:"AUDITED_IMPLEMENTATION_COMPARISON_NOT_ADOPTED",repository:"glee1228/korean_saju",revision:"8c81256db10d3179d31f551beacaa69f2ab2fcc5",path:"src/korean_saju/saju/johu.py",function:"JohuAnalyzer.analyze",url:"https://github.com/glee1228/korean_saju/blob/8c81256db10d3179d31f551beacaa69f2ab2fcc5/src/korean_saju/saju/johu.py",accessedOn:"2026-11-14",use:"SEASON_SCORE_FIRE_WATER_COUNTS_AND_COMBINATION_DELTAS_REVIEWED_BUT_NOT_PORTED"},
  ],
  rules:[rule(SCOPE,"WOOD_DAY_AND_HAI_ZI_MONTH_ONLY_NOT_A_WANG_XIANG_LOOKUP",[ORIGINAL,COMMENTARY,PROJECT]),rule(CANDIDATE,"NO_OBSERVED_FIRE_PER_SELECTED_HIDDEN_POLICY_ALLOWS_WARMING_REVIEW_CANDIDATE_ONLY",[ORIGINAL,COMMENTARY,PROJECT]),rule(GUARD,"PRESENT_FIRE_RETAINS_LOCATIONS_AND_HOLDS_AUTOMATIC_ADOPTION_WITHOUT_ASSERTING_EXCESS",[PROJECT]),rule(CONTEXT,"M3_M2_ISSUED_CONTEXT_COMPLETE_MEMBERS_AND_PARENT_REFERENCE_CONSISTENCY",[PROJECT]),rule(LIMIT,"PURPOSE_CANDIDATE_IS_NOT_FINAL_USEFUL_GOD_PATTERN_SUPPORT_OR_PREDICTION",[COMMENTARY,PROJECT])],
  notApplied:["BODY_STRENGTH","ROOT_FORCE","WEIGHTED_STRENGTH_SCORE","COMMANDING_QI_DAYS","COMBINATION_TRANSFORMATION","RELATION_EFFECT","WATER_FIRE_QUANTITY_WEIGHTS","FINAL_USEFUL_GOD","FAVORABLE_UNFAVORABLE_RANKING","FORTUNE","EVENT_PREDICTION"],
});
export interface M5SeasonalEnvelope {readonly policy:{readonly id:string;readonly version:string};readonly candidates:readonly {readonly candidateRef:string;readonly candidateIndex:number;readonly judgment:SeasonalSiliStateResult}[];}
interface Context {readonly evidence:M3EvidenceResult;readonly m2Facts:M3InputEnvelope;readonly seasonal:M5SeasonalEnvelope;readonly innerPatterns?:M4InnerPatternsResult;}
function locations(c:M3EvidenceResult["candidates"][number]):readonly M3StemLocation[]{return [...Object.values(c.directionalGroups).flat(),c.visibleDayMaster].sort((a,b)=>ROLES.indexOf(a.pillarRole)-ROLES.indexOf(b.pillarRole)||(a.locationKind==="VISIBLE_STEM"?-1:b.locationKind==="VISIBLE_STEM"?1:a.index!-b.index!));}
function validateContext(context:Context):void {
  const {evidence,m2Facts,seasonal,innerPatterns}=context;check(m2Facts!==undefined,"M5_ORIGINAL_M2_CONTEXT_REQUIRED");dense(m2Facts);validateM3EvidenceInputContext(evidence,m2Facts);
  check(evidence.policy.id===M3_EVIDENCE_PROFILE_ID&&evidence.policy.version===M3_EVIDENCE_VERSION,"M5_M3_POLICY_MISMATCH");
  check(m2Facts.policyBundle.policies.hiddenStems?.id===HIDDEN_STEM_POLICY_V1&&m2Facts.rules.find(r=>r.id===HIDDEN_STEM_RULE.ruleId)?.runtimeVersion===HIDDEN_STEM_RULE.version,"M5_SELECTED_HIDDEN_POLICY_REQUIRED");
  check(!M5_LIMITED_PURPOSE_METADATA.rules.some(r=>evidence.rules.some(up=>up.id===r.id))&&!M5_LIMITED_PURPOSE_METADATA.sources.some(s=>evidence.sources.some(up=>up.id===s.id)),"M5_UPSTREAM_REGISTRY_COLLISION");
  check(seasonal&&Object.isFrozen(seasonal)&&seasonal.policy.id===M3_SEASONAL_SILI_POLICY_ID&&seasonal.policy.version===M3_SEASONAL_SILI_VERSION,"M5_ISSUED_SUPPORTED_SEASONAL_CONTEXT_REQUIRED");dense(seasonal);
  check(seasonal.candidates.length===evidence.candidates.length,"M5_SEASONAL_PARENT_COUNT_MISMATCH");
  if(innerPatterns)validateM4InnerPatterns(innerPatterns,{evidence,m2Facts});
  evidence.candidates.forEach((c,i)=>{
    const all=locations(c),m2=m2Facts.candidates[i],s=seasonal.candidates[i];check(m2?.id===c.candidateRef&&c.candidateIndex===i&&c.candidateRef===`chart.candidates[${i}]`,"M5_PARENT_REFERENCE_MISMATCH");
    check(new Set(all.map(l=>l.locationId)).size===all.length,"M5_DUPLICATE_LOCATION");
    for(const [p,role]of ROLES.entries()){
      const pillar=m2.pillars[p];check(pillar?.role===role,"M5_FOUR_PILLARS_REQUIRED");const expected=hiddenStemsForBranch(pillar.branch,HIDDEN_STEM_POLICY_V1),actual=all.filter(l=>l.pillarRole===role&&l.locationKind==="HIDDEN_STEM").sort((a,b)=>a.index!-b.index!);
      check(actual.length===expected.length&&actual.every((l,j)=>l.stem===expected[j]!.stem&&l.position===expected[j]!.position&&l.index===j),"M5_COMPLETE_SELECTED_HIDDEN_MEMBERS_REQUIRED");
      check(all.filter(l=>l.pillarRole===role&&l.locationKind==="VISIBLE_STEM").length===1,"M5_VISIBLE_LOCATIONS_COMPLETE_REQUIRED");
    }
    check(s?.candidateRef===c.candidateRef&&s.candidateIndex===i,"M5_FOREIGN_SEASONAL_PARENT");const j=s.judgment;validateSeasonalSiliState(j);
    check(j.candidateRef===c.candidateRef&&j.dayMaster===c.dayMaster&&j.monthBranch===c.monthContext.monthPillar.branch&&equal(j.appliedJie,c.monthContext.activeSince),"M5_SEASONAL_INPUT_CONTEXT_MISMATCH");
    const facts=new Map(m2.facts.map(f=>[f.id,f])),records=new Set(c.evidence.map(e=>e.id));
    check(j.inputFactRefs.length>0&&j.inputFactRefs.every(id=>facts.has(id))&&j.inputEvidenceRefs.length>0&&j.inputEvidenceRefs.every(id=>records.has(id)),"M5_SEASONAL_FACT_OR_EVIDENCE_REFERENCE_MISMATCH");
    const month=c.evidence.find(e=>e.kind==="MONTH_CONTEXT");check(month&&j.inputEvidenceRefs.includes(month.id)&&equal(j.input.base.calculationSourceRefs,month.calculationSourceRefs),"M5_SEASONAL_MONTH_CONTEXT_REQUIRED");
  });
}
const contexts=new WeakMap<object,Context>();
/** Finite project adoption rule over already-issued facts; no calendar or climate-force calculation. */
export function deriveM5LimitedPurpose(evidence:M3EvidenceResult,options:{readonly policyId:string;readonly m2Facts:M3InputEnvelope;readonly seasonal:M5SeasonalEnvelope;readonly innerPatterns?:M4InnerPatternsResult}){
  check(options?.policyId===M5_LIMITED_PURPOSE_POLICY_ID,"M5_EXPLICIT_SUPPORTED_POLICY_REQUIRED");const context={evidence,m2Facts:options.m2Facts,seasonal:options.seasonal,...(options.innerPatterns?{innerPatterns:options.innerPatterns}:{})};validateContext(context);
  const candidates=evidence.candidates.map((c,i)=>{
    const m2=options.m2Facts.candidates[i]!,season=options.seasonal.candidates[i]!.judgment,all=locations(c),fire=all.filter(l=>l.element==="FIRE");
    const wood=STEM_NATURE[c.dayMaster].element==="WOOD",winterMonth=c.monthContext.monthPillar.branch==="亥"||c.monthContext.monthPillar.branch==="子",eligible=wood&&winterMonth;
    const winterConfirmed=season.status==="RESOLVED_UNDER_POLICY"&&season.alternatives.length===1&&season.alternatives[0]!.season==="WINTER";
    const reason=season.status==="NEEDS_DATA"?"SEASONAL_CONTEXT_NEEDS_DATA":!eligible?"OUTSIDE_WINTER_WOOD_SCOPE":!winterConfirmed?"SEASONAL_CONDITION_REQUIRES_REVIEW":fire.length?"PRESENT_WARMING_ELEMENT_EFFECT_UNASSESSED":"WINTER_WOOD_WITHOUT_OBSERVED_FIRE_REVIEW_CANDIDATE";
    const status=reason==="WINTER_WOOD_WITHOUT_OBSERVED_FIRE_REVIEW_CANDIDATE"?"CANDIDATE_UNDER_POLICY" as const:"HOLD" as const;
    const usedFacts=m2.facts.filter(f=>["SUMMARY","DAY_MASTER","PILLAR_NATURE","HIDDEN_STEMS","VISIBLE_TEN_GOD"].includes(f.kind)),usedRecords=c.evidence.filter(e=>e.kind==="MONTH_CONTEXT"||e.kind==="DIRECTIONAL_GROUP");
    const rules=[CONTEXT,SCOPE,LIMIT,...(eligible?[GUARD]:[]),...(status==="CANDIDATE_UNDER_POLICY"?[CANDIDATE]:[])];
    const refs={inputFactRefs:unique(usedFacts.map(f=>f.id)),inputEvidenceRefs:usedRecords.map(e=>e.id),inputMemberRefs:unique(all.flatMap(l=>l.inputMemberRef?[l.inputMemberRef]:[])),pillarRefs:ROLES.map(r=>c.candidateRef+'.'+r),ruleRefs:unique([...rules,...usedRecords.flatMap(e=>e.ruleRefs)]),policyRefs:unique([M5_LIMITED_PURPOSE_POLICY_ID,...usedRecords.flatMap(e=>e.policyRefs)]),sourceRefs:unique([...M5_LIMITED_PURPOSE_METADATA.rules.filter(r=>rules.includes(r.id)).flatMap(r=>r.sourceIds),...usedRecords.flatMap(e=>e.sourceRefs)]),calculationSourceRefs:unique(usedRecords.flatMap(e=>e.calculationSourceRefs))};
    const pattern=options.innerPatterns?.candidates[i];
    return {candidateRef:c.candidateRef,candidateIndex:i,decisionId:c.candidateRef+'#m5-winter-wood-decision',purpose:PURPOSE,status,reasonCodes:[reason],eligibleForPurpose:eligible,
      candidateElements:status==="CANDIDATE_UNDER_POLICY"?[{element:"FIRE" as const,nonRankedStemMembers:HEAVENLY_STEMS.filter(s=>STEM_NATURE[s].element==="FIRE"),role:"WARMING_REVIEW_ONLY",actualUsefulness:"NOT_EVALUATED" as const}]:[],
      inputFacts:{dayMaster:c.dayMaster,dayMasterElement:STEM_NATURE[c.dayMaster].element,monthPillar:{...c.monthContext.monthPillar},appliedJie:c.monthContext.activeSince,monthBoundarySide:c.monthContext.boundarySide,seasonalJudgmentRef:season.id,seasonalStatus:season.status,seasonalAlternatives:season.alternatives.map(a=>({id:a.id,condition:a.condition,season:a.season,seasonalState:a.seasonalState})),patternContext:pattern?{selectionRef:pattern.selection.id,primaryPattern:pattern.selection.primaryPattern,candidateTypes:[...pattern.selection.candidateTypes],status:pattern.selection.status,usedForM5Decision:false}:null},
      existingWarmingLocations:fire,
      conflictingEvidence:[...(fire.length?[{kind:"PRESENT_FIRE_SUFFICIENCY_UNASSESSED",observed:true,locationRefs:fire.map(l=>l.locationId),effect:"NOT_EVALUATED"}]:[]),...c.evidence.filter(e=>e.kind==="BRANCH_RELATION_CONTEXT"||e.kind==="TRIAD_MEMBERSHIP_CONTEXT").map(e=>({kind:"EXISTING_RELATION_EFFECT_UNASSESSED",observed:true,evidenceRefs:[e.id],inputFactRefs:[...e.inputFactRefs],effect:"NOT_EVALUATED"}))],
      decisionTrace:[{step:"INPUT_AND_MEMBERS",status:"VERIFIED_SELECTED_CONTEXT",inputFactRefs:refs.inputFactRefs},{step:"WINTER_WOOD_SCOPE",woodDayMaster:wood,waterWinterMonth:winterMonth,satisfied:eligible,ruleRef:SCOPE},{step:"EXISTING_SEASONAL_CONTEXT",status:season.status,winterConfirmed,judgmentRef:season.id},{step:"EXISTING_FIRE_ADOPTION_GUARD",applied:eligible,observedFire:fire.length>0,locationRefs:fire.map(l=>l.locationId),ruleRef:GUARD},{step:"PURPOSE_CANDIDATE_OR_HOLD",status,reason,ruleRef:status==="CANDIDATE_UNDER_POLICY"?CANDIDATE:eligible?GUARD:SCOPE}],
      holds:status==="HOLD"?[{reason,meaning:reason==="PRESENT_WARMING_ELEMENT_EFFECT_UNASSESSED"?"EXISTING_FIRE_IS_NEITHER_EXCESS_NOR_PROVEN_SUFFICIENT":reason==="OUTSIDE_WINTER_WOOD_SCOPE"?"NOT_AN_ABSENCE_OF_HELPFUL_ELEMENTS":"INCOMPLETE_OR_CONDITIONAL_CONTEXT_NOT_ZERO"}]:[],
      unresolvedEffects:["ACTUAL_COLD_OR_WARMTH","PRESENT_FIRE_SUFFICIENCY","FIRE_OUTPUT_COST_TO_DAY_MASTER","ROOT_FORCE","SUPPORT_TRANSMISSION","RELATION_EFFECT","FINAL_USEFUL_GOD"],
      notApplied:[...M5_LIMITED_PURPOSE_METADATA.notApplied],...refs,
    };
  });
  const result=freeze({schemaVersion:M5_LIMITED_PURPOSE_SCHEMA,status:"LIMITED_PURPOSE_REVIEW" as const,policy:M5_LIMITED_PURPOSE_METADATA,purpose:PURPOSE,candidates,rules:[...evidence.rules,...M5_LIMITED_PURPOSE_METADATA.rules],sources:[...evidence.sources,...M5_LIMITED_PURPOSE_METADATA.sources],validation:{level:"ISSUED_M3_M2_AND_SEASONAL_VALUE_REFERENCE_CONSISTENCY",localAdapterMustVerifySeasonalExecution:"validateLocalM3SeasonalJudgments(seasonal,{evidence})",externalAuthentication:"NOT_PERFORMED_BY_PURE_MODULE",classicalEdition:"UNVERIFIED",rightsReview:"UNVERIFIED",predictiveValidity:"NOT_CLAIMED",m3FinalStrength:"NOT_IMPLEMENTED",m4FormationEffects:"NOT_IMPLEMENTED",finalUsefulGod:"NOT_IMPLEMENTED",g1P2Promotion:false}});
  contexts.set(result,context);return result;
}
export type M5LimitedPurposeResult=ReturnType<typeof deriveM5LimitedPurpose>;
export function validateM5LimitedPurpose(result:M5LimitedPurposeResult,expected:Partial<Context>={}):true {const c=contexts.get(result);check(c&&Object.isFrozen(result),"M5_ISSUED_IMMUTABLE_RESULT_REQUIRED");for(const key of ["evidence","m2Facts","seasonal","innerPatterns"] as const)if(expected[key]!==undefined)check(expected[key]===c[key],"M5_FOREIGN_EXECUTION_CONTEXT");validateContext(c);return true;}
function explanationContent(result:M5LimitedPurposeResult){validateM5LimitedPurpose(result);return {schemaVersion:"ko-m5-limited-purpose-v1",policyId:M5_LIMITED_PURPOSE_POLICY_ID,templateVersion:M5_LIMITED_PURPOSE_VERSION,title:"겨울 목 일간의 온기 요소 검토",candidates:result.candidates.map(c=>{
  const reason=c.reasonCodes[0],where=c.existingWarmingLocations.map(l=>ROLE_NAMES[l.pillarRole]+(l.locationKind==="VISIBLE_STEM"?"간 ":"지 장간 ")+l.stem).join(" · ");
  const text=c.status==="CANDIDATE_UNDER_POLICY"?`일간 ${c.inputFacts.dayMaster}은 목(木)이고 월지는 ${c.inputFacts.monthPillar.branch}입니다. 선택한 겨울 목 조후 검토 정책에서는 원국의 표면 천간·선택 장간에서 화가 확인되지 않아 화(火)를 온기 검토 후보로 표시합니다. 이는 실제로 화가 부족하다는 측정이나 최종 용신 확정이 아닙니다.`:reason==="PRESENT_WARMING_ELEMENT_EFFECT_UNASSESSED"?`겨울 목 조후의 검토 범위에는 해당하지만, 원국의 ${where}에서 이미 화(火)가 확인됩니다. 그 화의 실제 작용과 충분성을 평가하지 않았으므로 화를 자동으로 추가 후보로 채택하지 않고 보류합니다. 화가 과다하거나 불필요하다고 판단한 것은 아닙니다.`:reason==="OUTSIDE_WINTER_WOOD_SCOPE"?`이 후보의 일간은 ${c.inputFacts.dayMaster}, 월지는 ${c.inputFacts.monthPillar.branch}입니다. 현재 정책은 甲·乙 일간의 亥·子월만 다루므로 목적별 도움 요소 후보를 보류합니다. 도움 요소가 없다는 뜻은 아닙니다.`:`계절 판단의 자료 또는 조건이 확정되지 않아 겨울 목 조후 후보를 보류합니다. 기존 명식과 계절 대안은 유지합니다.`;
  const item={id:c.candidateRef+'#ko-m5-limited-purpose',candidateRef:c.candidateRef,templateId:"KO_M5_WINTER_WOOD_CANDIDATE_OR_HOLD",templateVersion:M5_LIMITED_PURPOSE_VERSION,text,decisionRefs:[c.decisionId],inputFactRefs:c.inputFactRefs,inputEvidenceRefs:c.inputEvidenceRefs,ruleRefs:c.ruleRefs,policyRefs:c.policyRefs,sourceRefs:c.sourceRefs,calculationSourceRefs:c.calculationSourceRefs};
  return {candidateRef:c.candidateRef,status:c.status,items:[item]};
}),scopeNote:"한 목적의 선택 전통·프로젝트 정책입니다. 억부·격국의 최종 용신, 희기 순위·길흉·건강·재물·혼인·사건을 판단하지 않으며 예측 타당성을 인증하지 않습니다."};}
export function explainM5LimitedPurpose(result:M5LimitedPurposeResult){return freeze(explanationContent(result));}
export function validateM5LimitedPurposeExplanation(explanation:unknown,result:M5LimitedPurposeResult):true {validateM5LimitedPurpose(result);dense(explanation);check(equal(explanation,explanationContent(result)),"M5_EXPLANATION_CONTENT_OR_REFERENCES_CHANGED");return true;}
export function renderM5LimitedPurposeText(result:M5LimitedPurposeResult):string {return ["겨울 목 일간의 온기 요소 검토",...explainM5LimitedPurpose(result).candidates.flatMap((c,i)=>[(result.candidates.length>1?`후보 ${i+1}\n`:"")+c.items.map(item=>item.text).join("\n")]),explanationContent(result).scopeNote].join("\n")+"\n";}
