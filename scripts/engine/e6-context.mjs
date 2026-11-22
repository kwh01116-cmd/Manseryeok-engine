import { isGregorianMinute } from '../../dist/calendar/solarTermTimeline.js';
import { MONTH_BOUNDARY_JIE } from '../../dist/calendar/monthPillar.js';
import { M7_LUCK_POLICY_V01, M7_LUCK_VERSION, MAX_LUCK_COUNT, compileLuckTimeline, annualLuckAtMinute } from '../../dist/luck/luckV01.js';
import { CALENDAR_PROJECTION_POLICY_V02, CALENDAR_PROJECTION_VERSION, NOMINAL_AS_OF_RANGE, selectNominalDaYunAt } from '../../dist/luck/calendarProjectionV02.js';
import { MONTHLY_LUCK_POLICY_ID, MONTHLY_LUCK_VERSION, compileMonthlyTimeline, monthlyLuckAtMinute } from '../../dist/luck/monthlyLuckV1.js';
import { MONTHLY_LUCK_V2_POLICY_ID, MONTHLY_LUCK_V2_VERSION, compileMonthlyTimelineV2, monthlyLuckAtMinuteV2 } from '../../dist/luck/monthlyLuckV2.js';
import { createLocalChartProfile, getLocalChartEventContext, MODERN_PROFILE_ID, MODERN_CLOCK_POLICY_ID,
  EXTENDED_SOLAR_PROFILE_ID, EXTENDED_MODERN_CLOCK_POLICY_ID } from '../kasi/local-chart.mjs';
import { createLocalLuckProfile } from '../kasi/local-luck.mjs';
import { projectLocalLuckResult } from '../kasi/local-luck-projection.mjs';
import { validateApiOnlyServerResult } from '../server/engine.mjs';
import { verifyServerApiOnlyLoaded } from '../server-data/binding.mjs';

const FROM = '1989-01-01T00:00';
const MAX_RANGE_DAYS = 366;
const DAY_MINUTES = 1440;
const MINUTE_MS = 60_000;
export const E6_TIMELINE_LIMITS = Object.freeze({
  maxRangeDays: MAX_RANGE_DAYS, maxSegments: 64, maxTimeContextsPerNatal: 128,
});
export const E6_QUERY_CLOCKS = Object.freeze({
  [MODERN_CLOCK_POLICY_ID]: Object.freeze({
    profileId: MODERN_PROFILE_ID, fromInclusive: FROM, untilExclusive: '2027-01-01T00:00', extension: false, version: '1',
  }),
  [EXTENDED_MODERN_CLOCK_POLICY_ID]: Object.freeze({
    profileId: EXTENDED_SOLAR_PROFILE_ID, fromInclusive: FROM, untilExclusive: '2028-01-01T00:00', extension: true, version: '2',
  }),
});
export const E6_LAYERS = Object.freeze(['DAEUN', 'SEYUN', 'MONTHLY']);
const DAYUN_POLICY = Object.freeze({ policyId: CALENDAR_PROJECTION_POLICY_V02, policyVersion: CALENDAR_PROJECTION_VERSION });
const SEYUN_POLICY = Object.freeze({ policyId: M7_LUCK_POLICY_V01, policyVersion: M7_LUCK_VERSION });
const MONTHLY_V1_POLICY = Object.freeze({ policyId: MONTHLY_LUCK_POLICY_ID, policyVersion: MONTHLY_LUCK_VERSION });
const MONTHLY_V2_POLICY = Object.freeze({ policyId: MONTHLY_LUCK_V2_POLICY_ID, policyVersion: MONTHLY_LUCK_V2_VERSION });
const EMPTY_STATES = new Set(['BEFORE_BIRTH', 'BEFORE_FIRST_DA_YUN']);
const issued = new WeakMap();
const unique = list => [...new Set(list)];
function check(value, code) { if (!value) throw new RangeError(code); }

