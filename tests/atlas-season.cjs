const assert = require('node:assert/strict'), fs = require('node:fs');
const seasons=JSON.parse(fs.readFileSync('scripts/atlas/seasons.json'));
const { chromium } = require('playwright'), { route } = require('./atlas-fixtures.cjs');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    for (const episode of JSON.parse(fs.readFileSync('scripts/atlas/episodes.json'))) {
      const page = await browser.newPage({ serviceWorkers: 'block' });
      await route(page);
      await page.goto('https://sansanote.com' + episode.href);
      await page.waitForFunction(title => document.querySelector('[data-atlas-season]').textContent.includes(title),seasons[episode.season].title);
      const label = await page.locator('[data-atlas-season]').innerText();
      assert(label.includes('EPISODE ' + String(Number(episode.number)).padStart(2, '0')));
      await page.locator('#startAtlas').click();
      assert((await page.locator('.atlas-intro [data-atlas-season]').innerText()).includes('SEASON '+episode.season));
      assert((await page.locator('.atlas-season-progress').innerText()).includes('0/12'));
      await page.locator('[data-atlas=resume]').click();
      assert.equal(await page.locator('#atlasBody [data-atlas-season]').count(), 0);
      console.log('PASS season landing/intro/progress only', episode.id);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
