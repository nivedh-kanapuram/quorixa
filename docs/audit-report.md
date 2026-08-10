# QUORIXA Audit Report

Audit date: 2026-08-09
Scope: full-stack upload/process/library/chat pipeline, API contract, UI/UX, data integrity.

## Summary

| Suite | Result |
|-------|--------|
| Phase 1–4 upload matrix (PDF/TXT/IMG/YT + Markdown) | **32/32** |
| Phase 6 multi-document isolation (3 docs) | **5/5** |
| Phase 7 UI / theme / responsive sweep | **17/17** |
| Phase 8 API error taxonomy & CORS | **18/18** |
| Final E2E regression (canonical student flow) | **21/21** |
| Phase 9 DB consistency | BLOCKED (env DNS, see below) |
| Phase 10 multilingual API matrix (PNG/PDF × eng/tel/hin) | **10/10** |
| Phase 10 RAG isolation (Telugu/Hindi grounded answers) | **8/8** |

Run scripts: `e2e/audit/audit-matrix.js`, `audit-isolation.js`, `audit-ui.js`, `audit-api.js`, `e2e/audit/audit-multilingual.js`, `e2e/final-e2e.js` (backend :5000 + frontend :5173 must be up). Rerun with `node e2e/audit/<file>.js`.

## Product fixes shipped during this audit

1. **Markdown notes (.md) were unsupported** although the codebase targeted txt-only notes. Added `text/markdown` to the upload allowlist + extension fallback (`upload.middleware.ts`), processor note branch with `format: 'markdown'` (`processor.service.ts`), type mapping `text/markdown → note` (`document.service.ts`), and the frontend picker (`accept="…,.md"`, `detectType`, hint copy on UploadPage). Verified: upload, library `type=note`, chat grounding (`ALPHA-MD-5Q2`), deletion.
2. **Library type resolved to `unknown` for MIME-useless uploads** (`application/octet-stream` and the like). `getDocumentTypeFromMime` now falls back to file extension; `datum` (e.g. curl) uploads show `pdf/note/image` instead of `unknown`.
3. **Empty-content uploads produced a raw 500 + Failed ghost browser from an internal message** (“Document text is required…”). Now a `422 “The uploaded document contains no readable text…”`, stored on the Failed record; 422 is preserved through the controller (`AppError` rethrow in `createDocumentMetadata`), no mid-air ghost docs.
4. **Stale/rogue ObjectId in URL → 500 “Cast to ObjectId failed”** leaked raw Mongo text as `ERR_500` on `GET/DELETE/PATCH /library/:id`. Omitted `isValidObjectId` guard in service → 404; delete/reprocess controllers were re-wrapping 404 AppError as 500; both fixed.
5. **Malformed JSON body → 500**; `entity.parse.failed` is now mapped to a clean 400 “Invalid JSON in request body.”
6. **Unknown API routes returned Express's HTML 404**; added a catch-all JSON 404 (`success:false`, `ERR_404`) before the error handler.
7. **YouTube failure UX absent**: fetching transcripts suppressed the error toast (asymmetric with file uploads). `fetchTranscript` failed path now pushes an error toast (frontend UploadPage).
8. **Upload error message** now mentions `.md` and remains unambiguous; oversized files stay blocked with `File is too large` (400; N.B. multer maps limit → 400, not 413 — kept as documented behavior).

## Confirmed-working surface (from matrix + isolation runs)

- Upload processing, library card, search, chat grounding with source cards (PDF marker `KITE-AMP2`, TXT `ALPHA-TXT-5Q2`, IMG OCR `OCR-EN-9K2`, MD `ALPHA-MD-5Q2`).
- Per-doc answers leak between documents (isolation: A↛B, B↛A, active-doc-only retrieval for out-of-doc questions).
- Selection persist across reload; deletion clears library + chat selector; deletion persists.
- YouTube (URL form) rounds trip: transcript → Completed → grounded chat answers.
- Error paths: blank image (422+Failed), empty txt (422+Failed), oversized (400 blocked), bad YouTube id (graceful), `.docx` (documented unsupported).
- Status/flow, dark theme (toggle + persistence via `localStorage`), responsive 768/390px with no horizontal overflow, hamburger nav on mobile, graceful 404 page, console error-free (excluding expected 422s).
- API genesis: 404/400/422 codes, uniform `{success,message,errorCode,timestamp}`, CORS allow/deny correct, preflights OK.

## Known limitations / deferred (Product evolution, not fixes)

| Area | Detail |
|------|--------|
| OCR language | **FIXED (multilingual phase, below).** Tesseract now runs `eng+tel+hin` with local `tessdata/*.traineddata.gz` (missing data → clear OCR configuration error, no silent eng fallback). A readability gate (`assessTextQuality`) rejects blank/replacement-char/symbol-soup output before indexing (`DOCUMENT_UNREADABLE` 422). |
| Scan/accent PDFs | **FIXED.** PDFs without a text layer now route through a scanned-PDF fallback: Chrome headless rasterizes pages and the multilingual OCR reads them; pdf-parse crashes (bad XRef) fall through to the same OCR path. Unreadable scans still end as a clean 422. |
| DOCX | Processor supports it but uploads deliberately block it (`.docx` not allowlisted) — intentional, documented in the upload UI in the `.txt/.md` hint copy. |
| Rate limits | Groq free tier throttles bursts; chat retries after 30–60s (seen once in matrix). No product bug. |
| Phase 9 direct-DB | Fresh Mongo connections couldn't resolve Atlas SRV (home resolver refuses SRV records; node `querySrv ECONNREFUSED`). The long-lived backend socket is unaffected; DB-level checks (counts, chunk integrity) swapped for API-surface checks (all pass). Blocked purely by the test machine's DNS. |
| YouTube | Uses captions; video without captions → clean `YOUTUBE_TRANSCRIPT_UNAVAILABLE`. |