function hasAllowedFields(value, fields) {
  return value && [Object.prototype, null].includes(Object.getPrototypeOf(value)) &&
    Reflect.ownKeys(value).every(key => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      return fields.includes(key) && descriptor?.enumerable && 'value' in descriptor;
    });
}
function exactFields(value, fields) {
  return hasAllowedFields(value, fields) && fields.every(key => Object.hasOwn(value, key));
}
function wallScalar(minute) { return Date.parse(minute + ':00Z'); }
function nextMinute(minute) { return new Date(wallScalar(minute) + MINUTE_MS).toISOString().slice(0, 16); }
function checkedMinute(minute) { return typeof minute === 'string' && isGregorianMinute(minute); }

export function validateE6Query(query, clockPolicyId, dayun) {
  check(typeof clockPolicyId === 'string' && Object.hasOwn(E6_QUERY_CLOCKS, clockPolicyId), 'E6_EXPLICIT_QUERY_CLOCK_POLICY_REQUIRED');
  check(hasAllowedFields(query, ['kind', 'asOf', 'from', 'to']), 'E6_QUERY_FIELDS');
  check(['AS_OF', 'COMPARE', 'RANGE'].includes(query.kind), 'E6_QUERY_KIND');
  if (query.kind === 'AS_OF') {
    check(exactFields(query, ['kind', 'asOf']) && checkedMinute(query.asOf), 'E6_EXPLICIT_AS_OF_MINUTE_REQUIRED');
  } else {
    check(exactFields(query, ['kind', 'from', 'to']) && checkedMinute(query.from) && checkedMinute(query.to), 'E6_EXPLICIT_FROM_TO_MINUTES_REQUIRED');
    if (query.kind === 'RANGE') check(query.from < query.to, 'E6_HALF_OPEN_RANGE_ORDER');
  }
  if (dayun !== undefined) {
    check(hasAllowedFields(dayun, ['traditionalSex', 'count']), 'E6_DAYUN_FIELDS');
    check(!Object.hasOwn(dayun, 'traditionalSex') || ['MALE', 'FEMALE'].includes(dayun.traditionalSex), 'E6_EXPLICIT_TRADITIONAL_SEX');
    check(!Object.hasOwn(dayun, 'count') ||
      (Number.isInteger(dayun.count) && dayun.count >= 1 && dayun.count <= MAX_LUCK_COUNT), 'E6_EXPLICIT_DAYUN_COUNT');
  }
  return true;
}

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

export function validateIssuedE6TimeContext(value, expected) {
  const entry = issued.get(value);
  check(entry && Object.isFrozen(value) && expected?.existing === entry.existing &&
    expected.natalCandidateRef === value.natalCandidateRef &&
    (expected.asOf === undefined || expected.asOf === value.asOf) &&
    (expected.timeContextRef === undefined || expected.timeContextRef === value.timeContextRef) &&
    (expected.clockPolicyId === undefined || expected.clockPolicyId === value.clockPolicyId), 'E6_ISSUED_CONTEXT_MISMATCH');
  return true;
}

function boundary(event) {
  return event ? { term: event.term, displayedMinute: event.displayedDateTime, precision: event.sourcePrecision,
    timeBasis: event.timeBasis, sourceRefs: [...event.sourceIds] } : null;
}

function layerState(layer, policy, status, extra = {}) {
  return { layer, ...policy, status, period: null, factRefs: [], sourceRefs: [], missingData: [], limitationCodes: [], ...extra };
}

