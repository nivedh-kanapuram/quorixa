// QUORIXA - multilingual fixture generator
// Creates genuine Telugu / Hindi / mixed image + scanned/text PDF fixtures.
// Usage: node e2e/audit/make-multilingual-fixtures.js
// Requirements: Windows + System.Drawing + Chrome + frontend puppeteer-core.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'e2e', 'fixtures');
const puppeteer = require(
  path.join(ROOT, 'frontend', 'node_modules', 'puppeteer-core')
);
const EXE =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function renderPng(fileName, lines, size = 30, width = 1600) {
  const height = Math.max(200, lines.length * (size + 26) + 80);
  const draw = lines
    .map((l) => {
      const esc = l.replace(/'/g, "''");
      return `$g.DrawString('${esc}', $font, $brush, 20, $y)`;
    })
    .join(`\n    $y += ${size + 26}\n    `);
  const script = `
Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap(${width}, ${height})
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::White)
$font = New-Object System.Drawing.Font('Nirmala UI', ${size}, [System.Drawing.FontStyle]::Regular)
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(20,20,20))
$y = 30
${draw}
$g.Dispose()
$bmp.Save('${path.join(OUT, fileName).replace(/\\/g, '/')}', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
`;
  execFileSync(
    'powershell.exe',
    ['-NoProfile', '-Command', script],
    { encoding: 'utf8' }
  );
  return path.join(OUT, fileName);
}

async function renderPdf(fileName, content, isImagePage = false, imagePath = null) {
  const browser = await puppeteer.launch({
    executablePath: EXE,
    headless: 'new',
    args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage();
    if (isImagePage) {
      await page.goto(`file:///${imagePath.replace(/\\/g, '/')}`);
      const img = await page.$('img');
      await img.evaluate((el) => {
        const r = el.getBoundingClientRect();
        el.style.margin = '0';
        el.style.width = '100%';
        el.style.height = 'auto';
      });
      await page.pdf({
        path: path.join(OUT, fileName),
        format: 'A4',
        printBackground: true,
        pageRanges: '1',
      });
    } else {
      await page.setContent(content, { waitUntil: 'networkidle0' });
      await page.pdf({
        path: path.join(OUT, fileName),
        format: 'A4',
        printBackground: true,
        margin: { top: '1.5cm', bottom: '1.5cm', left: '1.5cm', right: '1.5cm' },
      });
    }
  } finally {
    await browser.close();
  }
}

async function scannedPdfLib(fileName, pngPath) {
  const { PDFDocument } = require(
    path.join(ROOT, 'backend', 'node_modules', 'pdf-lib')
  );
  const buf = fs.readFileSync(pngPath);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const png = await doc.embedPng(buf);
  const w = 520;
  const h = (height / width) * w;
  page.drawImage(png, { x: 38, y: 841.89 - h - 60, width: w, height: h });
  fs.writeFileSync(path.join(OUT, fileName), await doc.save());
}

async function textPdf(fileName, bodyHtml) {
  const browser = await puppeteer.launch({
    executablePath: EXE,
    headless: 'new',
    args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(bodyHtml, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: path.join(OUT, fileName),
      format: 'A4',
      printBackground: true,
      margin: { top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' },
    });
  } finally {
    await browser.close();
  }
}

const htmlWrap = (body) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="font-size:18px;line-height:1.8">${body}</body></html>`;

async function main() {
  const telugu = 'తెలుగు భాష భారతదేశంలోని ఆంధ్రప్రదేశ్ మరియు తెలంగాణ రాష్ట్రాలలో మాట్లాడతారు.';
  const hindi = 'हिन्दी भारत की राजभाषा है और भारत के कई राज्यों में बोली जाती है';

  console.log('Generating image fixtures...');
  const telPng = renderPng('telugu-real.png', [telugu]);
  console.log(' telugu-real.png');
  const hinPng = renderPng('hindi-real.png', [hindi]);
  console.log(' hindi-real.png');
  const mixPng = renderPng(
    'bilingual-tel-en.png',
    [telugu, 'Photosynthesis happens in leaves', hindi.replace('हिन्दी ', '')],
    26
  );
  console.log(' bilingual-tel-en.png');

  const garbage =
    'a$a\u00b0ja a\u00b0ma\u00b0zla az0 \u00b0a\u00b0\u00b0sac*a la\u00b0tc \u00b0a\u00b0\u00b0za z\u00b0a\u00b0\u00b0sa\nx\u00b0y\u00b0z \u00b0a\u00b0\u00b0\u00b0\u00b0a a11\u00b0b22\u00b0c33 zzz\u00b0\u00b0\u00b0\u00b0jjj';
  renderPng('garbage-pattern.png', [garbage], 26);
  console.log(' garbage-pattern.png');

  console.log('Generating scanned PDFs (pdf-lib embedded rasters)...');
  await scannedPdfLib('scanned-telugu.pdf', telPng);
  console.log(' scanned-telugu.pdf');
  await scannedPdfLib('scanned-hindi.pdf', hinPng);
  console.log(' scanned-hindi.pdf');
  await scannedPdfLib('scanned-bilingual.pdf', mixPng);
  console.log(' scanned-bilingual.pdf');

  console.log('Generating text-layered PDFs...');
  await textPdf(
    'text-pdf-hindi.pdf',
    htmlWrap(`<h1>सौर ऊर्जा</h1><p>सूर्य से प्राप्त होने वाली ऊर्जा सौर ऊर्जा कहलाती है।</p>`)
  );
  console.log(' text-pdf-hindi.pdf');
  await textPdf(
    'text-pdf-bilingual.pdf',
    htmlWrap(`<h2>Telugu:</h2><p>${telugu}</p><h2>English:</h2><p>Photosynthesis stores light energy as glucose</p>`)
  );
  console.log(' text-pdf-bilingual.pdf');

  console.log('Done. Fixtures at ' + OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});