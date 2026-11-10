/** Local API -> existing finite M2 lookups. No calendar calculation or network. */
import { verifyLocalChartResult } from './local-chart.mjs';
import { labelKoreanGanZhi } from '../../dist/calendar/koreanBirthPreview.js';
import { deriveM2ChartFactsV3, M2_CHART_FACTS_V3_RULE_ID } from '../../dist/chartFacts/chartFactsV3.js';
import { M2_CHART_FACTS_RULE_ID } from '../../dist/chartFacts/chartFactsV1.js';
import { M2_CHART_FACTS_V2_RULE_ID } from '../../dist/chartFacts/chartFactsV2.js';
import { STEM_NATURE } from '../../dist/domain/stems.js';
import { BRANCH_NATURE } from '../../dist/domain/branches.js';
import { HIDDEN_STEM_RULE, HIDDEN_STEM_POLICY_V1 } from '../../dist/domain/hiddenStems.js';
import { BRANCH_TEN_GOD_RULE_ID } from '../../dist/domain/branchTenGods.js';
import { BRANCH_RELATION_RULES, BRANCH_RELATIONS_POLICY_V1 } from '../../dist/domain/branchRelations.js';
import { TRIAD_RULES, TRIAD_MEMBERSHIP_POLICY_V1 } from '../../dist/domain/triadMemberships.js';
import { twelveGrowthStage, TWELVE_GROWTH_RULE, TWELVE_GROWTH_POLICY_V1 } from '../../dist/domain/twelveGrowthStages.js';
import catalog from '../../docs/research/m2-policy-catalog.json' with {type:'json'};

export const M2_LOCAL_PROFILE_ID='m2-basic-classification-local-v1';
export const LOCAL_FACTS_SCHEMA='kasi-local-chart-facts-v1';
const ROLES=['year','month','day','hour'];
const NATURE_STEM='src/domain/stems.ts#STEM_NATURE';
const NATURE_BRANCH='src/domain/branches.ts#BRANCH_NATURE';
const TEN_GOD_RULE='M0-RULE-TEN-GODS-ELEMENT-RELATION';
const COMPOSITION_RULE='kasi-local-m2-composition-v1';
const issued=new WeakSet();
const clone=value=>structuredClone(value);
// Imported JSON is shared by Node's module cache; keep a private snapshot so
// another importer cannot change source-rights metadata between requests.
const sourceCatalog=clone(catalog.sources);
const sealed=new WeakSet();
function deepFreeze(value,seen=new WeakSet()){
  if(value && typeof value==='object' && !sealed.has(value) && !seen.has(value)){
    seen.add(value);Object.values(value).forEach(item=>deepFreeze(item,seen));Object.freeze(value);sealed.add(value);
  }
  return value;
}
function invalid(code='LOCAL_M2_FACTS_REJECTED'){const error=new RangeError(code);error.code=code;throw error;}
const check=(condition,code)=>{if(!condition)invalid(code);};
const unique=values=>[...new Set(values)];
let cachedBundle,cachedRules,cachedRuleSources;

/** Bundle version is new composition metadata, never an invented upstream rule version. */
export function getM2PolicyBundle(id){
  check(id===M2_LOCAL_PROFILE_ID,'EXPLICIT_SUPPORTED_M2_PROFILE_REQUIRED');
  if(cachedBundle)return cachedBundle;
  cachedBundle=deepFreeze({id,version:'1',classificationSchema:'m2-chart-facts-v3',policies:{
    hiddenStems:{id:HIDDEN_STEM_POLICY_V1,runtimeVersion:HIDDEN_STEM_RULE.version},
    branchRelations:{id:BRANCH_RELATIONS_POLICY_V1,runtimeVersion:null},
    triadMembership:{id:TRIAD_MEMBERSHIP_POLICY_V1,runtimeVersion:null},
    twelveGrowth:{id:TWELVE_GROWTH_POLICY_V1,runtimeVersion:TWELVE_GROWTH_RULE.version},
  },settings:{hiddenStemOrder:'EXISTING_MAIN_QI_FIRST_DISPLAY_NOT_STRENGTH',
    twelveGrowth:'YANG_FORWARD_YIN_REVERSE_WU_FOLLOWS_BING_JI_FOLLOWS_DING',
    branchRelations:'ALL_POSITION_PAIRS_DIRECTION_AND_OVERLAPS_PRESERVED',
    triads:'FOUR_SANHE_FOUR_SANHUI_FULL_OR_PARTIAL_DISTINCT_MEMBERS_ONLY'},
  excluded:['STRENGTH','GEJU','YONGSHEN','TIAOHOU','TRANSFORMATION','RELATION_EFFECT','FORTUNE','DAYUN','PREDICTION'],
  editionVerification:'UNVERIFIED',rightsReview:'UNVERIFIED',predictiveValidity:'NOT_CLAIMED'});
  return cachedBundle;
}

