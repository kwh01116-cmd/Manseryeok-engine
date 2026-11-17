// 그믐 골목(웹툰 컷) 통과 테스트.
//   node toon.js geumeum [phone|desk]       LLM 없이 고정 대본
//   node toon.js geumeum-llm [phone|desk]   가짜 sample로 LLM 대화 경로
//   node toon.js geumeum-crisis             위급한 말이 나오면 역할을 벗고 109 안내 → 골목 고르기로
//   node toon.js hub                        골목 고르기 ↔ 포차 골목 오가기
//   node toon.js gunghap [phone|desk]       커플 궁합(단·청), LLM 없이. 상대는 태어난 시를 모르는 걸로
//   node toon.js gunghap-llm [phone|desk]   커플 궁합, 가짜 sample로
// img/gm_*.webp가 아직 없으면 그 자리에 이름이 적힌 빈 그림을 대신 넣어 화면 짜임만 본다.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const { fakeSample } = require('./playthrough.js');
const which = process.argv[2] || 'geumeum', sizes = (process.argv[3] || 'phone').split(',');
const SZ = { phone: { width: 400, height: 780 }, desk: { width: 1280, height: 720 } };
const ph = name => {
  const tall = /alley|gate|room|brush|ohaeng/.test(name), h = tall ? 1536 : 1024, hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 ${h}"><rect width="1024" height="${h}" fill="hsl(${hue} 35% 22%)"/><circle cx="512" cy="${h * .37}" r="150" fill="hsl(${hue} 40% 40%)"/><rect x="205" y="${h * .27}" width="614" height="${h * .46}" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="4"/><text x="512" y="${h / 2}" font-size="72" fill="#fff" fill-opacity=".8" text-anchor="middle" font-family="sans-serif">${name}</text></svg>`;
};
(async () => {
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } : undefined;
  const browser = await chromium.launch({ proxy, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const name of sizes) {
    const ctx = await browser.newContext({ viewport: SZ[name], deviceScaleFactor: 1, ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    if (/-llm$|-crisis$/.test(which)) await page.addInitScript(fakeSample, which);
    // COOKIE=2 또는 3: 그 쿠키 컷이 나오게 지난 그믐의 기록을 미리 넣는다
    if (process.env.COOKIE) await page.addInitScript(n => { try { localStorage.setItem('geumeum-cookie', JSON.stringify({ idx: 0, n: n - 1 })); } catch (e) { /* 없으면 첫 토막 */ } }, +process.env.COOKIE);
    const errs = [], fake = new Set();
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 200)); });
    await page.route('**/three.min.js', r => r.fulfill({ body: fs.readFileSync('node_modules/three/build/three.min.js'), contentType: 'application/javascript' }));
    await page.route('**/lunar.js', r => r.fulfill({ body: fs.readFileSync('node_modules/lunar-javascript/lunar.js'), contentType: 'application/javascript' }));
    await page.route('**/img/gm_*.webp', r => {
      const f = path.basename(new URL(r.request().url()).pathname);
      if (fs.existsSync(path.join(__dirname, '..', 'img', f))) return r.continue();
      fake.add(f); return r.fulfill({ body: ph(f.replace(/^gm_|\.webp$/g, '')), contentType: 'image/svg+xml' });
    });
    const shot = n => page.screenshot({ path: `${which}-${name}-${n}.png` });
    const has = sel => page.$(sel);
    let n = 0;
    // 지금 보이는 데서 끝까지 한 화면씩 내려가며 찍는다
    const readDown = async () => {
      for (let k = 0; k < 40; k++) {
        await page.waitForTimeout(900); await shot(String(n++).padStart(2, '0'));
        const left = await page.evaluate(() => { const s = document.querySelector('#toonScroll'), o = document.querySelector('#toonOpts'), last = o.childElementCount ? o : document.querySelector('#strip'); const gap = last.getBoundingClientRect().bottom - s.getBoundingClientRect().bottom; if (gap > 4) s.scrollBy(0, Math.min(gap + 30, s.clientHeight * .85)); return gap; });
        if (left <= 4) break;
      }
    };
    try {
      await page.goto('http://127.0.0.1:8765/test/page.html');
      await page.waitForSelector('#hub:not([hidden])', { timeout: 30000 });
      if (which === 'hub') {      // 포차 골목에 들어갔다가 나오고, 다시 들어간다
        await page.click('#dailyBtn'); await page.waitForSelector('#dailyOpen:not([hidden])'); await page.waitForTimeout(700); await shot('daily');
        console.log(which, name, 'daily', await page.textContent('#dailyHead'));
        for (let k = 0; k < 2; k++) {
          await page.click('.hub-card[data-id="pocha"]');
          await page.waitForSelector('#alleyUi:not([hidden])', { timeout: 120000 }); await page.waitForTimeout(700); await shot('alley' + k);
          if (k === 0) { await page.click('#toHub'); await page.waitForSelector('#hub:not([hidden])'); await page.waitForTimeout(700); await shot('hub-again'); }
        }
        throw { done: true };
      }
      await page.waitForSelector('.hub-card[data-id="geumeum"]:not(.locked)', { timeout: 20000 });
      await page.waitForTimeout(700); await shot('hub');
      await page.click('.hub-card[data-id="geumeum"]');
      await page.waitForSelector('#toon:not([hidden])', { timeout: 30000 });
      let opened = false, asked = 0, names = 0, births = 0;
      for (let guard = 0; guard < 60 && !(await has('#envOpen')); guard++) {
        // 입력 칸이 뜰 때까지 기다린다 (LLM 대기 중에는 건너뛰기 단추만 있다)
        await page.waitForFunction(() => { const o = document.querySelector('#toonOpts'); return o.querySelector('#envOpen, #by, input, .sug, :scope > .opt:not(.solo), #toonLeave'); }, null, { timeout: 60000 });
        await readDown();
        if (await has('#envOpen')) break;
        if (await has('#toonLeave')) throw new Error('편지 전에 끝났다');
        if (await has('#toonOpts #by')) {
          if (births++ === 0) { await page.fill('#by', '1990'); await page.selectOption('#bm', '5'); await page.selectOption('#bd', '15'); await page.fill('#bt', '14:30'); }
          else { await page.fill('#by', '1992'); await page.selectOption('#bm', '8'); await page.selectOption('#bd', '3'); await page.check('#bu'); }
          await page.click('#toonOpts .birth button[type=submit]');
        } else if (await has('#toonOpts input[maxlength="40"]')) { await page.fill('#toonOpts input', ['민지', '준호'][names++ % 2]); await page.press('#toonOpts input', 'Enter'); }
        else if (await page.$('#toonOpts button:has-text("둘 사이")')) await page.click(which.startsWith('gunghap') ? '#toonOpts button:has-text("둘 사이")' : '#toonOpts button:has-text("나 혼자")');
        else if (await page.$('#toonOpts button:has-text("이제 됐어요")')) {
          const first = await page.$('#toonOpts .sug, #toonOpts > .opt');
          if (asked++ < 1 && first) await first.click(); else await page.click('#toonOpts button:has-text("이제 됐어요")');
        } else if (!opened && await has('#toonOpts input[maxlength="200"]')) {
          opened = true;
          if (which === 'geumeum-crisis') {
            await page.fill('#toonOpts input', '요즘은 그냥 사라지고 싶어요'); await page.press('#toonOpts input', 'Enter');
            await page.waitForSelector('#strip .narr.notice'); await page.waitForSelector('#toonOpts > .opt'); await readDown();
            const notice = await page.evaluate(() => [...document.querySelectorAll('#strip .narr.notice')].map(e => e.textContent).join(' / '));
            console.log(which, name, 'notice', JSON.stringify({ has109: notice.includes('109'), boxes: (notice.match(/ \/ /g) || []).length + 1, calls: await page.evaluate(() => window.__calls) }));
            await page.click('#toonOpts > .opt');
            await page.waitForSelector('#hub:not([hidden])'); await shot('back');
            throw { done: true };
          }
          await page.fill('#toonOpts input', '지금 회사가 너무 버거워요'); await page.press('#toonOpts input', 'Enter');
        }
        else if (await has('#toonOpts .sug')) await page.click('#toonOpts .sug');
        else await page.click('#toonOpts > .opt');
        await page.waitForTimeout(350);
      }
      await readDown(); await page.click('#envOpen');
      await page.waitForSelector('#payOk', { state: 'visible' }); await shot('pay'); await page.click('#payOk');
      await page.waitForSelector('#report:not([hidden]) #view-letter:not([hidden])'); await page.waitForTimeout(300); await shot('letter');
      const rep = await page.evaluate(() => ({ text: document.querySelector('#report').dataset.plain, cls: document.querySelector('#sheet').className, calls: window.__calls || 0 }));
      if (process.env.DUMP) fs.writeFileSync(`${which}-${name}-letter.txt`, rep.text);     // DUMP=1: 편지와 풀이서 글 전체
      console.log(which, name, 'letter', JSON.stringify({ chars: rep.text.length, cls: rep.cls, calls: rep.calls, haoche: /하오|이오|소\.|구려|시오/.test(rep.text), banned: /대운|용신/.test(rep.text.split('=== 별지')[0]), book: (rep.text.split('=== 별지')[1] || '').length, head: rep.text.split('\n').slice(0, 5) }));
      // BOOK=장,장: 풀이서의 그 장으로 내려가 찍는다
      for (const id of (process.env.BOOK || '').split(',').filter(Boolean)) {
        const ok = await page.evaluate(id => { const sh = document.querySelector('#sheet'), e = document.getElementById('bk-' + id); if (!e) return false; sh.scrollTop = e.offsetTop - 8; return true; }, id);
        if (ok) { await page.waitForTimeout(250); await shot('book-' + id); }
      }
      await page.click('#repClose');
      await page.waitForSelector('#toonLeave', { timeout: 20000 }); await readDown();
      // 컷에 쓰인 그림 순서. CUTS=이름,이름 이면 그 컷만 따로 찍는다
      console.log(which, name, 'cuts', (await page.$$eval('#strip .cut > img', a => a.map(i => i.src.split('/').pop().replace(/^gm_|\.webp$/g, '')))).join(' '));
      for (const n of (process.env.CUTS || '').split(',').filter(Boolean)) {
        const e = await page.$(`#strip .cut:has(> img[src$="gm_${n}.webp"])`);
        if (e) { await e.scrollIntoViewIfNeeded(); await page.waitForTimeout(1500); await e.screenshot({ path: `${which}-${name}-cut-${n}.png` }); }
      }
      await page.click('#toonLeave');
      await page.waitForSelector('#hub:not([hidden])'); await page.waitForTimeout(600); await shot('back');
      if (await has('#hubLetters:not([hidden])')) { await page.click('#hubLetters'); await page.waitForSelector('#view-list:not([hidden]) .letter-item'); await shot('letters'); await page.click('#listClose'); }
    } catch (e) { if (!e.done) { await shot('FAIL'); errs.push('TEST STOPPED: ' + e.message.split('\n')[0]); } }
    const info = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, cuts: document.querySelectorAll('#strip .cut').length, bubs: document.querySelectorAll('#strip .bub').length, mode: document.querySelector('#hub').hidden ? 'not hub' : 'hub' }));
    console.log(which, name, JSON.stringify(info), 'shots', n, fake.size ? `(빈 그림 ${fake.size}장으로 대신함)` : '', errs.length ? errs : 'no errors');
    await ctx.close();
  }
  await browser.close();
})();
