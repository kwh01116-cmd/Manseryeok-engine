import test from 'node:test';
import assert from 'node:assert/strict';
import {buildInterpretedReport,rebuildInterpretationBasis} from '../dist/report/narrativePipelineV1.js';
import {INTERPRETATION_PROFILE_ID} from '../dist/report/interpretationPolicyV1.js';
import {makeConsumerProjection} from './fixtures/consumer-report-projection-v1.mjs';
import {SPRINT7_REPORT_CASES} from './fixtures/sprint7-interpretation-cases-v1.mjs';
import {describeQuality,getComparisonType,getBlindPacket,getBlindDebrief,toStudyFixture} from '../scripts/beta/materials.mjs';

function unitReport(variant) {
  return buildInterpretedReport(rebuildInterpretationBasis(makeConsumerProjection({variant})),{profileId:INTERPRETATION_PROFILE_ID});
}
test('연구 표본은 기존 37개 전부와 실패 사례, 절입 후보·토왕 대안·보류 반례를 보존한다',()=>{
  assert.equal(SPRINT7_REPORT_CASES.length,37);
  assert.equal(SPRINT7_REPORT_CASES.filter(c=>c.expected.natalParents===0).length,5);
  const fixtures=['two-natal-parents','seasonal-alternatives','dst-gap','dst-fold'].map((variant,i)=>
    toStudyFixture(unitReport(variant),'F0'+(i+1)));
  assert.deepEqual(fixtures.map(f=>f.candidates.length),[2,1,0,0]);
  assert.equal(fixtures[1].candidates[0].seasons.length,2);
  assert.deepEqual(fixtures.slice(2).map(f=>f.claims),[[],[]]);
  assert.equal(new Set(fixtures[0].claims.map(c=>c.claimId)).size,8);
  assert.deepEqual(fixtures[0].chapters.map(x=>x.chapterId),['ch1','ch2','ch3','ch4','ch5','ch6']);
  assert.ok(fixtures[0].claims.every(c=>c.inputFacts.length&&c.policy.id&&c.originalRef&&c.sourceRefs.length));
  assert.equal(getBlindPacket(fixtures,'F01',['A','C','B']),null);
});

test('다른 후보의 증거 노드는 전문가 평가용 자료로 옮길 때도 거절한다',()=>{
  const foreign=structuredClone(unitReport('two-natal-parents'));
  foreign.interpretationClaims[0].inputFactRefs=[foreign.basis.projection.candidates[1].refs.day];
  assert.throws(()=>toStudyFixture(foreign,'F01'),/S9_CLAIM_FACT_REFERENCE/);
});

