const { chromium } = require('playwright');
const fs = require('fs');
// tarot-llm: 가짜 sample로 LLM 대화 경로. tarot-deny: 첫 호출이 not_granted로 거절되면 고정 대본으로 넘어가는지
const which = process.argv[2] || 'tarot', booth = which.startsWith('tarot') ? 'tarot' : which, sizes = (process.argv[3] || 'phone,desk').split(',');
const SZ = { phone: {width:400,height:780}, desk: {width:1280,height:720} };
(async () => {
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } : undefined;
  const browser = await chromium.launch({ proxy, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const name of sizes) {
    const ctx = await browser.newContext({ viewport: SZ[name], deviceScaleFactor: 1, ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    if (which !== booth) await page.addInitScript(fakeSample, which);
    const errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type()==='error' || m.type()==='warning') errs.push(m.type() + ': ' + m.text().slice(0,200)); });
    await page.route('**/three.min.js', r => r.fulfill({ body: fs.readFileSync('node_modules/three/build/three.min.js'), contentType: 'application/javascript' }));
    await page.route('**/lunar.js', r => r.fulfill({ body: fs.readFileSync('node_modules/lunar-javascript/lunar.js'), contentType: 'application/javascript' }));
    const shot = n => page.screenshot({ path: `${which}-${name}-${n}.png` });
    const pickCards = async () => {
      const vp = SZ[name];
      let got = '';
      for (const fy of [0.3, 0.36, 0.42, 0.48]) { for (const fx of [0.38, 0.5, 0.62]) { await page.mouse.click(vp.width * fx, vp.height * fy); await page.waitForTimeout(120); } got = await page.evaluate(() => document.querySelector('.count span')?.textContent); if (got && !got.includes('0 /')) break; }
      console.log(which, name, 'after canvas clicks:', got);
      for (let k = 0; k < 3; k++) { const b = await page.$('.count button'); if (b) { await b.click().catch(()=>{}); await page.waitForTimeout(200); } }
    };
    // 대사를 넘기며 selector가 나올 때까지 (LLM 대기 중에는 ▼가 없으니 기다린다)
    const until = async (sel, ms = 90000) => {
      const end = Date.now() + ms;
      while (Date.now() < end) {
        if (await page.$(sel)) return;
        const n = await page.$('#next:not([hidden])');
        if (n) { await n.click({ force: true }).catch(() => {}); await page.waitForTimeout(80); } else await page.waitForTimeout(150);
      }
      throw new Error('never saw ' + sel);
    };
    const line = async (snap) => { await page.waitForSelector('#next:not([hidden])', {timeout:40000}); if (snap) await shot(snap); await page.click('#next', {force:true}); await page.waitForTimeout(60); };
    try {
    await page.goto('http://127.0.0.1:8765/test/page.html');
    await page.waitForSelector('.loading.done', {timeout: 30000});
    await page.waitForTimeout(1500); await shot('0-intro');
    await page.waitForSelector('#alleyUi:not([hidden])', {timeout: 60000}); await page.waitForTimeout(800); await shot('1-alley');
    if (booth !== 'tarot') { await page.click(which === 'saju' ? '#prev' : '#nextBooth'); await page.waitForTimeout(3000); await shot('1b-focus'); }
    await page.click('#go');
    await page.waitForTimeout(2600); await shot('2-walk'); await page.waitForTimeout(1000); await shot('2b-curtain'); await page.waitForTimeout(800); await shot('2c-through');
    await page.waitForSelector('#roomUi:not([hidden])', {timeout: 60000});
    if (which !== booth) {
      await line('3-seat'); await line();
      await page.waitForSelector('#answer'); await page.fill('#answer', '민지'); await page.click('.ask button[type=submit]');
      await line();
      await page.waitForSelector('.ask #answer'); await page.fill('#answer', '이직을 해야 할지 고민이에요. 지금 회사가 너무 버거워요'); await shot('4-free');
      await page.click('.ask button[type=submit]'); await page.waitForTimeout(150); await shot('4b-think');
      if (which === 'tarot-llm') {
        await until('.sugs'); await shot('4c-chips'); await page.click('.sugs .opt:nth-child(1)');
        await until('.ask #answer'); await page.fill('#answer', '팀장님이 매일 야근을 시켜서 지쳤어요'); await page.click('.ask button[type=submit]');
      }
      await until('.count'); await pickCards();
      await page.waitForTimeout(1800);
      if (which === 'tarot-llm') {
        await until('.ask #answer'); await shot('7-followup'); await page.fill('#answer', '그럼 언제 옮기는 게 좋을까요?'); await page.click('.ask button[type=submit]');
        await until('.ask #answer'); await page.click('.ask button[type=button]');
      }
      await until('#envOpen'); await page.waitForTimeout(900); await shot('8b-env'); await page.click('#envOpen');
      await page.waitForSelector('#report:not([hidden])'); await page.waitForTimeout(300); await shot('8c-report');
      const rep = await page.evaluate(() => { const s = document.querySelector('#sheet'); s.scrollTop = 99999; return { text: document.querySelector('#report').dataset.plain, sw: s.scrollWidth, cw: s.clientWidth, calls: window.__calls }; });
      await page.waitForTimeout(200); await shot('8d-report-end');
      console.log(which, name, 'report', JSON.stringify({ chars: rep.text.length, quote: (rep.text.match(/「[^」]*」/) || [''])[0], fun: rep.text.includes('재미로 보는'), sheetScroll: rep.sw - rep.cw, calls: rep.calls }));
      await page.click('#repClose');
      await until('#opts .opt:nth-child(2)'); await page.click('#opts .opt:nth-child(2)'); await line();
    } else if (which === 'tarot') {
      await line('3-seat'); await line();
      await page.waitForSelector('#answer'); await page.click('.ask button[type=button]');
      await line();
      await page.waitForSelector('.opt'); await page.click('.opt:nth-child(1)');
      await line();
      await page.waitForTimeout(2200); await shot('4-riffle');
      await page.waitForSelector('.count', {timeout: 40000}); await page.waitForTimeout(1500); await shot('5-fan');
      await pickCards();
      await page.waitForTimeout(1800);
      await line('6-three');
      for (let k = 0; k < 3; k++) { await line(k === 0 ? '7-flip' : null); await line(k === 0 ? '7b-meaning' : null); await line(); }
      await line('8-wrap'); await line(); await line(); await line(); await line(); await line();
      await page.waitForSelector('#envOpen'); await page.waitForTimeout(900); await shot('8b-env'); await page.click('#envOpen');
      await page.waitForSelector('#report:not([hidden])'); await page.waitForTimeout(300); await shot('8c-report'); await page.click('#repClose');
      await page.waitForSelector('.opt'); await shot('9-end'); await page.click('.opt:nth-child(2)'); await line();
    } else if (which === 'star') {
      await line('3-seat'); await line();
      await page.waitForSelector('#sm'); await page.selectOption('#sm', '5'); await page.selectOption('#sd', '15'); await shot('4-form');
      await page.click('.birth button[type=submit]');
      await line('5-paper'); await line('6-element'); await line();
      await page.waitForSelector('.opt'); await shot('7-ask'); await page.click('.opt:nth-child(1)'); await line();
      await page.waitForSelector('.opt'); await page.click('.opt:nth-child(4)');
      await line(); await line();
    } else {
      await line('3-seat'); await line();
      await page.waitForSelector('#by'); await page.fill('#by', '1990'); await page.selectOption('#bm', '5'); await page.selectOption('#bd', '15'); await page.fill('#bt', '14:30'); await shot('4-form');
      await page.click('.birth button[type=submit]');
      await line('5-paper');
      await line('6-daymaster'); await line(); await line(); await line();
      await page.waitForSelector('.opt'); await shot('7-ask'); await page.click('.opt:nth-child(1)'); await line();
      await page.waitForSelector('.opt'); await page.click('.opt:nth-child(4)');
      await line(); await line();
    }
    await page.waitForSelector('#alleyUi:not([hidden])', {timeout: 60000}); await page.waitForTimeout(500); await shot('10-back');
    } catch (e) { await shot('FAIL'); errs.push('TEST STOPPED: ' + e.message.split('\n')[0]); }
    const info = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, chip: document.querySelector('#chip').textContent, line: document.querySelector('#line').textContent.slice(0,40) }));
    console.log(which, name, JSON.stringify(info), errs.length ? errs : 'no errors');
    await ctx.close();
  }
  await browser.close();
})();

