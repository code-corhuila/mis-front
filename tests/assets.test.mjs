import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('ships a real PNG brand asset and static licensed Lucide icons', async () => {
  const png = await readFile(new URL('../assets/medistock-demo.png', import.meta.url));
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(png.readUInt32BE(16) > 0 && png.readUInt32BE(20) > 0);
  for (const icon of ['pill', 'truck', 'boxes', 'user-round', 'log-out']) {
    const svg = await readFile(new URL(`../assets/${icon}.svg`, import.meta.url), 'utf8');
    assert.match(svg, /^<svg /); assert.match(svg, /class="lucide /);
    assert.doesNotMatch(svg, /<script|foreignObject|\bon\w+=|\bhref=/i);
  }
  const license = await readFile(new URL('../assets/LUCIDE-LICENSE', import.meta.url), 'utf8');
  assert.match(license, /Lucide Icons and Contributors/); assert.match(license, /Cole Bemis/);
});
