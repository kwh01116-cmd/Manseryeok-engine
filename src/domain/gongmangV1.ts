import { EARTHLY_BRANCHES, type EarthlyBranch } from "./branches.js";
import { ganZhiAt, ganZhiIndex, type GanZhi } from "./sexagenary.js";

export const GONGMANG_POLICY_ID = "M2-DAY-XUN-VOID-BRANCHES-V01" as const;
export const GONGMANG_VERSION = "0.1.0" as const;
const RULE = "M2-RULE-DAY-XUN-UNPAIRED-BRANCHES-001";
const SOURCE = "IMPL-GONGMANG-DAY-XUN-V01";
const roles = ["year", "month", "day", "hour"] as const;
type Role = typeof roles[number];
function check(value:unknown, code:string):asserts value {if(!value)throw new RangeError(code);}
function dense(value:readonly unknown[]):void {check(Array.isArray(value)&&Array.from({length:value.length},(_,i)=>Object.hasOwn(value,i)).every(Boolean),"GONGMANG_DENSE_ARRAY_REQUIRED");}
function freeze<T>(value:T):T {if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function policy(value:unknown):void {check(value===GONGMANG_POLICY_ID,"EXPLICIT_SUPPORTED_GONGMANG_POLICY_REQUIRED");}
function equal(a:unknown,b:unknown):boolean {if(a===b)return true;if(!a||!b||typeof a!=="object"||typeof b!=="object"||Array.isArray(a)!==Array.isArray(b))return false;const ka=Object.keys(a).sort(),kb=Object.keys(b).sort();return ka.length===kb.length&&ka.every((k,i)=>k===kb[i]&&equal((a as Record<string,unknown>)[k],(b as Record<string,unknown>)[k]));}
function pillar(value:GanZhi):number {check(value&&typeof value==="object","GONGMANG_DAY_PILLAR_REQUIRED");const index=ganZhiIndex(value.stem,value.branch);check(index!==null,"GONGMANG_VALID_SEXAGENARY_PILLAR_REQUIRED");return index;}
export const GONGMANG_METADATA=freeze({id:GONGMANG_POLICY_ID,version:GONGMANG_VERSION,
  meaning:"DAY_PILLAR_XUN_ARITHMETIC_NOT_FORTUNE_OR_EFFECT",schemaVersion:"day-xun-gongmang-v1",
  rules:[{id:RULE,version:GONGMANG_VERSION,policyRefs:[GONGMANG_POLICY_ID],sourceRefs:[SOURCE]}],
  sources:[{id:SOURCE,kind:"PROJECT_ARITHMETIC_DEFINITION",implementationRef:"src/domain/gongmangV1.ts",
    definition:"TAKE_THE_TEN_PILLARS_OF_THE_DAY_XUN_AND_RETURN_THE_TWO_BRANCHES_NOT_PAIRED_WITH_THE_TEN_STEMS",
    existingCycleRef:"src/domain/sexagenary.ts",technicalComparisonRef:"https://github.com/yhj1024/manseryeok/blob/fba3253d7305b8b61189bd78318a7a27ed8c9b09/src/features/void-branches.ts",
    sourceCodeCopied:false,classicalEditionVerification:"NOT_PERFORMED",rightsReview:"NOT_A_CALENDAR_DATA_LICENSE",effectDefinition:"NOT_IMPLEMENTED"}],
  limits:["DAY_PILLAR_BASIS_ONLY","NO_NATAL_BRANCH_REMOVAL","NO_LUCK_OR_MISFORTUNE_INFERENCE","CALLER_SELECTS_DAY_ROLLOVER","REFERENCES_ARE_TRACEABILITY_NOT_AUTHENTICATION"]});

/** Independent cycle arithmetic. The caller supplies the day pillar already selected by M1. */
export function gongmangForDayPillar(input:{readonly dayPillar:GanZhi;readonly policyId:string}){
  policy(input?.policyId);const index=pillar(input.dayPillar),start=index-index%10;
  const used=new Set(Array.from({length:10},(_,offset)=>ganZhiAt(start+offset).branch));
  const voidBranches=EARTHLY_BRANCHES.filter(branch=>!used.has(branch));check(voidBranches.length===2,"GONGMANG_XUN_CARDINALITY");
  return freeze({schemaVersion:"day-xun-gongmang-v1" as const,status:"RESOLVED_UNDER_POLICY" as const,
    policyId:GONGMANG_POLICY_ID,policyVersion:GONGMANG_VERSION,basis:"SELECTED_DAY_PILLAR" as const,
    dayPillar:{stem:input.dayPillar.stem,branch:input.dayPillar.branch},dayIndex:index,xunIndex:Math.floor(index/10),xunStart:{...ganZhiAt(start)},voidBranches,
    ruleRefs:[RULE],sourceRefs:[SOURCE],efficacy:"NOT_EVALUATED" as const});
}
export interface GongmangPillar extends GanZhi {readonly role:Role;readonly factRef:string;}
export interface GongmangInput {readonly candidateRef:string;readonly pillars:readonly GongmangPillar[];readonly policyId:string;readonly calculationPolicyRefs?:readonly string[];}
function validateInput(input:GongmangInput):void {
  policy(input?.policyId);check(typeof input.candidateRef==="string"&&/^chart\.candidates\[\d+\]$/.test(input.candidateRef),"GONGMANG_PARENT_REFERENCE_REQUIRED");
  dense(input.pillars);check(input.pillars.length===4,"GONGMANG_FOUR_PILLARS_REQUIRED");const refs=new Set<string>();
  input.pillars.forEach((p,i)=>{pillar(p);check(p.role===roles[i],"GONGMANG_ORDERED_PILLARS_REQUIRED");check(typeof p.factRef==="string"&&(p.factRef.startsWith(input.candidateRef+"#")||p.factRef.startsWith(input.candidateRef+"."))&&!refs.has(p.factRef),"GONGMANG_SCOPED_UNIQUE_FACT_REFERENCE_REQUIRED");refs.add(p.factRef);});
  if(input.calculationPolicyRefs!==undefined){dense(input.calculationPolicyRefs);check(input.calculationPolicyRefs.every(ref=>typeof ref==="string"&&ref.trim().length>0)&&new Set(input.calculationPolicyRefs).size===input.calculationPolicyRefs.length,"GONGMANG_CALCULATION_POLICY_REFERENCES_REQUIRED");}
}
const contexts=new WeakMap<object,GongmangInput>();
export function deriveGongmang(input:GongmangInput){
  validateInput(input);const basis=gongmangForDayPillar({dayPillar:input.pillars[2]!,policyId:input.policyId});
  const targets=input.pillars.map(p=>({id:input.candidateRef+"#gongmang-"+p.role,candidateRef:input.candidateRef,role:p.role,branch:p.branch,
    presence:basis.voidBranches.includes(p.branch)?"PRESENT_UNDER_POLICY" as const:"ABSENT_UNDER_POLICY" as const,
    inputFactRefs:[input.pillars[2]!.factRef,p.factRef].filter((r,i,a)=>a.indexOf(r)===i),ruleRefs:[RULE],policyRefs:[GONGMANG_POLICY_ID],sourceRefs:[SOURCE],efficacy:"NOT_EVALUATED" as const}));
  const result=freeze({id:input.candidateRef+"#gongmang",candidateRef:input.candidateRef,policy:GONGMANG_METADATA,...basis,
    inputFactRefs:input.pillars.map(p=>p.factRef),calculationPolicyRefs:[...(input.calculationPolicyRefs??[])],targets,
    observedMatches:targets.filter(t=>t.presence==="PRESENT_UNDER_POLICY"),interpretation:"PRESENCE_ONLY_NOT_LUCK_OR_MISFORTUNE" as const});
  contexts.set(result,freeze({candidateRef:input.candidateRef,pillars:input.pillars.map(p=>({...p})),policyId:input.policyId,...(input.calculationPolicyRefs===undefined?{}:{calculationPolicyRefs:[...input.calculationPolicyRefs]})}));return result;
}
export type GongmangResult=ReturnType<typeof deriveGongmang>;
export function validateGongmang(result:GongmangResult,expected?:GongmangInput):true {
  const input=contexts.get(result);check(input&&Object.isFrozen(result),"ISSUED_GONGMANG_RESULT_REQUIRED");
  if(expected){validateInput(expected);check(equal(input,expected),"GONGMANG_INPUT_CONTEXT_MISMATCH");}
  check(equal(deriveGongmang(input),result),"GONGMANG_RESULT_CHANGED");return true;
}
export function matchGongmangBranches(result:GongmangResult,locations:readonly {readonly locationKind:"DA_YUN"|"SE_YUN"|"MONTHLY";readonly locationRef:string;readonly branch:EarthlyBranch}[]){
  validateGongmang(result);dense(locations);const known=new Set<string>();
  return freeze(locations.map(p=>{check(p&&typeof p==="object"&&Object.keys(p).every(k=>["locationKind","locationRef","branch"].includes(k))&&["DA_YUN","SE_YUN","MONTHLY"].includes(p.locationKind)&&typeof p.locationRef==="string"&&p.locationRef.trim().length>0&&(EARTHLY_BRANCHES as readonly string[]).includes(p.branch)&&!known.has(p.locationRef),"GONGMANG_UNIQUE_TEMPORAL_LOCATION_REQUIRED");known.add(p.locationRef);return {candidateRef:result.candidateRef,locationKind:p.locationKind,locationRef:p.locationRef,branch:p.branch,presence:result.voidBranches.includes(p.branch)?"PRESENT_UNDER_POLICY" as const:"ABSENT_UNDER_POLICY" as const,basisRef:result.id,ruleRefs:[RULE],policyRefs:[GONGMANG_POLICY_ID],sourceRefs:[SOURCE],efficacy:"NOT_EVALUATED" as const};}));
}
export function explainGongmang(result:GongmangResult):string {
  validateGongmang(result);const roleKo={year:"연지",month:"월지",day:"일지",hour:"시지"};
  return `선택한 일주 ${result.dayPillar.stem}${result.dayPillar.branch}는 ${result.xunStart.stem}${result.xunStart.branch}순이며 공망 지지는 ${result.voidBranches.join("·")}입니다. ${result.observedMatches.length?"원국에서는 "+result.observedMatches.map(t=>roleKo[t.role]+" "+t.branch).join("·")+"가 대응합니다":"원국 네 지지에서는 대응하는 위치가 없습니다"}. 공망의 존재 계산이며 실제 길흉이나 작용을 판정하지 않습니다.`;
}
