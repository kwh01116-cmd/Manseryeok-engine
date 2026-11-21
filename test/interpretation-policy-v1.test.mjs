import test from 'node:test';
import assert from 'node:assert/strict';
import {DOMAINS,INTERPRETATION_PROFILE_ID,INTERPRETATION_POLICIES,INTERPRETATION_VERSION,INTERPRETATION_SOURCES,FORBIDDEN_CONCLUSIONS,resolveSymbolicInterpretation,roleFamily,canonicalInterpretation,assertInterpretationJson} from '../dist/report/interpretationPolicyV1.js';
import {SPRINT7_INTERPRETATION_CONTRACTS as CASES,SPRINT7_INTERPRETATION_CONTRACT_BASIS as BASIS,SPRINT7_SYNTHETIC_CONTRASTS} from './fixtures/sprint7-interpretation-contract-v1.mjs';

const clone=v=>structuredClone(v), valid=CASES.filter(c=>!c.expected.rejected);
const makeContext=row=>{
  const contextId='literal-'+row.id,candidateId='chart.candidates[0]',ref=kind=>contextId+'/'+candidateId+'/'+kind;
  const expose=x=>({role:x.role,stem:x.stem,tenGod:x.type});
  return {contextId,candidateId,ordinal:1,dayStem:row.dayStem,
    visible:clone(row.visible),
    monthly:{...clone(row.monthly),primaryPattern:row.monthly.mainTenGod==='比肩'||row.monthly.mainTenGod==='劫財'?null:row.monthly.mainTenGod,unresolvedTypes:clone(row.monthly.unresolvedTypes??[]),exactExposures:row.monthly.exactExposures.map(expose),competingExposures:row.monthly.competingExposures.map(expose)},
    hidden:(row.hiddenSupplement??[]).map(x=>({...clone(x),position:x.position??'MAIN_QI'})),
    factRefs:{day:ref('day'),pillars:ref('pillars'),pattern:ref('pattern'),root:ref('root'),relations:ref('relations'),seasonal:ref('seasonal'),strength:ref('strength')},
    rootPresence:row.rootPresence??'PRESENT_UNDER_POLICY',relationCount:0,seasonalAlternativeCount:row.seasonalAlternatives?.length??1,
    existingSupport:clone(row.existingSupport??[]),inputSourceRefs:['FIXED-SYNTHETIC-STRUCTURAL-CONTRACT-NOT-API-AUTHENTICATION']};
};
const solve=context=>resolveSymbolicInterpretation(context,{profileId:INTERPRETATION_PROFILE_ID});
const byDomain=claims=>Object.fromEntries(claims.map(c=>[c.domain,c]));
const order={year:0,month:1,day:2,hour:3};
const pairKey=condition=>{
  assert.equal(condition.locations.length,2);
  const [left,right]=condition.locations,parts=condition.code.split('_');
  return order[left.role]<order[right.role]?`${left.role}:${right.role}:${parts.join('_')}`:`${right.role}:${left.role}:${parts.reverse().join('_')}`;
};
const pairConditions=claim=>claim.supportingConditions.filter(c=>c.locations.length===2&&!c.code.startsWith('MONTH_'));
const expectedCode={
  MONTH_MAIN_EXACT_EXPOSURE:['LIMITED_MONTH_EXACT_ROLE'],MONTH_MAIN_EXACT_EXPOSURE_COMPETING:['LIMITED_COMPETING'],
  MONTH_MAIN_NOT_EXACTLY_EXPOSED:['HOLD_NO_EXACT_EXPOSURE'],PEER_MAIN_OUTSIDE_EIGHT:['HOLD_PEER_OR_MONTH_SCOPE'],
  MONTH_SELECTION_POLICY_UNRESOLVED:['HOLD_MONTH_COMPATIBILITY','HOLD_PEER_OR_MONTH_SCOPE'],
  NO_VISIBLE_WEALTH_CONNECTION:['HOLD_NO_SELECTED_SURFACE_PAIR'],VISIBLE_WEALTH_WITHOUT_ALLOWED_CONNECTION:['HOLD_NO_SELECTED_SURFACE_PAIR'],
  WEALTH_ONLY_HIDDEN:['HOLD_NO_SELECTED_SURFACE_PAIR'],NO_SUPPORTED_VISIBLE_COMMUNICATION_PAIR:['HOLD_NO_SELECTED_SURFACE_PAIR'],
  NO_SUPPORTED_VISIBLE_WORK_PAIR:['HOLD_NO_SELECTED_SURFACE_PAIR'],MONTH_WEALTH_EXACT_EXPOSURE:['LIMITED_MONTH_WEALTH_EXACT'],
  VISIBLE_WEALTH_WITH_OTHER_FAMILY:['LIMITED_VISIBLE_PAIR','LIMITED_MULTIPLE_PAIRS'],
};

