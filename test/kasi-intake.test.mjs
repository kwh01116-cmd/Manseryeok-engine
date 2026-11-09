// Synthetic responses only. No calendar oracle or live-service success is implied.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm, symlink, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { inspectLocalResponse, inspectLocalFile, parseIntakeArgs } from '../.kasi-build/intake.js';
import { TERMS } from '../.kasi-build/schema.js';
const solarScope = { service: 'solar', year: 2026 };
const terms = () => TERMS.map((dateName, i) => ({ dateName,
  locdate: `2026${String(Math.floor(i / 2) + 1).padStart(2, '0')}${i % 2 ? '20' : '05'}`, kst: '0120' }));
const body = (items, { page = 1, size = 100, total = items.length, message = 'OK' } = {}) => JSON.stringify({ response: {
  header: { resultCode: '00', resultMsg: message }, body: { items: { item: items }, pageNo: page, numOfRows: size, totalCount: total },
} });
const lunar = (day = 1) => ({ solYear: '2026', solMonth: '01', solDay: String(day),
  lunYear: day < 30 ? '2025' : '2026', lunMonth: day < 30 ? '12' : '1', lunDay: String(day < 30 ? day : day - 29),
  lunLeapmonth: '평', lunNday: '29', lunSecha: '갑자(甲子)', lunWolgeon: '을축(乙丑)', lunIljin: '병인(丙寅)' });
async function temporary(fn) {
  const root = await mkdtemp(join(tmpdir(), 'kasi-intake-'));
  try { await fn(root); } finally { await rm(root, { recursive: true, force: true }); }
}