/** Minimal shape adapter only; API date provenance remains in the local envelope. */
export function toM2Preview(calculation){
  verifyLocalChartResult(calculation);
  return previewFromVerified(calculation);
}
function previewFromVerified(calculation){
  check(calculation.status==='OK','LOCAL_M2_REQUIRES_OK_CHART');
  const chart=calculation.chart;
  const sourceIds=unique(chart.monthBoundaryTrace.candidateContexts.flatMap(c=>c.activeSince.sourceIds)
    .concat(chart.monthBoundaryTrace.atPublishedBoundary?.sourceIds??[])
    .concat('KASI_OPENAPI_RESPONSE:'+calculation.evidence.yearBoundary.sourceRef+':'+calculation.evidence.yearBoundary.original.date+':'+calculation.evidence.yearBoundary.original.termCode)).sort();
  return {status:'OK',preview:{schemaVersion:'v0-korean-birth-chart-preview-v1',locale:'ko-KR',
    input:clone(calculation.input),recordedBirthKstMinute:chart.recordedBirthKstMinute,
    effectiveDayDate:chart.effectiveDayDate,policies:clone(chart.policies),
    confidence:chart.confidence,confidenceScope:chart.confidenceScope,
    solarTermSourceIds:sourceIds,coverage:clone(chart.coverage),
    candidates:chart.candidates.map(candidate=>Object.fromEntries(ROLES.map(role=>[role,labelKoreanGanZhi(candidate[role])]))),
  }};
}

function ruleRecords(bundle){
  const implementation=(id,ref,policyIds=[])=>({id,runtimeVersion:null,kind:'EXISTING_IMPLEMENTATION_REFERENCE',
    implementationRef:ref,sourceIds:[],policyIds,upstreamSourceRegistry:'OPEN_NOT_CREATED_BY_THIS_BRIDGE'});
  const from=(rule,ref)=>({id:rule.ruleId,runtimeVersion:rule.version??null,kind:'EXISTING_TRADITIONAL_RULE',
    implementationRef:ref,sourceIds:[...rule.sourceIds],policyIds:[rule.policyId],
    evidenceLayer:rule.evidenceLayer,meaning:rule.meaning,codeability:rule.codeability,disputeStatus:rule.disputeStatus});
  return [
    {id:COMPOSITION_RULE,runtimeVersion:'1',kind:'NEW_LOCAL_COMPOSITION_ONLY',implementationRef:'scripts/kasi/local-chart-facts.mjs',sourceIds:[],policyIds:[bundle.id],meaning:'CONNECT_EXISTING_CALCULATION_AND_LOOKUPS_ONLY'},
    implementation(NATURE_STEM,NATURE_STEM),implementation(NATURE_BRANCH,NATURE_BRANCH),
    implementation(TEN_GOD_RULE,'src/domain/tenGods.ts#tenGod'),
    implementation(BRANCH_TEN_GOD_RULE_ID,'src/domain/branchTenGods.ts#branchTenGodFacts',[HIDDEN_STEM_POLICY_V1]),
    implementation(M2_CHART_FACTS_RULE_ID,'src/chartFacts/chartFactsV1.ts#deriveM2ChartFacts',[HIDDEN_STEM_POLICY_V1]),
    implementation(M2_CHART_FACTS_V2_RULE_ID,'src/chartFacts/chartFactsV2.ts#deriveM2ChartFactsV2',[BRANCH_RELATIONS_POLICY_V1]),
    implementation(M2_CHART_FACTS_V3_RULE_ID,'src/chartFacts/chartFactsV3.ts#deriveM2ChartFactsV3',[TRIAD_MEMBERSHIP_POLICY_V1]),
    from(HIDDEN_STEM_RULE,'src/domain/hiddenStems.ts#HIDDEN_STEM_RULE'),
    from(TWELVE_GROWTH_RULE,'src/domain/twelveGrowthStages.ts#TWELVE_GROWTH_RULE'),
    ...Object.entries(BRANCH_RELATION_RULES).map(([kind,rule])=>from(rule,'src/domain/branchRelations.ts#BRANCH_RELATION_RULES.'+kind)),
    ...Object.entries(TRIAD_RULES).map(([kind,rule])=>from(rule,'src/domain/triadMemberships.ts#TRIAD_RULES.'+kind)),
  ];
}

