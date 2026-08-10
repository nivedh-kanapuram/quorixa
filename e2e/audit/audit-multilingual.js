// QUORIXA Audit - multilingual RAG verification (Phase 8).
// Telugu + Hindi PDFs/pages uploaded; chat grounded per document with fresh
// chat sessions; also verifies OCR-extracted text round-trips to the RAG layer.
// Usage: node e2e/audit/audit-multilingual.js  (backend:5000 + frontend:5173 up)

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
const check = (n, c, d = '') => {
  results.push({ n, pass: !!c });
  console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${!c && d ? '  [' + String(d).slice(0, 200) + ']' : ''}`);
  return c;
};
const curl = (a) => execFileSync('curl.exe', a, { encoding: 'utf8' });
const lastAnswer = (body, question) => {
  const at = body.lastIndexOf(question);
  return (at === -1 ? body : body.slice(at + question.length)).replace(/\s+/g, ' ');
};
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
  if (/temporarily busy|rate limit/i.test(body) && attempts > 1) {
    await sleep(30000);
    return chatAsk(page, question, attempts - 1);
  }
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
  console.log('=== QUORIXA AUDIT - MULTILINGUAL RAG (Telugu + Hindi) ===');
  for (const d of apiAll()) curl(['-s', '-X', 'DELETE', `${API}/library/${d.documentId}`]);
  const up = (f) => curl(['-s', '-X', 'POST', `${API}/documents/upload`, '-F', `file=@${path.join(FX, f)}`]);
  up('telugu-real.png');
  up('hindi-real.png');
  for (const name of ['telugu-real.png', 'hindi-real.png']) {
    await waitFor(() => { const d = apiGet(name); return d && d.status === 'Completed'; }, 120000);
    check(`${name} uploaded+Completed`, !!apiGet(name) && apiGet(name).status === 'Completed');
  }
  console.log('(Telugu + Hindi docs uploaded)\n');

  const tel= JSON.parse(curl(['-s', `${API}/library/${apiGet('telugu-real.png').documentId}`])).data;
  const hin = JSON.parse(curl(['-s', `${API}/library/${apiGet('hindi-real.png').documentId}`])).data;
  check('Telugu OCR text stored (ఆంధ్రప్రదేశ్ present)', /ఆంధ్రప్రదేశ్|తెలంగాణ/.test(tel.text || ''),
    (tel.text || '').slice(0, 120).replace(/\s+/g, ' '));
  check('Hindi OCR text stored (राजभाषा present)', /राजभाषा|भारत/.test(hin.text || ''),
    (hin.text || '').slice(0, 120).replace(/\s+/g, ' '));

  const browser = await puppeteer.launch({ executablePath: EXE, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  check('M1 Telugu grounded answer stays in Telugu',
    await chatSelect(page, 'telugu-real.png').then(() => chatAsk(page, 'తెలుగు భాష ఏ రాష్ట్రాలలో మాట్లాడతారు? దస్త్రం నుండే సమాధానం ఇవ్వండి.'))
      .then((a) => /ఆంధ్రప్రదేశ్|తెలంగాణ/.test(a)));

  check('M2 Hindi grounded answer',
    await chatSelect(page, 'hindi-real.png').then(() => chatAsk(page, 'हिन्दी किसकी राजभाषा है? केवल इस दस्तावेज़ से उत्तर दें।'))
      .then((a) => /भारत/.test(a)));

  const q3 = 'ఆంధ్రప్రదేశ్ గురించి ఈ దస్త్రంలో ఏం ఉంది? దస్త్రంలో లేకపోతే NONE అని చెప్పండి.';
  check('M3 no leak: Hindi doc answers nothing about Telugu states',
    await chatSelect(page, 'hindi-real.png').then(() => chatAsk(page, q3))
      .then((a) => {
        const ans = lastAnswer(a, q3);
        console.log('--- M3 answer:', ans.slice(0, 160));
        return /NONE|couldn't find|could not|not found|not mentioned/i.test(ans) && !/ఆంధ్రప్రదేశ్/.test(ans);
      }));

  const q4 = 'इस दस्तावेज़ में हिन्दी की राजभाषा का उल्लेख क्या है? यदि नहीं तो NONE।';
  check('M4 Telugu doc does not leak Hindi (राजभाषा absent)',
    await chatSelect(page, 'telugu-real.png').then(() => chatAsk(page, q4))
      .then((a) => {
        const ans = lastAnswer(a, q4);
        console.log('--- M4 answer:', ans.slice(0, 160));
        return /NONE|couldn't find|could not|not found|not mentioned/i.test(ans) && !/राजभाषा/.test(ans);
      }));

  await browser.close();
  const passed = results.filter((r) => r.pass).length;
  console.log(`\nMULTILINGUAL: ${passed}/${results.length} passed`);
  process.exit(passed === results.length ? 0 : 1);
})().catch((e) => { console.error('CRASH', e); process.exit(2); });