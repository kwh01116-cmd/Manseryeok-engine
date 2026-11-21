/** Optional symbolic role reading. Does not diagnose traits, strength or events. */
import {TEN_GODS, tenGod} from "../domain/tenGods.js";
import {HEAVENLY_STEMS, type HeavenlyStem} from "../domain/stems.js";
import {EARTHLY_BRANCHES} from "../domain/branches.js";
import {areStemCombinationPartners} from "../domain/stemCombinations.js";
import {validateReportProjection, type ReportProjection, type RecordValue} from "./consumerReportV1.js";

export const INTERPRETATION_VERSION = "0.1.0" as const;
export const INTERPRETATION_RESOLVER_VERSION = "0.1.1" as const;
export const INTERPRETATION_PROFILE_ID = "SAJU-TRADITIONAL-REFLECTION-REPORT-V01" as const;
export const DOMAINS = Object.freeze(["BEHAVIOR", "COMMUNICATION", "WORK", "MONEY"] as const);
export type InterpretationDomain = typeof DOMAINS[number];
export type Family = "PEER" | "OUTPUT" | "WEALTH" | "CONTROL" | "RESOURCE";
export const INTERPRETATION_POLICIES = Object.freeze({
  BEHAVIOR: "S7-SYMBOLIC-BEHAVIOR-ROLE-V01",
  COMMUNICATION: "S7-SYMBOLIC-COMMUNICATION-PAIR-V01",
  WORK: "S7-SYMBOLIC-WORK-PROCESS-V01",
  MONEY: "S7-SYMBOLIC-WEALTH-CHOICE-V01",
});
export const INTERPRETATION_SOURCES = freezeInterpretation([
  {id:"S7-SMTH-ROLE-NAMES-WIKISOURCE-V5",kind:"CLASSICAL_TRANSCRIPTION",title:"三命通會 卷五 論古人立印食官財名義",url:"https://zh.wikisource.org/w/index.php?oldid=2706483&title=三命通會/卷五",accessed:"2026-11-21",verification:"HTML_TRANSCRIPTION_NOT_SCAN_OR_PREDICTIVE_VALIDATION"},
  {id:"S7-SMTH-ROLE-CONTEXT-WIKISOURCE-V6",kind:"CLASSICAL_TRANSCRIPTION",title:"三命通會 卷六 論正財・印綬・食神",url:"https://zh.wikisource.org/w/index.php?oldid=845352&title=三命通會/卷六",accessed:"2026-11-21",verification:"HTML_TRANSCRIPTION_NOT_SCAN_OR_CRITICAL_EDITION"},
  {id:"S7-ZPZQ-MONTH-ORIGINAL-NCC",kind:"ORIGINAL_TEXT_IN_COMMENTED_TRANSCRIPTION",title:"子平真詮 論用神 原著部分",url:"https://ncc.com.tw/fate/paleo/bg/bg_032.htm",accessed:"2026-11-21",verification:"HTML_TRANSCRIPTION_REVISION_UNAVAILABLE"},
  {id:"S7-ZPZQ-CONTEXT-XU-NCC",kind:"XU_COMMENTARY_TRANSCRIPTION",title:"子平真詮評註 論食神 徐註",url:"https://ncc.com.tw/fate/paleo/bg/bg_035.htm",accessed:"2026-11-21",verification:"HTML_TRANSCRIPTION_NOT_INDEPENDENT_SCHOOL_CONSENSUS"},
  {id:"S7-PROJECT-SYMBOLIC-ROLE-POLICY-V01",kind:"PROJECT_POLICY",title:"현대 역할 어휘・네 영역・적용 조건은 프로젝트 선택",url:null,accessed:"2026-11-21",verification:"EXPLICIT_PROJECT_GENERALIZATION_NOT_CLASSICAL_IF_ELSE"},
]);
export const FORBIDDEN_CONCLUSIONS = Object.freeze([
  "PERSONALITY_DIAGNOSIS", "DETERMINISTIC_RELATIONSHIP", "JOB_APTITUDE_OR_SUCCESS",
  "INCOME_INVESTMENT_OR_LOSS_PREDICTION", "HEALTH_DEATH_DISASTER_PREDICTION",
  "FINAL_STRENGTH_PATTERN_SUCCESS_OR_YONGSHEN", "ROOT_OR_RELATION_EFFICACY", "PROBABILITY_OR_SCIENTIFIC_ACCURACY",
]);
const FAMILY: Record<string, Family> = {比肩:"PEER",劫財:"PEER",食神:"OUTPUT",傷官:"OUTPUT",正財:"WEALTH",偏財:"WEALTH",正官:"CONTROL",七殺:"CONTROL",正印:"RESOURCE",偏印:"RESOURCE"};
const GOD: Record<string,string> = {比肩:"비견",劫財:"겁재",食神:"식신",傷官:"상관",正財:"정재",偏財:"편재",正官:"정관",七殺:"칠살",正印:"정인",偏印:"편인"};
const ROLE: Record<string,string> = {year:"연간",month:"월간",day:"일간",hour:"시간"};
const INDEX: Record<string,number> = {year:0,month:1,day:2,hour:3};
const THEME: Record<Family,{name:string;meaning:string;question:string}> = {
  RESOURCE:{name:"받아들이고 정리하는 관점",meaning:"전통의 인성은 생양과 받음의 비유입니다. 이 정책에서는 자료나 도움을 받아 이해하는 과정으로 풀어 읽습니다.",question:"정보를 충분히 모으는 단계와 내 방식으로 정리하는 단계를 어떻게 구별하고 있나요?"},
  OUTPUT:{name:"표현과 산출을 살피는 관점",meaning:"식상은 일간이 내놓는다는 관계에서 붙은 이름입니다. 여기서는 생각을 설명하거나 결과물로 내놓고 수정하는 과정에 빗댑니다.",question:"내 생각을 내놓기 전의 기준과, 반응을 받은 뒤 고치는 기준은 어떻게 다른가요?"},
  CONTROL:{name:"역할과 외부 기준을 살피는 관점",meaning:"관성은 나를 제어하는 관계의 이름입니다. 이 정책에서는 맡은 역할과 외부의 기준을 확인하는 관점으로 읽습니다.",question:"정해진 역할을 따를 때와 내 재량으로 판단할 때, 어떤 기준을 먼저 확인하나요?"},
  WEALTH:{name:"쓰임과 자원 배분을 살피는 관점",meaning:"재성은 쓰고 관리하는 대상에 대한 전통적 비유입니다. 여기서는 돈의 많고 적음보다 무엇에 자원을 쓸지 정하는 관점으로 풉니다.",question:"시간이나 비용을 쓸 때 기대하는 쓰임과 지켜야 할 조건을 어떻게 구분하나요?"},
  PEER:{name:"개인 몫과 공동 몫을 살피는 관점",meaning:"비겁은 일간과 같은 오행의 관계입니다. 여기서는 나와 비슷한 위치의 사람, 개인의 몫과 공동의 몫을 구분하는 관점으로 사용합니다.",question:"함께 결정할 일과 내가 직접 결정할 일을 어떻게 나누고 있나요?"},
};
export interface RoleLocation {role:string;stem:string;tenGod:string;}
export interface RoleMonthly {branch:string;mainStem:string;mainTenGod:string;status:string;primaryPattern:string|null;unresolvedTypes:string[];exactExposures:RoleLocation[];competingExposures:RoleLocation[];}
export interface ExistingSupport {role:string;stem:string;decision:string;rootPresence:string;upstreamRef:string;}
export interface SymbolicContext {
  contextId:string;candidateId:string;ordinal:number;dayStem:string;
  monthly:RoleMonthly;visible:RoleLocation[];hidden:({branch:string;position:string}&RoleLocation)[];
  factRefs:{day:string;pillars:string;pattern:string;root:string;relations:string;seasonal:string;strength:string};
  rootPresence:string;relationCount:number;seasonalAlternativeCount:number;
  existingSupport:ExistingSupport[];inputSourceRefs:string[];
  factOwnership?:{id:string;candidateId:string}[];
}
export type ConditionLocation = RoleLocation | {role:"day";stem:string;tenGod:null};
export interface InterpretationCondition {code:string;factRefs:string[];locations:ConditionLocation[];detail:string;}
export interface GroundedInterpretationClaim {
  claimId:string;chartCandidateRef:string;domain:InterpretationDomain;
  interpretationPolicyId:string;interpretationPolicyVersion:typeof INTERPRETATION_VERSION;
  resolverVersion:typeof INTERPRETATION_RESOLVER_VERSION;
  sourceRefs:string[];inputSourceRefs:string[];inputFactRefs:string[];
  supportingConditions:InterpretationCondition[];competingConditions:InterpretationCondition[];
  interpretationScope:string;allowedMeaning:string[];forbiddenConclusions:readonly string[];
  confidenceOrApplicabilityStatus:"LIMITED"|"HOLD";decisionCode:string;
  narrativeTemplateId:string;consumerText:string;alternativeText:string;
  unresolvedEffects:string[];unusedAsDeterminant:string[];
}

