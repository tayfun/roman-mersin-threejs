// Close-up renders of the dioramas via the dev-only preview page.
// Usage: NODE_PATH=$(npm root -g) node tools/model_shots.mjs <outDir> [model,model...]   (needs `npm run dev` on :5173)
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2] || 'shots';
const all = ['anemurium', 'seleucia', 'diocaesarea', 'cennet', 'adamkayalar', 'korykos', 'elaiussa', 'kanlidivane', 'soli', 'tarsus'];
const models = process.argv[3] ? process.argv[3].split(',') : all;
const tilt = { cennet: 'a=194&e=48&d=3.0', kanlidivane: 'a=18&e=44&d=3.0', adamkayalar: 'a=14&e=20&d=3.0' }; // matches each site's in-map view
const views = { front: 'a=18&e=30&d=3.1', high: 'a=-35&e=52&d=3.1', back: 'a=160&e=28&d=3.1', close: 'a=30&e=18&d=1.7&ty=0.12', dusk: 'a=-20&e=24&d=2.9&dusk=1' };
const base = process.env.BASE || 'http://localhost:5173/';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1100, height: 760 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(120000);
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
for (const m of models) for (const [name, qs] of Object.entries(views)) {
  if (process.env.VIEWS && !process.env.VIEWS.split(',').includes(name)) continue;
  await page.goto(`${base}preview.html?m=${m}&${name === 'front' && tilt[m] ? tilt[m] : qs}${process.env.EXTRA || ''}`);
  await page.waitForFunction(() => window.__ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/${m}-${name}.png` });
  if (name === 'front') console.log(m, JSON.stringify(await page.evaluate(() => window.__stats)));
}
await browser.close();
console.log(errors.length ? 'ERRORS:\n' + [...new Set(errors)].join('\n') : 'no console errors');
