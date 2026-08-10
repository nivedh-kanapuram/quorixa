import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const RENDER_SCALE = 2;
const MAX_IMAGE_WIDTH = 2400;
const CHROME_EDGE = 0.08;
const CHROME_BOTTOM = 280;

const cropPng = async (png: Buffer): Promise<Buffer> => {
  const { loadImage, createCanvas } =
    (await import('@napi-rs/canvas')) as typeof import('@napi-rs/canvas');
  const img = await loadImage(png);
  const left = Math.floor(img.width * CHROME_EDGE);
  const right = Math.ceil(img.width * (1 - CHROME_EDGE));
  const top = 0;
  const bottom = Math.max(top + 1, img.height - CHROME_BOTTOM);
  const canvas = createCanvas(right - left, bottom - top);
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
  ctx.drawImage(
    img as unknown as CanvasImageSource,
    left,
    top,
    right - left,
    bottom - top,
    0,
    0,
    right - left,
    bottom - top
  );
  return canvas.toBuffer('image/png');
};

type PuppeteerPage = {
  setViewport: (v: {
    width: number;
    height: number;
    deviceScaleFactor: number;
  }) => Promise<void>;
  goto: (url: string, opts: Record<string, unknown>) => Promise<unknown>;
  waitForSelector: (
    sel: string,
    opts: Record<string, unknown>
  ) => Promise<unknown>;
  $$: (sel: string) => Promise<unknown[]>;
  close?: () => Promise<void>;
};

type PuppeteerModule = {
  launch: (options: Record<string, unknown>) => Promise<{
    newPage: () => Promise<PuppeteerPage>;
    close: () => Promise<void>;
  }>;
};

const moduleRequire = createRequire(__filename);

const chromeCandidates = (): string[] =>
  [
    process.env.CHROME_PATH || '',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA
      ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
      : '',
  ].filter(Boolean);

const findChrome = (): string => {
  const found = chromeCandidates().find((p) => fs.existsSync(p));
  if (!found) {
    throw new Error(
      'PDF rendering requires Google Chrome with a standard install path.'
    );
  }
  return found;
};

const findPuppeteer = (): string => {
  const candidates = [
    path.resolve(process.cwd(), '../frontend/node_modules/puppeteer-core'),
    path.resolve(process.cwd(), 'node_modules/puppeteer-core'),
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) {
    throw new Error(
      'PDF rendering requires puppeteer-core to be installed (frontend or backend).'
    );
  }
  return found;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const renderPdfToPageImages = async (
  filePath: string
): Promise<Buffer[]> => {
  const puppeteer = moduleRequire(findPuppeteer()) as PuppeteerModule;
  const pdfjs =
    (await import('pdfjs-dist/legacy/build/pdf.mjs')) as typeof import('pdfjs-dist');
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjs.getDocument({ data }).promise;
  const first = await doc.getPage(1);
  const base = first.getViewport({ scale: 1 });
  const scale = Math.min(
    RENDER_SCALE,
    MAX_IMAGE_WIDTH / Math.max(1, base.width)
  );
  const pageWidth = Math.ceil(base.width * scale);
  const pageHeight = Math.ceil(base.height * scale);
  const totalHeight = doc.numPages * (pageHeight + 60);
  await doc.destroy();

  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: pageWidth,
      height: totalHeight,
      deviceScaleFactor: 1,
    });
    await page.goto(
      `file:///${filePath.replace(/\\/g, '/')}#toolbar=0&navpanes=0&zoom=fit`,
      {
        waitUntil: 'networkidle0',
        timeout: 30000,
      }
    );
    await sleep(2500);
    const screenshot = page as unknown as {
      screenshot: (opts: { type: string }) => Promise<Buffer>;
    };
    const png = await screenshot.screenshot({ type: 'png' });
    if (!png || png.length === 0) {
      throw new Error('PDF page rendering produced no pages.');
    }
    return [await cropPng(png)];
  } finally {
    await browser.close();
  }
};
