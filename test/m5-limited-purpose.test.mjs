import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {deriveM3Evidence,M3_EVIDENCE_PROFILE_ID} from '../dist/m3/structuralEvidenceV1.js';
import {resolveSeasonalSiliState,M3_SEASONAL_SILI_POLICY_ID,M3_SEASONAL_SILI_METADATA} from '../dist/m3/seasonalStateV2.js';
import {deriveM4InnerPatterns,M4_INNER_PATTERN_PROFILE_ID} from '../dist/m4/innerPatternsV1.js';
import {HEAVENLY_STEMS} from '../dist/domain/stems.js';
import {EARTHLY_BRANCHES} from '../dist/domain/branches.js';
import {MONTH_BRANCH_BY_JIE} from '../dist/calendar/monthPillar.js';
import {structuralM2Unit} from './fixtures/m3-structural-unit-input.mjs';
import {M5_CASE_BASIS,M5_LIMITED_CASES,M5_REJECTION_CONTRACTS,M5_BOUNDARY_CONTRACT} from './fixtures/m5-limited-purpose-cases-v1.mjs';
import {M5_LIMITED_PURPOSE_POLICY_ID,M5_LIMITED_PURPOSE_METADATA,deriveM5LimitedPurpose,validateM5LimitedPurpose,explainM5LimitedPurpose,validateM5LimitedPurposeExplanation,renderM5LimitedPurposeText} from '../dist/m5/limitedPurposeV1.js';

// Literal winter-wood eligibility rows, branch order 子丑寅卯辰巳午未申酉戌亥.
// These inspect software policy scope, not 120 actual birth charts or climate force.
const ELIGIBLE={甲:'100000000001',乙:'100000000001',丙:'000000000000',丁:'000000000000',戊:'000000000000',己:'000000000000',庚:'000000000000',辛:'000000000000',壬:'000000000000',癸:'000000000000'};
const FIXTURE='eefa6faef3c8bfc9fe6c1dad26eebbff88843181d71e1c9fead69593f4770051';
const nextByMonth={辰:['LIXIA','2026-05-05T01:20'],未:['LIQIU','2026-08-05T01:20'],戌:['LIDONG','2026-11-05T01:20'],丑:['LICHUN','2026-02-05T01:20']};
function seasonalFor(evidence,{missingNext=false,atB=false}={}){
  const candidates=evidence.candidates.map(c=>{
    const month=c.evidence.find(e=>e.kind==='MONTH_CONTEXT'),active=c.monthContext.activeSince,side=c.monthContext.boundarySide;
    const base={candidateRef:c.candidateRef,dayMaster:c.dayMaster,monthBranch:c.monthContext.monthPillar.branch,evidenceRefs:[month.id],inputFactRefs:[...month.inputFactRefs],pillarRefs:[c.candidateRef+'.day',c.candidateRef+'.month'],calculationSourceRefs:[...month.calculationSourceRefs],appliedJie:structuredClone(active)};
    const next=nextByMonth[base.monthBranch],nextSili=!missingNext&&next?{term:next[0],displayedDateTime:next[1],timeBasis:'KST',sourcePrecision:'MINUTE',sourceIds:[active.sourceIds[0]+':SYNTHETIC_ENDING_EVENT']}:null;
    let birthDateTime=active.displayedDateTime.slice(0,8)+'08T01:20',monthCondition='BETWEEN_PUBLISHED_BOUNDARIES';
    if(side==='BEFORE_PUBLISHED_MINUTE'){birthDateTime=next[1];monthCondition='BEFORE_PUBLISHED_BOUNDARY';}
    if(side==='AFTER_PUBLISHED_MINUTE'){birthDateTime=active.displayedDateTime;monthCondition='AFTER_PUBLISHED_BOUNDARY';}
    if(atB)birthDateTime='2026-04-17T01:20';
    const judgment=resolveSeasonalSiliState({base,birthDateTime,monthCondition,nextSili},{policyId:M3_SEASONAL_SILI_POLICY_ID});
    return Object.freeze({candidateRef:c.candidateRef,candidateIndex:c.candidateIndex,judgment});
  });
  return Object.freeze({policy:M3_SEASONAL_SILI_METADATA,candidates:Object.freeze(candidates)});
}
function state(pillarSets,terms,seasonOptions={}){
  const m2Facts=structuralM2Unit(pillarSets,{monthTerms:terms}),evidence=deriveM3Evidence(m2Facts,{policyId:M3_EVIDENCE_PROFILE_ID});
  return {m2Facts,evidence,seasonal:seasonalFor(evidence,seasonOptions),innerPatterns:deriveM4InnerPatterns(evidence,{profileId:M4_INNER_PATTERN_PROFILE_ID,m2Facts})};
}
const caseState=c=>state([c.pillars],[c.term]);
const run=(s,override={})=>deriveM5LimitedPurpose(s.evidence,{policyId:M5_LIMITED_PURPOSE_POLICY_ID,m2Facts:s.m2Facts,seasonal:s.seasonal,innerPatterns:s.innerPatterns,...override});
const shape=l=>[l.pillarRole,l.locationKind,l.stem];

