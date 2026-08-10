// QUORIXA — Final end-to-end test of the complete student flow.
// Prerequisites: backend (port 5000) and frontend (port 5173) running.
//   backend:  cd backend  && npm run dev
//   frontend: cd frontend && npm run dev
// Usage: node e2e/final-e2e.js   (from the repository root)
//
// Uploads the two fixture PDFs in e2e/fixtures (which contain the marker
// codes KITE-AMP2 and COMET-B7X9) and verifies grounding + isolation.
// Performs at most four AI generation calls.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const puppeteer = require(path.join(ROOT, 'frontend', 'node_modules', 'puppeteer-core'));

const BASE = process.env.QUORIXA_E2E_BASE || 'http://localhost:5173';
const API = process.env.QUORIXA_E2E_API || 'http://localhost:5000/api/v1';
const EXE =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const PDF_A = path.join(ROOT, 'e2e', 'fixtures', 'photosynthesis-markers.pdf');
const PDF_B = path.join(ROOT, 'e2e', 'fixtures', 'wwii-markers.pdf');
const NAME_A = 'photosynthesis-markers.pdf';
const NAME_B = 'wwii-markers.pdf';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(pred, timeout = 20000, interval = 300) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      if (await pred()) return true;
    } catch {}
    await sleep(interval);
  }
  return false;
}

function curl(args) {
  return execFileSync('curl.exe', args, { encoding: 'utf8', shell: false });
}

