/** Offline inspection of one user-supplied API response. No keys, transport or engine imports. */
import { constants } from 'node:fs';
import { lstat, open } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CollectorError, fail, year, daysInMonth, parsePage, normalizeSolar, normalizeLunar,
  validateSolar, validateLunar, fingerprint, TERMS, type Service, type SolarRow, type LunarRow } from './schema.js';

const MAX_BYTES = 2_000_000;
export interface IntakeScope { service: Service; year: number; month?: number; day?: number; }
function checkScope(scope: IntakeScope): void {
  if (!scope || Object.getPrototypeOf(scope) !== Object.prototype ||
      Object.keys(scope).some(key => !['service', 'year', 'month', 'day'].includes(key))) fail('INTAKE_SCOPE');
  year(scope.year);
  if (!['solar', 'lunar'].includes(scope.service)) fail('INTAKE_SERVICE');
  if (scope.month !== undefined && (!Number.isInteger(scope.month) || scope.month < 1 || scope.month > 12)) fail('INTAKE_MONTH');
  if (scope.service === 'lunar' && scope.month === undefined) fail('INTAKE_LUNAR_MONTH_REQUIRED');
  if (scope.day !== undefined && (scope.service !== 'lunar' || scope.month === undefined ||
      !Number.isInteger(scope.day) || scope.day < 1 || scope.day > daysInMonth(scope.year, scope.month))) fail('INTAKE_DAY');
}

/** Only finite validated calendar fields enter the report/digest; raw headers and messages never do. */
export function inspectLocalResponse(raw: string, scope: IntakeScope) {
  checkScope(scope);
  const page = parsePage(raw);
  const expected = scope.service === 'solar' ? scope.month === undefined ? 24 : 2
    : scope.day === undefined ? daysInMonth(scope.year, scope.month!) : 1;
  const offset = (page.page - 1) * page.size;
  if (page.total > expected || (page.total === 0 ? page.page !== 1 || page.items.length !== 0
      : offset >= page.total || page.items.length !== Math.min(page.size, page.total - offset))) fail('INTAKE_PAGE_CONTRACT');
  const rows: (SolarRow | LunarRow)[] = page.items.map(item => scope.service === 'solar'
    ? normalizeSolar(item, scope.year) : normalizeLunar(item, scope.year, scope.month!, scope.day));
  if (scope.service === 'solar') {
    const solar = rows as SolarRow[];
    if (solar.some(r => scope.month !== undefined && Number(r.date.slice(5, 7)) !== scope.month ||
        Math.floor(TERMS.indexOf(r.term as typeof TERMS[number]) / 2) + 1 !== Number(r.date.slice(5, 7)))) fail('INTAKE_SOLAR_MONTH');
    if (new Set(solar.map(r => r.date)).size !== rows.length || new Set(solar.map(r => r.term)).size !== rows.length) fail('INTAKE_DUPLICATE_ROW');
  } else if (new Set((rows as LunarRow[]).map(r => r.solarDate)).size !== rows.length) fail('INTAKE_DUPLICATE_ROW');
  const complete = page.page === 1 && page.total === expected && rows.length === expected;
  if (complete) {
    if (scope.service === 'solar') {
      if (scope.month === undefined) validateSolar(rows as SolarRow[], scope.year);
      else {
        // Input order is arbitrary; the dates must preserve this month's term sequence.
        const ordered = [...rows as SolarRow[]].sort((a, b) => a.date.localeCompare(b.date));
        const firstTerm = (scope.month - 1) * 2;
        if (ordered.some((row, index) => row.term !== TERMS[firstTerm + index])) fail('INTAKE_SOLAR_ORDER');
      }
    }
    if (scope.service === 'lunar') validateLunar(rows as LunarRow[], scope.year, scope.month, scope.day);
  }
  const minuteRows = scope.service === 'solar' ? (rows as SolarRow[]).filter(r => r.precision === 'MINUTE').length : null;
  const precisionComplete = scope.service !== 'solar' || minuteRows === rows.length;
  const status = page.total === 0 ? 'EMPTY_RESPONSE' : !complete ? 'PARTIAL_SCOPE'
    : !precisionComplete ? 'DATE_ONLY_SCOPE' : 'STRUCTURALLY_COMPLETE_SCOPE';
  // Unknown item fields can contain tokens or personal data: return only recognized field names.
  const fields = scope.service === 'solar'
    ? ['dateName', 'locdate', 'kst', 'sunLongitude', 'dateKind', 'isHoliday', 'seq']
    : ['solYear', 'solMonth', 'solDay', 'solWeek', 'solLeapyear', 'solJd', 'lunYear', 'lunMonth', 'lunDay', 'lunLeapmonth', 'lunNday', 'lunSecha', 'lunWolgeon', 'lunIljin'];
  const normalized = [...rows].sort((a, b) => ('date' in a ? a.date : a.solarDate).localeCompare('date' in b ? b.date : b.solarDate));
  return Object.freeze({
    schemaVersion: 'kasi-local-intake-report-v1', evidenceSurface: 'USER_SUPPLIED_LOCAL_RESPONSE', status,
    scope: Object.freeze({ ...scope }), actualFormat: page.schema.format,
    page: Object.freeze({ number: page.page, size: page.size, declaredTotal: page.total, rows: rows.length }),
    expectedScopeRows: expected, completeScope: complete, yearComplete: false,
    minuteRows, dateOnlyRows: minuteRows === null ? null : rows.length - minuteRows,
    published2400Rows: scope.service === 'solar' ? (rows as SolarRow[]).filter(r => r.timeNotation === 'AS_REPORTED_2400').length : 0,
    unreportedLeapMonthGanjiRows: scope.service === 'lunar' ? (rows as LunarRow[]).filter(r => r.ganji.month === null).length : 0,
    recognizedItemFields: Object.freeze(page.schema.itemFields.filter(f => fields.includes(f))),
    unreportedItemFieldCount: page.schema.itemFields.filter(f => !fields.includes(f)).length,
    normalizedRowsSha256: fingerprint(normalized),
    originalResponseSha256: null, // Raw bytes may contain secrets in ignored fields. Never hash/publish them here.
    providerAuthenticity: 'UNVERIFIED', externalOriginalVerification: 'UNVERIFIED', rightsReview: 'UNVERIFIED',
    engineSupportPromotion: false, g1P2Promotion: false,
  } as const);
}

