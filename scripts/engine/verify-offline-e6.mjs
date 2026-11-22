/** Run the pinned package outside the checkout with Node-only dependency guards. */
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { appendFile, cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { writeOfflineGuards } from '../offline/guards.mjs';
import { createNewDirectory, digest, filesBelow, hashFiles, parsePairs, pathsOverlap } from '../offline/integrity.mjs';
import { verifyE6Package } from './e6-package.mjs';
import { E6_BIRTH_CASES } from '../../test/fixtures/e6-birth-cases-v1.mjs';
import { performance } from 'node:perf_hooks';

const execute = promisify(execFile);
const repo = resolve(import.meta.dirname, '../..');
const samplePath = 'docs/contracts/examples/engine-e6-request-v1.json';
const save = (path, value) => writeFile(path, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });

async function prepareGuards(dir) {
  const { loader, preload } = await writeOfflineGuards(dir, { forbiddenRoot: repo });
  const scope = join(dir, 'deny-source-reads.mjs'), restore = join(dir, 'restore-guard.mjs');
  await writeFile(scope, [
    "import fs from 'node:fs'; import fsp from 'node:fs/promises';",
    "import {relative,resolve,isAbsolute} from 'node:path'; import {fileURLToPath} from 'node:url';",
    "import {syncBuiltinESMExports} from 'node:module';",
    "const root=" + JSON.stringify(repo) + ";",
    "function check(path) {",
    "  if(typeof path==='number') return;",
    "  if(path instanceof URL && path.protocol==='file:') path=fileURLToPath(path);",
    "  const rel=relative(root,resolve(String(path)));",
    "  if(!isAbsolute(rel) && rel.split(/[\\\\/]/)[0]!=='..') throw Error('E6_DEVELOPER_FILE_READ_DENIED');",
    "}",
    "for(const name of ['readFile','createReadStream','readdir','open','lstat','stat','realpath','access']) {",
    "  for(const [obj,key] of [[fs,name],[fs,name+'Sync'],[fsp,name]]) {",
    "    const original=obj[key]; if(typeof original==='function')",
    "      obj[key]=function(path,...args){check(path);return original.call(this,path,...args);};",
    "  }",
    "}",
    "syncBuiltinESMExports();",
  ].join('\n'), { flag: 'wx' });
  await writeFile(restore, [
    "import net from 'node:net'; import http from 'node:http'; import https from 'node:https';",
    "import {register,syncBuiltinESMExports} from 'node:module';",
    "const deny=()=>{throw Error('OFFLINE_NETWORK_DENIED');};",
    "globalThis.fetch=deny; net.Socket.prototype.connect=deny; net.Server.prototype.listen=deny;",
    "http.request=deny; http.get=deny; https.request=deny; https.get=deny;",
    "process.env=new Proxy(process.env,{get(t,key){",
    "  if(typeof key==='string'&&/KASI|API_KEY|SERVICE_KEY/i.test(key)) throw Error('OFFLINE_KEY_ACCESS_DENIED');",
    "  return Reflect.get(t,key);",
    "}});",
    "syncBuiltinESMExports(); register(" + JSON.stringify(pathToFileURL(loader).href) + ");",
  ].join('\n'), { flag: 'wx' });
  return { scope, preload, restore };
}

function pillar(position) {
  return position ? position.stem + position.branch : null;
}

function rowMatches(row, [kind, role, layer]) {
  return row.kind === kind && row.positions.some(site => site.layer === layer) &&
    row.positions.some(site => site.layer === 'NATAL' && site.positionRef.endsWith('#natal:' + role));
}

function lookup(root, ref) {
  return ref.split('/').slice(1).reduce((value, key) => value?.[key], root);
}

