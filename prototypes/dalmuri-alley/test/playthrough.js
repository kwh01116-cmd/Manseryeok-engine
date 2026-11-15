const { chromium } = require('playwright');
const fs = require('fs');
const which = process.argv[2] || 'tarot', sizes = (process.argv[3] || 'phone,desk').split(',');
const SZ = { phone: {width:400,height:780}, desk: {width:1280,height:720} };
(async () => {
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } : undefined;
  const browser = await chromium.launch({ proxy, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const name of sizes) {
    const ctx = await browser.newContext({ viewport: SZ[name], deviceScaleFactor: 1, ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type()==='error' || m.type()==='warning') errs.push(m.type() + ': ' + m.text().slice(0,200)); });
    await page.route('**/three.min.js', r => r.fulfill({ body: fs.readFileSync('node_modules/three/build/three.min.js'), contentType: 'application/javascript' }));
    await page.route('**/lunar.js', r => r.fulfill({ body: fs.readFileSync('node_modules/lunar-javascript/lunar.js'), contentType: 'application/javascript' }));
    const shot = n => page.screenshot({ path: `${which}-${name}-${n}.png` });
    const line = async (snap) => { await page.waitForSelector('#next:not([hidden])', {timeout:40000}); if (snap) await shot(snap); await page.click('#next', {force:true}); await page.waitForTimeout(60); };
    try {
    await page.goto('http://127.0.0.1:8765/test/page.html');
    await page.waitForSelector('.loading.done', {timeout: 30000});
    await page.waitForTimeout(1500); await shot('0-intro');
    await page.waitForSelector('#alleyUi:not([hidden])', {timeout: 60000}); await page.waitForTimeout(800); await shot('1-alley');
    if (which === 'saju') { await page.click('#nextBooth'); await page.waitForTimeout(3000); await shot('1b-focus'); }
    await page.click('#go');
    await page.waitForTimeout(2600); await shot('2-walk'); await page.waitForTimeout(1000); await shot('2b-curtain'); await page.waitForTimeout(800); await shot('2c-through');
    await page.waitForSelector('#roomUi:not([hidden])', {timeout: 60000});
    if (which === 'tarot') {
      await line('3-seat'); await line();
      await page.waitForSelector('#answer'); await page.click('.ask button[type=button]');
      await line();
      await page.waitForSelector('.opt'); await page.click('.opt:nth-child(1)');
      await line();
      await page.waitForTimeout(2200); await shot('4-riffle');
      await page.waitForSelector('.count', {timeout: 40000}); await page.waitForTimeout(1500); await shot('5-fan');
      const vp = SZ[name];
      let got = '';
      for (const fy of [0.3, 0.36, 0.42, 0.48]) { for (const fx of [0.38, 0.5, 0.62]) { await page.mouse.click(vp.width * fx, vp.height * fy); await page.waitForTimeout(120); } got = await page.evaluate(() => document.querySelector('.count span')?.textContent); if (got && !got.includes('0 /')) break; }
      console.log(which, name, 'after canvas clicks:', got);
      for (let k = 0; k < 3; k++) { const b = await page.$('.count button'); if (b) { await b.click().catch(()=>{}); await page.waitForTimeout(200); } }
      await page.waitForTimeout(1800);
      await line('6-three');
      for (let k = 0; k < 3; k++) { await line(k === 0 ? '7-flip' : null); await line(k === 0 ? '7b-meaning' : null); await line(); }
      await line('8-wrap'); await line(); await line(); await line(); await line();
      await page.waitForSelector('.opt'); await shot('9-end'); await page.click('.opt:nth-child(2)'); await line();
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