function periodLayer(layer, policy, clock, stemBranch, fromInclusive, toExclusive, details = {}) {
  const { opensAt, closesAt, yearLabel, ordinal, missingData = [], ...rest } = details;
  const sourceRefs = unique([...(opensAt?.sourceRefs ?? []), ...(closesAt?.sourceRefs ?? [])]);
  const periodRef = [layer, policy.policyId, clock, fromInclusive ?? 'UNKNOWN_START', toExclusive ?? 'UNKNOWN_END',
    yearLabel ?? ordinal ?? '', stemBranch.stem + stemBranch.branch].join(':');
  const status = fromInclusive && toExclusive ? 'RESOLVED_UNDER_POLICY' : 'NEEDS_DATA';
  const period = {
    periodRef, fromInclusive, toExclusive, stem: stemBranch.stem, branch: stemBranch.branch,
    nominalConvention: '[START_INCLUSIVE,END_EXCLUSIVE)_PUBLISHED_MINUTE_POLICY',
    ...(yearLabel === undefined ? {} : { yearLabel }),
    ...(ordinal === undefined ? {} : { ordinal }),
    boundaries: { opensAt: opensAt ?? null, closesAt: closesAt ?? null },
  };
  return layerState(layer, policy, status, {
    period, sourceRefs, missingData, ...rest, limitationCodes: [
      ...(!fromInclusive || !toExclusive ? ['INCOMPLETE_PERIOD_BOUNDARIES_KNOWN_PILLAR_RETAINED'] : []),
      ...(rest.limitationCodes ?? []),
    ],
  });
}

const assumption = (event, side) => ({
  boundaryRef: event.term + ':' + event.displayedMinute,
  term: event.term, displayedMinute: event.displayedMinute, side, sourceRefs: event.sourceRefs,
});

function clockAvailability(calendar, minute) {
  if (minute >= calendar.clock.fromInclusive && minute < calendar.clock.untilExclusive) return null;
  if (calendar.clock.extension && minute.slice(0, 4) === '2028') {
    return { status: 'NEEDS_DATA', limitationCodes: ['QUERY_CLOCK_SCOPE_EXCEEDED', 'NO_APPROVED_2028_SOLAR_GUARD_EVENTS'] };
  }
  return { status: 'POLICY_UNRESOLVED', limitationCodes: ['OUTSIDE_EXPLICIT_QUERY_CLOCK_SCOPE'] };
}

function annualChoices(calendar, minute) {
  const blocked = clockAvailability(calendar, minute);
  if (blocked) return [layerState('SEYUN', SEYUN_POLICY, blocked.status, blocked)];
  const result = annualLuckAtMinute({ timeline: calendar.annualTimeline, queryMinute: minute, policyId: M7_LUCK_POLICY_V01 });
  if (!result.entries.length) {
    return [layerState('SEYUN', SEYUN_POLICY, result.status, { missingData: result.missingData })];
  }
  return result.entries.map(({ yearLabel, pillar, condition }) => {
    const opensAt = boundary(calendar.lichun.get(yearLabel));
    const closesAt = boundary(calendar.lichun.get(yearLabel + 1));
    const missingData = [
      ...(!opensAt ? [{ year: yearLabel, term: 'LICHUN', reason: 'ANNUAL_PERIOD_START_MISSING' }] : []),
      ...(!closesAt ? [{ year: yearLabel + 1, term: 'LICHUN', reason: 'ANNUAL_PERIOD_END_MISSING' }] : []),
    ];
    return periodLayer('SEYUN', SEYUN_POLICY, calendar.clockPolicyId, pillar,
      opensAt?.displayedMinute ?? null, closesAt?.displayedMinute ?? null, {
        yearLabel, opensAt, closesAt, missingData, factRefs: [...result.ruleRefs],
        condition: condition === 'DEFINITE' ? null : assumption(boundary(result.lichun), condition),
      });
  });
}

function monthlyChoices(calendar, minute) {
  const policy = calendar.monthlyPolicy;
  const blocked = clockAvailability(calendar, minute);
  if (blocked) return [layerState('MONTHLY', policy, blocked.status, blocked)];
  const result = calendar.monthlyAt({ timeline: calendar.monthlyTimeline, queryMinute: minute, policyId: policy.policyId });
  if (!result.entries.length) {
    return [layerState('MONTHLY', policy, result.status, { missingData: result.missingData, limitationCodes: [result.reason].filter(Boolean) })];
  }
  return result.entries.map(entry => {
    const opensAt = boundary(entry.activeSince), closesAt = boundary(entry.untilEvent);
    const { startInclusive, endExclusive } = entry.nominalInterval;
    const event = entry.boundarySide === 'BEFORE_PUBLISHED_MINUTE' ? closesAt : opensAt;
    check(entry.boundarySide === 'DEFINITE' || event?.displayedMinute === minute, 'E6_QUERY_MONTH_BOUNDARY_EVIDENCE_REQUIRED');
    return periodLayer('MONTHLY', policy, calendar.clockPolicyId, entry.monthPillar, startInclusive, endExclusive, {
      yearLabel: entry.yearLabel, opensAt, closesAt, missingData: entry.missingData,
      factRefs: [...entry.ruleRefs], calendarYearPillar: entry.yearPillar,
      condition: entry.boundarySide === 'DEFINITE' ? null : assumption(event, entry.boundarySide),
    });
  });
}

