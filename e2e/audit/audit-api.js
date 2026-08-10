// QUORIXA Audit — Phase 8: API error taxonomy & CORS.
// Pure curl checks against the running backend. No AI calls.

const { execFileSync } = require('child_process');
const API = 'http://localhost:5000/api/v1';

const results = [];
const check = (n, c, d = '') => { results.push({ n, pass: !!c }); console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${!c && d ? '  [' + String(d).slice(0, 170) + ']' : ''}`); };

function curl(args) {
  const raw = execFileSync('curl.exe', ['-s', '-i', ...args], { encoding: 'utf8', shell: false });
  const head = raw.substring(0, raw.indexOf('\r\n\r\n')).split('\r\n');
  const status = Number(head[0].split(' ')[1]);
  const bodyText = raw.substring(raw.indexOf('\r\n\r\n') + 4);
  let body = null;
  try { body = JSON.parse(bodyText); } catch {}
  return { status, body, bodyText, head };
}

check('A1 /health returns 200 JSON', (() => { const r = curl([`${API}/health`]); return r.status === 200 && r.body && r.body.success === true; })());
check('A2 /library (no params) 200', (() => { const r = curl([`${API}/library`]); return r.status === 200 && Array.isArray(r.body?.data?.documents); })());
check('A3 /library?page=abc handled (200 or 400, no 500)', (() => { const r = curl([`${API}/library?page=abc`]); return r.status < 500; })());
check('A4 /library?sort=bogus gracefully defaults', (() => { const r = curl([`${API}/library?sort=bogus`]); return r.status === 200 && Array.isArray(r.body?.data?.documents); })());
check('A5 /library/not-an-id -> 404 with JSON error', (() => { const r = curl([`${API}/library/not-an-id`]); return r.status === 404 && r.body && r.body.success === false && !!r.body.errorCode; })());
check('A6 DELETE /library/not-an-id -> 404', (() => { const r = curl(['-X', 'DELETE', `${API}/library/not-an-id`]); return r.status === 404 && r.body?.success === false; })());
check('A7 POST /documents/upload without file -> error (4xx)', (() => { const r = curl(['-X', 'POST', `${API}/documents/upload`]); return r.status >= 400 && r.status < 500 && r.body?.success === false; })());
check('A8 POST youtube missing url -> 400', (() => { const r = curl(['-s', '-i', '-X', 'POST', `${API}/documents/upload/youtube`, '-H', 'Content-Type: application/json', '-d', '{}']); return r.status === 400 && r.body?.success === false; })());
check('A9 POST youtube malformed JSON -> 400', (() => { const r = curl(['-s', '-i', '-X', 'POST', `${API}/documents/upload/youtube`, '-H', 'Content-Type: application/json', '-d', '{bad']); return r.status === 400; })());
check('A10 POST youtube invalid URL -> 400', (() => { const r = curl(['-s', '-i', '-X', 'POST', `${API}/documents/upload/youtube`, '-H', 'Content-Type: application/json', '-d', '{"url":"notaurl"}']); return r.status === 400; })());
check('A11 PATCH rename with empty name -> 400', (() => { const r = curl(['-s', '-i', '-X', 'PATCH', `${API}/library/not-an-id/rename`, '-H', 'Content-Type: application/json', '-d', '{"name":""}']); return r.status === 400; })());
check('A12 PATCH reprocess unknown id -> 404', (() => { const r = curl(['-s', '-i', '-X', 'PATCH', `${API}/library/not-an-id/reprocess`]); return r.status === 404; })());
check('A13 unknown route -> 404 JSON', (() => { const r = curl([`${API}/does-not-exist`]); return r.status === 404 && r.body?.success === false; })());
check('A14 health route NOT found on misspelled path', (() => { const r = curl([`${API}/healf`]); return r.status === 404; })());

// CORS
check('C1 preflight OPTIONS /library returns ACAO for localhost origin', (() => {
  const r = curl(['-X', 'OPTIONS', `${API}/library`, '-H', 'Origin: http://localhost:5173', '-H', 'Access-Control-Request-Method: GET']);
  const acao = r.head.find((h) => /^access-control-allow-origin/i.test(h));
  return r.status === 204 && !!acao;
})());
check('C2 disallowed origin is NOT granted (no ACAO)', (() => {
  const r = curl(['-X', 'OPTIONS', `${API}/library`, '-H', 'Origin: https://evil.example.com', '-H', 'Access-Control-Request-Method: GET']);
  const acao = r.head.find((h) => /^access-control-allow-origin/i.test(h));
  return !acao || acao.includes('null') && r.status < 500;
})());
check('C3 allowed Origin reflects on GET', (() => {
  const r = curl([`${API}/health`, '-H', 'Origin: http://localhost:5173']);
  const acao = r.head.find((h) => /^access-control-allow-origin/i.test(h));
  return r.status === 200 && acao && /localhost:5173|localhost|127\.0\.0\.1/.test(acao);
})());

// payload shape
check('A15 error payload has success/message/errorCode/timestamp', (() => {
  const r = curl([`${API}/library/not-an-id`]);
  const b = r.body;
  return b && b.success === false && typeof b.message === 'string' && typeof b.errorCode === 'string' && typeof b.timestamp === 'string';
})());

const passed = results.filter((r) => r.pass).length;
console.log(`\nAPI TAXONOMY: ${passed}/${results.length} passed`);
process.exit(passed === results.length ? 0 : 1);