export function assertInterpretationJson(value:unknown):void {
  let nodes=0;const seen=new Set<object>();
  const visit=(v:unknown,depth:number):void=>{if(++nodes>180000||depth>70)throw new RangeError("S7_JSON_LIMIT");
    if(v===null||typeof v==="string"||typeof v==="boolean"||typeof v==="number"&&Number.isFinite(v))return;
    if(!v||typeof v!=="object"||seen.has(v))throw new RangeError("S7_JSON_VALUE");seen.add(v);
    if(Array.isArray(v)){if(Reflect.ownKeys(v).length!==v.length+1)throw new RangeError("S7_SPARSE_ARRAY");for(let i=0;i<v.length;i++){const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d||!d.enumerable||!("value"in d))throw new RangeError("S7_SPARSE_ARRAY");}}
    else if(![Object.prototype,null].includes(Object.getPrototypeOf(v)))throw new RangeError("S7_PLAIN_OBJECT_REQUIRED");
    for(const key of Reflect.ownKeys(v)){if(Array.isArray(v)&&key==="length")continue;const d=Object.getOwnPropertyDescriptor(v,key)!;if(typeof key!=="string"||!d.enumerable||!("value"in d))throw new RangeError("S7_JSON_DESCRIPTOR");visit(d.value,depth+1);}seen.delete(v);};visit(value,0);
}
export function canonicalInterpretation(value:unknown):string {assertInterpretationJson(value);const c=(v:unknown):string=>v===null||typeof v!=="object"?JSON.stringify(v):Array.isArray(v)?"["+v.map(c).join(",")+"]":"{"+Object.keys(v).sort().map(k=>JSON.stringify(k)+":"+c((v as Record<string,unknown>)[k])).join(",")+"}";return c(value);}
export function freezeInterpretation<T>(value:T):T {if(value&&typeof value==="object"){Object.values(value).forEach(freezeInterpretation);Object.freeze(value);}return value;}
const check=(ok:unknown,code:string):void=>{if(!ok)throw new RangeError(code);};
const unique=<T>(values:T[]):T[]=>[...new Set(values)];
const objects=(v:unknown):RecordValue[]=>Array.isArray(v)?v as RecordValue[]:[];
export function roleFamily(god:string):Family {check(Object.hasOwn(FAMILY,god),"S7_TEN_GOD_REQUIRED");return FAMILY[god]!;}
function label(v:RoleLocation):string{return `${ROLE[v.role]} ${v.stem}(${GOD[v.tenGod]})`;}
function validateContext(c:SymbolicContext):void {
  assertInterpretationJson(c);check(c.contextId.length>0&&c.candidateId.length>0&&Number.isSafeInteger(c.ordinal)&&c.ordinal>0,"S7_CONTEXT_REQUIRED");
  check(HEAVENLY_STEMS.some(s=>s===c.dayStem),"S7_DAY_STEM");
  check(c.visible.length===3&&c.visible.map(v=>v.role).join(",")==="year,month,hour","S7_SURFACE_POSITIONS");
  for(const v of [...c.visible,...c.hidden,...c.monthly.exactExposures,...c.monthly.competingExposures])check(HEAVENLY_STEMS.some(s=>s===v.stem)&&TEN_GODS.some(g=>g===v.tenGod)&&Object.hasOwn(INDEX,v.role),"S7_LOCATION_CLASSIFICATION");
  check(TEN_GODS.some(g=>g===c.monthly.mainTenGod)&&HEAVENLY_STEMS.some(s=>s===c.monthly.mainStem),"S7_MONTH_MAIN");
  check(EARTHLY_BRANCHES.some(b=>b===c.monthly.branch),"S7_MONTH_BRANCH");
  check(Object.keys(c.factRefs).sort().join(",")==="day,pattern,pillars,relations,root,seasonal,strength","S7_REQUIRED_FACT_REFS");
  for(const v of [...c.visible,...c.hidden])check(tenGod(c.dayStem as HeavenlyStem,v.stem as HeavenlyStem)===v.tenGod,"S7_EXISTING_CLASSIFICATION_MISMATCH");
  check(tenGod(c.dayStem as HeavenlyStem,c.monthly.mainStem as HeavenlyStem)===c.monthly.mainTenGod,"S7_MONTH_CLASSIFICATION_MISMATCH");
  if(c.factOwnership){check(c.factOwnership.length===7&&unique(c.factOwnership.map(r=>r.id)).length===7&&Object.values(c.factRefs).every(id=>typeof id==="string"&&id.length>0&&c.factOwnership!.some(r=>r.id===id&&r.candidateId===c.candidateId)),"S7_CROSS_CANDIDATE_FACT");}
  else check(Object.values(c.factRefs).every(r=>typeof r==="string"&&r.startsWith(c.contextId+"/"+c.candidateId+"/")&&r.length>c.contextId.length+c.candidateId.length+2),"S7_CROSS_CANDIDATE_FACT");
  check(unique(Object.values(c.factRefs)).length===7,"S7_DUPLICATE_FACT_REF");
  check(c.inputSourceRefs.length>0&&c.inputSourceRefs.every(r=>typeof r==="string"&&r.length>0)&&unique(c.inputSourceRefs).length===c.inputSourceRefs.length,"S7_SOURCE_REQUIRED");
  check(Number.isSafeInteger(c.relationCount)&&c.relationCount>=0&&Number.isSafeInteger(c.seasonalAlternativeCount)&&c.seasonalAlternativeCount>=0,"S7_CONTEXT_COUNTS");
  check(["PRESENT_UNDER_POLICY","ABSENT_UNDER_POLICY"].includes(c.rootPresence),"S7_ROOT_PRESENCE");
  for(const e of c.monthly.exactExposures)check(e.stem===c.monthly.mainStem&&e.tenGod===c.monthly.mainTenGod&&c.visible.some(v=>v.role===e.role&&v.stem===e.stem&&v.tenGod===e.tenGod),"S7_EXACT_EXPOSURE");
  for(const e of c.monthly.competingExposures)check(c.visible.some(v=>v.role===e.role&&v.stem===e.stem&&v.tenGod===e.tenGod),"S7_COMPETING_EXPOSURE");
  check(unique(c.monthly.exactExposures.map(e=>e.role)).length===c.monthly.exactExposures.length,"S7_DUPLICATE_EXPOSURE");
  check(unique(c.monthly.competingExposures.map(e=>e.role+":"+e.stem)).length===c.monthly.competingExposures.length,"S7_DUPLICATE_COMPETITION");
  check(unique(c.existingSupport.map(r=>r.role)).length===c.existingSupport.length,"S7_DUPLICATE_SUPPORT");
  for(const r of c.existingSupport)check(c.visible.some(v=>v.role===r.role&&v.stem===r.stem&&roleFamily(v.tenGod)==="RESOURCE")&&["NO_HOLD_BY_THIS_RULE","SUPPORT_HELD_UNDER_SELECTED_RULE","ROOTED_COMBINATION_EFFECT_UNRESOLVED","OUT_OF_SCOPE_INTERACTION"].includes(r.decision)&&["PRESENT_UNDER_POLICY","ABSENT_UNDER_POLICY"].includes(r.rootPresence)&&typeof r.upstreamRef==="string"&&r.upstreamRef.startsWith(c.candidateId+"#m3-resource-support"),"S7_EXISTING_SUPPORT_SCOPE");
}

