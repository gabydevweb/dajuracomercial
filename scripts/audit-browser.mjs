import { chromium, webkit } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const baseURL = process.env.DAJURA_BASE_URL || 'http://127.0.0.1:5173';
const routes = ['/', '/tienda', '/carrito', '/checkout', '/cuenta', '/contacto', '/nosotros', '/como-comprar', '/politicas', '/privacidad', '/admin', '/ruta-inexistente'];
const engine = process.env.DAJURA_BROWSER || 'chromium';
const browser = await (engine === 'webkit' ? webkit : chromium).launch();
const page = await browser.newPage();
const errors = [], results = [];
page.on('pageerror', error => errors.push(error.message));
try {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      const response = await page.goto(baseURL + route);
      // Let authenticated/catalog requests settle before replacing the document.
      await page.waitForLoadState('networkidle');
      await page.locator('h1, h2').first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      const result = await page.evaluate(() => ({
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        brokenImages: [...document.images].filter(img => img.complete && img.naturalWidth === 0).map(img => img.getAttribute('src')),
        emptyLinks: [...document.querySelectorAll('a')].filter(a => !a.getAttribute('href') || a.getAttribute('href') === '#').length,
      }));
      results.push({ route, status: response.status(), ...result });
      assert.ok([200,304].includes(response.status()), `${route}: HTTP ${response.status()}`);
      assert.ok(result.scrollWidth <= width, `Overflow ${route} at ${width}: ${result.scrollWidth}`);
      assert.deepEqual(result.brokenImages, [], `Broken image ${route}`);
      assert.equal(result.emptyLinks, 0, `Empty link ${route}`);
    }
  }
  assert.deepEqual(errors, []);
  await mkdir('.local', {recursive:true});
  await writeFile(`.local/browser-audit-${engine}.json`, JSON.stringify({baseURL, engine, results, errors}, null, 2));
  console.log(`PASS ${engine}: ${results.length} recorridos; 12 rutas en cinco tamaños, sin desbordamiento, imágenes rotas ni errores JavaScript.`);
} finally { await browser.close(); }