function compatible(annual, monthly) {
  if (annual.condition?.boundaryRef === monthly.condition?.boundaryRef && annual.condition?.side !== monthly.condition?.side) return false;
  const year = monthly.calendarYearPillar, period = annual.period;
  return !period || !year ||
    (period.yearLabel === monthly.period?.yearLabel && period.stem === year.stem && period.branch === year.branch);
}

function solarChoices(calendar, minute) {
  return correlateSolarPeriods(annualChoices(calendar, minute), monthlyChoices(calendar, minute));
}

/** Pure pairing of normalized M7 choices. This helper does not issue a time context. */
export function correlateSolarPeriods(annual, monthly) {
  const alternatives = annual.flatMap(seyun => monthly.filter(month => compatible(seyun, month)).map(month => [seyun, month]));
  check(alternatives.length > 0 && alternatives.length <= 2, 'E6_INCOHERENT_SOLAR_CHOICE_CONTEXT');
  return alternatives;
}

function projectedDayun(existing, modern, dayun) {
  if (existing.request.calendarProfileId !== MODERN_PROFILE_ID) {
    return { status: 'POLICY_UNRESOLVED', limitationCodes: ['M7_NATAL_BIRTH_CLOCK_POLICY_NOT_ADOPTED'] };
  }
  if (!dayun?.traditionalSex || !dayun.count) {
    return { status: 'NEEDS_INPUT', limitationCodes: ['EXPLICIT_TRADITIONAL_SEX_AND_DAYUN_COUNT_REQUIRED'] };
  }
  const alreadyIssued = { calculate: () => existing.calculation };
  const old = createLocalLuckProfile(alreadyIssued, { contextProfile: modern.profile, luckPolicyId: M7_LUCK_POLICY_V01 });
  const { calendar, date, lunarDate, time, policies } = existing.request;
  const birthRequest = { calendar, ...(calendar === 'GREGORIAN' ? { date } : { lunarDate }), time, policies };
  const luck = old.calculate(birthRequest, { dayun });
  const projected = projectLocalLuckResult(luck, { calendarProjectionPolicyId: CALENDAR_PROJECTION_POLICY_V02 });
  return { status: 'PROJECTED', projections: projected.projection.candidates };
}

function dayunLayer(issuedProjection, candidateIndex, asOf, calendar, birthMinute) {
  if (asOf < birthMinute) return layerState('DAEUN', DAYUN_POLICY, 'BEFORE_BIRTH');
  if (issuedProjection.status !== 'PROJECTED') {
    return layerState('DAEUN', DAYUN_POLICY, issuedProjection.status, { limitationCodes: issuedProjection.limitationCodes });
  }
  const { calendar: projection, facts } = issuedProjection.projections[candidateIndex];
  const result = selectNominalDaYunAt({ projection, asOfMinute: asOf, policyId: CALENDAR_PROJECTION_POLICY_V02 });
  const factRefs = facts.map(fact => fact.id);
  const kisanEvent = boundary(projection.selectedEvent);
  if (!result.selection) return layerState('DAEUN', DAYUN_POLICY, result.status, {
    factRefs, sourceRefs: kisanEvent?.sourceRefs ?? [], missingData: result.missingData,
    limitationCodes: result.status === 'POLICY_UNRESOLVED' ? ['M7_NOMINAL_QUERY_CLOCK_SCOPE_EXCEEDED'] :
      result.status === 'AMBIGUOUS' ? ['M7_NATAL_PUBLISHED_MINUTE_KISAN_UNRESOLVED'] :
        result.status === 'OUTSIDE_GENERATED_RANGE' ? ['GENERATED_DAYUN_SEQUENCE_EXHAUSTED'] : [],
    kisanEvent,
  });
  const { startInclusive, endExclusive, pillar, ordinal } = result.selection;
  return periodLayer('DAEUN', DAYUN_POLICY, calendar.clockPolicyId, pillar, startInclusive, endExclusive, {
    ordinal, factRefs, kisanEvent, sourceRefs: kisanEvent?.sourceRefs ?? [],
    limitationCodes: ['M7_NOMINAL_PERIOD_NOT_CERTIFIED_INSTANT'],
  });
}

