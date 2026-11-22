import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {calculateSinsalV1, SINSAL_PROFILE_ID, SINSAL_VERSION} from '../dist/e2/sinsalV1.js';

const oracle = JSON.parse(readFileSync(new URL('./fixtures/e2-sinsal-oracle-v1.json', import.meta.url), 'utf8'));
const options = {policyId:SINSAL_PROFILE_ID, policyVersion:SINSAL_VERSION, branchReference:'BOTH'};
const positions = ['year','month','day','hour'];
const branchOrder = [...'子丑寅卯辰巳午未申酉戌亥'];

function fixture(pairs, index = 0) {
  const id = `chart.candidates[${index}]`;
  const pillars = pairs.map(([stem,branch],i) => ({stem,branch,role:positions[i],factRef:`preview.candidates[${index}].${positions[i]}`}));
  return {candidateIndex:index, id, pillars, facts:pillars.map(({role,stem,branch}) => ({
    id:`${id}#${role}-nature`, candidateRef:id, kind:'PILLAR_NATURE', value:{role,stem,branch},
  }))};
}

function validPillarForBranch(branch) {
  return (branchOrder.indexOf(branch) % 2 ? '乙' : '甲') + branch;
}

test('all three branch stars check every reference against every target, for both reference policies', () => {
  for (const [ref,peach,horse,canopy] of oracle.branchRows) {
    for (const other of branchOrder) {
      const chart = fixture([ref,other,ref,other].map(validPillarForBranch));
      for (const branchReference of ['YEAR','DAY']) {
        const result = calculateSinsalV1(chart, {...options,branchReference});
        assert.equal(result.observations.length,6);
        for (const [i,expected] of [peach,horse,canopy].entries()) {
          const row=result.observations[i];
          const reference=branchReference==='YEAR'?'year':'day';
          const matches=chart.pillars.filter(p=>p.role!==reference && p.branch===expected).map(p=>p.role);
          assert.deepEqual(row.expectedMatch,[expected]);
          assert.deepEqual(row.matchedPositions.map(s=>s.position),matches);
          assert.equal(row.referencePosition,reference);
          assert.equal(row.includeReferencePillar,false);
          assert.equal(row.status,matches.length?'PRESENT':'NOT_PRESENT');
          assert.equal(row.factRefs.length,4);
        }
      }
    }
  }
});

test('noble, literary and blade lookup agrees with every cell of the independent day-stem table', () => {
  for (const [i,[stem,n1,n2,literary,blade]] of oracle.stemRows.entries()) {
    for (const branch of branchOrder) {
      const sample=validPillarForBranch(branch);
      const chart=fixture([sample,sample,stem+(i%2?'丑':'子'),sample]);
      const rows=calculateSinsalV1(chart,options).observations.slice(-3);
      const expected=[[n1,n2],[literary],[blade]];
      for (const [j,row] of rows.entries()) {
        assert.deepEqual(row.expectedMatch,expected[j]);
        assert.equal(row.referenceStemOrBranch,stem);
        assert.equal(row.referencePosition,'day');
        assert.equal(row.includeReferencePillar,true);
        const positions=chart.pillars.filter(p=>expected[j].includes(p.branch)).map(p=>p.role);
        assert.deepEqual(row.matchedPositions.map(s=>s.position),positions);
        assert.equal(row.status,positions.length?'PRESENT':'NOT_PRESENT');
      }
    }
  }
});

for (const c of oracle.contracts) {
  test(c.id+' preserves independent per-position expectations', () => {
    const chart=fixture(c.pillars);
    const result=calculateSinsalV1(chart,options);
    assert.equal(result.candidateRef,chart.id);
    assert.deepEqual(result.observations.map(row=>row.matchedPositions.map(s=>s.position)),c.matches);
    assert.deepEqual(result.observations.map(row=>row.starId),['DOHWA','YEOKMA','HWAGAE','DOHWA','YEOKMA','HWAGAE','CHEONEUL','MUNCHANG','YANGIN']);
    for(const [i,row] of result.observations.entries()){
      assert.equal(row.status,c.matches[i].length?'PRESENT':'NOT_PRESENT');
      assert.ok(row.sourceRefs.length>=2);
      for(const m of row.matchedPositions) {
        assert.equal(m.factRef,`${chart.id}#${m.position}-nature`);
        assert.ok(row.expectedMatch.includes(m.branch));
      }
    }
    assert.throws(()=>{result.observations[0].expectedMatch[0]='戌';},TypeError);
  });
}

test('published-minute charts keep before/after year anchors and their fact IDs separate', () => {
  const before=fixture(['乙巳','己丑','己酉','丁卯']);
  const after=fixture(['丙午','庚寅','己酉','丁卯'],1);
  const a=calculateSinsalV1(before,options), b=calculateSinsalV1(after,options);
  assert.equal(a.observations[0].status,'NOT_PRESENT');
  assert.deepEqual(b.observations[0].matchedPositions.map(s=>s.position),['hour']);
  assert.deepEqual(b.observations[3].matchedPositions.map(s=>s.position),['year']);
  assert.deepEqual(a.observations[2].matchedPositions.map(s=>s.position),['month']);
  assert.equal(b.observations[2].status,'NOT_PRESENT');
  assert.throws(()=>calculateSinsalV1({...before,facts:after.facts},options),/FOREIGN/);
  assert.throws(()=>calculateSinsalV1({...before,pillars:after.pillars},options),/MISMATCH/);
});

test('lookup fails closed for invalid options and missing, duplicated, sparse or changed source evidence', () => {
  const chart=fixture(oracle.contracts[0].pillars);
  for (const o of [undefined,{...options,policyVersion:'0.1.1'},{...options,policyId:'old'},{...options,branchReference:'MONTH'}]) {
    assert.throws(()=>calculateSinsalV1(chart,o),/EXPLICIT/);
  }
  for(const change of [
    c=>{c.facts.pop();}, c=>{c.facts[0]=c.facts[1];}, c=>{c.facts[0].value.branch='辰';},
    c=>{delete c.pillars[0];}, c=>{delete c.facts[1];}, c=>{c.pillars[0].stem='甲';c.facts[0].value.stem='甲';},
  ]){
    const copy=structuredClone(chart);change(copy);
    assert.throws(()=>calculateSinsalV1(copy,options),/E2_SINSAL_/);
  }
});