export async function inspectLocalFile(file: string, scope: IntakeScope) {
  checkScope(scope);
  // Reject devices/FIFOs/direct symlinks before opening; O_NOFOLLOW closes the symlink race on POSIX.
  const before = await lstat(file);
  if (!before.isFile() || before.isSymbolicLink()) fail('INTAKE_REGULAR_FILE_REQUIRED');
  const handle = await open(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0));
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.dev !== before.dev || stat.ino !== before.ino) fail('INTAKE_FILE_CHANGED');
    if (stat.size > MAX_BYTES) fail('RESPONSE_TOO_LARGE');
    const buffer = Buffer.alloc(MAX_BYTES + 1); let length = 0;
    while (length < buffer.length) {
      const read = await handle.read(buffer, length, buffer.length - length, null);
      if (!read.bytesRead) break;
      length += read.bytesRead;
    }
    if (length > MAX_BYTES) fail('RESPONSE_TOO_LARGE');
    let raw: string;
    try { raw = new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, length)); }
    catch { return fail('INTAKE_UTF8'); }
    return inspectLocalResponse(raw, scope);
  } finally { await handle.close(); }
}

export function parseIntakeArgs(args: string[]): { file: string; scope: IntakeScope } {
  const values: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    const name = args[i], value = args[i + 1];
    if (!name || !['--file', '--service', '--year', '--month', '--day'].includes(name) || Object.hasOwn(values, name) || !value || value.startsWith('--')) fail('INTAKE_ARGUMENTS');
    values[name] = value;
  }
  if (!values['--file'] || !values['--service'] || !values['--year']) fail('INTAKE_ARGUMENTS');
  for (const name of ['--year', '--month', '--day']) if (values[name] !== undefined && !/^\d+$/.test(values[name]!)) fail('INTAKE_ARGUMENTS');
  const scope: IntakeScope = { service: values['--service'] as Service, year: Number(values['--year']),
    ...(values['--month'] === undefined ? {} : { month: Number(values['--month']) }),
    ...(values['--day'] === undefined ? {} : { day: Number(values['--day']) }) };
  checkScope(scope);
  return { file: values['--file'], scope };
}

export async function intakeMain(args: string[]): Promise<number> {
  try {
    const { file, scope } = parseIntakeArgs(args);
    const report = await inspectLocalFile(file, scope);
    console.log(JSON.stringify(report));
    return report.status === 'STRUCTURALLY_COMPLETE_SCOPE' ? 0 : 2;
  } catch (error) {
    // Do not log file paths, source text, parser/OS messages, query URLs or unknown exception text.
    const code = error instanceof CollectorError ? error.code : 'INTAKE_READ_FAILED';
    console.log(JSON.stringify({ schemaVersion: 'kasi-local-intake-report-v1', status: 'REJECTED', code }));
    return 1;
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  intakeMain(process.argv.slice(2)).then(code => { process.exitCode = code; });
}