test('S7 independently fixed 24 minimal role contexts cover actual decision branches, hold and invalid inputs',()=>{
  assert.equal(BASIS.fixedBeforeInterpretationResolver,true);assert.equal(CASES.length,24);assert.equal(valid.length,22);
  const observed=new Set();
  for(const row of CASES){const context=makeContext(row);
    if(row.expected.rejected){assert.throws(()=>solve(context),Error,row.id);continue;}
    const original=clone(context),claims=solve(context),indexed=byDomain(claims);
    assert.deepEqual(claims.map(c=>c.domain),['BEHAVIOR','COMMUNICATION','WORK','MONEY']);
    assert.deepEqual(context,original,row.id+' must not mutate input');assert.equal(Object.isFrozen(context),false);
    for(const domain of DOMAINS){const expected=row.expected[domain],claim=indexed[domain];assert.equal(claim.confidenceOrApplicabilityStatus,expected.status,row.id+'/'+domain);
      if(expected.branch)assert.ok(expectedCode[expected.branch].includes(claim.decisionCode),row.id+'/'+domain+'/'+claim.decisionCode);
      if(expected.pairs)assert.deepEqual(pairConditions(claim).map(pairKey).sort(),[...expected.pairs].sort(),row.id+'/'+domain+' all pair locations');
      if(expected.status==='HOLD')assert.equal(claim.supportingConditions.length,0,row.id+'/'+domain+' held needs no invented support');
      observed.add(domain+':'+claim.confidenceOrApplicabilityStatus);
    }
  }
  assert.deepEqual([...observed].sort(),['BEHAVIOR:HOLD','BEHAVIOR:LIMITED','COMMUNICATION:HOLD','COMMUNICATION:LIMITED','MONEY:HOLD','MONEY:LIMITED','WORK:HOLD','WORK:LIMITED']);
});

test('S7 ten-god role families preserve every original yin/yang subtype without inventing personality or force scores',()=>{
  const literals=[['比肩','PEER'],['劫財','PEER'],['食神','OUTPUT'],['傷官','OUTPUT'],['正財','WEALTH'],['偏財','WEALTH'],['正官','CONTROL'],['七殺','CONTROL'],['正印','RESOURCE'],['偏印','RESOURCE']];
  for(const [god,family]of literals)assert.equal(roleFamily(god),family);
  for(const bad of ['AUTO','正官格','財','STRONG',''])assert.throws(()=>roleFamily(bad));
  for(const row of valid)for(const claim of solve(makeContext(row))){
    assert.equal(claim.interpretationPolicyId,INTERPRETATION_POLICIES[claim.domain]);assert.equal(claim.interpretationPolicyVersion,'0.1.0');
    assert.equal(Object.hasOwn(claim,'confidence'),false);assert.equal(Object.hasOwn(claim,'score'),false);assert.equal(Object.hasOwn(claim,'probability'),false);
    assert.deepEqual(claim.forbiddenConclusions,FORBIDDEN_CONCLUSIONS);assert.match(claim.interpretationScope,/NOT_DIAGNOSIS_OR_PREDICTION/);
    assert.doesNotMatch(claim.consumerText,/(?:정재|편재|겁재)과|\((?:정재|편재|겁재)\)과/u,'Korean particles follow the spoken ten-god name');
  }
});

