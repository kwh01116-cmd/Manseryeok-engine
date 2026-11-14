import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {deriveM3Evidence,M3_EVIDENCE_PROFILE_ID} from '../dist/m3/structuralEvidenceV1.js';
import {deriveM4ZhengguanStructure,M4_PATTERN_PROFILE_ID} from '../dist/m4/zhengguanStructureV1.js';
import {fiveElementRelation} from '../dist/domain/tenGods.js';
import {
  M4_INNER_PATTERN_PROFILE_ID,M4_INNER_PATTERN_METADATA,M4_INNER_PATTERN_TYPES,
  deriveM4InnerPatterns,validateM4InnerPatterns,explainM4InnerPatterns,
  validateM4InnerPatternsExplanation,renderM4InnerPatternsText,
} from '../dist/m4/innerPatternsV1.js';
import {structuralM2Unit} from './fixtures/m3-structural-unit-input.mjs';
import {M4_INNER_CASE_BASIS,M4_INNER_CASES,M4_INNER_BOUNDARY_CONTRACT,M4_INNER_REJECTION_CONTRACTS} from './fixtures/m4-inner-pattern-cases-v1.mjs';
import * as frozenContracts from './fixtures/m4-inner-pattern-cases-v1.mjs';

// Original pre-resolver full-file receipt: f311367aea347110fdf79468f5cf67fc902067a3da334f29ca800e7289b5b0de.
// Later correction changes one reason's "two" to "one" only. Non-reason digest is identical before/after.
const FIXTURE_SHA='868195f5256a5ff6e219488a9b7933f85dcd5ed7d3583efc70eb687c20bbb21f';
const CONTRACT_SHA='58956f2c1fe7edb19c80e92d9647587349b2bdf665c4ae2631a55c366785256e';
const state=(pillars,monthTerms)=>{const m2Facts=structuralM2Unit(pillars,{monthTerms});return {m2Facts,evidence:deriveM3Evidence(m2Facts,{policyId:M3_EVIDENCE_PROFILE_ID})};};
const forCase=c=>state([c.pillars],[c.monthTerm]);
const run=(s,override={})=>deriveM4InnerPatterns(s.evidence,{profileId:M4_INNER_PATTERN_PROFILE_ID,m2Facts:s.m2Facts,...override});
const find=id=>{const found=M4_INNER_CASES.find(c=>c.id===id);assert.ok(found,id);return found;};
const shape=link=>({role:link.visible.pillarRole,stem:link.visible.stem});
const focus=(candidate,type)=>{const p=candidate.patterns.find(p=>p.patternType===type);assert.ok(p,type);return p;};
const json=s=>JSON.stringify({m2:s.m2Facts,m3:s.evidence});

test('26 literal expectations and finite exclusions were pinned before resolver implementation',()=>{
  const bytes=readFileSync(new URL('./fixtures/m4-inner-pattern-cases-v1.mjs',import.meta.url),'utf8').replace(/\r\n/g,'\n');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),FIXTURE_SHA);
  const contract={...frozenContracts,M4_INNER_CASES:frozenContracts.M4_INNER_CASES.map(({reason,...rest})=>rest)};
  assert.equal(createHash('sha256').update(JSON.stringify(contract)).digest('hex'),CONTRACT_SHA);
  assert.equal(M4_INNER_CASES.length,26);assert.equal(M4_INNER_REJECTION_CONTRACTS.length,7);
  assert.match(M4_INNER_CASE_BASIS.expectationMethod,/BEFORE_RESOLVER/);
  assert.deepEqual(M4_INNER_PATTERN_TYPES,['正官','七殺','正財','偏財','正印','偏印','食神','傷官']);
  assert.equal(M4_INNER_PATTERN_METADATA.selectionAuthority,'PROJECT_POLICY_NOT_A_COMMON_CLASSICAL_FORMATION_ALGORITHM');
});

