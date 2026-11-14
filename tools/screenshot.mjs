// Usage: node tools/screenshot.mjs <outDir> [baseUrl]   (needs `npm run preview` or `npm run dev` running)
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright'); // resolved via NODE_PATH when installed globally
const out = process.argv[2] || 'shots';
const base = process.argv[3] || 'http://localhost:4173/';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errors = [];
async function page(w, h) {
  const p = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  p.setDefaultTimeout(180000);
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  p.on('pageerror', (e) => errors.push(String(e)));
  await p.goto(base + (process.env.Q ? '?q=' + process.env.Q : ''));
  await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  return p;
}
const p = await page(1280, 760);
await p.waitForTimeout(1500);
await p.screenshot({ path: `${out}/00-intro.png` });
await p.click('#begin-quiet');
await p.waitForTimeout(7000);
await p.screenshot({ path: `${out}/01-overview.png` });
const shots = (process.env.SITES || '0,1,2,3,4,5,6,7,8,9').split(',').map(Number);
for (const i of shots) {
  await p.keyboard.press(String((i + 1) % 10));
  await p.waitForTimeout(5500);
  await p.screenshot({ path: `${out}/site-${String(i + 1).padStart(2, '0')}.png` });
}
if (process.env.ONLY_SITES) { await browser.close(); console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors'); process.exit(0); }
await p.keyboard.press('g');
await p.waitForTimeout(3500);
await p.screenshot({ path: `${out}/20-dusk-site.png` });
await p.keyboard.press('h');
await p.waitForTimeout(5000);
await p.screenshot({ path: `${out}/21-dusk-overview.png` });
await p.close();
const m = await page(390, 780);
await m.click('#begin-quiet');
await m.waitForTimeout(6500);
await m.screenshot({ path: `${out}/30-mobile-overview.png` });
await m.click('#sitelist button:nth-child(7)');
await m.waitForTimeout(5000);
await m.screenshot({ path: `${out}/31-mobile-site.png` });
await browser.close();
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
