/** Strict, dependency-free CLI input parser; never chooses a Myeongli time policy. */
const KEYS = new Set([
  'calendar', 'date', 'leap', 'time', 'time-basis', 'day-rollover', 'hour-stem-reference',
]);
const REQUIRED = ['calendar', 'date', 'time', 'time-basis', 'day-rollover', 'hour-stem-reference'];
const DAY_ROLLOVERS = new Set(['CIVIL_MIDNIGHT', 'ZI_START']);
const HOUR_REFERENCES = new Set(['SELECTED_DAY_PILLAR', 'CIVIL_DATE_DAY_PILLAR']);


/** Calendar-shape checks only; lunar month existence/leap status belongs to the converter. */
function validateBirthDateShape(calendar, year, month, day) {
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) {
    throw new RangeError('Invalid birth date components.');
  }
  if (calendar === 'KOREAN_LUNAR') {
    if (day > 30) throw new RangeError('Lunar day must be between 1 and 30.');
    return;
  }
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new RangeError('Invalid Gregorian birth date.');
  }
}

export function parseKoreanChartCliArgs(argv) {
  if (!Array.isArray(argv)) throw new TypeError('CLI arguments must be an array.');
  const options = new Map();
  for (const token of argv) {
    if (typeof token !== 'string' || !/^--[a-z][a-z-]*=/.test(token)) {
      throw new RangeError('Each option must use --name=value.');
    }
    const split = token.indexOf('=');
    const key = token.slice(2, split);
    const value = token.slice(split + 1);
    if (!KEYS.has(key) || options.has(key) || value === '') {
      throw new RangeError('Unknown, duplicate or empty option: ' + key);
    }
    options.set(key, value);
  }
  for (const key of REQUIRED) {
    if (!options.has(key)) throw new RangeError('Missing required option: ' + key);
  }
  const calendar = options.get('calendar');
  if (calendar !== 'GREGORIAN' && calendar !== 'KOREAN_LUNAR') {
    throw new RangeError('Unsupported calendar; choose GREGORIAN or KOREAN_LUNAR.');
  }
  const date = options.get('date');
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new RangeError('Date must be YYYY-MM-DD.');
  validateBirthDateShape(calendar, Number(match[1]), Number(match[2]), Number(match[3]));
  const clock = options.get('time');
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(clock)) {
    throw new RangeError('Time must be HH:MM Korean civil clock time.');
  }
  if (options.get('time-basis') !== 'KOREAN_CIVIL_TIME') {
    throw new RangeError('Only explicit KOREAN_CIVIL_TIME is supported.');
  }
  if (!DAY_ROLLOVERS.has(options.get('day-rollover'))) {
    throw new RangeError('Unsupported or missing day-rollover policy.');
  }
  if (!HOUR_REFERENCES.has(options.get('hour-stem-reference'))) {
    throw new RangeError('Unsupported or missing hour-stem-reference policy.');
  }
  const policies = {
    timeBasis: 'KOREAN_CIVIL_TIME',
    dayRollover: options.get('day-rollover'),
    hourStemReference: options.get('hour-stem-reference'),
  };
  if (calendar === 'GREGORIAN') {
    if (options.has('leap')) throw new RangeError('--leap is forbidden for Gregorian dates.');
    return { input: { calendar, gregorianDate: date }, clock, policies };
  }
  if (!options.has('leap') || !['true', 'false'].includes(options.get('leap'))) {
    throw new RangeError('Korean lunar dates require explicit --leap=true|false.');
  }
  return {
    input: {
      calendar,
      lunarDate: {
        lunarYear: Number(match[1]), lunarMonth: Number(match[2]),
        lunarDay: Number(match[3]), isLeapMonth: options.get('leap') === 'true',
      },
    },
    clock,
    policies,
  };
}
