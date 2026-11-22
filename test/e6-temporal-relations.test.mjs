import assert from 'node:assert/strict';
import { test } from 'node:test';
import { observeE6Relations, diffE6Relations } from '../dist/e6/temporalRelationsV1.js';

const roles=['year','month','day','hour'];
function natal(...pillars) {
  return pillars.map(([stem,branch],i)=>({role:roles[i],stem,branch,positionRef:'N-'+roles[i],factRefs:['natal/'+roles[i]]}));
}
function transit(layer, periodRef, [stem,branch], ref=periodRef){
  return {layer,periodRef,stem,branch,positionRef:ref,factRefs:['period/'+periodRef]};
}
function observe(chart, positions, timeContextRef='T1', unavailableLayers=[], parent){
  return observeE6Relations('C0',chart,{natalCandidateRef:'C0',timeContextRef,positions,unavailableLayers},parent);
}
function member(value, definitionId, category){
  return value.triads.find(r=>r.definitionId===definitionId && r.category===category);
}
function endpoint(row,...refs){return refs.every(ref=>row.positions.some(p=>p.positionRef===ref));}

test('E6 adopts the independent finite branch hit inventory including overlap and oriented xing',()=>{
  const symmetric={
    LIUHE:'子丑 寅亥 卯戌 辰酉 巳申 午未',
    LIUCHONG:'子午 丑未 寅申 卯酉 辰戌 巳亥',
    LIUHAI:'子未 丑午 寅巳 卯辰 申亥 酉戌',
    LIUPO:'子酉 丑辰 寅亥 卯午 巳申 未戌',
  };
  const cycle='寅巳 巳申 申寅 丑戌 戌未 未丑'.split(' ');
  const order=[...'子丑寅卯辰巳午未申酉戌亥'];
  const token=b=>order.indexOf(b)%2 ? '乙'+b : '甲'+b;
  for(const a of order)for(const b of order){
    const output=observe(natal(token(a),'甲寅','甲寅','甲寅'),[transit('SEYUN','S',token(b))]);
    const given=output.pairs.filter(r=>endpoint(r,'N-year','S') && r.kind!=='STEM_COMBINATION');
    const expected=Object.entries(symmetric).filter(([,v])=>v.split(' ').some(s=>s===a+b||s===b+a))
      .map(([id])=>[id,'SYMMETRIC']);
    if(a===b && '辰午酉亥'.includes(a))expected.push(['XING','SELF_BETWEEN_OCCURRENCES']);
    else if(a+b==='子卯'||b+a==='子卯')expected.push(['XING','BIDIRECTIONAL']);
    else if(cycle.includes(a+b))expected.push(['XING','LEFT_TO_RIGHT']);
    else if(cycle.includes(b+a))expected.push(['XING','RIGHT_TO_LEFT']);
    assert.deepEqual(given.map(row=>[row.kind,row.orientation]),expected,a+b);
    assert.ok(given.every(row=>row.effectStatus==='NOT_EVALUATED' && row.category==='NATAL_TRANSIT'));
  }
});

test('E6 preserves duplicate position occurrences and uses the natal day stem for transit classes',()=>{
  const positions=[transit('SEYUN','S1','己巳'),transit('MONTHLY','M1','壬申')];
  const report=observe(natal('乙巳','己巳','甲申','丙戌'),positions);
  const overlaps=report.pairs.filter(r=>r.category==='NATAL_TRANSIT' && endpoint(r,'N-day','S1'));
  assert.deepEqual(overlaps.map(row=>row.kind),['STEM_COMBINATION','LIUHE','LIUPO','XING']);
  const annual=report.transitPositions[0];
  assert.equal(annual.stemTenGod,'正財');
  assert.deepEqual(annual.hiddenStems.map(row=>[row.stem,row.tenGod,row.position]),
    [['丙','食神','MAIN_QI'],['庚','七殺','OTHER'],['戊','偏財','OTHER']]);
  assert.equal(annual.twelveGrowth.stage,'病');
  const monthly=report.transitPositions[1];
  assert.deepEqual(report.pairs.filter(r=>endpoint(r,'N-year','M1')).map(r=>r.kind),['LIUHE','LIUPO','XING']);
  assert.deepEqual(report.pairs.filter(r=>endpoint(r,'N-month','M1')).map(r=>r.kind),['LIUHE','LIUPO','XING']);
  assert.equal(monthly.stemTenGod,'偏印');
  const between=report.pairs.filter(r=>endpoint(r,'S1','M1'));
  assert.equal(between.length,3);
  assert.ok(between.every(row=>row.category==='TRANSIT_TRANSIT'));
});