function studyPair(){
  // Test-only prose deliberately uses two different locator sentences and no real birth record.
  const make=(id,pillars,locator,body)=>({id,chartSummary:'가상 원국 표',candidates:[{ordinal:1,pillars}],
    chapters:[{chapterId:'ch2',paragraphs:['같은 조건 카드']}],
    claims:[{claimId:'p1-work',candidate:1,domain:'WORK',status:'LIMITED',text:locator+'. '+body}]});
  return [
    make('F01',['甲子'],'연간과 시간에 드러났습니다','만든 결과를 어디에 쓸지 생각하는 과정까지 함께 살핍니다. 최근 끝낸 일에서 결과를 만드는 기준과 그 쓰임을 정한 기준을 따로 떠올려 보세요.'),
    make('F02',['乙丑'],'월간과 시간에 드러났습니다','맡은 일을 하기 전에 필요한 자료를 받아 정리하는 과정에 주목합니다. 최근 일에서 요구 조건과 도움을 받은 정보를 어떻게 나누어 보았는지 살펴보세요.'),
  ];
}
test('블라인드 세 글은 같은 사실 카드와 슬롯만 제공하고 출처는 별도 해설에만 나타난다',()=>{
  const fixtures=studyPair();
  for(const order of [['A','B','C'],['A','C','B'],['B','A','C'],['B','C','A'],['C','A','B'],['C','B','A']]){
    const packet=getBlindPacket(fixtures,'F01',order);
    assert.deepEqual(Object.keys(packet).sort(),['context','fixtureId','readings','topic']);
    assert.equal(packet.context,'가상 원국 표\n같은 조건 카드');
    assert.equal(new Set(packet.readings.map(x=>x.text)).size,3);
    for(const [index,reading] of packet.readings.entries()){
      assert.deepEqual(Object.keys(reading).sort(),['slot','text']);
      assert.equal(reading.slot,String(index+1));
      assert.doesNotMatch(reading.text,/가상|연간|월간|CANDIDATE|F0[12]/);
    }
    assert.ok(fixtures[0].claims[0].text.endsWith(packet.readings[order.indexOf('A')].text));
    assert.ok(fixtures[1].claims[0].text.endsWith(packet.readings[order.indexOf('C')].text));
    const debrief=getBlindDebrief(fixtures,'F01',order);
    assert.ok(debrief.readings[order.indexOf('C')].origin.includes('다른 가상'));
    assert.deepEqual(getBlindPacket(fixtures,'F01',order),packet);
  }
});
test('동일한 팔자·같은 글·HOLD·조건 설명이 잘리는 글은 가짜 비교군으로 제공하지 않는다',()=>{
  for(const edit of [
    f=>{f[1].candidates[0].pillars=[...f[0].candidates[0].pillars];},
    f=>{f[1].claims[0].text=f[0].claims[0].text;},
    f=>{f[0].claims[0].status='HOLD';},
    f=>{f[0].claims[0].text+='\n다른 조건도 검토합니다.';},
  ]){
    const fixtures=studyPair(); edit(fixtures);
    assert.equal(getBlindPacket(fixtures,'F01',['C','B','A']),null);
  }
  assert.throws(()=>getBlindPacket(studyPair(),'F01',['A','A','C']),/S9_BLIND_ORDER/);
});
test('사전에 지정한 대조 위치에서는 서로 다른 원국이 실제로 같은 글을 낸 경우도 남긴다',()=>{
  const fixtures=studyPair();
  const repeated=structuredClone(fixtures[1]);
  repeated.id='F03';
  repeated.candidates[0].pillars=['丙寅'];
  fixtures.push(repeated);
  const order=['C','B','A'];
  assert.equal(getComparisonType(fixtures,'F02'),'IDENTICAL_WORDING_DIFFERENT_CHART');
  assert.equal(getComparisonType(fixtures,'F01'),'DISTINCT_WORDING_DIFFERENT_CHART');
  const packet=getBlindPacket(fixtures,'F02',order);
  assert.equal(packet.readings[0].text,packet.readings[2].text);
  assert.ok(!JSON.stringify(packet).includes('IDENTICAL_WORDING'));
  assert.match(getBlindDebrief(fixtures,'F02',order).explanation,/같은 해석 문장/);
});
test('서로 반대로 인용한 같은 위치 쌍은 구조 근거 한 건이고 요약장은 독립 해석이 아니다',()=>{
  const left={role:'year',stem:'乙',tenGod:'傷官'},right={role:'hour',stem:'丙',tenGod:'偏財'};
  const claims=['WORK','MONEY'].map((domain,i)=>({candidate:1,domain,status:'LIMITED',
    supportingConditions:[{code:i?'WEALTH_OUTPUT':'OUTPUT_WEALTH',locations:i?[right,left]:[left,right]}]}));
  claims.push({candidate:1,domain:'BEHAVIOR',status:'HOLD'});
  const result=describeQuality({candidates:[{ordinal:1}],claims,chapters:[]}).parentResults[0];
  assert.equal(result.distinctStructuralWitnesses,1);
  assert.deepEqual(result.repeatedRolePairs[0].domains,['WORK','MONEY']);
  assert.deepEqual(result.newSymbolicChapters,[4]);
  assert.deepEqual(result.heldSymbolicChapters,[3]);
});
