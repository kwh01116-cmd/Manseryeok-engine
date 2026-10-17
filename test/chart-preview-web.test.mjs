import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const script = fileURLToPath(new URL('../scripts/chart-preview-web.mjs', import.meta.url));
const sample = {
  calendar: 'GREGORIAN', date: '2027-02-05', time: '12:00',
  timeBasis: 'KOREAN_CIVIL_TIME', dayRollover: 'CIVIL_MIDNIGHT',
  hourStemReference: 'SELECTED_DAY_PILLAR',
};
async function start() {
  const child = spawn(process.execPath, [script], { env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  const origin = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Local HTTP startup timeout')), 8000);
    let stdout = '', stderr = '';
    child.stdout.on('data', chunk => {
      stdout += chunk.toString();
      const found = /http:\/\/127\.0\.0\.1:\d+/.exec(stdout);
      if (found) { clearTimeout(timer); resolve(found[0]); }
    });
    child.stderr.on('data', chunk => { stderr += chunk.toString(); });
    child.once('exit', code => { clearTimeout(timer); reject(new Error('Server exited ' + code + ': ' + stderr)); });
  });
  return { origin, stop: () => child.kill() };
}
async function submit(origin, data) {
  const r = await fetch(origin + '/api/preview', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  return { status: r.status, body: await r.json() };
}
test('V0 page loads and real solar/lunar chart outputs match', async () => {
  const server = await start();
  try {
    const page = await fetch(server.origin + '/');
    assert.equal(page.status, 200);
    assert.match(await page.text(), /나의 사주 원국/);
    const a = await submit(server.origin, sample);
    const b = await submit(server.origin, { ...sample, calendar: 'KOREAN_LUNAR', date: '2026-12-29', leap: false });
    assert.equal(a.status, 200);
    assert.equal(b.status, 200);
    assert.equal(a.body.status, 'OK');
    assert.deepEqual(a.body.preview.candidates, b.body.preview.candidates);
    assert.equal(a.body.preview.candidates[0].year.hangul, '정미');
    assert.equal(a.body.preview.coverage.validation, 'STRUCTURAL_COVERAGE_ONLY');
  } finally { server.stop(); }
});
test('V0 web preserves Lichun candidates and rejects invalid policies', async () => {
  const server = await start();
  try {
    const boundary = await submit(server.origin, { ...sample, date: '2027-02-04', time: '10:46' });
    assert.equal(boundary.status, 200);
    assert.equal(boundary.body.preview.candidates.length, 2);
    const bad = await submit(server.origin, { ...sample, dayRollover: '' });
    assert.equal(bad.status, 422);
    assert.equal(bad.body.status, 'ERROR');
    const extra = await submit(server.origin, { ...sample, unexpected: 'x' });
    assert.equal(extra.status, 422);
  } finally { server.stop(); }
});

test('V0 HTTP distinguishes out-of-coverage dates from invalid birth dates', async () => {
  const server = await start();
  try {
    for (const request of [
      { ...sample, date: '2028-01-01' },
      { ...sample, calendar: 'KOREAN_LUNAR', date: '2027-12-10', leap: false },
    ]) {
      const response = await submit(server.origin, request);
      assert.equal(response.status, 422);
      assert.equal(response.body.status, 'OUT_OF_COVERAGE');
    }
    const invalid = await submit(server.origin, { ...sample, date: '2027-02-30' });
    assert.equal(invalid.status, 422);
    assert.equal(invalid.body.status, 'ERROR');
  } finally { server.stop(); }
});