function createContext(existing, candidateIndex, asOf, calendar, dayun, [seyun, monthly]) {
  const natalCandidateRef = existing.candidates[candidateIndex].id;
  const birthMinute = existing.calculation.chart.recordedBirthKstMinute;
  const daeun = dayunLayer(dayun, candidateIndex, asOf, calendar, birthMinute);
  const layers = { DAEUN: daeun, SEYUN: seyun, MONTHLY: monthly };
  const assumptions = [...new Map([seyun.condition, monthly.condition].filter(Boolean)
    .map(item => [item.boundaryRef, item])).values()];
  const timeContextRef = [natalCandidateRef, calendar.clockPolicyId, asOf,
    ...assumptions.map(item => item.boundaryRef + ':' + item.side)].join('#');
  const positions = E6_LAYERS.flatMap(layer => {
    const { period, factRefs, policyId, policyVersion, sourceRefs, limitationCodes, status } = layers[layer];
    return period ? [{
      natalCandidateRef, timeContextRef, layer, positionRef: natalCandidateRef + '#' + period.periodRef,
      ...period, period, intervalStatus: status, factRefs, sourceRefs, policyId, policyVersion, limitationCodes,
    }] : [];
  });
  const unavailableLayers = E6_LAYERS.filter(layer => layers[layer].status !== 'RESOLVED_UNDER_POLICY' &&
    !EMPTY_STATES.has(layers[layer].status));
  const value = freeze({
    natalCandidateRef, timeContextRef, asOf, clockPolicyId: calendar.clockPolicyId,
    clockPolicyVersion: calendar.clock.version,
    birthRelation: asOf < birthMinute ? 'BEFORE_BIRTH' : asOf === birthMinute ? 'SAME_REPORTED_MINUTE' : 'AFTER_BIRTH',
    assumptions, positions, layers, unavailableLayers,
    limitationCodes: ['PUBLISHED_MINUTE_NOMINAL_ONLY', ...(asOf < birthMinute ? ['CALENDAR_AXES_BEFORE_BIRTH'] : [])],
  });
  issued.set(value, { existing });
  return value;
}

/** Structural partition of provided transition evidence, without calendrical inference. */
export function rangeCuts(query, calendar, dayun, birthMinute) {
  const { from, to } = query, cuts = new Set([from, to]);
  const add = minute => { if (minute > from && minute < to) cuts.add(minute); };
  add(calendar.clock.fromInclusive);
  add(calendar.clock.untilExclusive);
  if (dayun.projections?.length) add(NOMINAL_AS_OF_RANGE.untilExclusive);
  if (calendar.clock.extension) add('2029-01-01T00:00');
  add(birthMinute);
  add(nextMinute(birthMinute));
  for (const event of calendar.jie) {
    if (event.displayedDateTime < from || event.displayedDateTime >= to || clockAvailability(calendar, event.displayedDateTime)) continue;
    add(event.displayedDateTime);
    add(nextMinute(event.displayedDateTime));
  }
  for (const value of dayun.projections ?? []) {
    for (const period of value.calendar.periods) {
      if (period.startInclusive >= NOMINAL_AS_OF_RANGE.fromInclusive && period.startInclusive < NOMINAL_AS_OF_RANGE.untilExclusive) {
        add(period.startInclusive);
      }
      if (period.endExclusive >= NOMINAL_AS_OF_RANGE.fromInclusive && period.endExclusive < NOMINAL_AS_OF_RANGE.untilExclusive) {
        add(period.endExclusive);
      }
    }
  }
  return [...cuts].sort();
}

