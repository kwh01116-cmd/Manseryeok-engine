import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDirectModuleRun } from '../scripts/web-entrypoint.mjs';

const serverPath = fileURLToPath(new URL('../scripts/chart-preview-web.mjs', import.meta.url));

test('direct entrypoint recognizes absolute and relative paths on the host platform', () => {
  const url = pathToFileURL(serverPath);
  assert.equal(isDirectModuleRun(url, serverPath), true);
  const pathWithSpaceAndHangul = resolve('test files/한글 chart.mjs');
  assert.equal(isDirectModuleRun(pathToFileURL(pathWithSpaceAndHangul), pathWithSpaceAndHangul), true);
  const relative = new URL('../scripts/chart-preview-web.mjs', import.meta.url);
  assert.equal(isDirectModuleRun(relative, serverPath), true);
  assert.equal(isDirectModuleRun(url, resolve('scripts/other-script.mjs')), false);
  assert.equal(isDirectModuleRun(url, undefined), false);
  assert.equal(isDirectModuleRun(url, ''), false);
});

test('npm web command builds before launching the local preview', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.scripts.web, 'npm run build && node scripts/chart-preview-web.mjs');
});
