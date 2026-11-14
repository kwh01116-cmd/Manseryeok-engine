import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {structuralM2Unit} from './fixtures/m3-structural-unit-input.mjs';
import {deriveM3Evidence,M3_EVIDENCE_PROFILE_ID} from '../dist/m3/structuralEvidenceV1.js';
import {deriveM4InnerPatterns,M4_INNER_PATTERN_PROFILE_ID,validateM4InnerPatterns} from '../dist/m4/innerPatternsV1.js';
import {M4_DIVERSE_BASIS,M4_DIVERSE_CASES} from './fixtures/m4-diverse-month-contracts-v1.mjs';
const states={anchor:'MAIN_QI_STRUCTURAL_ANCHOR',competition:'MAIN_QI_WITH_COMPETING_EXPOSURES',peer:'PEER_MAIN_OUT_OF_SCOPE','peer-other':'PEER_MAIN_WITH_EXPOSED_OTHER_UNRESOLVED'};
const root=row=>{const m2Facts=structuralM2Unit([row[1]],{monthTerms:[row[2]]}),evidence=deriveM3Evidence(m2Facts,{policyId:M3_EVIDENCE_PROFILE_ID});return {m2Facts,evidence,result:deriveM4InnerPatterns(evidence,{profileId:M4_INNER_PATTERN_PROFILE_ID,m2Facts})};};

test('diverse literal contracts cover twelve month branches, ten day stems and eight non-January MAIN patterns',()=>{
  assert.equal(M4_DIVERSE_BASIS.expectedFromResolver,false);assert.equal(M4_DIVERSE_CASES.length,21);
  assert.equal(new Set(M4_DIVERSE_CASES.map(r=>r[1][1][1])).size,12);
  assert.equal(new Set(M4_DIVERSE_CASES.map(r=>r[1][2][0])).size,10);
  const kinds=new Set(M4_DIVERSE_CASES.filter(r=>r[0].slice(5,7)!=='01'&&!['比肩','劫財'].includes(r[3])).map(r=>r[3]));
  assert.equal(kinds.size,8);
  assert.equal(new Set(M4_DIVERSE_CASES.map(r=>r[0])).size,21);
  assert.equal(createHash('sha256').update(readFileSync(new URL('./fixtures/m4-diverse-month-contracts-v1.mjs',import.meta.url),'utf8').replace(/\r\n/g,'\n')).digest('hex'),'f6f92b6da60529ec3a4e6d9a50a2fd049d43aae19ec09988e99a29bcfe83ebfe');
});

test('all diverse month structures preserve literal MAIN, OTHER exposure, noncandidate and policy-hold decisions',()=>{
  for(const row of M4_DIVERSE_CASES){const {result,evidence,m2Facts}=root(row),c=result.candidates[0];validateM4InnerPatterns(result,{evidence,m2Facts});
    assert.equal(c.monthContext.principalHiddenMember.tenGod,row[3],row[0]);
    assert.deepEqual(c.selection.candidateTypes,row[4],row[0]);assert.deepEqual(c.selection.unresolvedTypes,row[5],row[0]);assert.equal(c.selection.status,states[row[6]],row[0]);
    assert.equal(c.selection.primaryPattern,['比肩','劫財'].includes(row[3])?null:row[3],row[0]);
    const exposures=c.monthBasis.competingExposures.map(l=>[l.hidden.tenGod,l.hidden.stem,l.visible.pillarRole]);assert.deepEqual(exposures,row[7],row[0]);
    for(const p of c.patterns){const expected=row[4].includes(p.patternType)?'STRUCTURAL_CANDIDATE':row[5].includes(p.patternType)?'SOURCE_OR_POLICY_UNRESOLVED':'NOT_A_CANDIDATE_UNDER_POLICY';assert.equal(p.assessment.status,expected,row[0]+' '+p.patternType);}
    assert.equal(c.effects.geCheng,'NOT_IMPLEMENTED');assert.equal(c.effects.geBai,'NOT_IMPLEMENTED');assert.equal(c.effects.jiuYing,'NOT_IMPLEMENTED');
  }
});