function limit(reasonCode, limit, actual, coverage) {
  return freeze({ status: 'LIMIT_EXCEEDED', candidates: [], hold: { reasonCode, limit, actual }, coverage });
}

function coverageFor(existing, clockPolicyId) {
  const clock = E6_QUERY_CLOCKS[clockPolicyId];
  return freeze({
    birth: { status: existing.status, profileId: existing.request.calendarProfileId,
      calendar: existing.request.calendar, range: existing.calculation?.profile?.birthRange ?? null },
    queryClock: { policyId: clockPolicyId, policyVersion: clock.version,
      fromInclusive: clock.fromInclusive, untilExclusive: clock.untilExclusive },
    layers: {
      DAEUN: { ...DAYUN_POLICY, natalProfileId: MODERN_PROFILE_ID, asOfRange: NOMINAL_AS_OF_RANGE,
        natalPolicyAdopted: existing.request.calendarProfileId === MODERN_PROFILE_ID },
      SEYUN: { ...SEYUN_POLICY, scope: 'DATED_LICHUN_INTERVALS_PUBLISHED_MINUTE' },
      MONTHLY: { ...(clock.extension ? MONTHLY_V2_POLICY : MONTHLY_V1_POLICY),
        scope: 'DATED_JIE_INTERVALS_PUBLISHED_MINUTE',
        ...(clock.extension ? { completeIntervals2027: 10, missingIntervals2027: 2 } : {}) },
    },
    dataPackSha256: existing.dataPack.manifestContentSha256, limits: E6_TIMELINE_LIMITS,
  });
}