## Hygiene

- All audit fixtures committed under `e2e/fixtures` (small PNGs + markers); the 49MB oversized fixture is generated on the fly by the matrix test (`audit-matrix.js`, E3).
- Backend dev servers: `backend:npm run dev` (ts-node-dev) and `frontend npm run dev` (vite). A stray duplicate ts-node-dev chain was cleaned (EADDRINUSE noise).

## Phase 10: Multilingual reading (eng+tel+hin OCR + scanned-PDF fallback)

Audit date: 2026-08-09. This phase made QUORIXA actually *read* printed Telugu/Hindi (the Phase 1–8 OCR limitation) and scanned PDFs without a text layer.

**What shipped**

1. **Multilingual OCR configuration** (`backend/src/services/image/ocr-config.ts`): `OCR_DEFAULT_LANGS = 'eng+tel+hin'`; `TESSDATA_DIR` points at `backend/tessdata`; `verifyOcrLanguageData()` throws an explicit OCR configuration error if `<lang>.traineddata.gz` is missing — **no silent English-only fallback**. Tesseract.js v5 requires gzipped traineddata for a local `langPath`, so `eng/tel/hin.traineddata.gz` (fast tessdata, ~5 MB total) are committed alongside.
2. **Readability gate** (`backend/src/utils/text-quality.ts`): `assessTextQuality()` rejects blank, shady-short, or garbage output before indexing. Character-classing is script-aware — Telugu (U+0C00–0C7F) and Devanagari (U+0900–097F) combining marks are *content*, not symbols; curated punctuation is allowed. Mojibake/symbol-soup is detected via a bridged-symbols ratio (≥5 bridges and >12% of meaningful chars); garbage front-end streams can only pass if they carry real recovered script content. Failure → `422 DOCUMENT_UNREADABLE` with `reasons`, stored on Failed records (verified: `garbage-pattern.png` 422, `blank-img.png` 422).
3. **Scanned-PDF fallback** (`backend/src/services/pdf/pdf.service.ts` + `pdf-render.service.ts`): extraction now (a) tries pdf-parse for a native text layer — valid text takes the native path; (b) otherwise rasterizes each page in headless Chrome's built-in PDF viewer (`#toolbar=0&navpanes=0&zoom=fit`, wait ~2.5s, screenshot whole page, crop viewer chrome), then (c) OCRs pages with a single tesseract worker. pdf-parse *crashes* on malformed XRef also fall through to the OCR path. (Skia/PDF m151 output embeds inline images pdf.js renders blank in node and in-page — pdf-lib-embedded raster pages rasterize fine, so Chrome's viewer is used for both.)
4. **End-to-end language metadata**: processor adds detected `languages` to metadata; upload responses (file + YouTube) now include `languages`; the frontend maps them to human labels (`English`, `Telugu`, `Hindi`) and notes detected languages in the success toast (`document.api.ts` `languages?: string[]`, `UploadPage.tsx`).
5. **Malformed-JSON body guard**: `error.middleware.ts` uses a type-only cast to map `entity.parse.failed` → 400 (zero runtime change; backends `tsc`/`eslint` clean, frontend `tsc`/`eslint`/`vite build` clean).

**Fixture suite** (generated by `e2e/audit/make-multilingual-fixtures.js`; committed under `e2e/fixtures/`): `telugu-real.png`, `hindi-real.png`, `bilingual-tel-en.png`, `garbage-pattern.png`, scanned PDFs (`scanned-telugu.pdf`, `scanned-hindi.pdf`, `scanned-bilingual.pdf` — raster embedded via pdf-lib), text PDFs with a real text layer (`text-pdf-hindi.pdf`, `text-pdf-bilingual.pdf` — Chrome `page.pdf()`). Real Telugu/Hindi text set in Nirmala UI (system font).

**Results**

| Suite | Result |
|-------|--------|
| API matrix: GPS-named PNGs/pdf, lang mapping, 422s | **10/10** (telugu-real→`[tel]`, hindi-real→`[hin]`, bilingual→`[eng,tel,hin]`; scanned-*→same langs via OCR path; text-pdf-hindi→`[hin]`, text-pdf-bilingual→`[eng,tel]`; `garbage-pattern.png`→422, `blank-img.png`→422) |
| Multilingual RAG isolation (`e2e/audit/audit-multilingual.js`) | **8/8**: OCR text stored contains actual Devanagari (`ఆంధ్రప్రదేశ్`/`రాజభాషా`…); Telugu question → grounded Telugu answer; Hindi question → grounded Hindi answer; negative ctrl questions don't leak content from the *other* doc (assertions on the lastAnswer segment, honest-refusal phrasing tolerated) |
| Post-change regressions | matrix **32/32**, isolation **5/5**, UI **17/17**, API **18/18**, final E2E **21/21** — all rerun after the Phase 10 changes |

**Notes**

- `upload` is synchronous: the response carries the final status (+ `languages`) or the 422; no polling.
- The legacy `ocr-te.png` fixture now *also* completes (`[eng,tel,hin]`) — OCR genuinely recovers Telugu glyphs (`తండ్రి`, `ఉడికి`) alongside residual garbage, which satisfies the gate as recovered content rather than rejection.
- One transient puppeteer CDP crash occurred mid-matrix run during this audit (`adoptBackendNode`), pure test-harness flake; the rerun passed 32/32. No product impact observed.
- Phase 9 DB-consistency checks remain blocked by the machine's DNS (see Phase 9 row).