export function contextsFromProjection(input:ReportProjection, existingSupport:Record<string,ExistingSupport[]> = {}):SymbolicContext[] {
  validateReportProjection(input);assertInterpretationJson(existingSupport);
  check(Object.keys(existingSupport).every(id=>input.candidates.some(c=>c.id===id)),"S7_SUPPORT_PARENT");
  const nodes=new Map(input.evidence.map(n=>[n.id,n]));
  return input.candidates.map(c=>{const get=(key:keyof typeof c.refs)=>nodes.get(c.refs[key])!.value;
    check(nodes.get(c.refs.pattern)!.policyId==="M4-INNER-EIGHT-MONTH-STRUCTURE-V01"&&nodes.get(c.refs.pattern)!.policyVersion==="0.1.0","S7_PATTERN_DEPENDENCY_POLICY");
    check(nodes.get(c.refs.root)!.policyId==="M3-ROOT-PRESENCE-HIDDEN-SAME-ELEMENT-V01"&&nodes.get(c.refs.root)!.policyVersion==="0.1.0","S7_ROOT_DEPENDENCY_POLICY");
    const p=get("pattern"), main=p.main as RecordValue, items=objects(get("pillars").items);
    const asLocation=(v:RecordValue):RoleLocation=>({role:String(v.role),stem:String(v.stem),tenGod:String(v.type??v.tenGod)});
    const context:SymbolicContext={contextId:input.contextId,candidateId:c.id,ordinal:c.ordinal,dayStem:String(get("day").stem),
      monthly:{branch:String(items[1]!.branch),mainStem:String(main.stem),mainTenGod:String(main.tenGod),status:String(p.status),primaryPattern:p.primaryPattern as string|null,unresolvedTypes:(p.unresolvedTypes??[]) as string[],exactExposures:objects(p.exposures).filter(e=>e.type===main.tenGod&&e.stem===main.stem).map(asLocation),competingExposures:objects(p.competingExposures).map(asLocation)},
      visible:items.filter(v=>v.role!=="day").map(v=>({role:String(v.role),stem:String(v.stem),tenGod:String(v.visibleTenGod)})),
      hidden:items.flatMap(v=>objects((v.branchTenGods as RecordValue).members).map(h=>({role:String(v.role),branch:String(v.branch),stem:String(h.stem),tenGod:String(h.tenGod),position:String(h.position)}))),
      factRefs:{day:c.refs.day,pillars:c.refs.pillars,pattern:c.refs.pattern,root:c.refs.root,relations:c.refs.relations,seasonal:c.refs.seasonal,strength:c.refs.strength},
      factOwnership:[c.refs.day,c.refs.pillars,c.refs.pattern,c.refs.root,c.refs.relations,c.refs.seasonal,c.refs.strength].map(id=>({id,candidateId:nodes.get(id)!.candidateId!})),
      rootPresence:String(get("root").presence),relationCount:objects(get("relations").pairs).length,seasonalAlternativeCount:objects(get("seasonal").alternatives).length,
      existingSupport:existingSupport[c.id]??[],inputSourceRefs:unique(input.evidence.filter(n=>n.candidateId===c.id).flatMap(n=>n.sourceRefs))};
    validateContext(context);
    // Replay only the closed invariants of the already selected M3 support result.
    // This checks copied metadata against the original projected positions/root;
    // it does not turn NO_HOLD, presence or a combination into actual efficacy.
    for(const support of context.existingSupport){
      const source=objects(get("root").surfaceSupport).find(r=>r.role===support.role&&r.stem===support.stem);
      check(source&&source.presence===support.rootPresence,"S7_SUPPORT_ROOT_REFERENCE_MISMATCH");
      const partners=items.filter(v=>v.role!==support.role&&areStemCombinationPartners(support.stem as HeavenlyStem,v.stem as HeavenlyStem));
      const shared=partners.some(p=>context.visible.some(v=>v.role!==support.role&&roleFamily(v.tenGod)==="RESOURCE"&&areStemCombinationPartners(v.stem as HeavenlyStem,p.stem as HeavenlyStem)));
      const outside=partners.length>1||partners.some(p=>Math.abs(INDEX[String(p.role)]!-INDEX[support.role]!)!==1)||shared;
      const expected=!partners.length?"NO_HOLD_BY_THIS_RULE":outside?"OUT_OF_SCOPE_INTERACTION":support.rootPresence==="PRESENT_UNDER_POLICY"?"ROOTED_COMBINATION_EFFECT_UNRESOLVED":"SUPPORT_HELD_UNDER_SELECTED_RULE";
      check(support.decision===expected,"S7_SUPPORT_COPIED_DECISION_MISMATCH");
    }
    return context;});
}

