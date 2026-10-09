/** Local-only, read-only V0 chart preview. No persistence of birth inputs. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createKoreanLunisolarConverter, KASI_KOREAN_LUNISOLAR_2025_2027, resolveKoreanBirthChartPreview } from '../dist/index.js';
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 } from '../dist/calendar/koreaSolarTermFixtures.js';
import { parseKoreanChartCliArgs } from './chart-preview-cli-args.mjs';

const manifest = Object.freeze({
  schemaVersion: 'm1-solar-term-coverage-v1', requirementProfile: 'FULL_24_TERM_YEAR',
  timeBasis: 'KST', sourcePrecision: 'MINUTE',
  supportedFromInclusive: '2026-01-01T00:00', supportedUntilExclusive: '2028-01-01T00:00',
  requiredYears: Object.freeze([2026, 2027]),
  requiredPriorBoundary: Object.freeze({ year: 2025, term: 'DAXUE' }),
});
const converter = createKoreanLunisolarConverter(KASI_KOREAN_LUNISOLAR_2025_2027);
const allowed = ['calendar', 'date', 'time', 'timeBasis', 'dayRollover', 'hourStemReference', 'leap'];
const required = ['calendar', 'date', 'time', 'timeBasis', 'dayRollover', 'hourStemReference'];

/** Reuse the tested CLI parser to avoid a second calendar or policy validator. */
export function parseWebBirthInput(data) {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) throw new RangeError('Invalid request');
  if (Object.keys(data).some(key => !allowed.includes(key)) ||
      required.some(key => typeof data[key] !== 'string')) throw new RangeError('Invalid request');
  if (data.calendar === 'KOREAN_LUNAR') {
    if (typeof data.leap !== 'boolean') throw new RangeError('Invalid request');
  } else if ('leap' in data) throw new RangeError('Invalid request');
  const args = [
    '--calendar=' + data.calendar, '--date=' + data.date, '--time=' + data.time,
    '--time-basis=' + data.timeBasis, '--day-rollover=' + data.dayRollover,
    '--hour-stem-reference=' + data.hourStemReference,
    ...(data.calendar === 'KOREAN_LUNAR' ? ['--leap=' + data.leap] : []),
  ];
  return parseKoreanChartCliArgs(args);
}
const common = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
function json(res, code, value) {
  res.writeHead(code, { ...common, 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(value));
}
async function readJson(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw new RangeError('Invalid request');
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 8192) throw new RangeError('Invalid request');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new RangeError('Invalid request'); }
}
export function makeChartPreviewServer() {
  return createServer(async (req, res) => {
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      try {
        const html = await readFile(new URL('../web/index.html', import.meta.url));
        res.writeHead(200, { ...common, 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      } catch { json(res, 500, { status: 'ERROR', message: 'Unable to load preview page' }); }
      return;
    }
    if (req.method === 'POST' && req.url === '/api/preview') {
      try {
        const { input, clock, policies } = parseWebBirthInput(await readJson(req));
        const output = resolveKoreanBirthChartPreview(input, clock, policies, converter,
          KOREA_SOLAR_TERM_EVENTS_2026_2027, manifest);
        json(res, output.status === 'OK' ? 200 : 422, output);
      } catch (error) {
        const invalid = error instanceof RangeError || error instanceof TypeError;
        json(res, invalid ? 422 : 500, {
          status: 'ERROR',
          code: invalid ? 'INVALID_OR_UNSUPPORTED_INPUT' : 'INTERNAL_ERROR',
          message: invalid ? 'Invalid request' : 'Unable to calculate chart',
        });
      }
      return;
    }
    json(res, 404, { status: 'ERROR', message: 'Not found' });
  });
}
if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  const port = Number(process.env.PORT ?? '4173');
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new RangeError('Invalid PORT');
  makeChartPreviewServer().listen(port, '127.0.0.1', function () {
    process.stdout.write('V0 chart preview: http://127.0.0.1:' + this.address().port + '\n');
  });
}
