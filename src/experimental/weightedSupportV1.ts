/** Optional Level-2 heuristic. Does not replace M3 strength or imply measured force.
 * Weight design reference: glee1228/korean_saju@8c81256, ilgan_strength.py.
 * See THIRD_PARTY_NOTICES.md. Uses our existing tables; no foreign calendar data.
 */
import {HEAVENLY_STEMS, STEM_NATURE, type HeavenlyStem, type FiveElement} from '../domain/stems.js';
import {EARTHLY_BRANCHES, BRANCH_NATURE, type EarthlyBranch} from '../domain/branches.js';
import {fiveElementRelation} from '../domain/tenGods.js';
import {hiddenStemsForBranch,HIDDEN_STEM_POLICY_V1} from '../domain/hiddenStems.js';
import {branchRelationsBetween,BRANCH_RELATIONS_POLICY_V1} from '../domain/branchRelations.js';

export const WEIGHTED_SUPPORT_POLICY_ID='EXPERIMENTAL-WEIGHTED-SUPPORT-LOCAL-NO-TRANSFORMATION-V01' as const;
export const WEIGHTED_SUPPORT_VERSION='0.1.0' as const;
export const WEIGHTED_SUPPORT_METADATA=Object.freeze({
  policyId:WEIGHTED_SUPPORT_POLICY_ID,policyVersion:WEIGHTED_SUPPORT_VERSION,level:2,
  status:'EXPERIMENTAL_POLICY_CANDIDATE_NOT_DEFAULT',
  sourceRefs:Object.freeze(['https://github.com/glee1228/korean_saju/blob/8c81256db10d3179d31f551beacaa69f2ab2fcc5/src/korean_saju/saju/ilgan_strength.py#L87-L264']),
  assumptions:Object.freeze([
    'DEVELOPER_SELECTED_HEURISTIC_NOT_CLASSICAL_CONSENSUS_OR_MEASURED_FORCE',
    'SUPPORTIVE_MEANS_SAME_ELEMENT_OR_GENERATES_DAY_MASTER',
    'BRANCH_PRINCIPAL_ELEMENT_ONLY_WEIGHTS_MONTH_3_5_DAY_1_5_YEAR_1_HOUR_1',
    'NON_DAY_VISIBLE_SUPPORTIVE_STEM_1_IF_ROOTED_OTHERWISE_0_5',
    'LOCAL_M2_HIDDEN_MEMBERSHIP_EXCLUDES_UPSTREAM_HAI_WU',
    'SUPPORTIVE_MONTH_CLASH_MINUS_0_8_ONCE_IS_SELECTED_HEURISTIC',
    'NO_UPSTREAM_AUTOMATIC_STEM_TRANSFORMATION_OR_CHARACTER_DELETION',
    'EXACTLY_FOUR_VALID_PILLARS_NO_MISSING_HOUR_IMPUTATION',
  ]),
  limitations:Object.freeze(['NOT_OFFICER_RELATIVE_STRENGTH','NOT_TRADITIONAL_EFFECT_CERTIFICATION','NO_GEJU_YONGSHEN_OR_FORTUNE','NOT_M3_RELEASE_GATE_PROMOTION','NOT_UPSTREAM_BIT_FOR_BIT_POLICY']),
  hiddenStemPolicyId:HIDDEN_STEM_POLICY_V1,branchRelationPolicyId:BRANCH_RELATIONS_POLICY_V1,
});
export type SupportRole='year'|'month'|'day'|'hour';
export interface WeightedSupportInput {
  readonly candidateRef:string;
  readonly pillars:readonly {readonly role:SupportRole;readonly stem:HeavenlyStem;readonly branch:EarthlyBranch;readonly factRef:string}[];
}
const ROLES=['year','month','day','hour'] as const;
function requireInput(ok:unknown,code:string):asserts ok {if(!ok)throw new RangeError(code);}
function checked(input:WeightedSupportInput,policyId:string):WeightedSupportInput['pillars']{
  requireInput(policyId===WEIGHTED_SUPPORT_POLICY_ID,'EXPLICIT_EXPERIMENTAL_POLICY_REQUIRED');
  requireInput(input&&/^chart\.candidates\[\d+\]$/.test(input.candidateRef),'CANDIDATE_REFERENCE_REQUIRED');
  requireInput(Array.isArray(input.pillars)&&input.pillars.length===4&&[0,1,2,3].every(i=>Object.hasOwn(input.pillars,i)),'FOUR_DENSE_PILLARS_REQUIRED');
  const candidateIndex=input.candidateRef.match(/\[(\d+)\]/)![1];
  for(let i=0;i<4;i++){
    const p=input.pillars[i];
    requireInput(p&&p.role===ROLES[i]&&HEAVENLY_STEMS.includes(p.stem)&&EARTHLY_BRANCHES.includes(p.branch),'ORDERED_VALID_PILLARS_REQUIRED');
    requireInput(p.factRef===`facts.candidates[${candidateIndex}].pillars[${i}]`,'CROSS_CANDIDATE_FACT_REFERENCE');
    requireInput(HEAVENLY_STEMS.indexOf(p.stem)%2===EARTHLY_BRANCHES.indexOf(p.branch)%2,'GANZHI_PARITY_REQUIRED');
  }
  return input.pillars;
}
const supportive=(day:FiveElement,target:FiveElement)=>['SAME','TARGET_GENERATES_DAY_MASTER'].includes(fiveElementRelation(day,target));
/** Integer tenths avoid decimal drift. Thresholds are this policy's choices. */
export function weightedSupportClass(totalTenths:number){
  requireInput(Number.isSafeInteger(totalTenths)&&totalTenths>=0&&totalTenths<=100,'BOUNDED_INTEGER_TENTHS_REQUIRED');
  return totalTenths>=85?'VERY_STRONG':totalTenths>=55?'STRONG':totalTenths>=40?'BALANCED':totalTenths>=20?'WEAK':'VERY_WEAK';
}
export function scoreWeightedSupport(input:WeightedSupportInput,{policyId}:{policyId:string}){
  const pillars=checked(input,policyId),day=STEM_NATURE[pillars[2]!.stem].element;
  const branchWeights=[10,35,15,10],trace:{ruleId:string;role:SupportRole;inputRefs:string[];contributionTenths:number;reason:string;rootRefs:string[]}[]=[];
  for(let i=0;i<4;i++){
    const p=pillars[i]!,element=BRANCH_NATURE[p.branch].principalElement,applies=supportive(day,element);
    trace.push({ruleId:'WEIGHTED-PRINCIPAL-BRANCH',role:p.role,inputRefs:[p.factRef],contributionTenths:applies?branchWeights[i]!:0,reason:fiveElementRelation(day,element),rootRefs:[]});
  }
  for(const i of [0,1,3]){
    const p=pillars[i]!,element=STEM_NATURE[p.stem].element,applies=supportive(day,element),rootRefs:string[]=[];
    for(const b of pillars){
      for(const member of hiddenStemsForBranch(b.branch,HIDDEN_STEM_POLICY_V1))if(STEM_NATURE[member.stem].element===element)rootRefs.push(`${b.factRef}.branchTenGods.members[${member.index}]`);
    }
    trace.push({ruleId:'WEIGHTED-SURFACE-SUPPORT-ROOT-FACTOR',role:p.role,inputRefs:[p.factRef],contributionTenths:applies?(rootRefs.length?10:5):0,reason:applies?(rootRefs.length?'LOCAL_HIDDEN_ROOT_PRESENT':'LOCAL_HIDDEN_ROOT_ABSENT_HALF_WEIGHT'):'NOT_SUPPORTIVE_UNDER_POLICY',rootRefs});
  }
  const month=pillars[1]!,clashes=pillars.filter(p=>p.role!=='month'&&branchRelationsBetween(month.branch,p.branch,BRANCH_RELATIONS_POLICY_V1).some(r=>r.kind==='LIUCHONG'));
  const penalty=trace[1]!.contributionTenths>0&&clashes.length>0?-8:0;
  trace.push({ruleId:'WEIGHTED-SUPPORTIVE-MONTH-CLASH-ONCE',role:'month',inputRefs:[month.factRef,...clashes.map(p=>p.factRef)],contributionTenths:penalty,reason:penalty?'HEURISTIC_PENALTY_NOT_ROOT_DAMAGE_FINDING':'NO_PENALTY_UNDER_POLICY',rootRefs:[]});
  const rawTenths=trace.reduce((n,t)=>n+t.contributionTenths,0),totalTenths=Math.max(0,Math.min(100,rawTenths));
  const value={schemaVersion:'experimental-weighted-support-v1',candidateRef:input.candidateRef,policy:WEIGHTED_SUPPORT_METADATA,
    status:'CLASSIFIED_UNDER_HEURISTIC_POLICY',inputFacts:pillars.map(p=>({role:p.role,stem:p.stem,branch:p.branch,factRef:p.factRef})),decisionTrace:trace,
    score:{totalTenths,value:totalTenths/10,scale:'POLICY_SUPPORT_SCORE_0_TO_10_NOT_PROBABILITY_OR_OBJECTIVE_STRENGTH',rawTenths},
    policyClassification:weightedSupportClass(totalTenths),alternatives:[] as readonly unknown[],
    originalM3FinalStrength:'NOT_MODIFIED',originalM4Efficacy:'NOT_MODIFIED',limitations:WEIGHTED_SUPPORT_METADATA.limitations};
  const freeze=(v:unknown):void=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}};freeze(value);return value;
}
export function validateWeightedSupport(value:unknown,input:WeightedSupportInput,options:{policyId:string}){
  requireInput(JSON.stringify(value)===JSON.stringify(scoreWeightedSupport(input,options)),'WEIGHTED_SUPPORT_OUTPUT_OR_REFERENCE_CHANGED');
}