test('M5 literal expectations were fixed before target execution and sources remain separately attributed',()=>{
  const bytes=readFileSync(new URL('./fixtures/m5-limited-purpose-cases-v1.mjs',import.meta.url),'utf8').replace(/\r\n/g,'\n');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),FIXTURE);assert.equal(M5_LIMITED_CASES.length,18);assert.equal(M5_REJECTION_CONTRACTS.length,12);
  assert.equal(M5_CASE_BASIS.method,'LITERAL_PROJECT_DECISION_TABLE_FIXED_BEFORE_RESOLVER');
  assert.equal(M5_CASE_BASIS.policyId,M5_LIMITED_PURPOSE_POLICY_ID);assert.equal(M5_LIMITED_PURPOSE_METADATA.scope.eligibleStemMonthCells,4);assert.equal(M5_LIMITED_PURPOSE_METADATA.scope.totalStemMonthCells,120);
  const sources=new Map(M5_LIMITED_PURPOSE_METADATA.sources.map(s=>[s.id,s]));assert.equal(sources.get(M5_CASE_BASIS.sourceRef).author,'沈孝瞻');assert.equal(sources.get(M5_CASE_BASIS.commentaryRef).author,'徐樂吾');
  assert.ok(M5_LIMITED_PURPOSE_METADATA.rules.every(r=>r.kind==='PROJECT_POLICY'&&r.sourceRuleVersion===null));
  const guard=M5_LIMITED_PURPOSE_METADATA.rules.find(r=>r.id==='M5-RULE-PRESENT-FIRE-ADOPTION-HOLD-001');assert.deepEqual(guard.sourceIds,['M5-PROJECT-WINTER-WOOD-WARMING-001']);
});

test('all 18 independent scope, fire-presence, polarity and M4 comparison cases match literal decisions',()=>{
  for(const row of M5_LIMITED_CASES){const s=caseState(row),before=JSON.stringify(s.m2Facts),r=run(s),c=r.candidates[0],x=row.expected;
    assert.equal(c.status,x.status,row.id);assert.equal(c.eligibleForPurpose,x.eligible,row.id);assert.deepEqual(c.candidateElements.map(x=>x.element),x.elements,row.id);assert.deepEqual(c.reasonCodes,[x.reason],row.id);
    assert.deepEqual(c.existingWarmingLocations.map(shape),x.fire,row.id);if(x.m4Main)assert.equal(c.inputFacts.patternContext.primaryPattern,x.m4Main,row.id);
    assert.equal(c.inputFacts.patternContext.usedForM5Decision,false);assert.equal(validateM5LimitedPurpose(r,s),true);assert.equal(JSON.stringify(s.m2Facts),before,'M2 unchanged '+row.id);
    assert.equal(r.validation.finalUsefulGod,'NOT_IMPLEMENTED');assert.equal(r.validation.m3FinalStrength,'NOT_IMPLEMENTED');assert.equal(r.validation.g1P2Promotion,false);
  }
});