type Pair = {left:RoleLocation;right:RoleLocation;kind:string;};
const PAIRS:Record<InterpretationDomain,readonly (readonly [Family,Family])[]>={BEHAVIOR:[],COMMUNICATION:[["OUTPUT","CONTROL"],["RESOURCE","OUTPUT"],["PEER","WEALTH"]],WORK:[["OUTPUT","WEALTH"],["CONTROL","RESOURCE"]],MONEY:[["WEALTH","OUTPUT"],["WEALTH","CONTROL"],["WEALTH","PEER"],["WEALTH","RESOURCE"]]};
const PAIR_MEANING:Record<string,{meaning:string;question:string}>={
  OUTPUT_CONTROL:{meaning:"내 생각을 표현하고 수정하는 관점과, 외부의 기준을 확인하는 관점이 함께 놓입니다.",question:"의견을 제안하는 단계와 합의한 기준을 확인하는 단계를 나누어 생각해 보세요."},
  RESOURCE_OUTPUT:{meaning:"받아서 이해하는 과정과 밖으로 설명하는 과정을 함께 읽습니다.",question:"상대의 뜻을 이해하는 일과 내 뜻을 전달하는 일을 어떻게 구분할지 돌아볼 수 있습니다."},
  PEER_WEALTH:{meaning:"개인의 몫과 공동의 몫, 관리할 자원의 경계를 함께 살피는 관점입니다.",question:"함께 정할 범위와 각자 결정할 범위를 미리 구별하는 질문으로 읽어 보세요."},
  OUTPUT_WEALTH:{meaning:"산출을 만드는 과정과 그 산출의 쓰임을 정하는 과정을 연결해 읽습니다.",question:"결과물을 만드는 기준과 그것을 어디에 활용할지 정하는 기준을 따로 적어 볼 수 있습니다."},
  CONTROL_RESOURCE:{meaning:"맡은 역할과 외부 기준을 파악하는 과정, 필요한 자료나 지원을 받아 정리하는 과정을 연결해 읽습니다.",question:"해야 할 일의 조건과 그 일을 위해 받아야 할 정보를 구분해 보세요."},
  WEALTH_OUTPUT:{meaning:"자원의 사용과 결과물의 산출을 함께 살피는 관점입니다.",question:"어떤 결과를 기대하며 시간이나 비용을 쓸지, 그 기대와 쓰임을 구분해 보세요."},
  WEALTH_CONTROL:{meaning:"사용할 자원과 지켜야 할 역할·조건을 함께 살피는 관점입니다.",question:"자원을 배분할 때 자유롭게 정할 부분과 이미 약속한 조건을 구분해 보세요."},
  WEALTH_PEER:{meaning:"관리할 자원과 개인·공동 몫의 경계를 함께 살피는 관점입니다.",question:"공동으로 쓰는 자원과 각자가 결정할 자원을 어떤 기준으로 나눌지 돌아볼 수 있습니다."},
  WEALTH_RESOURCE:{meaning:"자원의 배분과 자료·지원에 쓰는 과정을 나란히 놓고 읽습니다.",question:"배우거나 도움을 받는 데 쓸 자원과 다른 쓰임 사이에서 무엇을 비교하는지 돌아보세요."},
};
function pairsFor(c:SymbolicContext,domain:InterpretationDomain):Pair[]{const out:Pair[]=[];for(const [a,b] of PAIRS[domain])for(const left of c.visible.filter(v=>roleFamily(v.tenGod)===a))for(const right of c.visible.filter(v=>roleFamily(v.tenGod)===b))if(left.role!==right.role)out.push({left,right,kind:a+"_"+b});return out;}
const condition=(code:string,factRefs:string[],locations:ConditionLocation[],detail:string):InterpretationCondition=>({code,factRefs:unique(factRefs),locations,detail});