test('all literal eight-pattern contracts preserve main, OTHER, competition and deferred member results',()=>{
  const mainTypes=new Set(),otherTypes=new Set();
  for(const c of M4_INNER_CASES){
    const s=forCase(c),before=json(s),nativePillarsFrozen=Object.isFrozen(s.m2Facts.candidates[0].pillars),value=run(s),p=value.candidates[0],x=c.expected,t=focus(p,x.focus);
    assert.deepEqual(p.patterns.map(p=>p.patternType),M4_INNER_PATTERN_TYPES,c.id);
    assert.equal(p.monthContext.principalHiddenMember.tenGod,x.main,c.id);
    assert.equal(p.selection.primaryPattern,x.primary,c.id);
    assert.deepEqual(p.selection.candidateTypes,x.candidates,c.id);
    assert.deepEqual(p.selection.unresolvedTypes,x.unresolved,c.id);
    assert.equal(t.assessment.status,x.status,c.id);assert.equal(t.assessment.basis,x.basis,c.id);
    assert.deepEqual(t.exactExposures.map(shape),x.exposures,c.id);
    if(x.selection)assert.equal(p.selection.status,x.selection,c.id);
    if(x.competition!==undefined)assert.equal(p.monthBasis.competingExposures.length>0,x.competition,c.id);
    if(x.dayOnly)assert.deepEqual(p.monthBasis.dayMasterOnlyMatches.map(l=>l.stem),x.dayOnly,c.id);
    assert.equal(p.effects.status,'NOT_EVALUATED');assert.equal(p.effects.geCheng,'NOT_IMPLEMENTED');assert.equal(p.effects.geBai,'NOT_IMPLEMENTED');assert.equal(p.effects.jiuYing,'NOT_IMPLEMENTED');
    assert.equal(validateM4InnerPatterns(value,s),true);
    assert.equal(json(s),before,c.id+' upstream values unchanged');
    assert.equal(Object.isFrozen(s.m2Facts.candidates[0].pillars),nativePillarsFrozen,c.id+' mutable input not silently frozen');
    if(t.assessment.status==='STRUCTURAL_CANDIDATE') (t.assessment.basis==='MAIN_QI'?mainTypes:otherTypes).add(t.patternType);
  }
  assert.equal(mainTypes.size,8);assert.equal(otherTypes.size,8);
});

test('same-element wrong-polarity stems never become exact OTHER exposure and duplicate positions stay distinct',()=>{
  const wrong=run(forCase(find('other-officer-wrong-polarity-no-exposure'))).candidates[0];
  assert.equal(focus(wrong,'正官').exactExposures.length,0);
  assert.equal(focus(wrong,'正官').monthMembers[0].stem,'辛');
  const repeated=run(forCase(find('repeated-exact-exposure-positions'))).candidates[0],links=focus(repeated,'正官').exactExposures;
  assert.deepEqual(links.map(shape),[{role:'year',stem:'辛'},{role:'hour',stem:'辛'}]);
  assert.equal(new Set(links.map(l=>l.id)).size,2);
  const multi=run(forCase(find('two-other-members-exposed-keep-all'))).candidates[0];
  assert.deepEqual(multi.selection.candidateTypes,['正官','正財','正印']);
  assert.equal(multi.selection.exclusivePatternDecision,'NOT_EVALUATED');
});

test('peer-main exclusion retains a narrow explicit OTHER ambiguity without forcing 建祿 or 羊刃',()=>{
  for(const id of ['peer-main-without-other-exposure','rob-wealth-main-out-of-scope']){
    const p=run(forCase(find(id))).candidates[0];assert.equal(p.selection.primaryPattern,null);assert.deepEqual(p.selection.candidateTypes,[]);assert.equal(p.selection.peerMainAmbiguity,false);
  }
  const p=run(forCase(find('peer-main-with-other-exposure-ambiguous'))).candidates[0];
  assert.equal(p.selection.primaryPattern,null);assert.deepEqual(p.selection.candidateTypes,['食神']);assert.equal(p.selection.peerMainAmbiguity,true);
  assert.ok(p.exclusions.includes('JIANLU')&&p.exclusions.includes('YANGREN'));
  const dayOnly=run(forCase(find('main-indirect-resource-day-match-only'))).candidates[0];
  assert.equal(dayOnly.monthBasis.dayMasterOnlyMatches[0].visible.pillarRole,'day');
  assert.equal(dayOnly.monthBasis.competingExposures.length,0);
});

test('peer MAIN plus exposed 午OTHER keeps compatibility and peer selection ambiguity together',()=>{
  // Additional literal boundary contract fixed before the peer-ambiguity predicate correction.
  // 丁 day / 午丁比肩 MAIN; 己食神 OTHER exactly exposed at year, but compatibility is deferred.
  const expected={primary:null,candidates:[],unresolved:['食神'],status:'PEER_MAIN_WITH_EXPOSED_OTHER_UNRESOLVED',ambiguity:true};
  const p=run(state([['己巳','壬午','丁卯','庚子']],['MANGZHONG'])).candidates[0];
  assert.equal(p.selection.primaryPattern,expected.primary);assert.deepEqual(p.selection.candidateTypes,expected.candidates);
  assert.deepEqual(p.selection.unresolvedTypes,expected.unresolved);assert.equal(p.selection.status,expected.status);
  assert.equal(p.selection.peerMainAmbiguity,expected.ambiguity);assert.equal(focus(p,'食神').assessment.status,'SOURCE_OR_POLICY_UNRESOLVED');
  assert.deepEqual(focus(p,'食神').exactExposures.map(shape),[{role:'year',stem:'己'}]);
});