test('E6 records native partial Three Harmony and Assembly plus distinct completion by transit sites',()=>{
  const water=observe(natal('甲申','丙子','甲寅','丙寅'),[
    transit('DAEUN','D','庚辰'),transit('MONTHLY','M','壬辰'),
  ]);
  const original=member(water,'SANHE_WATER','NATAL_NATAL');
  assert.deepEqual([original.state,original.partialKind],['TWO_DISTINCT_MEMBERS','BIRTH_AND_CENTER']);
  const mixed=member(water,'SANHE_WATER','NATAL_TRANSIT');
  assert.equal(mixed.natalCompletion,'COMPLETES_NATAL_PARTIAL');
  assert.equal(mixed.distinctMemberCount,3);
  assert.deepEqual(mixed.members.map(r=>r.positions.map(p=>p.positionRef)),[['N-year'],['N-month'],['D','M']]);
  assert.equal(member(water,'SANHE_WATER','TRANSIT_TRANSIT'),undefined);
  assert.equal(mixed.effectStatus,'NOT_EVALUATED');

  const wood=observe(natal('甲寅','乙卯','甲午','丙午'),[transit('SEYUN','S','庚辰')]);
  assert.equal(member(wood,'SANHUI_WOOD','NATAL_NATAL').partialKind,'SANHUI_PARTIAL_MEMBERS');
  assert.equal(member(wood,'SANHUI_WOOD','NATAL_TRANSIT').natalCompletion,'COMPLETES_NATAL_PARTIAL');
});

test('E6 preserves a complete native triad and flags added transit occurrences without double completion',()=>{
  const report=observe(natal('甲申','丙子','庚辰','甲寅'),[transit('SEYUN','S','壬子')]);
  assert.equal(member(report,'SANHE_WATER','NATAL_NATAL').distinctMemberCount,3);
  const mixed=member(report,'SANHE_WATER','NATAL_TRANSIT');
  assert.equal(mixed.natalCompletion,'NATAL_ALREADY_COMPLETE');
  assert.equal(mixed.includesNewNatalCompletion,false);
  assert.deepEqual(mixed.members[1].positions.map(row=>row.positionRef),['N-month','S']);
  assert.equal(report.triads.filter(r=>r.definitionId==='SANHE_WATER'&&r.includesNewNatalCompletion).length,0);
});

test('E6 diff keeps stable seyun and native positions, and distinguishes same-shape new periods',()=>{
  const chart=natal('乙巳','戊寅','甲子','壬申'), parent={};
  const start=observe(chart,[transit('SEYUN','S','辛酉','S@1'),transit('MONTHLY','M1','甲午')],'T1',[],parent);
  const next=observe(chart,[transit('MONTHLY','M2','乙卯'),transit('SEYUN','S','辛酉','S@2')],'T2',[],parent);
  const delta=diffE6Relations(start,next);
  assert.deepEqual(delta.changedLayers.map(r=>r.layer),['MONTHLY']);
  assert.ok(delta.maintained.some(r=>r.kind==='LIUPO' && endpoint(r,'N-day','S@2')));
  assert.ok(delta.ended.some(r=>r.kind==='LIUCHONG' && endpoint(r,'N-day','M1')));
  assert.ok(delta.added.some(r=>r.kind==='XING' && endpoint(r,'N-day','M2')));
  assert.equal(delta.maintained.filter(r=>r.category==='NATAL_NATAL').length,
    start.pairs.filter(r=>r.category==='NATAL_NATAL').length);
  const nextSameShape=observe(chart,[transit('SEYUN','S','辛酉'),transit('MONTHLY','M3','乙卯')],'T3',[],parent);
  const later=diffE6Relations(next,nextSameShape);
  const prior= later.ended.find(r=>r.kind==='XING' && endpoint(r,'N-day','M2'));
  const following=later.added.find(r=>r.kind==='XING' && endpoint(r,'N-day','M3'));
  assert.notEqual(prior.key,following.key);
  assert.equal(prior.shapeKey,following.shapeKey);
});