function calendarSources(calculation){
  const records=new Map();
  for(const evidence of [...calculation.evidence.appliedJie,calculation.evidence.yearBoundary]){
    const id='KASI_OPENAPI_RESPONSE:'+evidence.sourceRef+':'+evidence.original.date+':'+evidence.original.termCode;
    records.set(id,{id,kind:'CALENDAR_API',evidence:clone(evidence),rightsReview:'UNVERIFIED',meaning:'CALENDAR_DATA_NOT_M2_RULE_SOURCE'});
  }
  const evidence=calculation.evidence.dateConversion;
  const id='KASI_OPENAPI_RESPONSE_DATE:'+evidence.sourceRef+':'+evidence.observed.solarDate;
  records.set(id,{id,kind:'CALENDAR_API',evidence:clone(evidence),rightsReview:'UNVERIFIED',meaning:'OBSERVED_DATE_MAPPING_NOT_M2_RULE_SOURCE'});
  return [...records.values()];
}

/** The caller must pass the live result issued by the validated local chart module. */
export function deriveLocalChartFacts(calculation,{m2ProfileId,request}={}){
  const bundle=getM2PolicyBundle(m2ProfileId);
  verifyLocalChartResult(calculation,{request});
  const preview=previewFromVerified(calculation), genericM2=deriveM2ChartFactsV3(preview,
    bundle.policies.hiddenStems.id,bundle.policies.branchRelations.id,bundle.policies.triadMembership.id);
  check(genericM2.status==='READY','LOCAL_M2_NOT_READY');
  const rules=cachedRules??=deepFreeze(ruleRecords(bundle)), ruleMap=new Map(rules.map(r=>[r.id,r]));
  const ruleSources=cachedRuleSources??=deepFreeze(sourceCatalog.map(source=>({id:source.sourceId,kind:'M2_RULE_SOURCE_RECORD',...source})));
  const sources=[...ruleSources,...calendarSources(calculation)];
  const dateSourceId=sources.find(s=>s.kind==='CALENDAR_API' && s.id.startsWith('KASI_OPENAPI_RESPONSE_DATE:')).id;
  const yearSourceId='KASI_OPENAPI_RESPONSE:'+calculation.evidence.yearBoundary.sourceRef+':'+calculation.evidence.yearBoundary.original.date+':'+calculation.evidence.yearBoundary.original.termCode;
  const candidates=genericM2.candidates.map((candidate,index)=>{
    const id=`chart.candidates[${index}]`, context=calculation.chart.monthBoundaryTrace.candidateContexts[index];
    const labelled=preview.preview.candidates[index], facts=[];
    const calculationSourceRefs=unique([...context.activeSince.sourceIds,yearSourceId,dateSourceId]);
    const activeOriginal=sources.find(source=>context.activeSince.sourceIds.includes(source.id))?.evidence.original;
    check(activeOriginal && typeof activeOriginal.term==='string','APPLIED_JIE_EVIDENCE_REQUIRED');
    const add=(suffix,kind,value,pillarRoles,ruleRefs,policyRefs=[],sourceRefs)=>{
      const fact={id:id+'#'+suffix,candidateRef:id,kind,value:clone(value),
        pillarRefs:pillarRoles.map(role=>id+'.'+role),ruleRefs:[...ruleRefs],policyRefs:[...policyRefs],
        sourceRefs:unique(sourceRefs??ruleRefs.flatMap(ref=>ruleMap.get(ref).sourceIds)),
        calculationSourceRefs:[...calculationSourceRefs]};
      facts.push(fact);return fact;
    };
    const pillars=candidate.pillars.map(pillar=>({...clone(pillar),nature:{stem:clone(STEM_NATURE[pillar.stem]),branch:clone(BRANCH_NATURE[pillar.branch])},
      twelveGrowth:clone(twelveGrowthStage(candidate.dayMaster,pillar.branch,bundle.policies.twelveGrowth.id))}));
    add('summary','SUMMARY',{pillars:ROLES.map(role=>({role,...labelled[role]})),policies:clone(calculation.policies),
      confidence:calculation.chart.confidence,boundarySide:context.boundarySide,activeSince:{...clone(context.activeSince),koreanName:activeOriginal.term},
      pairCount:candidate.branchRelations.length,triadCount:candidate.triadMemberships.length},ROLES,[COMPOSITION_RULE],[bundle.id]);
    add('day-master','DAY_MASTER',{stem:candidate.dayMaster,...STEM_NATURE[candidate.dayMaster]},['day'],[NATURE_STEM]);
    for(const pillar of pillars){
      const role=pillar.role;
      add(role+'-nature','PILLAR_NATURE',{role,stem:pillar.stem,branch:pillar.branch,stemNature:pillar.nature.stem,branchNature:pillar.nature.branch},[role],[NATURE_STEM,NATURE_BRANCH]);
      if(pillar.visibleTenGod!==null)add(role+'-visible-ten-god','VISIBLE_TEN_GOD',{role,stem:pillar.stem,dayMaster:candidate.dayMaster,tenGod:pillar.visibleTenGod},['day',role],[TEN_GOD_RULE]);
      const hiddenFact=add(role+'-hidden-stems','HIDDEN_STEMS',{role,branch:pillar.branch,dayMaster:candidate.dayMaster,
        members:pillar.branchTenGods.members,principalTenGod:pillar.branchTenGods.members.find(m=>m.position==='MAIN_QI')?.tenGod??null},
        ['day',role],[HIDDEN_STEM_RULE.ruleId,BRANCH_TEN_GOD_RULE_ID,TEN_GOD_RULE],[bundle.policies.hiddenStems.id]);
      hiddenFact.value.members=hiddenFact.value.members.map(member=>({...member,
        id:hiddenFact.id+`#member[${member.index}]`,candidateRef:id,
        pillarRef:id+'.'+role,
        memberRef:`facts.candidates[${index}].pillars[${ROLES.indexOf(role)}].branchTenGods.members[${member.index}]`,
        m2FactRef:`genericM2.candidates[${index}].pillars[${ROLES.indexOf(role)}].branchTenGods.members[${member.index}]`,
        ruleRefs:[HIDDEN_STEM_RULE.ruleId,BRANCH_TEN_GOD_RULE_ID,TEN_GOD_RULE],
        policyRefs:[bundle.policies.hiddenStems.id],sourceRefs:[...HIDDEN_STEM_RULE.sourceIds]}));
      add(role+'-twelve-growth','TWELVE_GROWTH',{role,...pillar.twelveGrowth},['day',role],[TWELVE_GROWTH_RULE.ruleId],[bundle.policies.twelveGrowth.id]);
    }
    candidate.branchRelations.forEach((relation,i)=>add('relation-'+i,'BRANCH_RELATION',relation,
      [relation.leftPillarRole,relation.rightPillarRole],[relation.ruleId],[bundle.policies.branchRelations.id],relation.sourceIds));
    candidate.triadMemberships.forEach((triad,i)=>add('triad-'+i,'TRIAD_MEMBERSHIP',triad,
      unique(triad.members.flatMap(m=>m.pillarRoles)),[triad.ruleId],[bundle.policies.triadMembership.id],triad.sourceIds));
    return {id,candidateIndex:index,dayMaster:candidate.dayMaster,pillars,branchRelations:clone(candidate.branchRelations),
      triadMemberships:clone(candidate.triadMemberships),facts};
  });
  const result={schemaVersion:LOCAL_FACTS_SCHEMA,status:'READY',policyBundle:bundle,
    confidence:genericM2.confidence,candidateDisplay:genericM2.candidateDisplay,
    calculation:clone(calculation),preview,genericM2:clone(genericM2),rules,sources,candidates,
    validation:{level:'SAME_PROCESS_PINNED_LOCAL_CALCULATION_AND_EXISTING_FINITE_M2_LOOKUPS',
      genericM2Validation:'STRUCTURAL_SELF_CONSISTENCY_NOT_EXTERNAL_AUTHENTICATION',
      previewSourceIdScope:'ACTUAL_USED_EVENT_SOURCE_SUBSET_NOT_FULL_YEAR_CORPUS',
      serializedReferences:'TRACEABILITY_NOT_EXTERNAL_AUTHENTICATION',
      apiDateEvidenceNotCoercedIntoAnnualTxtLunarConversionSource:true,
      editionVerification:'UNVERIFIED',rightsReview:'UNVERIFIED',predictiveValidity:'NOT_CLAIMED',g0Receipt:null,g1P2Promotion:false}};
  validateReferences(result);
  // Complete reference validation happens once at minting. The entire object
  // graph is sealed before the identity is issued;
  // consumers cannot change facts or their provenance between validations.
  deepFreeze(result);
  issued.add(result);
  return result;
}