test('the full 10-day-stem by 12-month scope uses four literal eligible cells and never a numeric season score',()=>{
  let eligible=0,candidates=0;
  for(const [si,stem]of HEAVENLY_STEMS.entries())for(const [bi,branch]of EARTHLY_BRANCHES.entries()){
    const term=Object.entries(MONTH_BRANCH_BY_JIE).find(([,b])=>b===branch)[0],month=(bi%2?'癸':'壬')+branch,day=stem+(si%2?'丑':'子');
    const s=state([['庚申',month,day,'癸酉']],[term]),c=run(s).candidates[0],expected=ELIGIBLE[stem][bi]==='1';
    assert.equal(c.eligibleForPurpose,expected,stem+'/'+branch);eligible+=Number(expected);candidates+=Number(c.status==='CANDIDATE_UNDER_POLICY');
    assert.equal(c.candidateElements.length,expected?1:0);assert.equal(Object.hasOwn(c,'score'),false);
  }
  assert.equal(eligible,4);assert.equal(candidates,4);
});

test('existing hidden FIRE blocks automatic adoption without being confused with surface counts or excess',()=>{
  const row=M5_LIMITED_CASES.find(c=>c.id==='hidden-year-fire-only'),r=run(caseState(row)),c=r.candidates[0];
  assert.deepEqual(c.existingWarmingLocations.map(shape),[['year','HIDDEN_STEM','丙']]);assert.equal(c.status,'HOLD');assert.deepEqual(c.holds,[{reason:'PRESENT_WARMING_ELEMENT_EFFECT_UNASSESSED',meaning:'EXISTING_FIRE_IS_NEITHER_EXCESS_NOR_PROVEN_SUFFICIENT'}]);
  assert.ok(explainM5LimitedPurpose(r).candidates[0].items[0].text.includes('화가 과다하거나 불필요하다고 판단한 것은 아닙니다'));
  assert.equal(c.existingWarmingLocations[0].position,'OTHER');assert.equal(c.candidateElements.length,0);
});

test('M4 alternatives, structural roots and overlapping relations do not become final usefulness or erase the input',()=>{
  const a=run(caseState(M5_LIMITED_CASES[0])).candidates[0],b=run(caseState(M5_LIMITED_CASES[2])).candidates[0],noRoot=run(caseState(M5_LIMITED_CASES[3])).candidates[0];
  assert.equal(a.inputFacts.patternContext.primaryPattern,'正印');assert.equal(b.inputFacts.patternContext.primaryPattern,'偏印');assert.equal(a.status,b.status);assert.equal(a.status,noRoot.status);
  assert.ok(a.conflictingEvidence.some(e=>e.kind==='EXISTING_RELATION_EFFECT_UNASSESSED'));
  assert.ok(a.conflictingEvidence.every(e=>e.effect==='NOT_EVALUATED'));assert.ok(a.unresolvedEffects.includes('FIRE_OUTPUT_COST_TO_DAY_MASTER'));
  assert.ok(a.notApplied.includes('WEIGHTED_STRENGTH_SCORE'));assert.ok(a.notApplied.includes('COMBINATION_TRANSFORMATION'));
});

test('existing correlated month parents and B seasonal alternatives never create additional M5 natal candidates',()=>{
  const s=state(M5_BOUNDARY_CONTRACT.parentPillars,M5_BOUNDARY_CONTRACT.terms),r=run(s);
  assert.equal(r.candidates.length,2);assert.deepEqual(r.candidates.map(c=>c.status),M5_BOUNDARY_CONTRACT.expectedStatuses);assert.deepEqual(r.candidates.map(c=>c.reasonCodes[0]),M5_BOUNDARY_CONTRACT.expectedReasons);
  assert.deepEqual(r.candidates.map(c=>c.candidateRef),['chart.candidates[0]','chart.candidates[1]']);
  const b=state([['庚申','壬辰','甲辰','癸酉']],['QINGMING'],{atB:true}),br=run(b);
  assert.equal(b.seasonal.candidates[0].judgment.alternatives.length,2);assert.equal(br.candidates.length,1);assert.equal(br.candidates[0].inputFacts.seasonalAlternatives.length,2);assert.equal(br.candidates[0].reasonCodes[0],'OUTSIDE_WINTER_WOOD_SCOPE');
});

test('valid seasonal data shortage is a HOLD while absent required context and fabricated seasonal judgments reject',()=>{
  const s=state([['庚申','癸丑','甲辰','壬子']],['XIAOHAN'],{missingNext:true}),r=run(s);
  assert.equal(s.seasonal.candidates[0].judgment.status,'NEEDS_DATA');assert.equal(r.candidates[0].status,'HOLD');assert.equal(r.candidates[0].reasonCodes[0],'SEASONAL_CONTEXT_NEEDS_DATA');
  assert.throws(()=>run(s,{seasonal:undefined}),/M5_ISSUED_SUPPORTED_SEASONAL_CONTEXT_REQUIRED/);
  const copied=structuredClone(s.seasonal);Object.freeze(copied);assert.throws(()=>run(s,{seasonal:copied}),/M3_SILI_ISSUED_IMMUTABLE_JUDGMENT_REQUIRED/);
});