test('S7 all six manually fixed contrasts distinguish exact stems, pair roles, locations and irrelevant seasonal or root changes',()=>{
  assert.equal(SPRINT7_SYNTHETIC_CONTRASTS.length,6);
  const results=new Map(valid.map(c=>[c.id,byDomain(solve(makeContext(c)))]));
  const pair=id=>results.get(id), status=id=>DOMAINS.map(d=>pair(id)[d].confidenceOrApplicabilityStatus);
  assert.notEqual(pair('S01-OFFICER-EXPOSED-RESOURCE-OUTPUT').BEHAVIOR.confidenceOrApplicabilityStatus,pair('S02-OFFICER-HIDDEN-NOT-EXPOSED').BEHAVIOR.confidenceOrApplicabilityStatus);
  assert.equal(pair('S05-PEER-MAIN-OUTPUT-WEALTH').WORK.confidenceOrApplicabilityStatus,'LIMITED');assert.equal(pair('S06-PEER-MAIN-RESOURCE-WEALTH').WORK.confidenceOrApplicabilityStatus,'HOLD');
  assert.equal(pair('S07-RESOURCE-OUTPUT-ONLY').COMMUNICATION.confidenceOrApplicabilityStatus,'LIMITED');assert.equal(pair('S08-RESOURCE-ONLY-NO-OUTPUT').COMMUNICATION.confidenceOrApplicabilityStatus,'HOLD');
  assert.deepEqual(status('S09-OUTPUT-CONTROL-POSITIONS'),status('S10-OUTPUT-CONTROL-REMOTE-POSITIONS'));
  assert.deepEqual(pairConditions(pair('S09-OUTPUT-CONTROL-POSITIONS').COMMUNICATION).map(pairKey),['year:month:OUTPUT_CONTROL']);
  assert.deepEqual(pairConditions(pair('S10-OUTPUT-CONTROL-REMOTE-POSITIONS').COMMUNICATION).map(pairKey),['year:hour:OUTPUT_CONTROL']);
  assert.deepEqual(status('S15-HIDDEN-WEALTH-ONLY'),['HOLD','HOLD','HOLD','HOLD']);assert.deepEqual(status('S16-VISIBLE-WEALTH-ADDED-TO-HIDDEN-CONTEXT'),['LIMITED','LIMITED','HOLD','LIMITED']);
  assert.deepEqual(status('S04-KILLING-MAIN-EXPOSED-COMPETING-RESOURCE'),status('S22-SAME-PAIRS-WITHOUT-ROOT'));
});

test('S7 references bind every condition and claim to its parent and fixed interpretation policy without claiming upstream authentication',()=>{
  const knownSources=new Set(INTERPRETATION_SOURCES.map(s=>s.id));
  for(const row of valid){const context=makeContext(row),allowedRefs=new Set(Object.values(context.factRefs));for(const c of solve(context)){
    assert.equal(c.chartCandidateRef,context.candidateId);assert.ok(c.claimId.startsWith(context.contextId+'/'+context.candidateId+'/interpretation/'));
    assert.ok(c.inputFactRefs.length>0);assert.equal(new Set(c.inputFactRefs).size,c.inputFactRefs.length);
    assert.ok(c.inputFactRefs.every(r=>allowedRefs.has(r)));assert.ok(c.sourceRefs.length>0);assert.ok(c.sourceRefs.every(id=>knownSources.has(id)));
    for(const condition of [...c.supportingConditions,...c.competingConditions])assert.ok(condition.factRefs.every(r=>allowedRefs.has(r)));
    assert.deepEqual(c.inputSourceRefs,context.inputSourceRefs);
  }}
  for(const mutate of [c=>c.factRefs.root='other-context/chart.candidates[1]/root',c=>c.inputSourceRefs=[],c=>c.monthly.exactExposures.push({...c.monthly.exactExposures[0]}),c=>c.visible[0].tenGod='正財']){
    const c=makeContext(valid[0]);mutate(c);assert.throws(()=>solve(c));
  }
  assert.throws(()=>resolveSymbolicInterpretation(makeContext(valid[0]),{profileId:'AUTO'}));
});

