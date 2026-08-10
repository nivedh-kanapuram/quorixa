// QUORIXA Audit — Phase 6: multi-document isolation (3 docs).
// A=photosynthesis-markers.pdf (KITE-AMP2), B=wwii-markers.pdf (COMET-B7X9),
// C=alpha-notes.txt (ALPHA-TXT-5Q2).
// Each question goes to a FRESH chat so history cannot leak markers.
// Also proves bilingual content (Telugu/Hindi) survives in note text.

const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const puppeteer = require(path.join(ROOT, 'frontend', 'node_modules', 'puppeteer-core'));
const BASE = 'http://localhost:5173';
const API = 'http://localhost:5000/api/v1';
const EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FX = path.join(ROOT, 'e2e', 'fixtures');

const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const check = (n, c, d = '') => { results.push({ n, pass: !!c }); console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${!c && d ? '  [' + String(d).slice(0, 150) + ']' : ''}`); };
const curl = (a) => execFileSync('curl.exe', a, { encoding: 'utf8' });
const apiAll = () => JSON.parse(curl(['-s', `${API}/library?limit=100`])).data.documents;
const apiGet = (name) => apiAll().find((d) => d.filename === name);

async function waitFor(pred, timeout = 20000, interval = 300) {
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
async function chatAsk(page, question, attempts = 4) {
  const ta = await page.waitForSelector('textarea', { timeout: 20000 });
  await ta.click({ clickCount: 3 });
  await ta.type(question);
  const sendBtn = await page.$('button[aria-label="Send message"]');
  if (sendBtn) await sendBtn.click(); else await ta.press('Enter');
  const done = await waitFor(async () => {
    if (await page.evaluate(() => !!document.querySelector('[aria-label="Quorixa is typing"]'))) return false;
    const t = await page.evaluate(() => document.body.innerText);
    return /source/i.test(t) || /could|sorry|busy|unavailable|rate/i.test(t);
  }, 180000, 4000);
  if (!done) return '';
  const body = await page.evaluate(() => document.body.innerText);
  if (/temporarily busy|rate limit/i.test(body) && attempts > 1) { await sleep(30000); return chatAsk(page, question, attempts - 1); }
  return body;
}
async function chatSelect(page, name) {
  await nav(page, `${BASE}/chat`);
  await waitFor(() => page.evaluate(() => document.querySelectorAll('button[aria-pressed]').length >= 3), 15000);
  await page.evaluate((n) => {
    for (const b of document.querySelectorAll('button[aria-pressed]')) if (b.innerText.includes(n)) b.click();
  }, name);
  return waitFor(() => page.evaluate((n) => /Studying:/.test(document.body.innerText) && document.body.innerText.includes(n), name), 8000);
}

(async () => {
  console.log('=== QUORIXA AUDIT — PHASE 6: ISOLATION (3 DOCS) ===');
  // Fresh library: A, B, C only
  for (const d of apiAll()) curl(['-s', '-X', 'DELETE', `${API}/library/${d.documentId}`]);
  const up = (f) => curl(['-s', '-X', 'POST', `${API}/documents/upload`, '-F', `file=@${path.join(FX, f)}`]);
  up('photosynthesis-markers.pdf'); up('wwii-markers.pdf'); up('alpha-notes.txt');
  for (const name of ['photosynthesis-markers.pdf', 'wwii-markers.pdf', 'alpha-notes.txt']) {
    await waitFor(() => { const d = apiGet(name); return d && d.status === 'Completed'; }, 120000);
  }
  console.log('(A, B, C uploaded and Completed)\n');

  const browser = await puppeteer.launch({ executablePath: EXE, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Scenario A: ask A about A's marker, in a fresh chat
  check('S1 A grounded: KITE-AMP2 found, no cross-leak', await chatSelect(page, 'photosynthesis-markers.pdf').then(() => chatAsk(page, 'Which QUORIXA marker is in the current document? Reply with the code only.')).then((a) => /KITE-AMP2/.test(a) && !/COMET-B7X9/.test(a)));

  // Scenario B: ask B about B's marker (fresh chat)
  check('S2 B grounded: COMET-B7X9 found, no cross-leak', await chatSelect(page, 'wwii-markers.pdf').then(() => chatAsk(page, 'Which QUORIXA marker is in the current document? Reply with the code only.')).then((a) => /COMET-B7X9/.test(a) && !/KITE-AMP2/.test(a)));

  // Scenario C: ask C about C's marker (fresh chat)
  check('S3 C grounded: ALPHA-TXT-5Q2 found', await chatSelect(page, 'alpha-notes.txt').then(() => chatAsk(page, 'Which QUORIXA marker is in the current document? Reply with the code only.')).then((a) => /ALPHA-TXT-5Q2/.test(a)));

  // Scenario D: while active on A, ask about B's marker -> must NOT fabricate
  check('S4 active A, question about B -> does not leak B', await chatSelect(page, 'photosynthesis-markers.pdf').then(() => chatAsk(page, 'What is the COMET marker code? Only answer from the current document; say NONE if not in the current document.')).then((a) => !/COMET-B7X9/.test(a) && /NONE|not|couldn/i.test(a)));

  // Scenario E: bilingual content check (Telugu + Hindi present in note text via API)
  const cDoc = apiGet('alpha-notes.txt');
  const cDetail = JSON.parse(curl(['-s', `${API}/library/${cDoc.documentId}`])).data;
  const txt = cDetail.text || cDetail.fullText || '';
  const hasTelugu = /[\u0C00-\u0C7F]/.test(txt);
  const hasHindi = /[\u0900-\u097F]/.test(txt);
  check('S5 bilingual text preserved (Telugu + Hindi in stored note)', hasTelugu && hasHindi, `telugu=${hasTelugu} hindi=${hasHindi}`);

  await browser.close();
  const passed = results.filter((r) => r.pass).length;
  console.log(`\nISOLATION: ${passed}/${results.length} passed`);
  process.exit(passed === results.length ? 0 : 1);
})().catch((e) => { console.error('CRASH', e); process.exit(2); });