test('E6 diff reports a missing-layer relation without treating the missing observation as ended',()=>{
  const chart=natal('乙巳','戊寅','甲子','壬申');
  const initial=observe(chart,[transit('DAEUN','D','甲午'),transit('SEYUN','S','辛酉')],'T1');
  const partial=observe(chart,[transit('SEYUN','S','辛酉')],'T2',['DAEUN']);
  assert.equal(partial.status,'PARTIAL');
  assert.equal(observe(natal('甲寅','甲寅','甲寅','甲寅'),[]).status,'OBSERVED_NO_RELATIONS');
  const delta=diffE6Relations(initial,partial);
  assert.equal(delta.status,'PARTIAL');
  assert.equal(delta.ended.length,0);
  assert.ok(delta.uncomparable.some(rec=>rec.side==='BEFORE' && rec.row.kind==='LIUCHONG' && endpoint(rec.row,'N-day','D')));
  assert.ok(delta.maintained.some(r=>r.kind==='LIUPO' && endpoint(r,'N-day','S')));
  assert.ok(delta.triadChanges.some(r=>r.status==='UNCOMPARABLE'));
});

test('E6 keeps a known pillar under a data hold for only its period bounds',()=>{
  const chart=natal('乙巳','戊寅','甲子','壬申');
  const positions=[{...transit('SEYUN','S','辛酉'),intervalStatus:'NEEDS_DATA'}];
  const initial=observe(chart,positions,'T1',['SEYUN']);
  const next=observe(chart,positions,'T2',['SEYUN']);
  assert.equal(initial.status,'PARTIAL');
  assert.equal(initial.transitPositions[0].stemTenGod,'正官');
  assert.ok(initial.pairs.some(r=>r.kind==='LIUPO' && endpoint(r,'N-day','S')));
  const delta=diffE6Relations(initial,next);
  assert.equal(delta.added.length,0);
  assert.equal(delta.ended.length,0);
  assert.ok(delta.maintained.some(r=>r.kind==='LIUPO' && endpoint(r,'N-day','S')));
});

test('E6 preserves a native partial/complete change and rejects forged observations and cross-parent inputs',()=>{
  const a=natal('甲申','丙子','甲寅','丙寅'), b=natal('甲申','丙子','甲寅','甲午'),parent={};
  const left=observe(a,[],'T1',[],parent);
  const right=observe(a,[transit('MONTHLY','M','壬辰')],'T2',[],parent);
  const changes=diffE6Relations(left,right).triadChanges;
  const triads=changes.filter(row=>(row.before??row.after).definitionId==='SANHE_WATER');
  assert.deepEqual(triads.map(row=>row.status),['MAINTAINED','ADDED']);
  assert.equal(triads[1].after.natalCompletion,'COMPLETES_NATAL_PARTIAL');
  assert.throws(()=>diffE6Relations(structuredClone(left),right),/E6_ISSUED_RELATION_OBSERVATION_REQUIRED/);
  assert.throws(()=>diffE6Relations(left,observe(a,[],'T3',[],{})),/E6_RELATION_DIFF_PRECONDITION/);
  assert.throws(()=>diffE6Relations(left,observe(b,[],'T4',[],parent)),/E6_RELATION_DIFF_PRECONDITION/);
  assert.throws(()=>observe(a,[transit('SEYUN','S','辛酉'),transit('SEYUN','S2','辛酉')]),/E6_INCOHERENT_RELATION_LAYER_INSTANCES/);
  assert.throws(()=>observe(a,[transit('SEYUN','S','辛酉')],'T5',['SEYUN']),/E6_INCOHERENT_RELATION_LAYER_INSTANCES/);
});