test('S7 unresolved monthly compatibility and hidden-only wealth remain holds while independent visible pairs survive',()=>{
  for(const id of ['S14-OUTPUT-WEALTH-RESOURCE','S20-MONTHLY-SELECTION-POLICY-UNRESOLVED']){
    const claims=byDomain(solve(makeContext(valid.find(c=>c.id===id))));assert.equal(claims.BEHAVIOR.confidenceOrApplicabilityStatus,'HOLD');
    for(const domain of ['COMMUNICATION','WORK','MONEY'])assert.equal(claims[domain].confidenceOrApplicabilityStatus,'LIMITED');
  }
  const hidden=byDomain(solve(makeContext(valid.find(c=>c.id==='S15-HIDDEN-WEALTH-ONLY')))).MONEY;
  assert.equal(hidden.confidenceOrApplicabilityStatus,'HOLD');assert.match(hidden.consumerText,/지장간.*확인.*표면 연결/);assert.match(hidden.consumerText,/판단하지/);
});

test('S7 preserves every competing relation and existing support hold without erasing the original resource role',()=>{
  const context=makeContext(valid.find(c=>c.id==='S01-OFFICER-EXPOSED-RESOURCE-OUTPUT'));
  context.relationCount=3;context.existingSupport=[{role:'month',stem:'壬',decision:'SUPPORT_HELD_UNDER_SELECTED_RULE',rootPresence:'ABSENT_UNDER_POLICY',upstreamRef:context.candidateId+'#m3-resource-support#month'}];
  const result=solve(context);for(const c of result){assert.ok(c.competingConditions.some(x=>x.code==='BRANCH_RELATIONS_EFFECT_UNEVALUATED'));
    assert.ok(c.competingConditions.some(x=>x.code==='EXISTING_RESOURCE_SUPPORT_LIMITATION'&&x.detail.includes('SUPPORT_HELD_UNDER_SELECTED_RULE')));}
  assert.equal(byDomain(result).WORK.confidenceOrApplicabilityStatus,'LIMITED');assert.equal(context.visible[1].tenGod,'偏印');
  assert.deepEqual(result[0].unresolvedEffects,['ACTUAL_SUPPORT_AND_CONTROL_TRANSMISSION','ROOT_STRENGTH_AND_RELATION_EFFICACY','FINAL_STRENGTH_PATTERN_SUCCESS_YONGSHEN']);
  const foreign=clone(context);foreign.existingSupport[0].upstreamRef='chart.candidates[1]#m3-resource-support#month';assert.throws(()=>solve(foreign));
});

test('S7 a seasonal alternative count is context, never a second natal parent or an added interpretation set',()=>{
  const context=makeContext(valid[0]),single=solve(context);context.seasonalAlternativeCount=2;const alternative=solve(context);
  assert.equal(single.length,4);assert.equal(alternative.length,4);assert.deepEqual(single,alternative);
  context.candidateId='chart.candidates[1]';for(const key of Object.keys(context.factRefs))context.factRefs[key]=context.contextId+'/'+context.candidateId+'/'+key;
  const other=solve(context);assert.ok(other.every(c=>c.chartCandidateRef==='chart.candidates[1]'));
  assert.ok(other.every((c,i)=>c.claimId!==single[i].claimId));
});

test('S7 canonical claims are reproducible, immutable and reject sparse/getter/non-JSON contexts without evaluating accessors',()=>{
  const context=makeContext(valid[0]),before=clone(context),a=solve(context),b=solve(clone(context));assert.equal(canonicalInterpretation(a),canonicalInterpretation(b));
  assert.deepEqual(context,before);assert.equal(Object.isFrozen(a),true);assert.equal(Object.isFrozen(a[0]),true);assert.equal(Object.isFrozen(a[0].supportingConditions),true);
  let invoked=0;const getter=makeContext(valid[0]);Object.defineProperty(getter,'extra',{enumerable:true,get(){invoked++;return 1;}});assert.throws(()=>solve(getter));assert.equal(invoked,0);
  const sparse=makeContext(valid[0]);delete sparse.visible[1];assert.throws(()=>solve(sparse));
  for(const v of [NaN,Infinity,undefined,()=>1])assert.throws(()=>assertInterpretationJson(v));
  const cycle={};cycle.self=cycle;assert.throws(()=>assertInterpretationJson(cycle));
});

test('S7 required fact references and nonnegative discrete context counts must not be silently accepted as empty evidence',()=>{
  for(const mutate of [c=>c.factRefs={},c=>delete c.factRefs.pattern,c=>c.relationCount=-1,c=>c.seasonalAlternativeCount=-1]){
    const c=makeContext(valid[0]);mutate(c);assert.throws(()=>solve(c),Error);
  }
});