export function certifyBirthCase(result, { id, expected }) {
  assert.equal(result.candidates.length, expected.parents, id);
  if (expected.status) assert.equal(result.status, expected.status, id);
  if (!expected.parents) {
    assert.ok(result.hold?.reasonCode, id);
    return;
  }
  for (const [index, parent] of result.candidates.entries()) {
    assert.equal(parent.natalCandidateRef, result.e5.candidates[index].candidateRef, id);
    const contexts = new Set(parent.timeContexts.map(context => context.timeContextRef));
    for (const ref of parent.natalFactRefs) assert.ok(lookup(result, ref), ref);
    for (const purpose of Object.values(parent.purposeStatuses)) assert.ok(lookup(result, purpose.resultRef), purpose.resultRef);
    for (const context of parent.timeContexts) {
      assert.equal(parent.natalCandidateRef, context.natalCandidateRef, id);
      assert.equal(context.observations.timeContextRef, context.timeContextRef, id);
      for (const row of context.observations.pairs) {
        for (const ref of row.factRefs.filter(ref => ref.startsWith('/'))) assert.ok(lookup(result, ref), ref);
      }
      for (const position of context.observations.transitPositions) {
        assert.equal(position.periodRef, context.layers[position.layer].period.periodRef, id);
      }
    }
    for (const segment of parent.selection.segments ?? []) {
      assert.ok(segment.fromInclusive < segment.toExclusive && segment.timeContextRefs.every(ref => contexts.has(ref)), id);
    }
  }
  const parent = result.candidates[0], contexts = parent.timeContexts, first = contexts[0];
  if (expected.hit) assert.ok(first.observations.pairs.some(row => rowMatches(row, expected.hit)), id);
  if (expected.daeun) {
    assert.equal(first.layers.DAEUN.status, expected.daeun, id);
    if (expected.daeun === 'NEEDS_INPUT') assert.ok(first.layers.SEYUN.period && first.layers.MONTHLY.period);
  }
  if (expected.activeDaeun) assert.equal(pillar(first.layers.DAEUN.period), expected.activeDaeun, id);
  if (expected.clockPairs) assert.deepEqual(contexts.map(context => [
    pillar(context.layers.SEYUN.period), pillar(context.layers.MONTHLY.period),
  ]).sort(), expected.clockPairs.slice().sort(), id);
  if (expected.leftMonthly) {
    const byRef = new Map(contexts.map(context => [context.timeContextRef, context]));
    const [delta] = parent.comparison.alternatives;
    assert.equal(pillar(byRef.get(delta.leftTimeContextRef).layers.MONTHLY.period), expected.leftMonthly);
    assert.equal(pillar(byRef.get(delta.rightTimeContextRef).layers.MONTHLY.period), expected.rightMonthly);
    for (const key of ['ended', 'added', 'maintained']) assert.ok(delta[key].some(row => rowMatches(row, expected[key])), key);
  }
  if (expected.sameMinuteAlternatives) {
    assert.equal(parent.comparison.alternatives.length, expected.sameMinuteAlternatives, id);
    assert.ok(parent.comparison.alternatives.every(
      delta => delta.leftTimeContextRef === delta.rightTimeContextRef && !delta.added.length && !delta.ended.length), id);
  }
  if (expected.boundary) assert.ok(parent.selection.segments.some(row => row.fromInclusive === expected.boundary), id);
  if (expected.missingMonthly) {
    assert.ok(contexts.some(context => context.layers.MONTHLY.period && context.layers.MONTHLY.status === 'RESOLVED_UNDER_POLICY'), id);
    assert.ok(contexts.some(context => !context.layers.MONTHLY.period && context.layers.MONTHLY.status === 'NEEDS_DATA'), id);
    assert.equal(result.status, 'PARTIAL');
  }
  if (expected.seasonalAlternatives) {
    const seasonal = result.e5.candidates[0].features.climateAssessmentV2.result.seasonal;
    assert.equal(seasonal.alternativeConditions.length, expected.seasonalAlternatives, id);
  }
}

function semantic(result) {
  return result.candidates.map(parent => ({
    pillars: parent.pillars.map(pillar),
    contexts: parent.timeContexts.map(context => ({
      periods: context.positions.map(site => [site.layer, site.periodRef, site.stem, site.branch]),
      pairs: context.observations.pairs.map(row => row.key),
      triads: context.observations.triads.map(row => [row.key, row.state]),
    })),
  }));
}

