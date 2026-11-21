/** Small literal projections for consumer composition tests, not issued API records.
 * They exercise report contracts only. No calendar/day/ten-god helper generates expected values.
 */
export const CONSUMER_UNIT_POLICY_IDS = Object.freeze({
  calculation: 'UNIT-CALCULATION-V01', classification: 'UNIT-CLASSIFICATION-V01',
  pattern: 'M4-INNER-EIGHT-MONTH-STRUCTURE-V01',
  seasonal: 'M3-SEASONAL-SILI-PRE18-NOMINAL-MINUTES-V02',
  root: 'M3-ROOT-PRESENCE-HIDDEN-SAME-ELEMENT-V01',
  m5: 'M5-WINTER-WOOD-WARMING-CANDIDATE-V01',
  strength: 'UNIT-LIMITED-STRENGTH-V01', time: 'UNIT-TIME-AXIS-V01',
});
const P = CONSUMER_UNIT_POLICY_IDS;
const versions = {[P.calculation]: '1.0.0', [P.classification]: null, [P.pattern]: '0.1.0', [P.seasonal]: '0.2.0', [P.root]: '0.1.0', [P.m5]: '0.1.0', [P.strength]: '1.0.0', [P.time]: '1.0.0'};
const source = 'UNIT-SOURCE-SELECTED-PROJECTION';
const rule = 'UNIT-RULE-EVIDENCE-LINK';
const roles = ['year', 'month', 'day', 'hour'];
const charts = {
  winter: [['壬', '申', '임신'], ['辛', '亥', '신해'], ['甲', '辰', '갑진'], ['甲', '子', '갑자']],
  winterNoon: [['壬', '申', '임신'], ['辛', '亥', '신해'], ['甲', '辰', '갑진'], ['庚', '午', '경오']],
  earthBoundary: [['丙', '午', '병오'], ['壬', '辰', '임진'], ['辛', '酉', '신유'], ['戊', '戌', '무술']],
  lichunBefore: [['乙', '巳', '을사'], ['己', '丑', '기축'], ['己', '酉', '기유'], ['丁', '卯', '정묘']],
  lichunAfter: [['丙', '午', '병오'], ['庚', '寅', '경인'], ['己', '酉', '기유'], ['丁', '卯', '정묘']],
};
const member = (stem, position, tenGod, index) => ({stem, position, tenGod, index});
const winterMembers = [
  [member('庚', 'MAIN_QI', '七殺', 0), member('壬', 'OTHER', '偏印', 1), member('戊', 'OTHER', '偏財', 2)],
  [member('壬', 'MAIN_QI', '偏印', 0), member('甲', 'OTHER', '比肩', 1)],
  [member('戊', 'MAIN_QI', '偏財', 0), member('乙', 'OTHER', '劫財', 1), member('癸', 'OTHER', '正印', 2)],
  [member('癸', 'MAIN_QI', '正印', 0)],
];
const nature = [
  {stem: {element: 'WATER', polarity: 'YANG'}, branch: {principalElement: 'METAL', polarity: 'YANG'}},
  {stem: {element: 'METAL', polarity: 'YIN'}, branch: {principalElement: 'WATER', polarity: 'YIN'}},
  {stem: {element: 'WOOD', polarity: 'YANG'}, branch: {principalElement: 'EARTH', polarity: 'YANG'}},
  {stem: {element: 'WOOD', polarity: 'YANG'}, branch: {principalElement: 'WATER', polarity: 'YANG'}},
];
const otherDetails = {
  earthBoundary: {
    visible: ['正官', '傷官', null, '正印'],
    members: [[['丁', 'MAIN_QI', '七殺'], ['己', 'OTHER', '偏印']], [['戊', 'MAIN_QI', '正印'], ['乙', 'OTHER', '偏財'], ['癸', 'OTHER', '食神']], [['辛', 'MAIN_QI', '比肩']], [['戊', 'MAIN_QI', '正印'], ['辛', 'OTHER', '比肩'], ['丁', 'OTHER', '七殺']]],
    stemNature: [['FIRE', 'YANG'], ['WATER', 'YANG'], ['METAL', 'YIN'], ['EARTH', 'YANG']], branchNature: [['FIRE', 'YANG'], ['EARTH', 'YANG'], ['METAL', 'YIN'], ['EARTH', 'YANG']],
  },
  lichunBefore: {
    visible: ['七殺', '比肩', null, '偏印'],
    members: [[['丙', 'MAIN_QI', '正印'], ['戊', 'OTHER', '劫財'], ['庚', 'OTHER', '傷官']], [['己', 'MAIN_QI', '比肩'], ['癸', 'OTHER', '偏財'], ['辛', 'OTHER', '食神']], [['辛', 'MAIN_QI', '食神']], [['乙', 'MAIN_QI', '七殺']]],
    stemNature: [['WOOD', 'YIN'], ['EARTH', 'YIN'], ['EARTH', 'YIN'], ['FIRE', 'YIN']], branchNature: [['FIRE', 'YIN'], ['EARTH', 'YIN'], ['METAL', 'YIN'], ['WOOD', 'YIN']],
  },
  lichunAfter: {
    visible: ['正印', '傷官', null, '偏印'],
    members: [[['丁', 'MAIN_QI', '偏印'], ['己', 'OTHER', '比肩']], [['甲', 'MAIN_QI', '正官'], ['丙', 'OTHER', '正印'], ['戊', 'OTHER', '劫財']], [['辛', 'MAIN_QI', '食神']], [['乙', 'MAIN_QI', '七殺']]],
    stemNature: [['FIRE', 'YANG'], ['METAL', 'YANG'], ['EARTH', 'YIN'], ['FIRE', 'YIN']], branchNature: [['FIRE', 'YANG'], ['WOOD', 'YANG'], ['METAL', 'YIN'], ['WOOD', 'YIN']],
  },
};