/** Pure chosen-policy consistency only; callers must supply trusted classifications. */
export function resolveSymbolicInterpretation(context:SymbolicContext,{profileId}:{profileId:string}):GroundedInterpretationClaim[]{
  check(profileId===INTERPRETATION_PROFILE_ID,"S7_EXPLICIT_PROFILE_REQUIRED");validateContext(context);
  const c=structuredClone(context), ref=c.factRefs, family=roleFamily(c.monthly.mainTenGod);
  const compatible=!c.monthly.unresolvedTypes.length&&["MAIN_QI_STRUCTURAL_ANCHOR","MAIN_QI_WITH_COMPETING_EXPOSURES"].includes(c.monthly.status)&&c.monthly.primaryPattern===c.monthly.mainTenGod;
  const monthUsable=compatible&&family!=="PEER"&&c.monthly.exactExposures.length>0;
  const competing:InterpretationCondition[]=[];
  for(const e of c.monthly.competingExposures)competing.push(condition("COMPETING_MONTH_EXPOSURE",[ref.pattern,ref.pillars],[e],"다른 월령 투출도 관측됨; 지배력·성향 우열 미판정"));
  if(c.monthly.unresolvedTypes.length)competing.push(condition("MONTH_COMPATIBILITY_UNRESOLVED",[ref.pattern],[],c.monthly.unresolvedTypes.join(" / ")));
  const allSurfaceStems:ConditionLocation[]=[c.visible[0]!,c.visible[1]!,{role:"day",stem:c.dayStem,tenGod:null},c.visible[2]!];
  for(let i=0;i<allSurfaceStems.length;i++)for(let j=i+1;j<allSurfaceStems.length;j++)if(areStemCombinationPartners(allSurfaceStems[i]!.stem as HeavenlyStem,allSurfaceStems[j]!.stem as HeavenlyStem)){
    const locations=[allSurfaceStems[i]!,allSurfaceStems[j]!],includesDay=locations.some(l=>l.role==="day");
    competing.push(condition("STEM_COMBINATION_MEMBERSHIP",includesDay?[ref.pillars,ref.day]:[ref.pillars],locations,includesDay?"일간 본신을 포함한 기존 오합 짝; 일간을 별도 지원 천간으로 추가하거나 합거·합화 효력을 판정하지 않음":"기존 오합 helper의 타간 짝; 합거·합화·갈등 효력은 평가하지 않음"));
  }
  for(const r of c.existingSupport)if(r.decision!=="NO_HOLD_BY_THIS_RULE")competing.push(condition("EXISTING_RESOURCE_SUPPORT_LIMITATION",[ref.pillars,ref.root],c.visible.filter(v=>v.role===r.role),r.decision+"; "+r.upstreamRef));
  if(c.relationCount)competing.push(condition("BRANCH_RELATIONS_EFFECT_UNEVALUATED",[ref.relations],[],`${c.relationCount}개 위치 관계 보존; 실제 손상·활성 미평가`));
  if(c.visible.some(v=>v.tenGod==="正官")&&c.visible.some(v=>v.tenGod==="七殺"))competing.push(condition("OFFICER_KILLINGS_COEXISTENCE",[ref.pillars],c.visible.filter(v=>["正官","七殺"].includes(v.tenGod)),"관살 병존; 격 실패·성격 혼란을 판단하지 않음"));
  if(c.visible.some(v=>v.tenGod==="傷官")&&c.visible.some(v=>v.tenGod==="正官"))competing.push(condition("OUTPUT_OFFICER_COEXISTENCE",[ref.pillars],c.visible.filter(v=>["傷官","正官"].includes(v.tenGod)),"상관·정관 병존; 반항·파격을 판단하지 않음"));
  return freezeInterpretation(DOMAINS.map(domain=>{
    const pairs=pairsFor(c,domain), supports:InterpretationCondition[]=[], paragraphs:string[]=[];
    let decisionCode:string, status:"LIMITED"|"HOLD";
    if(domain==="BEHAVIOR"){
      status=monthUsable?"LIMITED":"HOLD";
      decisionCode=!compatible?c.monthly.unresolvedTypes.length?"HOLD_MONTH_COMPATIBILITY":"HOLD_PEER_OR_MONTH_SCOPE":!c.monthly.exactExposures.length?"HOLD_NO_EXACT_EXPOSURE":c.monthly.competingExposures.length?"LIMITED_COMPETING":"LIMITED_MONTH_EXACT_ROLE";
      if(monthUsable){supports.push(condition("MONTH_MAIN_EXACT_SURFACE_ROLE",[ref.pattern,ref.pillars,ref.day],c.monthly.exactExposures,`${c.monthly.branch} 본기 ${c.monthly.mainStem}의 정확 투출`));const t=THEME[family];paragraphs.push(`월령 분류 ${GOD[c.monthly.mainTenGod]} 및 ${c.monthly.exactExposures.map(label).join("·")}의 정확한 연결을 근거로, '${t.name}'을 행동을 돌아보는 관점으로 고릅니다. ${t.meaning} ${t.question}`);if(c.monthly.competingExposures.length)paragraphs.push(`동시에 ${c.monthly.competingExposures.map(label).join("·")}의 월령 투출도 있어 관점을 하나로 좁히지 않습니다.`);}
      else paragraphs.push(c.monthly.unresolvedTypes.length?"월령의 장간 호환 정책이 미정이어서 행동 관점을 고르지 않았습니다.":family==="PEER"?"월령 본기가 비겁인 경우는 이번 행동 정책의 여덟 내격 범위 밖입니다. 이를 특정 성격으로 바꾸지 않았습니다.":"월령의 분류는 확인되지만 같은 천간의 정확한 표면 투출 조건이 없어 행동 관점의 선택을 보류했습니다.");
    }else{
      const moneyMonth=domain==="MONEY"&&family==="WEALTH"&&monthUsable;
      status=pairs.length||moneyMonth?"LIMITED":"HOLD";decisionCode=pairs.length?pairs.length>1?"LIMITED_MULTIPLE_PAIRS":"LIMITED_VISIBLE_PAIR":moneyMonth?"LIMITED_MONTH_WEALTH_EXACT":"HOLD_NO_SELECTED_SURFACE_PAIR";
      for(const p of pairs){const distance=Math.abs(INDEX[p.left.role]!-INDEX[p.right.role]!);supports.push(condition(p.kind,[ref.pillars,ref.day],[p.left,p.right],distance===1?"인접 표면 위치; 실제 전달의 충분조건 아님":"격위 표면 위치; 간섭 없음이나 효력 감소를 단정하지 않음"));}
      for(const kind of unique(pairs.map(p=>p.kind))){const selected=pairs.filter(p=>p.kind===kind),m=PAIR_MEANING[kind]!;const meaning=domain==="MONEY"&&kind==="WEALTH_OUTPUT"?"일과 활동에서 읽은 같은 산출·활용의 연결을, 여기서는 자원 선택 관점에서 다시 살펴봅니다.":m.meaning;paragraphs.push(`${selected.map(p=>`${label(p.left)} 및 ${label(p.right)}`).join(" / ")}의 배치를 함께 읽습니다. ${meaning} ${m.question}`);}
      if(moneyMonth&&!pairs.length){supports.push(condition("MONTH_WEALTH_EXACT_SURFACE",[ref.pattern,ref.pillars],c.monthly.exactExposures,"월령 재성의 정확 투출 예외"));paragraphs.push(`월령 재성이 ${c.monthly.exactExposures.map(label).join("·")}에 정확히 드러나 자원의 쓰임을 살피는 관점을 고릅니다. ${THEME.WEALTH.meaning} ${THEME.WEALTH.question}`);}
      if(status==="HOLD"){const hiddenOnly=domain==="MONEY"&&!c.visible.some(v=>roleFamily(v.tenGod)==="WEALTH")&&c.hidden.some(v=>roleFamily(v.tenGod)==="WEALTH");paragraphs.push(hiddenOnly?"재성은 지장간에서 확인되지만 이번 정책이 요구하는 표면 연결은 없습니다. 재물의 유무나 선택 태도를 판단하지 않았습니다.":`${domain==="COMMUNICATION"?"소통":domain==="WORK"?"활동 과정":"자원 선택"} 관점을 고르는 표면 역할 쌍이 이번 조건에 맞지 않습니다. 명식 전체의 해당 요소가 없다는 뜻은 아닙니다.`);}
    }
    const localCompeting=structuredClone(competing);
    if(domain==="MONEY"&&pairs.some(p=>p.kind==="WEALTH_OUTPUT"))localCompeting.push(condition("SHARED_ROLE_PAIR_ACROSS_DOMAINS",[ref.pillars],pairs.filter(p=>p.kind==="WEALTH_OUTPUT").flatMap(p=>[p.left,p.right]),"WORK와 같은 표면 쌍의 재사용; 추가 강도·독립 증거 횟수로 합산하지 않음"));
    if(pairs.length>1)localCompeting.push(condition("MULTIPLE_ROLE_PATHS_PRESERVED",[ref.pillars],unique(pairs.flatMap(p=>[p.left,p.right])),"여러 쌍을 합산·우열화하지 않고 모두 보존"));
    const text=paragraphs.join("\n");
    return {claimId:c.contextId+"/"+c.candidateId+"/interpretation/"+domain.toLowerCase(),chartCandidateRef:c.candidateId,domain,interpretationPolicyId:INTERPRETATION_POLICIES[domain],interpretationPolicyVersion:INTERPRETATION_VERSION,
      resolverVersion:INTERPRETATION_RESOLVER_VERSION,sourceRefs:INTERPRETATION_SOURCES.map(s=>s.id),inputSourceRefs:c.inputSourceRefs,inputFactRefs:unique([ref.day,ref.pillars,ref.pattern,...supports.flatMap(s=>s.factRefs),...localCompeting.flatMap(s=>s.factRefs)]),supportingConditions:supports,competingConditions:localCompeting,
      interpretationScope:"SELECTED_TRADITIONAL_SYMBOLIC_ROLE_PERSPECTIVE_NOT_DIAGNOSIS_OR_PREDICTION",allowedMeaning:status==="LIMITED"?paragraphs:["HOLD_RETAINS_UNASSESSED_NOT_ABSENCE",...paragraphs],forbiddenConclusions:FORBIDDEN_CONCLUSIONS,
      confidenceOrApplicabilityStatus:status,decisionCode,narrativeTemplateId:domain.toLowerCase()+"/"+decisionCode.toLowerCase()+"@"+INTERPRETATION_VERSION,consumerText:text,alternativeText:status==="LIMITED"?"이 배치를 한 가지 성격으로 정하지 않고 다음 관점으로 살펴봅니다.\n"+text:text,
      unresolvedEffects:["ACTUAL_SUPPORT_AND_CONTROL_TRANSMISSION","ROOT_STRENGTH_AND_RELATION_EFFICACY","FINAL_STRENGTH_PATTERN_SUCCESS_YONGSHEN"],unusedAsDeterminant:["UNWEIGHTED_ELEMENT_COUNTS","SEASONAL_STATE","GONGMANG","FORTUNE_PILLARS","ROOT_PRESENCE_AS_STRENGTH_SCORE"]};
  }));
}