test('new conservative 午OTHER member policy preserves both legacy officer outcomes and unrelated MAIN candidates',()=>{
  for(const id of ['wu-other-officer-exposed-legacy-compatible','wu-other-officer-unexposed-legacy-compatible']){
    const s=forCase(find(id)),inner=run(s).candidates[0],old=deriveM4ZhengguanStructure(s.evidence,{profileId:M4_PATTERN_PROFILE_ID,m2Facts:s.m2Facts}).candidates[0];
    assert.equal(focus(inner,'正官').assessment.status,old.candidateAssessment.status);
    assert.equal(old.candidateAssessment.status,'SOURCE_OR_POLICY_UNRESOLVED');assert.equal(inner.selection.primaryPattern,'正財');
  }
  const wealth=run(forCase(find('wu-other-wealth-exposed-new-policy-scope'))).candidates[0];
  assert.equal(focus(wealth,'正財').assessment.status,'SOURCE_OR_POLICY_UNRESOLVED');assert.equal(focus(wealth,'傷官').assessment.status,'STRUCTURAL_CANDIDATE');
  assert.match(M4_INNER_PATTERN_METADATA.wuOtherPolicy,/PROJECT/);
});

test('pattern-specific direction inventories differ and keep exact ten-god positions and effect deferral',()=>{
  const inventories=new Map();
  for(const c of M4_INNER_CASES.slice(0,8)){
    const p=run(forCase(c)).candidates[0],t=focus(p,c.expected.focus);
    inventories.set(t.patternType,t.observations.map(o=>o.kind));
    for(const o of t.observations){
      assert.equal(o.status,o.links.length?'OBSERVED':'NOT_OBSERVED');assert.equal(o.effectStatus,'NOT_EVALUATED');
      for(const link of o.links){
        assert.equal(fiveElementRelation(link.from.element,link.to.element),link.relation);
        assert.equal(link.effectStatus,'NOT_EVALUATED');
        assert.equal(link.from.candidateRef,p.candidateRef);assert.equal(link.to.candidateRef,p.candidateRef);
        assert.ok(link.from.tenGod===t.patternType||link.to.tenGod===t.patternType);
      }
      assert.ok(o.sourceRefs.includes('M4-INNER-PROJECT-POLICY-V01'));
      assert.ok(!o.sourceRefs.includes('M4-ZPZQ-ORIGINAL-ZHENGGUAN-NCC'),'directions are not officer-source substitution');
    }
  }
  assert.deepEqual(inventories.get('正官'),['WEALTH_GENERATES_OFFICER','OFFICER_GENERATES_RESOURCE','HURTING_OFFICER_CONTROLS_OFFICER','OFFICER_KILLINGS_COEXISTENCE']);
  assert.deepEqual(inventories.get('七殺'),['OUTPUT_CONTROLS_KILLINGS','KILLINGS_GENERATE_RESOURCE','WEALTH_GENERATES_KILLINGS']);
  assert.deepEqual(inventories.get('正財'),inventories.get('偏財'));
  assert.ok(inventories.get('偏印').includes('INDIRECT_RESOURCE_CONTROLS_FOOD'));assert.ok(!inventories.get('正印').includes('INDIRECT_RESOURCE_CONTROLS_FOOD'));
  assert.notDeepEqual(inventories.get('食神'),inventories.get('傷官'));
  const hurting=run(forCase(find('main-hurting-officer-wu-compatibility'))).candidates[0];
  assert.equal(focus(hurting,'傷官').observations.find(o=>o.kind==='HURTING_OFFICER_CONTROLS_OFFICER_KILLINGS').reviewRole,'CONTROL_REVIEW','no shared adverse label for 官 and 殺');
});

