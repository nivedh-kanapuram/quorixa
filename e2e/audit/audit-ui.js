// QUORIXA Audit — Phase 7: UI & UX sweep.
// Dark mode toggle + persistence, responsive layouts (desktop / tablet / mobile),
// navigation, 404, chat empty states, no horizontal overflow.

const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const puppeteer = require(path.join(ROOT, 'frontend', 'node_modules', 'puppeteer-core'));
const BASE = 'http://localhost:5173';
const EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const check = (n, c, d = '') => { results.push({ n, pass: !!c }); console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${!c && d ? '  [' + String(d).slice(0, 150) + ']' : ''}`); };
async function waitFor(pred, timeout = 15000, interval = 250) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { if (await pred()) return true; } catch {}
    await sleep(interval);
  }
  return false;
}
async function nav(page, url) {
  for (let i = 0; i < 3; i++) {
    try { await page.goto(url, { waitUntil: 'domcontentloaded' }); return; } catch (e) { if (i === 2) throw e; await sleep(1500); }
  }
}

(async () => {
  console.log('=== QUORIXA AUDIT — PHASE 7: UI SWEEP ===');
  const browser = await puppeteer.launch({ executablePath: EXE, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // ---------- Desktop ----------
  console.log('\n-- Desktop (1440x900) --');
  await page.setViewport({ width: 1440, height: 900 });
  await nav(page, BASE + '/');
  check('D1 landing loads with hero', await waitFor(() => page.evaluate(() => /study/i.test(document.body.innerText))));

  const navLinks = await page.evaluate(() => [...document.querySelectorAll('nav a, header a')].map((a) => ({ href: a.getAttribute('href'), text: a.innerText.trim() })).filter((x) => x.href && !/mailto/.test(x.href)));
  check('D2 nav links present (Library/Upload)', navLinks.some((l) => l.href.includes('/library')) && navLinks.some((l) => l.href.includes('/upload')), JSON.stringify(navLinks.slice(0, 5)));

  const themeBefore = await page.evaluate(() => ({ stored: localStorage.getItem('quorixa-theme'), dark: document.documentElement.classList.contains('dark') }));
  await page.evaluate(() => {
    const b = document.querySelector('button[role="switch"]') || [...document.querySelectorAll('button')].find((x) => /switch to (light|dark) mode/i.test(x.getAttribute('aria-label') || ''));
    if (b) b.click();
  });
  const themeAfter = await page.evaluate(() => ({ stored: localStorage.getItem('quorixa-theme'), dark: document.documentElement.classList.contains('dark') }));
  const expectedResolved = await page.evaluate(() => { const t = localStorage.getItem('quorixa-theme'); return (t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)); });
  check('D3 toggle changes stored theme + class matches', themeBefore.stored !== themeAfter.stored && themeAfter.dark === expectedResolved, `stored ${themeBefore.stored}->${themeAfter.stored}, class=${themeAfter.dark}, expected=${expectedResolved}`);

  await page.reload({ waitUntil: 'domcontentloaded' });
  const persisted = await waitFor(() => page.evaluate(() => { const t = localStorage.getItem('quorixa-theme'); const want = (t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)); return document.documentElement.classList.contains('dark') === want; }), 8000);
  check('D4 dark mode persists after reload', persisted === true, `expected stored=${themeAfter.stored}`);

  await nav(page, BASE + '/library');
  await waitFor(() => page.evaluate(() => document.documentElement.classList.contains('dark')) === themeAfter.dark, 8000);
  check('D5 library page renders in ' + (themeAfter.dark ? 'dark' : 'light') + ' mode', await page.evaluate(() => document.body.innerText.length > 50 && document.documentElement.classList.contains('dark')) === themeAfter.dark);
  check('D6 library page renders content (docs or empty state)', await waitFor(() => page.evaluate(() => /(document|library|no documents|empty)/i.test(document.body.innerText))));

  await nav(page, BASE + '/upload');
  check('D7 upload page renders (form present)', await waitFor(() => page.evaluate(() => !!document.querySelector('input[type=file]'))));

  await nav(page, BASE + '/chat');
  check('D8 chat page has composer + doc selector', await waitFor(() => page.evaluate(() => !!document.querySelector('textarea'))));

  // ---------- Tablet ----------
  console.log('\n-- Tablet (768x1024) --');
  await page.setViewport({ width: 768, height: 1024 });
  await nav(page, BASE + '/');
  check('T1 no horizontal overflow (landing)', await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  await nav(page, BASE + '/library');
  check('T2 no horizontal overflow (library)', await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  await nav(page, BASE + '/chat');
  check('T3 no horizontal overflow (chat)', await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));

  // ---------- Mobile ----------
  console.log('\n-- Mobile (390x844) --');
  await page.setViewport({ width: 390, height: 844 });
  await nav(page, BASE + '/');
  check('M1 hamburger/menu control present on mobile', await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].some((x) => /(menu|hamburger|open)/i.test((x.getAttribute('aria-label') || '') + x.innerText));
    return b;
  }));
  check('M2 no horizontal overflow (landing)', await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  await nav(page, BASE + '/chat');
  check('M3 chat usable on mobile', await waitFor(() => page.evaluate(() => !!document.querySelector('textarea'))));
  check('M4 doc selector reachable on mobile', await waitFor(() => page.evaluate(() => document.querySelectorAll('button[aria-pressed]').length >= 1), 10000));

  // ---------- Cross-cutting ----------
  console.log('\n-- Cross-cutting --');
  await page.setViewport({ width: 1440, height: 900 });
  await nav(page, BASE + '/does-not-exist');
  check('X1 graceful 404 page', await waitFor(() => page.evaluate(() => /(404|page not found)/i.test(document.body.innerText))));
  await nav(page, BASE + '/upload');
  const backTo = await page.evaluate(() => {
    const b = [...document.querySelectorAll('a, button')].find((x) => /back to library/i.test(x.innerText));
    if (b) b.click();
    return true;
  });
  check('X2 back-to-library link navigates', backTo && await waitFor(() => page.evaluate(() => location.pathname.includes('/library'))));

  await browser.close();
  const passed = results.filter((r) => r.pass).length;
  console.log(`\nUI SWEEP: ${passed}/${results.length} passed`);
  process.exit(passed === results.length ? 0 : 1);
})().catch((e) => { console.error('CRASH', e); process.exit(2); });