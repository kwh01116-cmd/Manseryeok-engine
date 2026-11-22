import {loadApiOnlyServerEngine,validateApiOnlyServerRequest,validateApiOnlyServerResult} from '../server/engine.mjs';
import {E1_SELECTION,projectEngineE1,validateE1Selection} from './e1.mjs';
import {projectTemporal} from './e2-temporal.mjs';
import {SINSAL_PROFILE_ID,SINSAL_VERSION,calculateSinsalV1} from '../../dist/e2/sinsalV1.js';
import {PATTERN_REVIEW_POLICY_ID,PATTERN_REVIEW_VERSION,reviewPatternPrerequisites} from '../../dist/e2/patternReviewV1.js';
import {deriveM4ZhengguanStructure,M4_PATTERN_PROFILE_ID} from '../../dist/m4/zhengguanStructureV1.js';
import {M4_INNER_PATTERN_METADATA} from '../../dist/m4/innerPatternsV1.js';
import {M7_LUCK_POLICY_METADATA} from '../../dist/luck/luckV01.js';
import {MONTHLY_LUCK_METADATA} from '../../dist/luck/monthlyLuckV1.js';
import {MONTHLY_LUCK_V2_METADATA} from '../../dist/luck/monthlyLuckV2.js';
import {M5_LIMITED_PURPOSE_METADATA} from '../../dist/m5/limitedPurposeV1.js';
import {GONGMANG_METADATA} from '../../dist/domain/gongmangV1.js';
import {TWELVE_GROWTH_RULE} from '../../dist/domain/twelveGrowthStages.js';
import {HIDDEN_STEM_RULE} from '../../dist/domain/hiddenStems.js';
import {areStemCombinationPartners} from '../../dist/domain/stemCombinations.js';

const version='0.1.0',modern='kasi-api-1989-2026-local-v1';
const pair=(id,version)=>({id,version});
const m2=pair('m2-basic-classification-local-v1','1');
export const E2_CORE_SELECTION=Object.freeze({profileId:'ENGINE-PARITY-E2-V01',version,
  sinsal:Object.freeze({policyId:SINSAL_PROFILE_ID,policyVersion:SINSAL_VERSION,branchReference:'BOTH'}),
  patternReviewPolicyId:PATTERN_REVIEW_POLICY_ID});