test('support/adverse descriptors prove the actual linked ten gods rather than final efficacy labels',()=>{
  const p=run(forCase(find('other-killings-exact-year'))).candidates[0];
  const kill=focus(p,'七殺').observations.find(o=>o.kind==='OUTPUT_CONTROLS_KILLINGS');
  assert.equal(kill.status,'OBSERVED');assert.ok(kill.links.every(l=>['食神','傷官'].includes(l.from.tenGod)&&l.to.tenGod==='七殺'));
  const food=focus(p,'食神').observations.find(o=>o.kind==='FOOD_CONTROLS_KILLINGS');
  assert.equal(food.status,'OBSERVED');assert.ok(food.links.every(l=>l.from.tenGod==='食神'&&l.to.tenGod==='七殺'));
  const resource=run(forCase(find('other-indirect-resource-exact-year'))).candidates[0];
  const print=focus(resource,'偏印').observations.find(o=>o.kind==='RESOURCE_GENERATES_DAY_MASTER');
  assert.equal(print.status,'OBSERVED');assert.ok(print.links.every(l=>l.from.tenGod==='偏印'&&l.to.pillarRole==='day'&&l.to.locationKind==='VISIBLE_STEM'));
});

test('existing Lichun parents stay correlated with separate month members and no Cartesian product',()=>{
  const b=M4_INNER_BOUNDARY_CONTRACT,s=state(b.pillars,b.monthTerms),value=run(s);
  assert.equal(value.candidates.length,2);
  for(let i=0;i<2;i++){
    const c=value.candidates[i],x=b.expected[i];
    assert.equal(c.candidateRef,'chart.candidates['+i+']');assert.equal(c.monthContext.principalHiddenMember.tenGod,x.main);
    assert.equal(c.selection.primaryPattern,x.primary);assert.deepEqual(c.selection.candidateTypes,x.candidates);assert.equal(c.selection.status,x.selection);
    for(const p of c.patterns)for(const m of p.monthMembers)assert.equal(m.candidateRef,c.candidateRef);
  }
  assert.equal(value.upstreamFinalStrength.status,'NOT_IMPLEMENTED');assert.equal(s.evidence.finalStrength.status,'NOT_IMPLEMENTED');
});

test('all references terminate in the same parent and actual rule/source registries',()=>{
  for(const c of M4_INNER_CASES){
    const s=forCase(c),value=run(s),p=value.candidates[0];
    const facts=new Set(s.m2Facts.candidates[0].facts.map(f=>f.id)),members=new Set(Object.values(s.evidence.candidates[0].directionalGroups).flat().filter(l=>l.locationKind==='HIDDEN_STEM').map(m=>m.inputMemberRef));
    const locations=new Set([...Object.values(s.evidence.candidates[0].directionalGroups).flat(),s.evidence.candidates[0].visibleDayMaster].map(l=>l.locationId));
    const evidence=new Set(s.evidence.candidates[0].evidence.map(e=>e.id)),rules=new Set(value.rules.map(r=>r.id)),sources=new Set(value.sources.map(s=>s.id));
    const all=[p.selection,...p.patterns.flatMap(t=>[t.assessment,...t.observations])];
    for(const item of all){
      assert.ok(item.inputFactRefs.length&&item.inputEvidenceRefs.length&&item.ruleRefs.length&&item.sourceRefs.length,c.id);
      assert.ok(item.inputFactRefs.every(r=>facts.has(r)),c.id);assert.ok(item.inputEvidenceRefs.every(r=>evidence.has(r)),c.id);
      assert.ok(item.locationRefs.every(r=>locations.has(r)),c.id);assert.ok(item.ruleRefs.every(r=>rules.has(r)),c.id);
      assert.ok(item.sourceRefs.every(r=>sources.has(r)),c.id);assert.ok(item.calculationSourceRefs.length&&item.calculationSourceRefs.every(r=>sources.has(r)),c.id);
      assert.ok(item.pillarRefs.every(r=>r.startsWith(p.candidateRef+'.')),c.id);
      assert.ok(item.inputMemberRefs.every(r=>members.has(r)),c.id);
    }
    assert.equal(new Set(value.rules.map(r=>r.id)).size,value.rules.length);assert.equal(new Set(value.sources.map(s=>s.id)).size,value.sources.length);
  }
});