const results = [];
function check(name, cond, detail = '') {
  results.push({ name, pass: !!cond, detail });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${!cond && detail ? '  [' + detail + ']' : ''}`);
}

async function chatAsk(page, question, attempts = 3) {
  const ta = await page.waitForSelector('textarea');
  await ta.type(question);
  await page.click('button[aria-label="Send message"]');
  const done = await waitFor(async () => {
    const typing = await page.evaluate(
      () => !!document.querySelector('[aria-label="Quorixa is typing"]'),
    );
    if (typing) return false;
    const text = await page.evaluate(() => document.body.innerText);
    if (/source/i.test(text) || /could not|sorry|busy|unavailable/i.test(text)) return true;
    return false;
  }, 150000, 5000);
  if (!done) return '';
  const body = await page.evaluate(() => document.body.innerText);
  if (/temporarily busy|rate limit/i.test(body) && attempts > 1) {
    console.log('      [retry] AI provider rate limit hit, waiting and retrying...');
    await sleep(30000);
    return chatAsk(page, question, attempts - 1);
  }
  return body;
}

async function main() {
  // Start from a pristine library (only docs created by this test remain).
  const lib = JSON.parse(curl(['-s', `${API}/library?limit=100`]));
  for (const doc of lib.data.documents) {
    curl(['-s', '-X', 'DELETE', `${API}/library/${doc.documentId}`]);
  }

  console.log('=== QUORIXA FINAL E2E ===\n');
  const browser = await puppeteer.launch({
    executablePath: EXE,
    headless: 'new',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const consoleErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 150));
  });
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message.slice(0, 150)));

  // 1. Open application
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  check('1. Application opens (landing page)', await waitFor(() => page.evaluate(() => /study material/i.test(document.body.innerText))));

  // 2-4. Upload a real PDF through the UI; verify request hits the backend
  await page.goto(`${BASE}/upload`, { waitUntil: 'domcontentloaded' });
  await waitFor(() => page.evaluate(() => !!document.querySelector('input[type=file]')));
  const input = await page.$('input[type=file]');
  await input.uploadFile(PDF_A);
  check('2. Successful upload state rendered', await waitFor(() => page.evaluate(() => /Ready to study/i.test(document.body.innerText)), 30000));

  const docsAfterA = JSON.parse(curl(['-s', `${API}/library`])).data.documents;
  const docA = docsAfterA.find((d) => d.filename === NAME_A);
  check('3. Upload request reached the backend', !!docA && docA.status === 'Completed', docA ? docA.status : 'not found');
  check('4. No pre-existing / sample documents in library', docsAfterA.length === 1 && !/sample|demo/i.test(docsAfterA[0].filename), docsAfterA.map((d) => d.filename).join(', '));

  // 5. Open Library → the document is listed
  await page.goto(`${BASE}/library`, { waitUntil: 'domcontentloaded' });
  check('5. Uploaded document appears in Library', await waitFor(() => page.evaluate((n) => document.body.innerText.includes(n), NAME_A)));

  // 6-8. Library Study → chat preselection → grounded Q&A
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.innerText.trim() === 'Study').click());
  await waitFor(() => page.evaluate(() => location.pathname === '/chat'));
  check('6. Study opens Chat with the document preselected', await waitFor(() => page.evaluate(() => /Studying:/.test(document.body.innerText))));

  const ans1 = await chatAsk(page, 'Which QUORIXA marker is in the current document? Reply with the code only.');
  check('7. Answer is grounded in the document (KITE-AMP2)', /KITE-AMP2/.test(ans1) && !/couldn't find/i.test(ans1), ans1.slice(0, 90));
  check('8. Source card cites the document and chunk', await page.evaluate((n) => /Chunk 1/i.test(document.body.innerText) && document.body.innerText.includes(n), NAME_A));

  // 9-10. Second document (API-level to keep the flow short) → both listed
  const upB = JSON.parse(curl(['-s', '-X', 'POST', `${API}/documents/upload`, '-F', `file=@${PDF_B}`]));
  check('9. Second document uploads and completes', upB.success === true && upB.data.status === 'Completed', upB.message || '');
  await page.goto(`${BASE}/library`, { waitUntil: 'domcontentloaded' });
  check('10. Both documents listed in Library', await waitFor(() => page.evaluate((n1, n2) => document.body.innerText.includes(n1) && document.body.innerText.includes(n2), NAME_A, NAME_B)));

  // 11-16. Document-scoped retrieval with the single-active-document UX
  // (each scenario uses a FRESH conversation so the model cannot repeat
  // markers it already saw in chat history). The library is sorted
  // newest-first, so the default active document is B (right after upload).
  await page.goto(`${BASE}/chat`, { waitUntil: 'domcontentloaded' });
  await waitFor(() => page.evaluate(() => document.querySelectorAll('button[aria-pressed]').length === 2));

  // Scenario A: newest document (B) is active by default
  await sleep(400);
  check('11. One active document (header + exactly one pressed)', await page.evaluate(() => {
    const pressed = [...document.querySelectorAll('button[aria-pressed]')].filter((b) => b.getAttribute('aria-pressed') === 'true').length;
    return pressed === 1 && /Studying: wwii-markers\.pdf/.test(document.body.innerText);
  }));
  const ans2 = await chatAsk(page, 'List the QUORIXA marker codes that appear in the current document.');
  check('12. Only doc B: COMET-B7X9 present', /COMET-B7X9/.test(ans2), ans2.slice(0, 90));
  check('13. Isolation: A marker NOT returned', !/KITE-AMP2/.test(ans2), ans2.slice(0, 90));

  // Scenario B: switch to doc A → header updates → grounded in A only
  await page.goto(`${BASE}/chat`, { waitUntil: 'domcontentloaded' });
  await waitFor(() => page.evaluate(() => document.querySelectorAll('button[aria-pressed]').length === 2));
  await page.evaluate((n) => {
    for (const b of document.querySelectorAll('button[aria-pressed]')) {
      if (b.innerText.includes(n)) b.click();
    }
  }, NAME_A);
  await sleep(400);
  check('14. Switching to A updates header and active state', await page.evaluate(() => /Studying: photosynthesis-markers\.pdf/.test(document.body.innerText)));
  const ans3 = await chatAsk(page, 'List the marker codes in the current document.');
  check('15. Only doc A: B marker absent, A marker present', !/COMET-B7X9/.test(ans3) && /KITE-AMP2/.test(ans3), ans3.slice(-160));

  // 16. Fresh page: empty state reflects the active (newest) document
  await page.goto(`${BASE}/chat`, { waitUntil: 'domcontentloaded' });
  await waitFor(() => page.evaluate(() => /Ask anything about/.test(document.body.innerText)));
  check('16. Empty state asks about the active document', await page.evaluate(() => /Ask anything about wwii-markers\.pdf/.test(document.body.innerText)));

  // 25-27. Delete a document → gone from Library and Chat selector
  await page.goto(`${BASE}/library`, { waitUntil: 'domcontentloaded' });
  await waitFor(() => page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.innerText.trim() === 'Study')));
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.getAttribute('aria-label')?.includes('Delete')).click());
  await waitFor(() => page.evaluate(() => /Delete this document?/.test(document.body.innerText)));
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.innerText.trim() === 'Delete').click());
  check('17. Deleted document disappears from Library', await waitFor(() => page.evaluate((n) => !document.body.innerText.includes(n), NAME_B), 15000));
  await page.goto(`${BASE}/chat`, { waitUntil: 'domcontentloaded' });
  check('18. Deleted document gone from chat selector', await waitFor(() => page.evaluate(() => document.querySelectorAll('button[aria-pressed]').length === 1)));

  // 19. Refresh → persistence; deleted stays deleted; no fakes
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(600);
  const body = await page.evaluate(() => document.body.innerText);
  check('19. Persistence after refresh (real doc stays, deleted doc stays gone)', body.includes(NAME_A) && !body.includes(NAME_B) && !body.includes('Reflective'));

  // 20. Nonexistent route → graceful 404
  await page.goto(`${BASE}/does-not-exist`, { waitUntil: 'domcontentloaded' });
  check('20. Graceful 404 page for unknown route', await waitFor(() => page.evaluate(() => /404|Page not found/i.test(document.body.innerText))));

  // 21. No console errors
  check('21. No application console errors', consoleErrors.filter((e) => !/favicon/.test(e)).length === 0, consoleErrors.join(' | '));

  await browser.close();

  const passed = results.filter((r) => r.pass).length;
  console.log(`\nE2E result: ${passed}/${results.length} passed`);
  process.exit(passed === results.length ? 0 : 1);
}

main().catch((e) => {
  console.error('E2E crashed:', e);
  process.exit(2);
});