test('all fact, rule, policy, source and member references terminate in the same parent',()=>{
  for(const row of M5_LIMITED_CASES){const s=caseState(row),r=run(s),c=r.candidates[0],facts=new Set(s.m2Facts.candidates[0].facts.map(f=>f.id)),records=new Set(s.evidence.candidates[0].evidence.map(e=>e.id)),members=new Set(Object.values(s.evidence.candidates[0].directionalGroups).flat().flatMap(l=>l.inputMemberRef?[l.inputMemberRef]:[])),rules=new Set(r.rules.map(r=>r.id)),sources=new Set(r.sources.map(s=>s.id)),policies=new Set([r.policy.id,s.evidence.policy.id,s.m2Facts.policyBundle.id,...Object.values(s.m2Facts.policyBundle.policies).map(p=>p.id)]);
    for(const id of c.inputFactRefs)assert.ok(facts.has(id),id);for(const id of c.inputEvidenceRefs)assert.ok(records.has(id),id);for(const id of c.inputMemberRefs)assert.ok(members.has(id),id);for(const id of c.ruleRefs)assert.ok(rules.has(id),id);for(const id of c.sourceRefs)assert.ok(sources.has(id),id);for(const id of c.policyRefs)assert.ok(policies.has(id),id);for(const id of c.calculationSourceRefs)assert.ok(sources.has(id),id);
    assert.ok(!c.calculationSourceRefs.some(id=>id.startsWith('M5-ZPZQ')));assert.ok(c.inputFactRefs.every(id=>id.startsWith(c.candidateRef+'#')));
  }
});

test('explicit policies, foreign contexts, missing members, sparse arrays and mutated source facts reject',()=>{
  const s=caseState(M5_LIMITED_CASES[0]),other=caseState(M5_LIMITED_CASES[1]);
  assert.throws(()=>run(s,{policyId:undefined}),/M5_EXPLICIT_SUPPORTED_POLICY_REQUIRED/);assert.throws(()=>run(s,{policyId:'unknown'}),/M5_EXPLICIT_SUPPORTED_POLICY_REQUIRED/);
  assert.throws(()=>run(s,{m2Facts:other.m2Facts}),/M3_ORIGINAL_INPUT_CONTEXT_REQUIRED/);assert.throws(()=>run(s,{innerPatterns:other.innerPatterns}),/M4_INNER_FOREIGN_EXECUTION_CONTEXT/);assert.throws(()=>run(s,{seasonal:other.seasonal}),/M5_SEASONAL_INPUT_CONTEXT_MISMATCH/);
  const hole={...s.seasonal,candidates:new Array(1)};Object.freeze(hole);assert.throws(()=>run(s,{seasonal:hole}),/M5_DENSE_ARRAY_REQUIRED/);
  const sparse=caseState(M5_LIMITED_CASES[0]);delete sparse.m2Facts.candidates[0].facts[0];assert.throws(()=>run(sparse),/M5_DENSE_ARRAY_REQUIRED/);
  const mutated=caseState(M5_LIMITED_CASES[0]);mutated.m2Facts.sources[0].id='fabricated';assert.throws(()=>run(mutated),/M3_ORIGINAL_INPUT_CHANGED_AFTER_ISSUANCE/);
  const invalid=structuralM2Unit([M5_LIMITED_CASES[0].pillars],{monthTerms:['DAXUE']});invalid.candidates[0].facts[0].sourceRefs=['unknown'];assert.throws(()=>deriveM3Evidence(invalid,{policyId:M3_EVIDENCE_PROFILE_ID}),/M3_/);
  // Generic M3 can faithfully assemble a self-consistent but incomplete table.
  // Remove 戌's last 丁 member in both views before issuance: M5 must not call this FIRE absence.
  const missing=structuralM2Unit([['庚戌','壬子','甲辰','癸酉']],{monthTerms:['DAXUE']});
  missing.candidates[0].pillars[0].branchTenGods.members.pop();missing.candidates[0].facts.find(f=>f.kind==='HIDDEN_STEMS'&&f.value.role==='year').value.members.pop();
  const missingEvidence=deriveM3Evidence(missing,{policyId:M3_EVIDENCE_PROFILE_ID});
  assert.throws(()=>deriveM5LimitedPurpose(missingEvidence,{policyId:M5_LIMITED_PURPOSE_POLICY_ID,m2Facts:missing,seasonal:seasonalFor(missingEvidence)}),/M5_COMPLETE_SELECTED_HIDDEN_MEMBERS_REQUIRED/);
  const version=structuralM2Unit([M5_LIMITED_CASES[0].pillars],{monthTerms:['DAXUE']});version.rules.find(r=>r.id==='M2-RULE-HIDDEN-STEMS-001').runtimeVersion='unsupported';const versionEvidence=deriveM3Evidence(version,{policyId:M3_EVIDENCE_PROFILE_ID});
  assert.throws(()=>deriveM5LimitedPurpose(versionEvidence,{policyId:M5_LIMITED_PURPOSE_POLICY_ID,m2Facts:version,seasonal:seasonalFor(versionEvidence)}),/M5_SELECTED_HIDDEN_POLICY_REQUIRED/);
  const collision=structuralM2Unit([M5_LIMITED_CASES[0].pillars],{monthTerms:['DAXUE']});collision.sources.push({id:'M5-PROJECT-WINTER-WOOD-WARMING-001',kind:'FABRICATED_COLLISION'});const collisionEvidence=deriveM3Evidence(collision,{policyId:M3_EVIDENCE_PROFILE_ID});
  assert.throws(()=>deriveM5LimitedPurpose(collisionEvidence,{policyId:M5_LIMITED_PURPOSE_POLICY_ID,m2Facts:collision,seasonal:seasonalFor(collisionEvidence)}),/M5_UPSTREAM_REGISTRY_COLLISION/);
});

