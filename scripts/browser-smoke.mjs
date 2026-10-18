/**
 * Dependency-free real-Chromium E2E for the private loopback V0 app.
 * Uses Node 22's built-in WebSocket + Chrome DevTools Protocol.
 * Do not point this browser harness at a public service or real birth records.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeChartPreviewServer } from './chart-preview-web.mjs';

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const pickBrowser = () => [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
].find(path => path && existsSync(path));

async function launchBrowser(chrome, profile, origin) {
  const child = spawn(chrome, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
    '--remote-debugging-port=0', '--user-data-dir=' + profile, origin + '/',
  ], { stdio: 'ignore' });
  let port;
  for (let i = 0; i < 150; i++) {
    if (child.exitCode !== null) throw new Error('Chromium exited during startup: ' + child.exitCode);
    try {
      const file = await readFile(join(profile, 'DevToolsActivePort'), 'utf8');
      port = Number(file.split('\n')[0]);
      if (port > 0) break;
    } catch { /* Browser starting. */ }
    await pause(100);
  }
  if (!port) throw new Error('Chromium CDP DevToolsActivePort was not created');
  let page;
  for (let i = 0; i < 40; i++) {
    try {
      const tabs = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
      page = tabs.find(tab => tab.type === 'page' && tab.webSocketDebuggerUrl);
      if (page) break;
    } catch { /* Browser startup race. */ }
    await pause(100);
  }
  if (!page) throw new Error('No Chromium CDP page target');
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const item = pending.get(message.id);
    if (!item) return;
    pending.delete(message.id);
    clearTimeout(item.timeout);
    if (message.error) item.reject(new Error(JSON.stringify(message.error)));
    else item.resolve(message.result ?? {});
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error('CDP timed out: ' + method));
    }, 10000);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const output = await send('Runtime.evaluate', {
      expression, awaitPromise: true, returnByValue: true,
    });
    if (output.exceptionDetails) {
      throw new Error('Browser JavaScript error: ' + JSON.stringify(output.exceptionDetails));
    }
    return output.result?.value;
  };
  const until = async (expression, why) => {
    for (let i = 0; i < 120; i++) {
      if (await evaluate(expression)) return;
      await pause(75);
    }
    throw new Error('Browser condition not reached: ' + why);
  };
  await send('Page.enable');
  await send('Runtime.enable');
  return { child, socket, send, evaluate, until };
}