export async function verifyDetachedE6({ artifact, pin, dataPack, out }) {
  assert.ok(![artifact, dataPack, repo].some(path => pathsOverlap(path, out)));
  const manifest = await verifyE6Package(artifact, pin);
  assert.equal(manifest.buildMode, 'FIXED_SOURCE_REVISION');
  const dir = await createNewDirectory(out, { privateOnly: true });
  const delivery = join(dir, 'input-code'), received = join(dir, 'input-data');
  const engine = join(dir, 'engine'), data = join(dir, 'server-data');
  const results = join(dir, 'results'), requests = join(dir, 'requests');
  const processes = [];
  try {
    await cp(artifact, delivery, { recursive: true });
    await cp(dataPack, received, { recursive: true });
    await mkdir(results); await mkdir(requests);
    const guards = await prepareGuards(dir);
    async function run(label, file, args, { tz = 'UTC', code = 0, stderr, writable = false } = {}) {
      const env = { PATH: '', TZ: tz };
      for (const key of ['SystemRoot', 'WINDIR', 'TEMP', 'TMP']) if (process.env[key]) env[key] = process.env[key];
      const flags = [guards.scope, writable ? guards.restore : guards.preload]
        .flatMap(path => ['--import', pathToFileURL(path).href]);
      let output, errorOutput, actualCode;
      const startedAt = performance.now();
      try {
        ({ stdout: output, stderr: errorOutput } = await execute(process.execPath, [...flags, file, ...args], {
          cwd: dir, env, windowsHide: true, timeout: 180000, maxBuffer: 48 * 1024 * 1024,
        }));
        actualCode = 0;
      } catch (failure) {
        output = failure.stdout ?? ''; errorOutput = failure.stderr ?? ''; actualCode = failure.code;
      }
      processes.push({ label, tz, exitCode: actualCode, bytes: Buffer.byteLength(output), elapsedMs: Math.round(performance.now() - startedAt),
        sha256: digest(output), stderr: errorOutput.trim() });
      assert.equal(actualCode, code, label + ': ' + errorOutput.trim());
      if (stderr) assert.match(errorOutput, stderr, label);
      else assert.equal(errorOutput, '', label);
      return output;
    }

    const probe = join(dir, 'guard-probe.mjs');
    await writeFile(probe, [
      "import assert from 'node:assert/strict';",
      "import {readFile} from 'node:fs/promises';",
      "assert.equal(process.env.PATH,'');",
      "assert.throws(()=>process.env.KASI_SERVICE_KEY,/OFFLINE_KEY_ACCESS_DENIED/);",
      "assert.throws(()=>fetch('https://example.invalid'),/OFFLINE_NETWORK_DENIED/);",
      "await assert.rejects(import('node:child_process'),/OFFLINE_NETWORK_OR_PROCESS_IMPORT_DENIED/);",
      "await assert.rejects(import(" + JSON.stringify(pathToFileURL(join(repo, 'scripts/engine/e6.mjs')).href) +
        "),/OFFLINE_DEVELOPER_PATH_DENIED/);",
      "assert.throws(()=>readFile(" + JSON.stringify(join(repo, 'package.json')) + "),/E6_DEVELOPER_FILE_READ_DENIED/);",
    ].join('\n'), { flag: 'wx' });
    await run('BOUNDARY_GUARDS', probe, []);
    await run('RESTORE', join(delivery, 'engine.mjs'), ['restore', '--manifest-sha', pin, '--out', engine,
      '--data-pack', received, '--data-out', data], { writable: true });
    const bootstrap = join(engine, 'engine.mjs'), example = join(engine, samplePath);
    const runArgs = (request, pack = data) => ['run', '--manifest-sha', pin, '--request', request, '--data-pack', pack];
    const base = JSON.parse(await readFile(example, 'utf8'));
    const resultsById = new Map();
    for (const fixture of E6_BIRTH_CASES) {
      const { id, request, expected } = fixture, path = join(requests, id + '.json');
      await save(path, request);
      const bytes = await run(id, bootstrap, runArgs(path), { code: expected.parents ? 0 : 2 });
      const result = JSON.parse(bytes);
      certifyBirthCase(result, fixture);
      const stats = {
        relationshipRows: result.relationshipRows,
        timeContexts: result.candidates.reduce((sum, parent) => sum + parent.timeContexts.length, 0),
        segments: result.candidates.reduce((sum, parent) => sum + (parent.selection.segments?.length ?? 0), 0),
      };
      Object.assign(processes.at(-1), stats);
      if (['MONTH_DIFF', 'MAX_RANGE_COMPLETE', 'LICHUN_EXACT'].includes(id)) {
        assert.equal(await run(id + '_SEOUL', bootstrap, runArgs(path), { tz: 'Asia/Seoul' }), bytes);
        Object.assign(processes.at(-1), stats);
      }
      if (['MONTH_DIFF', 'LEAP_SOLAR', 'LEAP_LUNAR', 'SAME_TIME_MIDNIGHT_BIRTH', 'SAME_TIME_NOON_BIRTH'].includes(id)) {
        resultsById.set(id, result);
      }
      await writeFile(join(results, id + '.json'), bytes, { flag: 'wx' });
    }
    assert.deepEqual(semantic(resultsById.get('LEAP_SOLAR')), semantic(resultsById.get('LEAP_LUNAR')));
    const compare = resultsById.get('MONTH_DIFF');
    const repeated = JSON.parse(await run('REPEAT_COMPARE', bootstrap, runArgs(example)));
    assert.deepEqual(repeated, compare);
    assert.deepEqual(resultsById.get('SAME_TIME_MIDNIGHT_BIRTH').e5, compare.e5);
    assert.notDeepEqual(resultsById.get('SAME_TIME_NOON_BIRTH').e5, compare.e5);
    const prior = join(requests, 'E5_STANDALONE.json');
    await save(prior, { schemaVersion: 'manseryeok-engine-e5-request-v1', selection: base.selection.e5, birth: base.birth });
    const old = await run('E5_STANDALONE', join(engine, 'e5/engine.mjs'),
      ['run', '--manifest-sha', manifest.e5ManifestSha256, '--data-pack', data, '--request', prior]);
    assert.deepEqual(JSON.parse(old), compare.e5);

    const policy = structuredClone(base);
    policy.selection.relationPolicyId = 'WRONG';
    for (const [label, request, code] of [
      ['FOREIGN_CANDIDATE', { ...base, natalCandidateRef: compare.candidates[0].natalCandidateRef }, /E6_REQUEST_SCHEMA/],
      ['FOREIGN_TIME_CONTEXT', { ...base, query: { ...base.query, timeContextRef: 'OTHER' } }, /E6_QUERY_FIELDS/],
      ['INVALID_POLICY', policy, /E6_EXPLICIT_POLICY_REQUIRED/],
    ]) {
      const path = join(requests, label + '.json');
      await save(path, request);
      await run(label, bootstrap, runArgs(path), { code: 1, stderr: code });
    }

    const copiedData = join(dir, 'tamper-data');
    await cp(data, copiedData, { recursive: true });
    await appendFile(join(copiedData, 'NOTICE.txt'), '\n');
    await run('DATA_CHANGED', bootstrap, runArgs(example, copiedData), { code: 1, stderr: /API_ONLY_FILE_CHANGED/ });
    const copiedEngine = join(dir, 'tamper-engine');
    await cp(engine, copiedEngine, { recursive: true });
    const tamperEntry = join(copiedEngine, 'engine.mjs');
    await appendFile(join(copiedEngine, 'dist/e6/temporalRelationsV1.js'), '\nthrow Error("unverified runtime");\n');
    await run('MODULE_CHANGED', tamperEntry, runArgs(example), { code: 1, stderr: /E1_ARTIFACT_FILE_SET_OR_BYTES_CHANGED/ });
    await appendFile(join(copiedEngine, 'engine-manifest.json'), ' ');
    await run('MANIFEST_CHANGED', tamperEntry, runArgs(example), { code: 1, stderr: /E6_MANIFEST_PIN_MISMATCH/ });

    assert.deepEqual(await hashFiles(data, await filesBelow(data)), await hashFiles(dataPack, await filesBelow(dataPack)));
    const receipt = { status: 'PASS', node: process.version, sourceRevision: manifest.sourceRevision,
      pin, e5ManifestSha256: manifest.e5ManifestSha256, dataPackSha256: manifest.acceptedDataPackSha256,
      files: manifest.files.length, restoredDataBytesEqual: true, fixtureCount: E6_BIRTH_CASES.length, processes };
    await save(join(dir, 'receipt.json'), receipt);
    return receipt;
  } catch (error) {
    await save(join(dir, 'failure.json'), { sourceRevision: manifest.sourceRevision, pin, processes, error: error.message });
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const options = parsePairs(process.argv.slice(2), ['--artifact', '--manifest-sha', '--data-pack', '--out']);
  const result = await verifyDetachedE6({ artifact: options['--artifact'], pin: options['--manifest-sha'],
    dataPack: options['--data-pack'], out: options['--out'] });
  console.log(JSON.stringify({ status: result.status, processes: result.processes.length, pin: result.pin }));
}
