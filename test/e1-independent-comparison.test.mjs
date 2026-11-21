import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {HEAVENLY_STEMS} from '../dist/domain/stems.js';
import {EARTHLY_BRANCHES} from '../dist/domain/branches.js';
import {assessProductStrength, PRODUCT_STRENGTH_POLICY_ID} from '../dist/e1/productStrengthV1.js';
import {deriveEokbuCandidate, EOKBU_POLICY_ID} from '../dist/e1/eokbuCandidateV1.js';
import {GRID_PATH} from '../scripts/engine/select-e1-cohort.mjs';

test('fixed actual-date integration list spans 120 cells with different root or support positions', async () => {
  const rows=(await readFile(GRID_PATH,'utf8')).trim().split(/\r?\n/).map(line=>line.split(' '));
  assert.equal(rows.length,240);
  assert.equal(new Set(rows.map(r=>r[0])).size,240);
  const cells=new Map();
  for (const [date,time,cell,signature] of rows) {
    assert.match(date,/^\d{4}-\d{2}-\d{2}$/);
    assert.match(time,/^\d{2}:15$/);
    assert.match(signature,/^[ES-]{4}\/[PR-]{3}$/);
    assert.ok(HEAVENLY_STEMS.includes(cell[0])&&EARTHLY_BRANCHES.includes(cell[1]));
    if (!cells.has(cell)) cells.set(cell,new Set());
    cells.get(cell).add(signature);
  }
  assert.equal(cells.size,120);
  assert.ok([...cells.values()].every(signatures=>signatures.size===2));
});

test('published 8-codes four-pillar illustration is compared with an independently hand-derived E1 result', () => {
  // Source image: doc.8-codes.com/origin/ukboo.jpg (calendar birthday unknown).
  // Under E1, year stem 甲 contributes 8 and 午 contains 7 fire; 巳 adds 18 fire;
  // day seat 卯 adds 20 wood with no fire root. 53 is held in the 45–55 band.
  const chart=['甲午','己巳','丁卯','庚子'];
  const input={candidateRef:'chart.candidates[0]',pillars:chart.map(([stem,branch],i)=>({
    stem,branch,role:['year','month','day','hour'][i],factRef:'facts.candidates[0].pillars['+i+']',
  }))};
  const strength=assessProductStrength(input,{policyId:PRODUCT_STRENGTH_POLICY_ID});
  assert.equal(strength.score.supportUnits,5300);
  assert.equal(strength.grade,'BORDERLINE');
  assert.deepEqual([strength.seasonalEvidence.acquired,strength.rootEvidence.acquired,strength.supportingEvidence.acquired],[true,false,false]);
  const eokbu=deriveEokbuCandidate(strength,{profileId:EOKBU_POLICY_ID});
  assert.equal(eokbu.status,'HOLD');
  assert.ok(eokbu.holdReasons.includes('BORDERLINE_STRENGTH'));
});