export const E2_SELECTION=Object.freeze({...E2_CORE_SELECTION,e1:E1_SELECTION});
const required=(ok,message)=>{if(!ok)throw new RangeError(message);};
function record(obj,keys){
  return obj && [null,Object.prototype].includes(Object.getPrototypeOf(obj)) &&
    Reflect.ownKeys(obj).length===keys.length && keys.every(k=>{
      const d=Object.getOwnPropertyDescriptor(obj,k);return d && d.enumerable && 'value' in d;
    });
}
export function validateE2Selection(s){
  const include=s!=null && Object.hasOwn(s,'e1');
  required(record(s,[...Object.keys(E2_CORE_SELECTION),...(include?['e1']:[])]) &&
    s.profileId===E2_CORE_SELECTION.profileId && s.version===version &&
    s.patternReviewPolicyId===PATTERN_REVIEW_POLICY_ID,'EXPLICIT_E2_POLICY_BUNDLE_REQUIRED');
  required(record(s.sinsal,['policyId','policyVersion','branchReference']) &&
    s.sinsal.policyId===SINSAL_PROFILE_ID && s.sinsal.policyVersion===SINSAL_VERSION &&
    ['BOTH','YEAR','DAY'].includes(s.sinsal.branchReference),'E2_SINSAL_SELECTION');
  if(include)validateE1Selection(s.e1);
}
function freeze(value){
  if(value && typeof value==='object' && !Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}
  return value;
}
// Partial dayun requests keep their own NEEDS_INPUT. Validate all supplied
// policy/query fields before dropping only the unexecutable part from M1 input.
export function prepareE2Birth(birth){
  try{validateApiOnlyServerRequest(birth);return {executable:birth,pending:null};}
  catch(error){
    if(error.message!=='SERVER_INVALID_DAYUN_INPUT')throw error;
    const opts=birth.luckOptions, d=opts.features.dayun;
    if ((!Object.hasOwn(d,'traditionalSex') || !Object.hasOwn(d,'count')) &&
      (d.traditionalSex===undefined || ['MALE','FEMALE'].includes(d.traditionalSex)) &&
      (d.count===undefined || Number.isInteger(d.count) && d.count>=1 && d.count<=20)){
      const executable={...birth};delete executable.luckOptions;
      if(opts.features.seyun)executable.luckOptions={luckPolicyId:opts.luckPolicyId,features:{seyun:opts.features.seyun}};
      validateApiOnlyServerRequest(executable);
      return {executable,pending:structuredClone(opts)};
    }
    throw error;
  }
}
function feature(featureId,policy,availability,result,factRefs,limitationCodes=[]){
  required(typeof policy?.id==='string' && typeof policy.version==='string','E2_MISSING_POLICY_PROVENANCE_'+featureId);
  return {featureId,availability,policyId:policy.id,policyVersion:policy.version,result,
    factRefs:[...new Set(factRefs)],limitationCodes:[...new Set(limitationCodes)]};
}
function catalog(existing){
  const request=existing.request;
  return {
    chart:existing.calculation?.profile??pair(request.calendarProfileId,'1'),
    elementsTenGods:m2, hiddenStems:pair(HIDDEN_STEM_RULE.policyId,HIDDEN_STEM_RULE.version),
    twelveStages:pair(TWELVE_GROWTH_RULE.policyId,TWELVE_GROWTH_RULE.version),
    relations:m2,gongmang:GONGMANG_METADATA,sinsal:pair(SINSAL_PROFILE_ID,SINSAL_VERSION),
    daeun:M7_LUCK_POLICY_METADATA,seyun:M7_LUCK_POLICY_METADATA,
    monthly:request.calendarProfileId===modern?MONTHLY_LUCK_METADATA:MONTHLY_LUCK_V2_METADATA,
    strength:pair(E1_SELECTION.strengthPolicyId,E1_SELECTION.version),eokbu:pair(E1_SELECTION.eokbuPolicyId,E1_SELECTION.version),
    climate:M5_LIMITED_PURPOSE_METADATA,pattern:M4_INNER_PATTERN_METADATA,patternReview:pair(PATTERN_REVIEW_POLICY_ID,PATTERN_REVIEW_VERSION),
  };
}
function heldAvailability(status){
  switch(status){
    case 'NEEDS_BIRTH_TIME': case 'AMBIGUOUS_TIME': return 'NEEDS_INPUT';
    case 'NONEXISTENT_TIME': case 'INVALID_INPUT': return 'INVALID_INPUT';
    case 'NEEDS_DATA':return 'NEEDS_DATA';
    default:return 'POLICY_UNRESOLVED';
  }
}
function stemPairs(pillars,observedPairs){
  const rows=[];
  for(const [i,a] of pillars.entries())for(const [j,b] of pillars.entries()){
    if(i>=j)continue;
    // Modern M3 has already issued all pairs. Historical profiles expose M2
    // stems without the modern synthesis, so use the same frozen M2 pair rule.
    const match=observedPairs?observedPairs.some(p=>p.left.pillarRole===a.role && p.right.pillarRole===b.role):
      areStemCombinationPartners(a.stem,b.stem);
    if(match)
      rows.push({leftRole:a.role,rightRole:b.role,leftStem:a.stem,rightStem:b.stem,adjacent:j-i===1,factRefs:[a.factRef,b.factRef]});
  }
  return rows;
}
function projectCandidate({existing,s,policies,index,inner,officers,e1,pending}) {
  const d=existing.analysisData, upstream=d.base?.existing??d;
  const parent=upstream.facts.candidates[index], evidence=upstream.evidence.candidates[index];
  const {id:candidateRef,pillars}=parent, pattern=inner.candidates[index], officerDetail=officers.candidates[index];
  const gm=d.gongmang[index],climate=d.m5.candidates[index],ec=e1?.candidates[index];
  for(const item of [evidence,pattern,officerDetail,gm,climate,...(e1?[ec]:[])])
    required(item?.candidateRef===candidateRef,'E2_CANDIDATE_CONTEXT_MISMATCH');
  const path='/existing/analysisData'+(d.base?'/base/existing':'');
  const cp=path+'/facts/candidates/'+index, ep=path+'/evidence/candidates/'+index, chir='/existing/calculation/chart';
  const pp='/existing/analysisData/'+(d.base?'base/':'')+'innerPatterns/candidates/'+index;
  const factPaths=(...kinds)=>parent.facts.flatMap((f,i)=>kinds.includes(f.kind)?[cp+'/facts/'+i]:[]);
  const make=(id,status,result,refs,limits)=>feature(id,policies[id],status,result,refs,limits);
  const hiddenFacts=parent.facts.filter(f=>f.kind==='HIDDEN_STEMS');
  const visible=pillars.map(p=>({role:p.role,stem:p.stem,branch:p.branch,stemNature:p.nature.stem,
    branchNature:p.nature.branch,visibleTenGod:p.visibleTenGod,branchMainTenGod:p.branchTenGods.members.find(m=>m.position==='MAIN_QI').tenGod}));
  const hiddenStems=hiddenFacts.map(({value})=>({role:value.role,branch:value.branch,
    representativeElement:pillars.find(p=>p.role===value.role).nature.branch.principalElement,
    members:value.members.map(member=>({ ...member,
      dayStemMatch:member.stem===parent.dayMaster?'EXACT':evidence.rootCandidates.sameElementDifferentStem.some(l=>l.locationId===member.id)?'SAME_ELEMENT':'NONE',
      exactSurfaceRoles:evidence.hiddenVisibleLinks.filter(l=>l.hidden.locationId===member.id).map(l=>l.visible.pillarRole),
      ...(ec?{e1Contribution:{units:ec.strengthAssessment.weightedComponents.find(row=>row.factRef===member.memberRef).units,
        totalChartUnits:10000,policyId:s.e1.strengthPolicyId,policyVersion:s.e1.version}}:{}),
    }))}));
  const temporal=projectTemporal(existing,index,feature,policies.monthly,pending);
  const natal=pillars.map(p=>({role:p.role,...p.twelveGrowth}));
  const observedPairs=upstream.researchSynthesis?.candidates[index].observed.interactions.visibleFiveCombinations;
  const relations={stemPairs:stemPairs(pillars,observedPairs),branchPairs:parent.branchRelations.map(p=>({...p,adjacent:Math.abs(p.leftPillarIndex-p.rightPillarIndex)===1})),
    triads:parent.triadMemberships,dependencyPolicies:upstream.facts.policyBundle.policies,
    stemPairRule:'src/domain/stemCombinations.ts#STEM_COMBINATION_PAIRS',effectStatus:'NOT_EVALUATED'};
  const reviews=reviewPatternPrerequisites(inner,upstream.evidence,upstream.facts,index);
  const chartInput=existing.calculation;
  const strength=ec?.strengthAssessment, eb=ec?.eokbuCandidate;
  const seasonal=upstream.seasonal.candidates[index];
  const chart=make('chart','AVAILABLE',{pillars,boundaryContext:chartInput.chart.monthBoundaryTrace.candidateContexts[index],
    clock:chartInput.policies,seasonal:seasonal.judgment??seasonal},[chir+'/candidates/'+index,cp+'/pillars',path+'/seasonal/candidates/'+index],
    ['PUBLISHED_MINUTE_PRECISION','SEASONAL_STATE_IS_NOT_STRENGTH']);
  const sinsal=calculateSinsalV1(parent,s.sinsal);
  return {candidateRef,features:{
    chart,
    elementsTenGods:make('elementsTenGods','AVAILABLE',visible,factPaths('PILLAR_NATURE','VISIBLE_TEN_GOD','DAY_MASTER','HIDDEN_STEMS'),['UNWEIGHTED_STRUCTURE']),
    hiddenStems:make('hiddenStems','AVAILABLE',hiddenStems,[...factPaths('HIDDEN_STEMS'),ep+'/rootCandidates',ep+'/hiddenVisibleLinks'],['ACTUAL_COMMAND_AND_ROOT_FORCE_UNEVALUATED']),
    twelveStages:make('twelveStages','AVAILABLE',{natal,temporal:temporal.temporal},[...factPaths('TWELVE_GROWTH'),...temporal.temporal.map(x=>x.sourcePath)],['TRADITIONAL_LABEL_ONLY','NO_STRENGTH_POINTS']),
    relations:make('relations','AVAILABLE',relations,[...factPaths('PILLAR_NATURE','BRANCH_RELATION','TRIAD_MEMBERSHIP'),
      ...(observedPairs?[path+'/researchSynthesis/candidates/'+index+'/observed/interactions/visibleFiveCombinations']:[])],
      ['FORMATION_MEMBERS_ONLY','NO_TRANSFORMATION_OR_ROOT_DAMAGE']),
    gongmang:make('gongmang','AVAILABLE',gm,['/existing/analysisData/gongmang/'+index],['EFFECT_UNEVALUATED']),
    sinsal:make('sinsal','AVAILABLE',sinsal,factPaths('PILLAR_NATURE'),['SELECTED_SIX_ONLY','NO_EVENT_INFERENCE']),
    daeun:temporal.daeun,seyun:temporal.seyun,monthly:temporal.monthly,
    strength:make('strength',ec?'AVAILABLE':'NOT_SELECTED',strength??null,ec?[cp+'/pillars',...factPaths('HIDDEN_STEMS','VISIBLE_TEN_GOD')]:[],ec?['PROJECT_POLICY','BORDERLINE_IS_NOT_BALANCED']:['SELECT_E1_EXPLICITLY']),
    eokbu:make('eokbu',!ec?'NOT_SELECTED':eb.status==='HOLD'?'HOLD':eb.status==='COMPETING_CANDIDATES'?'PARTIAL':'AVAILABLE',eb??null,
      ec?[cp+'/pillars',pp,'/existing/analysisData/m5/candidates/'+index]:[],ec?['EOKBU_CANDIDATES_ONLY',...eb.holdReasons]:['SELECT_E1_EXPLICITLY']),
    climate:make('climate',d.m5.execution==='NOT_EXECUTED_CLOCK_SCOPE_DEPENDENCY'?'POLICY_UNRESOLVED':climate.status==='HOLD'?'HOLD':'AVAILABLE',
      climate,['/existing/analysisData/m5/candidates/'+index],['WINTER_WOOD_WARMING_ONLY',...(climate.reasonCodes??[climate.reason].filter(Boolean))]),
    pattern:make('pattern','PARTIAL',pattern,[pp],['MONTH_STRUCTURE_ONLY','NO_EXCLUSIVE_PATTERN_DECISION']),
    patternReview:make('patternReview','PARTIAL',{reviews,officerDetail,eokbuHandoff:eb?.patternHandoff??null,
      eokbuReviewStatus:ec?'SELECTED_E1':'NOT_SELECTED',effects:pattern.effects},[pp,ep,cp],
      ['SPECIFIC_SHARED_LOCATION_PREREQUISITES','GE_CHENG_GE_BAI_JIU_YING_NOT_ADJUDICATED']),
  }};
}
function projectSelected(existing,selection,pending){
  validateE2Selection(selection);
  validateApiOnlyServerResult(existing);
  const policies=catalog(existing),s=structuredClone(selection),d=existing.analysisData;
  const candidates=[],unavailableFeatures={};
  if(d){
    const upstream=d.base?.existing??d,inner=d.base?.innerPatterns??d.innerPatterns;
    const officers=deriveM4ZhengguanStructure(upstream.evidence,{profileId:M4_PATTERN_PROFILE_ID,m2Facts:upstream.facts});
    const e1=s.e1?projectEngineE1(existing,s.e1):undefined;
    for(let index=0;index<existing.candidates.length;index++)
      candidates.push(projectCandidate({existing,s,policies,index,inner,officers,e1,pending}));
  }else{
    for(const [id,policy] of Object.entries(policies)){
      const notSelected=!s.e1 && (id==='strength'||id==='eokbu');
      unavailableFeatures[id]=feature(id,policy,notSelected?'NOT_SELECTED':heldAvailability(existing.status),null,
        ['/existing/status','/existing/holds'],[existing.status,...existing.holds.map(h=>h.code)]);
    }
  }
  return freeze({schemaVersion:'manseryeok-engine-e2-result-v1',track:'ENGINE-PARITY-TRACK-V1',selection:s,status:existing.status,
    existing,candidates,unavailableFeatures,inputContext:{pendingDayunRequest:pending},
    unimplementedFeatures:Object.fromEntries(['integratedUsefulGod','favorableUnfavorableRanking','patternUsefulGod','mediationUsefulGod'].map(id=>
      [id,feature(id,pair(s.profileId,s.version),'NOT_IMPLEMENTED',null,[],['REQUIRES_SEPARATE_PURPOSE_POLICY'])])),
    purposeScope:{eokbu:s.e1?'CANDIDATES_ONLY':'NOT_SELECTED',climate:'WINTER_WOOD_ONLY',
      integratedUsefulGod:'NOT_IMPLEMENTED',favorableUnfavorableRanking:'NOT_IMPLEMENTED'}});
}
export function projectEngineE2(existing,selection){
  return projectSelected(existing,selection,null);
}
export async function loadEngineE2({dataDirectory}){
  const engine=await loadApiOnlyServerEngine({dataDirectory});
  return Object.freeze({calculate(birth,selection){
    validateE2Selection(selection);
    const {executable,pending}=prepareE2Birth(birth);
    return projectSelected(engine.calculate(executable),selection,pending);
  }});
}