test('local intake verifies only declared scope; a full solar response never promotes annual collection or P2', () => {
  const r = inspectLocalResponse(body(terms()), solarScope);
  assert.equal(r.status, 'STRUCTURALLY_COMPLETE_SCOPE'); assert.equal(r.minuteRows, 24);
  assert.equal(r.completeScope, true); assert.equal(r.yearComplete, false);
  assert.equal(r.providerAuthenticity, 'UNVERIFIED'); assert.equal(r.rightsReview, 'UNVERIFIED');
  assert.equal(r.externalOriginalVerification, 'UNVERIFIED'); assert.equal(r.engineSupportPromotion, false);
  assert.equal(r.g1P2Promotion, false); assert.equal(r.originalResponseSha256, null);
});
test('local intake distinguishes date-only, partial first/later pages and genuinely empty responses', () => {
  const dates = terms().map(({ kst, ...r }) => r);
  assert.equal(inspectLocalResponse(body(dates), solarScope).status, 'DATE_ONLY_SCOPE');
  const mixed = terms(); delete mixed[0].kst;
  assert.equal(inspectLocalResponse(body(mixed), solarScope).minuteRows, 23);
  for (const page of [1, 2, 3]) {
    const r = inspectLocalResponse(body(terms().slice((page - 1) * 10, page * 10), { page, size: 10, total: 24 }), solarScope);
    assert.equal(r.status, 'PARTIAL_SCOPE'); assert.equal(r.completeScope, false);
  }
  const empty = inspectLocalResponse(body([]), solarScope);
  assert.equal(empty.status, 'EMPTY_RESPONSE'); assert.equal(empty.completeScope, false);
  assert.equal(empty.providerAuthenticity, 'UNVERIFIED');
});
test('local intake rejects false pagination claims without retrieving another page', () => {
  for (const input of [body(terms(), { total: 23 }), body(terms().slice(0, 9), { size: 10, total: 24 }),
    body([], { page: 2 }), body(terms().slice(0, 1), { page: 4, size: 10, total: 24 }), body(terms(), { total: 25 })]) {
    assert.throws(() => inspectLocalResponse(input, solarScope));
  }
});
test('local intake checks declared solar month and duplicate identities', () => {
  const scope = { ...solarScope, month: 1 };
  assert.equal(inspectLocalResponse(body(terms().slice(0, 2)), scope).status, 'STRUCTURALLY_COMPLETE_SCOPE');
  assert.throws(() => inspectLocalResponse(body(terms().slice(2, 4)), scope));
  const wrong = terms(); wrong[0].locdate = '20260205';
  assert.throws(() => inspectLocalResponse(body(wrong), solarScope));
  assert.throws(() => inspectLocalResponse(body([terms()[0], terms()[0]]), scope));
});
test('monthly solar intake accepts valid term dates with minute or date-only precision', () => {
  for (let month = 1; month <= 12; month++) {
    const rows = terms().slice((month - 1) * 2, month * 2), scope = { ...solarScope, month };
    const minute = inspectLocalResponse(body(rows), scope);
    assert.equal(minute.status, 'STRUCTURALLY_COMPLETE_SCOPE');
    assert.equal(minute.completeScope, true); assert.equal(minute.minuteRows, 2);
    const dateOnly = inspectLocalResponse(body(rows.map(({ kst, ...row }) => row)), scope);
    assert.equal(dateOnly.status, 'DATE_ONLY_SCOPE'); assert.equal(dateOnly.completeScope, true);
  }
});
test('monthly solar intake ignores input row order while retaining the same normalized digest', () => {
  for (let month = 1; month <= 12; month++) {
    const rows = terms().slice((month - 1) * 2, month * 2), scope = { ...solarScope, month };
    assert.deepEqual(inspectLocalResponse(body([...rows].reverse()), scope), inspectLocalResponse(body(rows), scope));
  }
});
test('monthly solar intake rejects reversed term dates regardless of row order or precision', () => {
  for (let month = 1; month <= 12; month++) {
    const rows = terms().slice((month - 1) * 2, month * 2), scope = { ...solarScope, month };
    [rows[0].locdate, rows[1].locdate] = [rows[1].locdate, rows[0].locdate];
    for (const input of [rows, [...rows].reverse(), rows.map(({ kst, ...row }) => row),
      [...rows].reverse().map(({ kst, ...row }) => row)]) {
      assert.throws(() => inspectLocalResponse(body(input), scope), error => error.code === 'INTAKE_SOLAR_ORDER');
    }
  }
});
test('local lunar sample validates an explicit day/month, leap values and full-month continuity', () => {
  const scope = { service: 'lunar', year: 2026, month: 1 };
  const r = inspectLocalResponse(body(Array.from({ length: 31 }, (_, i) => lunar(i + 1))), scope);
  assert.equal(r.status, 'STRUCTURALLY_COMPLETE_SCOPE'); assert.equal(r.yearComplete, false); assert.equal(r.minuteRows, null);
  assert.equal(inspectLocalResponse(body([lunar()]), { ...scope, day: 1 }).status, 'STRUCTURALLY_COMPLETE_SCOPE');
  assert.equal(inspectLocalResponse(body([lunar()]), scope).status, 'PARTIAL_SCOPE');
  assert.throws(() => inspectLocalResponse(body([lunar(2)]), { ...scope, day: 1 }));
  const rows = Array.from({ length: 31 }, (_, i) => lunar(i + 1)); rows[15].lunDay = '1';
  assert.throws(() => inspectLocalResponse(body(rows), scope));
  assert.throws(() => inspectLocalResponse(body([{ ...lunar(), lunLeapmonth: 'AUTO' }]), scope));
});
test('local intake reads XML and never treats API errors or malformed envelopes as empty years', () => {
  const xml = '<response><header><resultCode>00</resultCode></header><body><items><item><dateName>소한</dateName><locdate>20260105</locdate><kst>0120</kst></item></items><pageNo>1</pageNo><numOfRows>1</numOfRows><totalCount>24</totalCount></body></response>';
  const r = inspectLocalResponse(xml, solarScope); assert.equal(r.actualFormat, 'xml'); assert.equal(r.status, 'PARTIAL_SCOPE');
  for (const input of ['<broken>', '{"response":{"header":{"resultCode":"30"}}}',
    '<!DOCTYPE x [<!ENTITY a SYSTEM "file:///etc/passwd">]><x/>', '{"OpenAPI_ServiceResponse":{}}']) {
    assert.throws(() => inspectLocalResponse(input, solarScope));
  }
});
test('reports and normalized digests cannot include ignored source secrets, URLs, field names or messages', () => {
  const secret = 'SYNTHETIC_PRIVATE_TOKEN_+/=';
  const original = terms(), polluted = terms().map(x => ({ ...x, [secret]: secret, requestUrl: 'https://invalid/?serviceKey=' + secret }));
  const base = inspectLocalResponse(body(original), solarScope);
  const report = inspectLocalResponse(body(polluted, { message: secret }), solarScope);
  assert.equal(report.normalizedRowsSha256, base.normalizedRowsSha256);
  assert.equal(report.unreportedItemFieldCount, 2);
  const text = JSON.stringify(report); assert.ok(!text.includes(secret)); assert.ok(!text.includes('https://')); assert.ok(!text.includes('requestUrl'));
  assert.equal(base.normalizedRowsSha256, inspectLocalResponse(body(original.reverse()), solarScope).normalizedRowsSha256);
  assert.throws(() => inspectLocalResponse(body(original), { ...solarScope, token: secret }));
});
test('local intake validates arguments and never accepts an implicit service, year, month or executable option', () => {
  const args = ['--file', 'response.xml', '--service', 'lunar', '--year', '2026', '--month', '01'];
  assert.deepEqual(parseIntakeArgs(args).scope, { service: 'lunar', year: 2026, month: 1 });
  for (const a of [[], args.slice(0, 6), [...args, '--fetch', 'true'], [...args, '--file', 'other'],
    ['--file', 'x', '--service', 'solar', '--year', '2026x'], [...args, '--day', '32'],
    ['--file', 'x', '--service', 'solar', '--year', '2026', '--day', '1']]) assert.throws(() => parseIntakeArgs(a));
});
test('local file intake is read-only and rejects symlinks, directories, oversized bytes and invalid UTF-8', async () => temporary(async root => {
  const file = join(root, 'response.json'), source = body(terms()); await writeFile(file, source);
  assert.equal((await inspectLocalFile(file, solarScope)).status, 'STRUCTURALLY_COMPLETE_SCOPE');
  assert.equal(await readFile(file, 'utf8'), source); assert.deepEqual(await readdir(root), ['response.json']);
  const link = join(root, 'link'); await symlink(file, link);
  await assert.rejects(() => inspectLocalFile(link, solarScope)); await assert.rejects(() => inspectLocalFile(root, solarScope));
  await writeFile(file, Buffer.alloc(2_000_001)); await assert.rejects(() => inspectLocalFile(file, solarScope));
  await writeFile(file, Buffer.from([0xff, 0xfe])); await assert.rejects(() => inspectLocalFile(file, solarScope));
}));
test('offline CLI has stable exits and suppresses source/path/parser errors and inherited credentials', async () => temporary(async root => {
  const marker = 'SYNTHETIC_NOT_A_REAL_KEY', file = join(root, marker + '.json');
  const blocker = join(root, 'no-network.mjs');
  await writeFile(blocker, "import net from 'node:net'; net.Socket.prototype.connect=function(){throw Error('NETWORK_MUST_NOT_BE_USED')}; globalThis.fetch=()=>{throw Error('NETWORK_MUST_NOT_BE_USED')};");
  const args = ['--import', pathToFileURL(blocker).href, '.kasi-build/intake.js', '--file', file, '--service', 'solar', '--year', '2026'];
  const env = { ...process.env, KASI_API_KEY: marker, KASI_SPCDE_API_KEY: marker, KASI_LUNAR_API_KEY: marker };
  for (const [source, exit, status] of [[body(terms()), 0, 'STRUCTURALLY_COMPLETE_SCOPE'], [body([]), 2, 'EMPTY_RESPONSE'],
    [body(terms().map(({ kst, ...r }) => r)), 2, 'DATE_ONLY_SCOPE'], ['bad ' + marker, 1, 'REJECTED']]) {
    await writeFile(file, source); const r = spawnSync(process.execPath, args, { env, encoding: 'utf8', timeout: 10000 });
    assert.equal(r.status, exit); assert.equal(JSON.parse(r.stdout).status, status); assert.equal(r.stderr, '');
    assert.ok(!r.stdout.includes(marker)); assert.ok(!r.stdout.includes(root)); assert.equal(await readFile(file, 'utf8'), source);
  }
  await rm(file); const missing = spawnSync(process.execPath, args, { env, encoding: 'utf8', timeout: 10000 });
  assert.equal(missing.status, 1); assert.equal(JSON.parse(missing.stdout).code, 'INTAKE_READ_FAILED'); assert.ok(!missing.stdout.includes(marker));
}));
test('monthly offline CLI distinguishes reordered rows from invalid chronological dates', async () => temporary(async root => {
  const file = join(root, 'synthetic-month.json'), blocker = join(root, 'no-network.mjs');
  await writeFile(blocker, "import net from 'node:net'; net.Socket.prototype.connect=function(){throw Error('NETWORK_MUST_NOT_BE_USED')}; globalThis.fetch=()=>{throw Error('NETWORK_MUST_NOT_BE_USED')};");
  const args = ['--import', pathToFileURL(blocker).href, '.kasi-build/intake.js', '--file', file, '--service', 'solar', '--year', '2026', '--month', '1'];
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (/KASI.*KEY/.test(key)) delete env[key];
  const rows = terms().slice(0, 2), reversedDates = rows.map((row, index) => ({ ...row, locdate: rows[1 - index].locdate }));
  const reports = [];
  for (const [input, exit, status] of [[rows, 0, 'STRUCTURALLY_COMPLETE_SCOPE'],
    [[...rows].reverse(), 0, 'STRUCTURALLY_COMPLETE_SCOPE'], [reversedDates, 1, 'REJECTED']]) {
    const source = body(input); await writeFile(file, source);
    const run = spawnSync(process.execPath, args, { env, encoding: 'utf8', timeout: 10000 });
    assert.equal(run.status, exit); assert.equal(run.stderr, '');
    const report = JSON.parse(run.stdout); assert.equal(report.status, status); reports.push(report);
    assert.equal(await readFile(file, 'utf8'), source);
  }
  assert.deepEqual(reports[0], reports[1]);
  assert.deepEqual(reports[2], { schemaVersion: 'kasi-local-intake-report-v1', status: 'REJECTED', code: 'INTAKE_SOLAR_ORDER' });
}));