test('issued M5 results, request isolation and deterministic Korean claims resist substitutions',()=>{
  const s=caseState(M5_LIMITED_CASES[0]),r=run(s),other=caseState(M5_LIMITED_CASES[1]),e=explainM5LimitedPurpose(r);
  assert.equal(validateM5LimitedPurpose(r),true);assert.equal(validateM5LimitedPurposeExplanation(e,r),true);assert.equal(validateM5LimitedPurposeExplanation(structuredClone(e),r),true);
  assert.throws(()=>validateM5LimitedPurpose(structuredClone(r)),/M5_ISSUED_IMMUTABLE_RESULT_REQUIRED/);assert.throws(()=>validateM5LimitedPurpose(r,other),/M5_FOREIGN_EXECUTION_CONTEXT/);
  assert.throws(()=>{r.candidates[0].status='FINAL_YONGSHEN';},TypeError);
  const fake=structuredClone(e);fake.candidates[0].items[0].text='화가 최종 용신이며 반드시 재물을 얻습니다.';assert.throws(()=>validateM5LimitedPurposeExplanation(fake,r),/M5_EXPLANATION_CONTENT_OR_REFERENCES_CHANGED/);
  const refs=structuredClone(e);refs.candidates[0].items[0].decisionRefs=['chart.candidates[1]#foreign'];assert.throws(()=>validateM5LimitedPurposeExplanation(refs,r),/M5_EXPLANATION_CONTENT_OR_REFERENCES_CHANGED/);
  for(const key of ['inputFactRefs','ruleRefs','sourceRefs']){const unknown=structuredClone(e);unknown.candidates[0].items[0][key]=['NONEXISTENT'];assert.throws(()=>validateM5LimitedPurposeExplanation(unknown,r),/M5_EXPLANATION_CONTENT_OR_REFERENCES_CHANGED/);}
  assert.equal(renderM5LimitedPurposeText(r),renderM5LimitedPurposeText(run(s)));assert.ok(renderM5LimitedPurposeText(r).includes('화(火)를 온기 검토 후보로 표시합니다'));
  assert.ok(renderM5LimitedPurposeText(run(caseState(M5_LIMITED_CASES[10]))).includes('도움 요소가 없다는 뜻은 아닙니다'));
});