async function run() {
  const binary = pickBrowser();
  if (!binary) throw new Error('Real Chromium/Google Chrome binary is required; no mock browser fallback');
  const profile = await mkdtemp(join(tmpdir(), 'manseryeok-browser-smoke-'));
  const server = makeChartPreviewServer();
  let browser;
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const origin = 'http://127.0.0.1:' + server.address().port;
    browser = await launchBrowser(binary, profile, origin);
    const { send, evaluate, until } = browser;
    await send('Emulation.setDeviceMetricsOverride', {
      width: 360, height: 780, deviceScaleFactor: 1, mobile: true,
    });
    await until("document.readyState === 'complete' && !!document.getElementById('birth-form')",
      'V0 app loaded over real localhost HTTP');
    assert.equal(await evaluate("document.querySelectorAll('.candidate').length"), 0);
    assert.equal(await evaluate("document.querySelector('#rollover').value"), '');

    // First computation uses real HTML form submission, native browser fetch and live Node API.
    await evaluate("document.getElementById('example').click(); document.querySelector('#birth-form button[type=submit]').click()");
    await until("document.querySelectorAll('.candidate').length === 1", 'Gregorian chart rendered');
    const primary = await evaluate("Array.from(document.querySelectorAll('.candidate .pillar strong'), e => e.textContent)");
    assert.deepEqual(primary.slice(0, 2), ['丁未', '壬寅']);
    assert.equal(primary.length, 4);

    // U1 EP0 evidence is a native accessible disclosure; provenance comes from the engine DTO.
    assert.equal(await evaluate("document.querySelector('#calculation-evidence')?.open"), false);
    await evaluate("document.querySelector('#calculation-evidence summary').focus()");
    await send('Input.dispatchKeyEvent', {
      type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13,
      nativeVirtualKeyCode: 13,
    });
    await send('Input.dispatchKeyEvent', {
      type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13,
      nativeVirtualKeyCode: 13,
    });
    await until("document.querySelector('#calculation-evidence')?.open === true",
      'Keyboard Enter opens calculation evidence');
    const evidence = await evaluate("document.querySelector('#calculation-evidence').textContent");
    assert.match(evidence, /KR-KASI-CALENDAR-DATA/);
    assert.match(evidence, /자정\(00:00\)/);
    assert.match(evidence, /분 단위/);
    assert.doesNotMatch(evidence, /공식 인증 완료/);

    // Gregorian and equivalent Korean-lunar births produce identical four pillars.
    await evaluate(`(() => {
      const form=document.getElementById('birth-form');
      const lunar=form.querySelector('input[value="KOREAN_LUNAR"]');
      lunar.checked=true;lunar.dispatchEvent(new Event('change',{bubbles:true}));
      const date=document.getElementById('birth-date');date.value='2026-12-29';
      date.dispatchEvent(new Event('input',{bubbles:true}));
      form.querySelector('button[type=submit]').click();
    })()`);
    await until("document.querySelectorAll('.candidate').length === 1", 'Korean lunar chart rendered');
    const fromLunar = await evaluate("Array.from(document.querySelectorAll('.candidate .pillar strong'),e=>e.textContent)");
    assert.deepEqual(fromLunar, primary);
    assert.match(await evaluate("document.querySelector('#calculation-evidence').textContent"),
      /음력 변환.*KR-KASI-CALENDAR-DATA/);

    // Boundary minute must preserve both correlated year/month candidates.
    await evaluate(`(() => {
      const form=document.getElementById('birth-form');
      const solar=form.querySelector('input[value="GREGORIAN"]');
      solar.checked=true;solar.dispatchEvent(new Event('change',{bubbles:true}));
      const date=document.getElementById('birth-date');date.value='2027-02-04';
      date.dispatchEvent(new Event('input',{bubbles:true}));
      const clock=document.getElementById('birth-time');clock.value='10:46';
      clock.dispatchEvent(new Event('input',{bubbles:true}));
      form.querySelector('button[type=submit]').click();
    })()`);
    await until("document.querySelectorAll('.candidate').length === 2", 'Lichun two candidates');
    assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.candidate .pillar:first-child strong'),e=>e.textContent)"),
      ['丙午', '丁未']);
    assert.match(await evaluate("document.querySelector('#calculation-evidence').textContent"),
      /두 후보 모두 검토/);

    // Input edits invalidate old candidates. Out-of-coverage dates cannot produce a story.
    await evaluate(`(() => {
      const date=document.getElementById('birth-date');date.value='2028-01-01';
      date.dispatchEvent(new Event('input',{bubbles:true}));
    })()`);
    assert.equal(await evaluate("document.querySelectorAll('.candidate').length"), 0);
    assert.match(await evaluate("document.querySelector('#output').textContent"), /다시 계산/);
    await evaluate("document.querySelector('#birth-form button[type=submit]').click()");
    await until("!!document.querySelector('#output .error')", 'out-of-coverage error');
    assert.match(await evaluate("document.querySelector('#output .error').textContent"), /범위를 벗어납니다/);
    assert.equal(await evaluate("document.querySelector('#calculation-evidence')"), null);

    // Mobile source/error layout must fit and expose native focusable controls.
    for (const width of [360, 390]) {
      await send('Emulation.setDeviceMetricsOverride', {
        width, height: 800, deviceScaleFactor: 1, mobile: true,
      });
      const measured = await evaluate('({innerWidth,scrollWidth:document.documentElement.scrollWidth})');
      assert.ok(measured.scrollWidth <= measured.innerWidth + 1,
        'Horizontal overflow at ' + width + 'px: ' + JSON.stringify(measured));
    }
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
    assert.equal(await evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches"), true);
    process.stdout.write('PASS real-Chromium V0/U1 EP0 browser smoke: local HTTP, Gregorian/lunar, Lichun, keyboard evidence, coverage, 360/390px, reduced-motion\n');
  } finally {
    if (browser) {
      try { browser.socket.close(); } catch { /* teardown */ }
      browser.child.kill();
    }
    await new Promise(resolve => server.close(resolve));
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
