import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {relinkIntegratedSchema,verifySelfContainedVendor,integratedImportsIn} from '../scripts/offline/build-v2.mjs';
import {digest} from '../scripts/offline/integrity.mjs';
const ts=createRequire(import.meta.url)('typescript');

test('integrated XML packaging accepts only the fixed existing self-contained bundle and refuses substituted bytes',async()=>{
  const source=await readFile(new URL('../node_modules/fast-xml-parser/lib/fxp.cjs',import.meta.url),'utf8');
  assert.equal(digest(Buffer.from(source)),'fbddba1ab4b8874fa6010da7f4f65b52b8e6dcb927b07964e2e16d62fd990647');
  assert.equal(verifySelfContainedVendor(source,ts),true);
  assert.throws(()=>verifySelfContainedVendor(source+'\nimport "https";',ts),/PINNED_XML_VENDOR_BYTES_REQUIRED/);
  assert.throws(()=>verifySelfContainedVendor('module.exports={XMLParser:class {}};',ts),/PINNED_XML_VENDOR_BYTES_REQUIRED/);
});

test('schema packaging changes one exact import while keeping the complete normalization implementation',async()=>{
  const source=await readFile(new URL('../.kasi-build/schema.js',import.meta.url),'utf8'),linked=relinkIntegratedSchema(source,ts);
  const original="import { XMLParser, XMLValidator } from 'fast-xml-parser';";
  const replacement="import __offlineXmlParserBundle from '../vendor/fast-xml-parser.cjs';\nconst { XMLParser, XMLValidator } = __offlineXmlParserBundle;";
  assert.equal(linked,source.replace(original,replacement));
  for(const literal of ['export function parsePage','export function normalizeSolar','export function validateSolar','export function canonical'])assert.ok(linked.includes(literal),literal);
  assert.throws(()=>relinkIntegratedSchema(source.replace('XMLParser, XMLValidator','XMLParser'),ts),/PINNED_XML_IMPORT_NAMES/);
  assert.throws(()=>relinkIntegratedSchema(source.replace(original,''),ts),/PINNED_XML_IMPORT_REQUIRED/);
});

test('only the existing fixed projection CLI import may extend the integrated static closure',()=>{
  assert.deepEqual(integratedImportsIn("import('./local-luck-projection.mjs')",'scripts/kasi/local-luck.mjs',ts),['./local-luck-projection.mjs']);
  assert.throws(()=>integratedImportsIn('import(userPath)','scripts/kasi/local-luck.mjs',ts),/UNAPPROVED_INTEGRATED_DYNAMIC_IMPORT/);
  assert.throws(()=>integratedImportsIn("import('./network.mjs')",'scripts/kasi/local-luck.mjs',ts),/UNAPPROVED_INTEGRATED_DYNAMIC_IMPORT/);
  assert.throws(()=>integratedImportsIn("import('./local-luck-projection.mjs')",'scripts/kasi/other.mjs',ts),/UNAPPROVED_INTEGRATED_DYNAMIC_IMPORT/);
  assert.throws(()=>integratedImportsIn("require('node:http')",'scripts/kasi/local-luck.mjs',ts),/DYNAMIC_IMPORT_OR_REQUIRE_REJECTED/);
});