export function makeConsumerProjection({variant = 'winter-candidate', contextId = '1'.repeat(64)} = {}) {
  const held = ['unknown-time', 'dst-gap', 'dst-fold', 'needs-data', 'policy-unresolved', 'unsupported'].includes(variant);
  const status = {'unknown-time': 'NEEDS_BIRTH_TIME', 'dst-gap': 'NONEXISTENT_TIME', 'dst-fold': 'AMBIGUOUS_TIME', 'needs-data': 'NEEDS_DATA', 'policy-unresolved': 'POLICY_UNRESOLVED', unsupported: 'OUT_OF_PROFILE_COVERAGE'}[variant] ?? 'CALCULATED_UNDER_SELECTED_POLICIES';
  const policyRows = Object.values(P).map(id => ({id, version: versions[id]}));
  const projection = {
    schemaVersion: 'saju-consumer-report-input-v1', contextId, calculationStatus: status,
    inputContext: {calendar: 'GREGORIAN', gregorianDate: '1992-11-24', date: '1992-11-24', time: held ? null : variant === 'winter-fire-hold' ? '12:00' : '00:30', jurisdiction: 'KR', timeZone: 'Asia/Seoul', dayRollover: 'CIVIL_MIDNIGHT', hourStemReference: 'SELECTED_DAY_PILLAR', clockPolicyId: 'UNIT-CLOCK-V01'},
    provenance: {upstreamSchema: 'UNIT-SYNTHETIC-PROJECTION-NOT-AUTHENTICATED', upstreamProfileId: 'UNIT-SERVER-PROJECTION', upstreamProfileVersion: '1.0.0', dataVersion: 'UNIT-NO-CALENDAR-DATA', dataFingerprint: 'f'.repeat(64), sourceDigest: 'a'.repeat(64), validationScope: 'SYNTHETIC_PURE_COMPOSITION_NOT_API_AUTHENTICATION', sourceRefs: [{id: source, kind: 'SYNTHETIC_UNIT_REFERENCE', title: 'Literal report projection', url: null, verification: 'NOT_AN_API_OR_CLASSICAL_CERTIFICATE'}], policies: policyRows, rules: [{id: rule, version: null}]},
    candidates: [], evidence: [], temporalRef: contextId + '#temporal', blockers: [],
  };
  function evidence(id, candidateId, layer, state, policyId, value) {
    const row = {id, candidateId, layer, status: state, upstreamPath: 'fixture.' + id, upstreamFactRefs: ['fixture-fact:' + id], policyId, policyVersion: versions[policyId], sourceRefs: [source], ruleRefs: [rule], value};
    projection.evidence.push(row);return row;
  }
  evidence(projection.temporalRef, null, 'POLICY_ASSESSMENT', 'HOLD', P.time, {monthlyStatus: 'NOT_REQUESTED', year: null, completeIntervals: 0, missingIntervals: 0, queryPillars: [], queryStatus: 'NOT_REQUESTED', rows: []});
  if (held) {
    const state = variant === 'needs-data' ? 'NEEDS_DATA' : variant === 'policy-unresolved' ? 'POLICY_UNRESOLVED' : variant === 'unsupported' ? 'UNSUPPORTED' : 'HOLD';
    projection.blockers.push({code: status, status: state, requiredInformation: ['unknown-time', 'dst-gap', 'dst-fold'].includes(variant) ? '기록된 출생 시각 또는 시간대 근거' : null});
    return projection;
  }
  const kinds = variant === 'two-natal-parents' ? ['lichunBefore', 'lichunAfter'] : variant === 'seasonal-alternatives' ? ['earthBoundary'] : [variant === 'winter-fire-hold' ? 'winterNoon' : 'winter'];
  if (variant === 'two-natal-parents') Object.assign(projection.inputContext, {gregorianDate: '2026-02-04', date: '2026-02-04', time: '05:02'});
  if (variant === 'seasonal-alternatives') Object.assign(projection.inputContext, {gregorianDate: '2026-04-17', date: '2026-04-17', time: '20:49'});
  for (const [i, kind] of kinds.entries()) {
    const id = `chart.candidates[${i}]`, refs = Object.fromEntries(['chart', 'day', 'pillars', 'pattern', 'seasonal', 'root', 'm5', 'relations', 'strength', 'gongmang', 'luck'].map(key => [key, `${contextId}#parent-${i}-${key}`]));
    const c = {id, ordinal: i + 1, refs};projection.candidates.push(c);
    const pillars = charts[kind].map(([stem, branch, hangul], j) => ({role: roles[j], stem, branch, hangul}));
    const winter = kind === 'winter' || kind === 'winterNoon';
    const day = winter ? {stem: '甲', element: 'WOOD', polarity: 'YANG'} : kind === 'earthBoundary' ? {stem: '辛', element: 'METAL', polarity: 'YIN'} : {stem: '己', element: 'EARTH', polarity: 'YIN'};
    evidence(refs.chart, id, 'CALCULATION_FACT', 'SUPPORTED', P.calculation, {pillars, boundarySide: kind === 'lichunBefore' ? 'BEFORE' : kind === 'lichunAfter' ? 'AFTER' : 'NOT_AT_MONTH_BOUNDARY', activeSince: {koreanName: winter ? '입동' : kind === 'earthBoundary' ? '청명' : i ? '입춘' : '소한', displayedDateTime: winter ? '1992-11-07T12:00' : kind === 'earthBoundary' ? '2026-04-05T03:40' : i ? '2026-02-04T05:02' : '2026-01-05T17:23'}});
    evidence(refs.day, id, 'TRADITIONAL_CLASSIFICATION', 'SUPPORTED', P.classification, day);
    const fullPillars = pillars.map((p, j) => ({...p, factRef: id + '.' + roles[j], visibleTenGod: winter ? ['偏印', '正官', null, kind === 'winterNoon' ? '七殺' : '比肩'][j] : otherDetails[kind].visible[j], nature: winter ? structuredClone(nature[j]) : {stem: {element: otherDetails[kind].stemNature[j][0], polarity: otherDetails[kind].stemNature[j][1]}, branch: {principalElement: otherDetails[kind].branchNature[j][0], polarity: otherDetails[kind].branchNature[j][1]}}, branchTenGods: {members: winter ? structuredClone(winterMembers[j]) : otherDetails[kind].members[j].map(([stem, position, tenGod], k) => member(stem, position, tenGod, k))}}));
    if (kind === 'winterNoon') {fullPillars[3].nature = {stem: {element: 'METAL', polarity: 'YANG'}, branch: {principalElement: 'FIRE', polarity: 'YANG'}};fullPillars[3].branchTenGods.members = [member('丁', 'MAIN_QI', '傷官', 0), member('己', 'OTHER', '正財', 1)];}
    evidence(refs.pillars, id, 'TRADITIONAL_CLASSIFICATION', 'SUPPORTED', P.classification, {items: fullPillars});
    const primaryPattern = winter ? '偏印' : kind === 'earthBoundary' ? '正印' : kind === 'lichunBefore' ? null : '正官';
    evidence(refs.pattern, id, 'POLICY_ASSESSMENT', 'LIMITED', P.pattern, {status: primaryPattern === null ? 'PEER_MAIN_OUT_OF_SCOPE' : kind === 'winter' || kind === 'lichunAfter' ? 'MAIN_QI_WITH_COMPETING_EXPOSURES' : 'MAIN_QI_ONLY', primaryPattern, candidateTypes: primaryPattern === null ? [] : kind === 'lichunAfter' ? ['正官', '正印'] : [primaryPattern], unresolvedTypes: [], main: {stem: winter ? '壬' : kind === 'earthBoundary' ? '戊' : kind === 'lichunBefore' ? '己' : '甲', tenGod: primaryPattern ?? '比肩'}, exposures: kind === 'winter' ? [{stem: '甲', role: 'hour', type: '比肩'}] : kind === 'lichunAfter' ? [{stem: '丙', role: 'year', type: '正印'}] : []});
    const seasonal = kind === 'earthBoundary' ? [{id: 'before-B', season: 'SPRING', seasonalState: 'QIU'}, {id: 'after-B', season: 'EARTH_DOMINANT', seasonalState: 'XIANG'}] : [{id: 'single-season', season: winter ? 'WINTER' : kind === 'lichunBefore' ? 'EARTH_DOMINANT' : 'SPRING', seasonalState: winter ? 'XIANG' : kind === 'lichunBefore' ? 'WANG' : 'SI'}];
    evidence(refs.seasonal, id, 'POLICY_ASSESSMENT', 'LIMITED', P.seasonal, {status: seasonal.length === 2 ? 'AMBIGUOUS' : 'RESOLVED_UNDER_POLICY', alternatives: seasonal, reason: seasonal.length === 2 ? 'DERIVED_BOUNDARY_SAME_DISPLAYED_MINUTE' : null});
    evidence(refs.root, id, 'POLICY_ASSESSMENT', 'LIMITED', P.root, {presence: 'PRESENT_UNDER_POLICY', locations: winter ? [{role: 'month', branch: '亥', hiddenStem: '甲', matchType: 'EXACT_STEM'}, {role: 'day', branch: '辰', hiddenStem: '乙', matchType: 'SAME_ELEMENT_DIFFERENT_STEM'}] : kind === 'earthBoundary' ? [{role: 'day', branch: '酉', hiddenStem: '辛', matchType: 'EXACT_STEM'}] : kind === 'lichunBefore' ? [{role: 'month', branch: '丑', hiddenStem: '己', matchType: 'EXACT_STEM'}] : [{role: 'year', branch: '午', hiddenStem: '己', matchType: 'EXACT_STEM'}], surfaceSupport: winter ? [{role: 'year', stem: '壬', tenGod: '偏印', presence: 'PRESENT_UNDER_POLICY'}, ...(kind === 'winter' ? [{role: 'hour', stem: '甲', tenGod: '比肩', presence: 'PRESENT_UNDER_POLICY'}] : [])] : []});
    const m5Candidate = kind === 'winter';
    evidence(refs.m5, id, 'POLICY_ASSESSMENT', m5Candidate ? 'LIMITED' : 'HOLD', P.m5, {status: m5Candidate ? 'CANDIDATE_UNDER_POLICY' : 'HOLD', reasonCodes: [m5Candidate ? 'WINTER_WOOD_WITHOUT_OBSERVED_FIRE_REVIEW_CANDIDATE' : kind === 'winterNoon' ? 'PRESENT_WARMING_ELEMENT_EFFECT_UNASSESSED' : 'OUTSIDE_WINTER_WOOD_SCOPE'], candidateElements: m5Candidate ? ['FIRE'] : [], fireLocations: kind === 'winterNoon' ? [{role: 'hour', stem: '丁', locationKind: 'HIDDEN_STEM'}] : [], execution: 'EXECUTED_EXISTING_LIMITED_POLICY'});
    evidence(refs.relations, id, 'TRADITIONAL_CLASSIFICATION', 'LIMITED', P.classification, {pairs: [], triads: []});
    evidence(refs.strength, id, 'POLICY_ASSESSMENT', 'HOLD', P.strength, {pathStatuses: ['DEFERRED_EFFECT_POLICY_REQUIRED'], resolvedWeakPaths: 0});
    evidence(refs.gongmang, id, 'TRADITIONAL_CLASSIFICATION', 'SUPPORTED', P.classification, {voidBranches: kind === 'earthBoundary' ? ['子', '丑'] : ['寅', '卯'], matches: kind === 'lichunBefore' ? [{role: 'hour', branch: '卯'}] : kind === 'lichunAfter' ? [{role: 'month', branch: '寅'}, {role: 'hour', branch: '卯'}] : []});
    evidence(refs.luck, id, 'POLICY_ASSESSMENT', 'HOLD', P.time, {status: 'NOT_REQUESTED', requested: false, firstNominalStart: null, selectedPillar: null, firstPillars: [], seyun: [], reasons: ['EXPLICIT_INPUT_NOT_SELECTED']});
  }
  return projection;
}

export const CONSUMER_UNIT_EXPECTATIONS = Object.freeze({
  winterCandidate: Object.freeze({day: '甲', season: 'WINTER', warmingElements: ['FIRE'], m5Reason: 'WINTER_WOOD_WITHOUT_OBSERVED_FIRE_REVIEW_CANDIDATE', fullPaidReport: false}),
  presentFireHold: Object.freeze({sameDay: '甲', warmingElements: [], observedFireRole: 'hour', m5Reason: 'PRESENT_WARMING_ELEMENT_EFFECT_UNASSESSED', fullPaidReport: false}),
  parentBoundary: Object.freeze({natalParents: 2, seasonalAlternatives: [1, 1], patterns: [null, '正官']}),
  seasonalBoundary: Object.freeze({natalParents: 1, seasonalAlternatives: [2], states: ['QIU', 'XIANG']}),
});
