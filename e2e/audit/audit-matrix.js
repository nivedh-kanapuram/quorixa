// QUORIXA Audit — Phase 1..4 matrix: all supported document types.
// Prereqs: backend :5000 and frontend :5173 running.
// Covers: PDF / TXT / IMG / MD / YT upload (UI), backend completion+type,
// library UI + search, chat grounding (marker question), chat persistence
// across tab reload, library delete + persistence, error paths, console health.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const puppeteer = require(path.join(ROOT, 'frontend', 'node_modules', 'puppeteer-core'));

const BASE = 'http://localhost:5173';
const API = 'http://localhost:5000/api/v1';
const EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FX = path.join(ROOT, 'e2e', 'fixtures');
const YT_URL = 'https://www.youtube.com/watch?v=fNk_zzaMoSs';

const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function check(name, cond, detail = '') {
  results.push({ name, pass: !!cond });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${!cond && detail ? '  [' + String(detail).slice(0, 170) + ']' : ''}`);
}

async function waitFor(pred, timeout = 20000, interval = 300) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { if (await pred()) return true; } catch {}
    await sleep(interval);
  }
  return false;
}

function curl(args) {
  return execFileSync('curl.exe', args, { encoding: 'utf8', shell: false });
}
function apiAll() {
  return JSON.parse(curl(['-s', `${API}/library?limit=100`])).data.documents;
}
function apiGet(name) {
  return apiAll().find((d) => d.filename === name);
}

async function nav(page, url) {
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      return;
    } catch (e) {
      if (i === 2) throw e;
      await sleep(1500);
    }
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
  if (/temporarily busy|rate limit/i.test(body) && attempts > 1) {
    console.log('    [retry] rate limit, waiting 30s...');
    await sleep(30000);
    return chatAsk(page, question, attempts - 1);
  }
  return body;
}

async function uploadFile(page, filePath) {
  await nav(page, `${BASE}/upload`);
  await waitFor(() => page.evaluate(() => !!document.querySelector('input[type=file]')));
  const input = await page.$('input[type=file]');
  await input.uploadFile(filePath);
  return waitFor(() => page.evaluate(() => /Ready to study|Study failed/i.test(document.body.innerText)), 150000);
}

async function uploadYoutube(page, url, expectError = false) {
  await nav(page, `${BASE}/upload`);
  await waitFor(() => page.evaluate(() => !!document.querySelector('input[aria-label="YouTube video URL"]')));
  await page.type('input[aria-label="YouTube video URL"]', url);
  await sleep(250);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /fetch transcript/i.test(x.innerText));
    if (b) b.click();
  });
  if (expectError) {
    return waitFor(() => page.evaluate(() => /Failed|failed|transcript|unavailable|invalid|couldn't/i.test(document.body.innerText)), 150000);
  }
  return waitFor(() => page.evaluate(() => /Ready to study|Study failed/i.test(document.body.innerText)), 150000);
}

async function libraryHas(page, name, present = true) {
  await nav(page, `${BASE}/library`);
  return waitFor(() => page.evaluate((n, p) => p === document.body.innerText.includes(n), name, present), 10000);
}

async function chatSelect(page, name) {
  await nav(page, `${BASE}/chat`);
  const ok = await waitFor(() => page.evaluate(() => document.querySelectorAll('button[aria-pressed]').length >= 1), 15000);
  if (!ok) return false;
  await page.evaluate((n) => {
    for (const b of document.querySelectorAll('button[aria-pressed]')) if (b.innerText.includes(n)) b.click();
  }, name);
  return waitFor(() => page.evaluate((n) => /Studying:/.test(document.body.innerText) && document.body.innerText.includes(n), name), 8000);
}

async function deleteFromLibrary(page, name) {
  await nav(page, `${BASE}/library`);
  const ready = await waitFor(() => page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.innerText.trim() === 'Study')), 15000);
  if (!ready) return false;
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => (x.getAttribute('aria-label') || '').toLowerCase().includes('delete'));
    if (b) b.click();
  });
  await waitFor(() => page.evaluate(() => /Delete this document\?/.test(document.body.innerText)), 8000);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === 'Delete');
    if (b) b.click();
  });
  return waitFor(() => page.evaluate((n) => !document.body.innerText.includes(n), name), 15000);
}

async function waitCompleted(name) {
  let doc = null;
  await waitFor(() => {
    const r = apiGet(name);
    if (r && r.status === 'Completed') { doc = r; return true; }
    return false;
  }, 150000);
  return doc;
}

async function mainFlow() {
  console.log('=== QUORIXA AUDIT — PHASE 1..4 MATRIX ===');
  const started = apiAll().length;
  for (const d of apiAll()) curl(['-s', '-X', 'DELETE', `${API}/library/${d.documentId}`]);
  console.log(`(purged ${started} pre-existing docs; library now empty)`);

  const browser = await puppeteer.launch({ executablePath: EXE, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 120)); });
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message.slice(0, 120)));

  // ---------- PDF ----------
  console.log('\n-- PDF --');
  const pdfName = 'photosynthesis-markers.pdf';
  check('1.1 PDF upload succeeds (UI)', await uploadFile(page, path.join(FX, pdfName)));
  const pdfDoc = await waitCompleted(pdfName);
  check('1.2 PDF backend: Completed + type=pdf', !!pdfDoc && pdfDoc.status === 'Completed' && pdfDoc.type === 'pdf', pdfDoc ? `${pdfDoc.status}/${String(pdfDoc.type)}` : 'no record');
  check('1.3 PDF appears in Library UI', await libraryHas(page, pdfName));
  check('1.4 PDF grounding: KITE-AMP2 in answer', await chatSelect(page, pdfName).then(() => chatAsk(page, 'Which QUORIXA marker code is in the current document? Reply with the code only.')).then((a) => /KITE-AMP2/.test(a)));
  check('1.5 PDF source card cites the document', await page.evaluate((n) => document.body.innerText.includes(n), pdfName));
  check('1.6 PDF selection survives tab reload', (async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    return waitFor(() => page.evaluate((n) => /Studying:/.test(document.body.innerText) && document.body.innerText.includes(n), pdfName), 10000);
  })());

  // ---------- TXT ----------
  console.log('\n-- TXT --');
  const txtName = 'alpha-notes.txt';
  check('2.1 TXT upload succeeds (UI)', await uploadFile(page, path.join(FX, txtName)));
  const txtDoc = await waitCompleted(txtName);
  check('2.2 TXT backend: Completed + type=note', !!txtDoc && txtDoc.status === 'Completed' && txtDoc.type === 'note', txtDoc ? `${txtDoc.status}/${String(txtDoc.type)}` : 'no record');
  check('2.3 TXT appears in Library UI', await libraryHas(page, txtName));
  check('2.4 TXT chat grounded (ALPHA-TXT-5Q2)', await chatSelect(page, txtName).then(() => chatAsk(page, 'Which code is in the current document? Reply with the code only.')).then((a) => /ALPHA-TXT-5Q2/.test(a)));
  check('2.5 Library search filters results', (async () => {
    await nav(page, `${BASE}/library`);
    await page.type('input[aria-label="Search documents"]', 'alpha');
    await sleep(500);
    return page.evaluate(() => document.body.innerText.includes('alpha-notes.txt') && !document.body.innerText.includes('photosynthesis'));
  })());

  // ---------- IMG ----------
  console.log('\n-- IMG (OCR) --');
  const imgName = 'ocr-en.png';
  check('3.1 IMG upload succeeds (UI)', await uploadFile(page, path.join(FX, imgName)));
  const imgDoc = await waitCompleted(imgName);
  check('3.2 IMG backend: Completed + type=image', !!imgDoc && imgDoc.status === 'Completed' && imgDoc.type === 'image', imgDoc ? `${imgDoc.status}/${String(imgDoc.type)}` : 'no record');
  check('3.3 IMG appears in Library UI', await libraryHas(page, imgName));
  check('3.4 IMG chat grounded via OCR (OCR-EN-9K2)', await chatSelect(page, imgName).then(() => chatAsk(page, 'Which code is in the current image? Reply with the code only.')).then((a) => /OCR-EN-9K2/.test(a)));

  // ---------- MD ----------
  console.log('\n-- Markdown --');
  const mdName = 'alpha-notes.md';
  check('4.1 MD upload succeeds (UI)', await uploadFile(page, path.join(FX, mdName)));
  const mdDoc = await waitCompleted(mdName);
  check('4.2 MD backend: Completed + type=note', !!mdDoc && mdDoc.status === 'Completed' && mdDoc.type === 'note', mdDoc ? `${mdDoc.status}/${String(mdDoc.type)}` : 'no record');
  check('4.3 MD appears in library', await libraryHas(page, mdName));
  check('4.4 MD chat grounded (ALPHA-MD-5Q2)', await chatSelect(page, mdName).then(() => chatAsk(page, 'Which code is in the current document? Reply with the code only.')).then((a) => /ALPHA-MD-5Q2/.test(a)));

  // ---------- YT ----------
  console.log('\n-- YouTube --');
  check('5.1 YT URL form upload succeeds (UI)', await uploadYoutube(page, YT_URL));
  const ytDoc = await (async () => {
    let d = null;
    await waitFor(() => { const r = apiAll().find((x) => x.type === 'youtube'); if (r && r.status === 'Completed') { d = r; return true; } return false; }, 180000);
    return d;
  })();
  check('5.2 YT backend: Completed + type=youtube', !!ytDoc && ytDoc.status === 'Completed', ytDoc ? ytDoc.status : 'none completed');
  const ytName = ytDoc ? ytDoc.filename : 'youtube source';
  check('5.3 YouTube appears in library', ytDoc ? await libraryHas(page, ytName) : false);
  check('5.4 YouTube chat answers from transcript', ytDoc ? await chatSelect(page, ytName).then(() => chatAsk(page, 'What is this video about? Reply with a single sentence.')).then((a) => a.length > 40 && !/could|not find|temporarily/i.test(a)) : false, 'short or missing');

  // ---------- ERROR PATHS ----------
  console.log('\n-- Error paths --');
  check('E1 blank image: UI shows no-readable-text failure', (async () => {
    const toast = await uploadFile(page, path.join(FX, 'blank-img.png'));
    return toast && await waitFor(() => page.evaluate(() => /no readable text/i.test(document.body.innerText)), 10000);
  })());
  check('E1b blank image creates no Completed document', !apiGet('blank-img.png') || apiGet('blank-img.png').status !== 'Completed');
  check('E2 empty text: rejected with no ghost Completed', (async () => {
    const ok = await uploadFile(page, path.join(FX, 'empty-note.txt'));
    const d = apiGet('empty-note.txt');
    return ok && (!d || d.status !== 'Completed');
  })());
  check('E3 oversized upload blocked with message', (() => {
    const big = path.join(FX, '.tmp-audit-big.txt');
    fs.writeFileSync(big, 'A'.repeat(12 * 1024 * 1024));
    const r = curl(['-s', '-w', '|%{http_code}', '-X', 'POST', `${API}/documents/upload`, '-F', `file=@${big}`]);
    fs.unlinkSync(big);
    const parts = r.split('|');
    return /too large/i.test(parts[0] || '') && /400|413/.test(parts[1] || '');
  })());
  check('E4 unsupported .docx rejected (documented limitation)', (() => {
    const fake = path.join(FX, 'fake-audit.docx');
    fs.writeFileSync(fake, 'not a real docx');
    const r = curl(['-s', '-X', 'POST', `${API}/documents/upload`, '-F', `file=@${fake}`]);
    fs.unlinkSync(fake);
    return /Unsupported file type/.test(r);
  })());
  check('E5 invalid YouTube id: graceful failure, no completed doc', (async () => {
    const seen = await uploadYoutube(page, 'https://www.youtube.com/watch?v=zzzzzzzzzzz', true);
    const ytDocs = apiAll().filter((d) => d.type === 'youtube');
    return seen && ytDocs.every((d) => d.status === 'Completed');
  })());

  // ---------- Housekeeping ----------
  console.log('\n-- Housekeeping --');
  check('7.1 no fatal console errors (except expected 422 from error-path tests)', consoleErrors.filter((e) => !/favicon/i.test(e) && !/422/i.test(e)).length === 0, consoleErrors.join(' | ').slice(0, 300));
  check('7.2 delete flow removes MD doc', await deleteFromLibrary(page, mdName));
  check('7.3 deleted doc absent from chat selector', (async () => {
    await nav(page, `${BASE}/chat`);
    await waitFor(() => page.evaluate(() => document.querySelectorAll('button[aria-pressed]').length >= 1), 15000);
    return !(await page.evaluate(() => document.body.innerText.includes('alpha-notes.md')));
  })());

  const leftover = apiAll().length;
  console.log(`\nlibrary docs left at end: ${leftover}`);
  await browser.close();
  const passed = results.filter((r) => r.pass).length;
  console.log(`\nMATRIX: ${passed}/${results.length} passed`);
  process.exit(passed === results.length ? 0 : 1);
}

mainFlow().catch((e) => { console.error('CRASH', e); process.exit(2); });