test('Korean explanations reproduce exact assessments and observations with resolvable scoped references',()=>{
  for(const c of M4_INNER_CASES){
    const s=forCase(c),value=run(s),report=explainM4InnerPatterns(value),p=value.candidates[0];
    assert.equal(validateM4InnerPatternsExplanation(report,value),true);
    const text=renderM4InnerPatternsText(report);assert.match(text,/PROJECT_POLICY/);assert.match(text,/실제.*효력/);assert.match(text,/成格·破格·救應/);
    assert.equal(report.candidates[0].candidateRef,p.candidateRef);
    const assessments=new Map([p.selection,...p.patterns.map(t=>t.assessment)].map(a=>[a.id,a]));
    const observations=new Map(p.patterns.flatMap(t=>t.observations).map(o=>[o.id,o]));
    for(const item of report.candidates[0].items){
      const refs=[...item.assessmentRefs.map(r=>assessments.get(r)),...item.observationRefs.map(r=>observations.get(r))];
      assert.ok(refs.length&&refs.every(Boolean),c.id);
      for(const key of ['inputFactRefs','inputEvidenceRefs','inputMemberRefs','locationRefs','pillarRefs','ruleRefs','policyRefs','sourceRefs','calculationSourceRefs'])assert.deepEqual(new Set(item[key]),new Set(refs.flatMap(r=>r[key])),c.id+' '+key);
      if(item.templateId==='KO_M4_INNER_DIRECTION')assert.equal(item.observationRefs.length,1);
    }
    const changed=structuredClone(report);changed.candidates[0].items[0].text+=' 成格';assert.throws(()=>validateM4InnerPatternsExplanation(changed,value));
  }
});

test('missing, sparse, cross-parent and unknown-reference inputs reject without inventing absent candidates',()=>{
  const seed=find('main-officer-unexposed');
  const create=mutate=>{const s=structuralM2Unit([seed.pillars],{monthTerms:[seed.monthTerm]});mutate(s);return {m2Facts:s,evidence:deriveM3Evidence(s,{policyId:M3_EVIDENCE_PROFILE_ID})};};
  assert.throws(()=>create(s=>{s.candidates[0].facts=s.candidates[0].facts.filter(f=>f.id!=='chart.candidates[0]#month-hidden-stems');}));
  assert.throws(()=>create(s=>{delete s.candidates[0].facts.find(f=>f.kind==='HIDDEN_STEMS'&&f.value.role==='month').value.members[0];}));
  assert.throws(()=>create(s=>{s.candidates[0].facts.find(f=>f.kind==='HIDDEN_STEMS'&&f.value.role==='month').value.members[0].candidateRef='chart.candidates[1]';}));
  assert.throws(()=>create(s=>{s.candidates[0].facts[0].sourceRefs=['UNKNOWN'];}));
  const s=forCase(seed);for(const profileId of [undefined,'','AUTO','UNKNOWN'])assert.throws(()=>run(s,{profileId}));
  assert.throws(()=>run(s,{m2Facts:structuredClone(s.m2Facts)}));
  assert.throws(()=>deriveM4InnerPatterns(s.evidence));
  s.m2Facts.candidates[0].facts[0].value.boundarySide='AFTER_PUBLISHED_MINUTE';assert.throws(()=>run(s));
});

test('M3-issued but incomplete selected hidden-member tables are rejected by M4',()=>{
  const c=find('main-killings-unexposed'),m2Facts=structuralM2Unit([c.pillars],{monthTerms:[c.monthTerm]});
  m2Facts.candidates[0].pillars[1].branchTenGods.members.pop();
  m2Facts.candidates[0].facts.find(f=>f.kind==='HIDDEN_STEMS'&&f.value.role==='month').value.members.pop();
  const evidence=deriveM3Evidence(m2Facts,{policyId:M3_EVIDENCE_PROFILE_ID});
  assert.throws(()=>deriveM4InnerPatterns(evidence,{profileId:M4_INNER_PATTERN_PROFILE_ID,m2Facts}),/M4_INNER_COMPLETE_SELECTED_MEMBERS_REQUIRED/);
});

test('issued results and reports reject foreign contexts and fabricated serialized replacements',()=>{
  const a=forCase(find('main-officer-unexposed')),b=forCase(find('main-officer-unexposed')),result=run(a);
  assert.ok(Object.isFrozen(result)&&Object.isFrozen(result.candidates[0].patterns[0].assessment));
  assert.throws(()=>validateM4InnerPatterns(result,b));assert.throws(()=>validateM4InnerPatterns(structuredClone(result),a));
  const report=explainM4InnerPatterns(result);assert.throws(()=>renderM4InnerPatternsText(structuredClone(report)));
  const changed=structuredClone(report);changed.candidates[0].items[0].ruleRefs=['UNKNOWN'];assert.throws(()=>validateM4InnerPatternsExplanation(changed,result));
  assert.equal(validateM4InnerPatternsExplanation(structuredClone(report),result),true);
});
