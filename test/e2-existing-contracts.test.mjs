import test from 'node:test';
import assert from 'node:assert/strict';
import {twelveGrowthStage, TWELVE_GROWTH_POLICY_V1} from '../dist/domain/twelveGrowthStages.js';
import {collectFourPillarBranchRelations, BRANCH_RELATIONS_POLICY_V1} from '../dist/domain/branchRelations.js';
import {areStemCombinationPartners} from '../dist/domain/stemCombinations.js';
import {hiddenStemsForBranch, HIDDEN_STEM_POLICY_V1} from '../dist/domain/hiddenStems.js';
import {M7_LUCK_POLICY_V01, compileLuckTimeline, resolveLuckStart, luckPillarSequence, resolveLuckDirection} from '../dist/luck/luckV01.js';
import {CALENDAR_PROJECTION_POLICY_V02, projectNominalLuckCalendar, selectNominalDaYunAt} from '../dist/luck/calendarProjectionV02.js';

// Independent, literal outcome grid in 子 ... 亥 order. No reversal or anchor arithmetic in the oracle.
const rows = {
  甲: '浴帶祿旺衰病死墓絕胎養生', 乙: '病衰旺祿帶浴生養胎絕墓死',
  丙: '胎養生浴帶祿旺衰病死墓絕', 丁: '絕墓死病衰旺祿帶浴生養胎',
  戊: '胎養生浴帶祿旺衰病死墓絕', 己: '絕墓死病衰旺祿帶浴生養胎',
  庚: '死墓絕胎養生浴帶祿旺衰病', 辛: '生養胎絕墓死病衰旺祿帶浴',
  壬: '旺衰病死墓絕胎養生浴帶祿', 癸: '祿帶浴生養胎絕墓死病衰旺',
};
const names = {生:'長生',浴:'沐浴',帶:'冠帶',祿:'臨官',旺:'帝旺',衰:'衰',病:'病',死:'死',墓:'墓',絕:'絕',胎:'胎',養:'養'};

test('E2 audit pins all 120 M2 growth labels against literal branch columns', () => {
  for (const [stem, row] of Object.entries(rows)) {
    for (const [index, branch] of [...'子丑寅卯辰巳午未申酉戌亥'].entries()) {
      const actual = twelveGrowthStage(stem, branch, TWELVE_GROWTH_POLICY_V1);
      assert.equal(actual.stage, names[row[index]], stem + branch);
      assert.equal(actual.dayMaster, stem);
      assert.equal(actual.branch, branch);
      assert.ok(actual.sourceIds.length > 0);
    }
  }
});

test('E2 audit aligns reference stems in the published 甲午 己巳 丁卯 庚子 example', () => {
  assert.equal(areStemCombinationPartners('甲', '己'), true);
  assert.equal(twelveGrowthStage('丁','午',TWELVE_GROWTH_POLICY_V1).stage, '臨官');
  assert.equal(twelveGrowthStage('甲','午',TWELVE_GROWTH_POLICY_V1).stage, '死');
  assert.equal(twelveGrowthStage('甲','卯',TWELVE_GROWTH_POLICY_V1).stage, '帝旺');
  assert.deepEqual(hiddenStemsForBranch('子',HIDDEN_STEM_POLICY_V1).map(member => member.stem), ['癸']);
});

test('E2 audit preserves multiple kinds on the same pair and distinct occurrences of repeated branches', () => {
  const hits = collectFourPillarBranchRelations(['巳','午','申','午'], BRANCH_RELATIONS_POLICY_V1);
  const at = (left,right) => hits.filter(hit => hit.leftPillarIndex === left && hit.rightPillarIndex === right);
  assert.deepEqual(at(0,2).map(hit => hit.kind).sort(), ['LIUHE','LIUPO','XING']);
  assert.deepEqual(at(1,3).map(hit => hit.orientation), ['SELF_BETWEEN_OCCURRENCES']);
  for (const hit of hits) {
    assert.ok(hit.sourceIds.length);
    assert.equal(hit.status,'RAW_PAIR_MEMBERSHIP_ONLY');
    assert.ok(hit.leftPillarIndex < hit.rightPillarIndex);
  }
});

test('E2 audit joins verified M7 direction, adjacent Jie, model age and first period selection', () => {
  const birthMinute = '2010-06-01T12:00';
  const policyId = M7_LUCK_POLICY_V01;
  // Synthetic minute events deliberately make forward +3 days and reverse -6 days.
  // An intervening nongating solar term must never shorten either interval.
  const event = (term, displayedDateTime) => ({
    term, displayedDateTime, timeBasis:'KST', sourcePrecision:'MINUTE', sourceIds:['SYNTHETIC-E2-JIE'],
  });
  const timeline = compileLuckTimeline([
    event('LIXIA','2010-05-26T12:00'), event('XIAOMAN','2010-05-31T12:00'), event('MANGZHONG','2010-06-04T12:00'),
  ]);
  for (const [traditionalSex, expectedDirection, expectedTerm, interval, first, before, firstPillar] of [
    ['MALE','FORWARD','MANGZHONG',4320,'2011-06-01T12:00','2011-06-01T11:59','壬午'],
    ['FEMALE','REVERSE','LIXIA',8640,'2012-06-01T12:00','2012-06-01T11:59','庚辰'],
  ]) {
    const {direction} = resolveLuckDirection({yearPillar:{stem:'庚',branch:'寅'},traditionalSex,policyId});
    assert.equal(direction,expectedDirection);
    const start = resolveLuckStart({timeline,birthMinute,direction,boundarySide:'DEFINITE',policyId});
    assert.equal(start.selectedEvent.term,expectedTerm);
    assert.equal(start.nominalIntervalMinutes,interval);
    assert.equal(start.calendarProjection.exactStartDate,null);
    const sequence = luckPillarSequence({monthPillar:{stem:'辛',branch:'巳'},direction,count:2,policyId});
    const calendarPolicy = CALENDAR_PROJECTION_POLICY_V02;
    const projection = projectNominalLuckCalendar({candidateRef:'chart.candidates[0]',birthMinute,start,sequence,policyId:calendarPolicy});
    assert.equal(projection.firstStartMinute,first);
    assert.equal(projection.precision.actualInstantCertified,false);
    const select = asOfMinute => selectNominalDaYunAt({projection,asOfMinute,policyId:calendarPolicy});
    assert.equal(select(before).status,'BEFORE_FIRST_DA_YUN');
    const {ordinal, pillar} = select(first).selection;
    assert.equal(ordinal,1);
    assert.equal(pillar.stem + pillar.branch,firstPillar);
  }
});