// 페이지에 넣는 가짜 window.claude. 지연 후 단계에 맞는 JSON을 돌려준다
function fakeSample(mode) {
  window.__calls = 0;
  const L = (a, b) => [a, b].filter(Boolean);
  const answer = p => {
    const stage = (p.match(/\[지금 단계\] (\S+)/) || [])[1];
    const cards = [...p.matchAll(/\d\. (지나온 자리|지금 자리|다가올 자리): ([^(]+) \((정방향|역방향)\)/g)].map(m => `${m[1]} · ${m[2].trim()} (${m[3]})`);
    if (stage === '문진') {
      const turn = +(p.match(/\[지금 단계\] 문진 (\d)/) || [])[1];
      return { lines: L(`버겁다는 말이 먼저 나오네요. 그만큼 오래 참았다는 거죠. (문진 ${turn})`), mood: 'think', question: turn < 3 ? (turn === 1 ? '버거운 게 일 자체예요, 사람이에요?' : '옮긴다면 뭐가 제일 겁나요?') : '', chips: ['일이 너무 많아요', '사람이 힘들어요', '둘 다요'], crisis: false };
    }
    if (stage === '풀이') return { cards: [0, 1, 2].map(i => ({ lines: L(`가짜 풀이 ${i + 1}: 버거운 마음이 이 자리에서 보여요. 무리하지 말라는 얘기죠.`, '자리 뜻과 엮으면 지금은 숨 고를 때예요.'), mood: i === 1 ? 'think' : 'neutral' })), summary: { lines: L('세 장을 이으면, 참는 데서 고르는 쪽으로 넘어가는 흐름이에요.', '서두르지 말고 하나씩 정리해요.'), mood: 'smile' }, chips: ['언제 옮기면 좋아요?', '버티면 나아져요?'], crisis: false };
    if (stage === '되묻기') return { lines: L('날짜를 딱 집어 줄 순 없어요. 다만 다가올 자리 카드는 정리하고 움직이라고 해요.'), mood: 'neutral', question: '', chips: ['정리부터 할게요'], crisis: false };
    if (stage === '레포트') {
      if (/레포트 앞부분/.test(p)) return { headline: '참던 자리에서 고르는 자리로 넘어가는 중이에요.', answer: cards.map(c => ({ text: '버거운 마음은 이 카드가 보여 주는 흐름과 맞닿아 있어요. 무리해서 버틸 일은 아니에요.', basis: c })), timing: [{ text: '올해 남은 동안은 정리하는 때예요.', basis: cards[1] }, { text: '내년에는 움직여 볼 만해요.', basis: cards[2] }] };
      return { cautions: cards.map(c => ({ text: '밤에 든 생각으로 결정하지 마요.', basis: c })), quote: { said: '지금 회사가 너무 버거워요', note: '버겁다는 말에 오늘 고민이 다 들어 있었어요.', basis: cards[1] }, next: ['옮길 곳을 고르는 기준', '지금 팀에서 버티는 법'] };
    }
    return {};
  };
  const sample = () => Promise.reject({ code: 'invalid_request', message: 'json only' });
  sample.json = (input, opts = {}) => new Promise((res, rej) => {
    window.__calls++;
    if (mode === 'tarot-deny') return setTimeout(() => rej({ code: 'not_granted', message: 'declined' }), 300);
    const t = setTimeout(() => res(answer(String(input))), 700);
    opts.signal?.addEventListener('abort', () => { clearTimeout(t); rej({ code: 'cancelled', message: 'aborted' }); });
  });
  window.claude = { use: name => Promise.resolve(name === 'sample' ? sample : null) };
}