function validateReferences(envelope){
  const rules=new Map(envelope.rules.map(r=>[r.id,r])), sources=new Map(envelope.sources.map(s=>[s.id,s]));
  const policies=new Set([envelope.policyBundle.id,...Object.values(envelope.policyBundle.policies).map(p=>p.id)]);
  const allIds=new Set();
  for(const candidate of envelope.candidates){
    check(candidate.id===`chart.candidates[${candidate.candidateIndex}]`,'CANDIDATE_REFERENCE');
    for(const fact of candidate.facts){
      check(fact.candidateRef===candidate.id && fact.id.startsWith(candidate.id+'#') && !allIds.has(fact.id),'FACT_CANDIDATE_REFERENCE');allIds.add(fact.id);
      check(fact.pillarRefs.every(ref=>ROLES.some(role=>ref===candidate.id+'.'+role)),'PILLAR_REFERENCE');
      check(fact.ruleRefs.length>0 && fact.ruleRefs.every(ref=>rules.has(ref)),'RULE_REFERENCE');
      check(fact.policyRefs.every(ref=>policies.has(ref)),'POLICY_REFERENCE');
      check(fact.sourceRefs.every(ref=>sources.get(ref)?.kind==='M2_RULE_SOURCE_RECORD'),'RULE_SOURCE_REFERENCE');
      check(fact.calculationSourceRefs.length>0 && fact.calculationSourceRefs.every(ref=>sources.get(ref)?.kind==='CALENDAR_API'),'CALCULATION_SOURCE_REFERENCE');
      for(const member of fact.kind==='HIDDEN_STEMS'?fact.value.members:[]){
        check(member.id===fact.id+`#member[${member.index}]` && member.candidateRef===candidate.id && !allIds.has(member.id),'HIDDEN_MEMBER_REFERENCE');allIds.add(member.id);
        const role=fact.value.role, position=ROLES.indexOf(role);
        check(fact.pillarRefs.includes(member.pillarRef) && member.pillarRef===candidate.id+'.'+role &&
          member.memberRef===`facts.candidates[${candidate.candidateIndex}].pillars[${position}].branchTenGods.members[${member.index}]` &&
          member.m2FactRef===`genericM2.candidates[${candidate.candidateIndex}].pillars[${position}].branchTenGods.members[${member.index}]`,'HIDDEN_MEMBER_POSITION_REFERENCE');
      }
    }
  }
}

/** No M1/M2 rerun or repeated corpus hash. Every issued nested value is immutable.
 * Cloned/rehydrated JSON is deliberately not an issued live value. */
export function validateLocalChartFacts(envelope){
  check(issued.has(envelope),'LOCAL_M2_CONTEXT_REQUIRED');
  check(Object.isFrozen(envelope),'LOCAL_M2_FACTS_NOT_IMMUTABLE');
  return true;
}
