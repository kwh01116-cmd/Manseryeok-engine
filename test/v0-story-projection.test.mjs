import test from 'node:test';
import assert from 'node:assert/strict';
import { projectKoreanV0Story } from '../dist/story/v0StoryProjection.js';

const label = (stem, branch, hangul) => ({ stem, branch, hanja: stem + branch, hangul });
const a = { year: label('丁', '未', '정미'), month: label('壬', '寅', '임인'), day: label('乙', '卯', '을묘'), hour: label('壬', '午', '임오') };
const b = { year: label('甲', '午', '갑오'), month: label('甲', '寅', '갑인'), day: label('乙', '卯', '을묘'), hour: label('壬', '午', '임오') };
const base = { status: 'OK', preview: { schemaVersion: 'v0-korean-birth-chart-preview-v1', locale: 'ko-KR', confidence: 'DEFINITE', confidenceScope: 'PUBLISHED_MINUTE_COMPARISON_ONLY', coverage: { validation: 'STRUCTURAL_COVERAGE_ONLY', supportedFromInclusive: '2026-01-01T00:00', supportedUntilExclusive: '2028-01-01T00:00' }, policies: { timeBasis: 'KOREAN_CIVIL_TIME', dayRollover: 'CIVIL_MIDNIGHT', hourStemReference: 'SELECTED_DAY_PILLAR' }, candidates: [a] } };

test('success projects only calculated M1 facts into 3 traceable beats', () => {
  const view = projectKoreanV0Story(base);
  assert.equal(view.status, 'READY');
  assert.equal(view.candidateDisplay, 'ONE');
  assert.deepEqual(view.candidates[0].beats.map(beat => beat.type), ['FOUR_PILLARS', 'DAY_STEM_CLASSIFICATION', 'MONTH_BRANCH_CLASSIFICATION']);
  assert.deepEqual(view.candidates[0].beats[1], { type: 'DAY_STEM_CLASSIFICATION', factRef: 'preview.candidates[0].day.stem', stem: '乙', element: 'WOOD', polarity: 'YIN' });
  assert.deepEqual(view.candidates[0].beats[2], { type: 'MONTH_BRANCH_CLASSIFICATION', factRef: 'preview.candidates[0].month.branch', branch: '寅', principalElement: 'WOOD' });
  assert.equal(view.coverage.validation, 'STRUCTURAL_COVERAGE_ONLY');
  assert.equal(view.policies.dayRollover, 'CIVIL_MIDNIGHT');
  assert.equal(JSON.stringify(view).includes('strength'), false);
  assert.equal(JSON.stringify(view).includes('KR-KASA-CERTIFIED'), false);
});

test('published-minute ambiguity preserves both correlated candidates, not a cross product', () => {
  const view = projectKoreanV0Story({ ...base, preview: { ...base.preview, confidence: 'PUBLISHED_MINUTE_AMBIGUOUS', candidates: [b, a] } });
  assert.equal(view.candidateDisplay, 'SHOW_ALL_BOUNDARY_CANDIDATES');
  assert.equal(view.candidates.length, 2);
  assert.deepEqual(view.candidates.map(c => c.beats[0].pillars.map(p => p.label.hanja)), [['甲午', '甲寅', '乙卯', '壬午'], ['丁未', '壬寅', '乙卯', '壬午']]);
  assert.equal(view.candidates[1].beats[1].factRef, 'preview.candidates[1].day.stem');
});

test('coverage/lunar failures are blocked rather than given synthetic story', () => {
  for (const status of ['OUT_OF_COVERAGE', 'INVALID_LUNAR_DATE']) {
    assert.deepEqual(projectKoreanV0Story({status}), { schemaVersion: 'u0-story-projection-v1', status: 'BLOCKED', reason: status, candidates: [] });
  }
});

test('inconsistent candidate count and provenance fail closed', () => {
  assert.throws(() => projectKoreanV0Story({ ...base, preview: { ...base.preview, confidence: 'PUBLISHED_MINUTE_AMBIGUOUS' } }), RangeError);
  assert.throws(() => projectKoreanV0Story({ ...base, preview: { ...base.preview, candidates: [a, b] } }), RangeError);
  assert.throws(() => projectKoreanV0Story({ ...base, preview: { ...base.preview, coverage: { ...base.preview.coverage, validation: 'CERTIFIED' } } }), RangeError);
  assert.throws(() => projectKoreanV0Story({ ...base, preview: { ...base.preview, policies: { ...base.preview.policies, timeBasis: 'AUTO' } } }), RangeError);
  assert.throws(() => projectKoreanV0Story({ ...base, preview: { ...base.preview, policies: { ...base.preview.policies, dayRollover: 'AUTO' } } }), RangeError);
  assert.throws(() => projectKoreanV0Story({ ...base, preview: { ...base.preview, policies: { ...base.preview.policies, hourStemReference: 'AUTO' } } }), RangeError);
  assert.throws(() => projectKoreanV0Story({ ...base, preview: { ...base.preview, confidence: 'UNVERIFIED' } }), RangeError);
});

test('equivalent computed candidates yield identical presentation, no input calendar leakage', () => {
  const gregorian = projectKoreanV0Story(base);
  const lunar = projectKoreanV0Story({ ...base, preview: { ...base.preview, input: { calendar: 'KOREAN_LUNAR' }, lunarConversionSource: { sourceId: 'KR-KASI-CALENDAR-DATA' } } });
  assert.deepEqual(gregorian, lunar);
});
