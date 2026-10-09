/** Read-only Korean chart preview CLI. KASI finite fixtures, not official KASA certification. */
import {
  createKoreanLunisolarConverter,
  KASI_KOREAN_LUNISOLAR_2025_2027,
  resolveKoreanBirthChartPreview,
} from '../dist/index.js';
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 } from '../dist/calendar/koreaSolarTermFixtures.js';
import { parseKoreanChartCliArgs } from './chart-preview-cli-args.mjs';

const manifest = Object.freeze({
  schemaVersion: 'm1-solar-term-coverage-v1',
  requirementProfile: 'FULL_24_TERM_YEAR',
  timeBasis: 'KST', sourcePrecision: 'MINUTE',
  supportedFromInclusive: '2026-01-01T00:00',
  supportedUntilExclusive: '2028-01-01T00:00',
  requiredYears: Object.freeze([2026, 2027]),
  requiredPriorBoundary: Object.freeze({ year: 2025, term: 'DAXUE' }),
});
const usage = [
  'Read-only Korean birth chart preview (2026-2027 solar-term coverage).',
  'Required: --calendar=GREGORIAN|KOREAN_LUNAR --date=YYYY-MM-DD --time=HH:MM',
  ' --time-basis=KOREAN_CIVIL_TIME --day-rollover=CIVIL_MIDNIGHT|ZI_START',
  ' --hour-stem-reference=SELECTED_DAY_PILLAR|CIVIL_DATE_DAY_PILLAR',
  'For KOREAN_LUNAR also require --leap=true|false. No policy defaults.',
].join('\n') + '\n';

try {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--help') {
    process.stdout.write(usage);
  } else {
    const { input, clock, policies } = parseKoreanChartCliArgs(args);
    const converter = createKoreanLunisolarConverter(KASI_KOREAN_LUNISOLAR_2025_2027);
    const result = resolveKoreanBirthChartPreview(
      input, clock, policies, converter, KOREA_SOLAR_TERM_EVENTS_2026_2027, manifest,
    );
    process.stdout.write(JSON.stringify(result) + '\n');
    if (result.status !== 'OK') process.exitCode = 2;
  }
} catch (error) {
  const invalid = error instanceof RangeError || error instanceof TypeError;
  process.stderr.write(JSON.stringify({
    status: 'ERROR', code: invalid ? 'INVALID_OR_UNSUPPORTED_INPUT' : 'INTERNAL_ERROR',
    message: error instanceof Error ? error.message : 'Unexpected error',
  }) + '\n');
  process.exitCode = invalid ? 2 : 1;
}