export function createE6TimeResolver(loaded) {
  const identity = verifyServerApiOnlyLoaded(loaded), calendars = new Map();
  function calendarFor(clockPolicyId) {
    if (calendars.has(clockPolicyId)) return calendars.get(clockPolicyId);
    const clock = E6_QUERY_CLOCKS[clockPolicyId];
    const profile = createLocalChartProfile(loaded, { profileId: clock.profileId,
      expectedManifestSha256: identity.manifestContentSha256, ...(clock.extension ? { annualSolarExtension: loaded.annualSolarExtension } : {}) });
    const { events } = getLocalChartEventContext(profile);
    const calendar = {
      profile, clock, clockPolicyId,
      lichun: new Map(events.filter(event => event.term === 'LICHUN').map(event => [Number(event.displayedDateTime.slice(0, 4)), event])),
      jie: events.filter(event => MONTH_BOUNDARY_JIE.includes(event.term)),
      annualTimeline: compileLuckTimeline(events),
      monthlyTimeline: clock.extension ? compileMonthlyTimelineV2(events) : compileMonthlyTimeline(events),
      monthlyAt: clock.extension ? monthlyLuckAtMinuteV2 : monthlyLuckAtMinute,
      monthlyPolicy: clock.extension ? MONTHLY_V2_POLICY : MONTHLY_V1_POLICY,
    };
    calendars.set(clockPolicyId, calendar);
    return calendar;
  }
  return Object.freeze({ query({ existing, query, clockPolicyId, dayun }) {
    validateE6Query(query, clockPolicyId, dayun);
    validateApiOnlyServerResult(existing);
    check(existing.dataPack.manifestContentSha256 === identity.manifestContentSha256, 'E6_FOREIGN_DATA_CONTEXT');
    const coverage = coverageFor(existing, clockPolicyId);
    if (query.kind === 'RANGE') {
      const durationMinutes = (wallScalar(query.to) - wallScalar(query.from)) / MINUTE_MS;
      if (durationMinutes > MAX_RANGE_DAYS * DAY_MINUTES) {
        return limit('RANGE_DURATION_MINUTES', MAX_RANGE_DAYS * DAY_MINUTES, durationMinutes, coverage);
      }
    }
    if (!existing.candidates.length) return freeze({ status: 'NATAL_UNAVAILABLE', candidates: [],
      hold: { reasonCode: existing.status, upstreamHolds: existing.holds }, coverage });
    const calendar = calendarFor(clockPolicyId);
    const modern = existing.request.calendarProfileId === MODERN_PROFILE_ID && dayun?.traditionalSex && dayun.count ?
      calendarFor(MODERN_CLOCK_POLICY_ID) : null;
    const dayunProjection = projectedDayun(existing, modern, dayun);
    const cuts = query.kind === 'RANGE' ?
      rangeCuts(query, calendar, dayunProjection, existing.calculation.chart.recordedBirthKstMinute) : [];
    if (cuts.length - 1 > E6_TIMELINE_LIMITS.maxSegments) return limit('RANGE_SEGMENTS', E6_TIMELINE_LIMITS.maxSegments, cuts.length - 1, coverage);
    const minutes = query.kind === 'AS_OF' ? [query.asOf] : query.kind === 'COMPARE' ?
      unique([query.from, query.to]) : cuts.slice(0, -1);
    const solar = new Map(minutes.map(minute => [minute, solarChoices(calendar, minute)]));
    const contextCount = [...solar.values()].reduce((sum, alternatives) => sum + alternatives.length, 0);
    if (contextCount > E6_TIMELINE_LIMITS.maxTimeContextsPerNatal) {
      return limit('TIME_CONTEXTS_PER_NATAL', E6_TIMELINE_LIMITS.maxTimeContextsPerNatal, contextCount, coverage);
    }

    const candidates = existing.candidates.map((parent, candidateIndex) => {
      const timeContexts = minutes.flatMap(minute => solar.get(minute).map(alternative =>
        createContext(existing, candidateIndex, minute, calendar, dayunProjection, alternative)));
      const refs = new Map(minutes.map(minute => [minute, timeContexts.filter(c => c.asOf === minute).map(c => c.timeContextRef)]));
      const selection = query.kind === 'AS_OF' ? { kind: query.kind, timeContextRefs: refs.get(query.asOf) } :
        query.kind === 'COMPARE' ? { kind: query.kind, leftTimeContextRefs: refs.get(query.from), rightTimeContextRefs: refs.get(query.to) } :
          { kind: query.kind, segments: cuts.slice(0, -1).map((fromInclusive, index) => ({
            fromInclusive, toExclusive: cuts[index + 1], timeContextRefs: refs.get(fromInclusive),
          })) };
      const issuedDayun = dayunProjection.projections?.[candidateIndex];
      const dayunEvidence = issuedDayun ? {
        input: issuedDayun.input, firstStartMinute: issuedDayun.calendar.firstStartMinute,
        periods: issuedDayun.calendar.periods, factRefs: issuedDayun.facts.map(fact => fact.id),
        calculationSourceRefs: unique(issuedDayun.facts.flatMap(fact => fact.calculationSourceRefs)),
      } : null;
      return { natalCandidateRef: parent.id, timeContexts, selection, dayunEvidence };
    });
    const alternatives = candidates.some(parent => parent.timeContexts.some(value => value.assumptions.length));
    const partial = candidates.some(parent => parent.timeContexts.some(value => value.unavailableLayers.length));
    return freeze({ status: partial ? 'PARTIAL' : 'AVAILABLE', candidates, hasTimeAlternatives: alternatives, hold: null, coverage,
      queryClock: { policyId: calendar.clockPolicyId, policyVersion: calendar.clock.version,
        fromInclusive: calendar.clock.fromInclusive, untilExclusive: calendar.clock.untilExclusive },
      dayunPolicy: { ...DAYUN_POLICY, natalProfileId: MODERN_PROFILE_ID, asOfRange: NOMINAL_AS_OF_RANGE },
    });
  } });
}
